import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, getPool } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const PASSWORD = 'ProjectHub123!';

const users = [
  { universityId: 'HU0009000', email: 'admin@hu.edu', firstName: 'James', lastName: 'Mitchell', role: 'admin', department: 'IT', specialty: null },
  { universityId: 'HU0005001', email: 'swilliams@hu.edu', firstName: 'Sarah', lastName: 'Williams', role: 'teacher', department: 'Computer Science', specialty: 'Computer Science' },
  { universityId: 'HU0005002', email: 'jkumar@hu.edu', firstName: 'Raj', lastName: 'Kumar', role: 'teacher', department: 'Engineering', specialty: 'Engineering' },
  { universityId: 'HU0005003', email: 'ai.teacher@hu.edu', firstName: 'David', lastName: 'Park', role: 'teacher', department: 'Artificial Intelligence', specialty: 'Artificial Intelligence' },
  { universityId: 'HU0001001', email: 'alex.chen@hu.edu', firstName: 'Alex', lastName: 'Chen', role: 'student', department: 'CS', specialty: null },
  { universityId: 'HU0001002', email: 'emma.watson@hu.edu', firstName: 'Emma', lastName: 'Watson', role: 'student', department: 'CS', specialty: null },
  { universityId: 'HU0001003', email: 'maria.garcia@hu.edu', firstName: 'Maria', lastName: 'Garcia', role: 'student', department: 'CS', specialty: null },
  { universityId: 'HU0001004', email: 'james.liu@hu.edu', firstName: 'James', lastName: 'Liu', role: 'student', department: 'EE', specialty: null },
];

async function seed() {
  await getPool();
  const hash = await bcrypt.hash(PASSWORD, 12);
  console.log('Seeding users (password reset for demo accounts)...');

  const userIds = {};
  for (const u of users) {
    const existing = await query('SELECT UserId FROM Users WHERE Email = @email', { email: u.email });
    if (existing.recordset.length) {
      userIds[u.universityId] = existing.recordset[0].UserId;
      await query(
        `UPDATE Users SET UniversityId = @universityId, PasswordHash = @hash, PlainPassword = @plain, Email = @email, FirstName = @firstName, LastName = @lastName,
         Role = @role, Department = @department, Specialty = @specialty, IsActive = 1, AccountStatus = 'approved' WHERE Email = @email`,
        { universityId: u.universityId, hash, plain: PASSWORD, email: u.email, firstName: u.firstName, lastName: u.lastName, role: u.role, department: u.department, specialty: u.specialty || null }
      );
      console.log(`  Updated ${u.role}: ${u.universityId}`);
      continue;
    }
    const r = await query(
      `INSERT INTO Users (UniversityId, Email, PasswordHash, PlainPassword, FirstName, LastName, Role, Department, Specialty, IsActive, AccountStatus)
       OUTPUT INSERTED.UserId VALUES (@universityId, @email, @hash, @plain, @firstName, @lastName, @role, @department, @specialty, 1, 'approved')`,
      { universityId: u.universityId, email: u.email, hash, plain: PASSWORD, firstName: u.firstName, lastName: u.lastName, role: u.role, department: u.department, specialty: u.specialty || null }
    );
    userIds[u.universityId] = r.recordset[0].UserId;
    console.log(`  Created ${u.role}: ${u.universityId}`);
  }

  const projects = [
    { id: 'PRJ-CS-2026-001', title: 'AI-Powered Crop Yield Prediction', abstract: 'Machine learning system using satellite imagery and IoT sensors for crop yield prediction.', student: 'HU0001002' },
    { id: 'PRJ-CS-2026-002', title: 'Blockchain Supply Chain Tracker', abstract: 'Decentralized supply chain platform using Hyperledger Fabric with smart contracts.', student: 'HU0001001' },
    { id: 'PRJ-CS-2026-003', title: 'Distributed Ledger for Logistics', abstract: 'Blockchain solution for logistics companies to track shipments in real-time.', student: 'HU0001003' },
    { id: 'PRJ-EE-2026-001', title: 'Neural Interface for Prosthetics', abstract: 'Brain-computer interface for prosthetic limb control via EEG signal processing.', student: 'HU0001004' },
  ];

  console.log('Seeding projects...');
  const teacherId = userIds['HU0005001'];
  for (const p of projects) {
    const exists = await query('SELECT ProjectId FROM Projects WHERE TeacherAssignedId = @id', { id: p.id });
    if (exists.recordset.length) continue;
    const ownerId = userIds[p.student];
    const r = await query(
      `INSERT INTO Projects (TeacherAssignedId, Title, Abstract, AssignedByTeacherId, OwnerStudentId, Status)
       OUTPUT INSERTED.ProjectId VALUES (@id, @title, @abstract, @teacherId, @ownerId, 'assigned')`,
      { id: p.id, title: p.title, abstract: p.abstract, teacherId, ownerId }
    );
    await query(
      'INSERT INTO ProjectMembers (ProjectId, StudentId, InvitedByStudentId) VALUES (@projectId, @studentId, @studentId)',
      { projectId: r.recordset[0].ProjectId, studentId: ownerId }
    );
    console.log(`  Created project: ${p.id}`);
  }

  const settings = {
    theme_primary: '#008037',
    theme_secondary: '#2563EB',
    theme_accent: '#7C3AED',
    university_name: 'Hormuud University',
    university_short: 'HU',
    logo_path: '/projecthub-logo.png',
    ai_similarity_threshold: '60',
  };
  for (const [key, value] of Object.entries(settings)) {
    await query(
      `MERGE Settings AS t USING (SELECT @key AS SettingKey, @value AS SettingValue) AS s ON t.SettingKey = s.SettingKey
       WHEN MATCHED THEN UPDATE SET SettingValue = @value
       WHEN NOT MATCHED THEN INSERT (SettingKey, SettingValue) VALUES (@key, @value);`,
      { key, value }
    );
  }

  console.log('\nSeed complete!');
  console.log('Password for ALL demo accounts: ProjectHub123!');
  console.log('  Admin:   admin@hu.edu (email only, no HU ID)');
  console.log('  Teacher: HU000-5001 / swilliams@hu.edu (Computer Science)');
  console.log('  Teacher: HU000-5003 / ai.teacher@hu.edu (AI)');
  console.log('  Student: HU000-1001 / alex.chen@hu.edu');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
