import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { signToken, authMiddleware, attachUserDetails } from '../middleware/auth.js';
import { normalizeUniversityId, validateUniversityId } from '../utils/universityId.js';

const router = Router();

/** Register student or teacher — admin accounts cannot be created via registration */
router.post('/register', async (req, res) => {
  try {
    const { universityId, email, password, firstName, lastName, department, role } = req.body;
    if (!universityId || !email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'University ID, email, password, first and last name are required' });
    }

    const accountRole = role === 'teacher' ? 'teacher' : 'student';
    if (role === 'admin') {
      return res.status(403).json({ error: 'Admin accounts cannot be created via registration. Contact the system administrator.' });
    }

    const idCheck = validateUniversityId(universityId);
    if (!idCheck.ok) {
      return res.status(400).json({ error: idCheck.error });
    }
    const huId = idCheck.id;
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existing = await query(
      'SELECT UserId FROM Users WHERE UniversityId = @universityId OR Email = @email',
      { universityId: huId, email: email.toLowerCase().trim() }
    );
    if (existing.recordset.length) {
      return res.status(409).json({ error: 'University ID or email already registered' });
    }

    const hash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO Users (UniversityId, Email, PasswordHash, PlainPassword, FirstName, LastName, Role, Department, IsActive, AccountStatus)
       OUTPUT INSERTED.UserId, INSERTED.UniversityId, INSERTED.Email, INSERTED.FirstName, INSERTED.LastName, INSERTED.Role, INSERTED.Department, INSERTED.AccountStatus
       VALUES (@universityId, @email, @hash, @plain, @firstName, @lastName, @role, @department, 0, 'pending')`,
      {
        universityId: huId,
        email: email.toLowerCase().trim(),
        hash,
        plain: password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: accountRole,
        department: department || null,
      }
    );

    const user = result.recordset[0];

    const admins = await query(`SELECT UserId FROM Users WHERE Role = 'admin' AND IsActive = 1 AND AccountStatus = 'approved'`);
    for (const admin of admins.recordset) {
      await query(
        `INSERT INTO Notifications (UserId, Title, Message, Type)
         VALUES (@userId, @title, @message, 'account_pending')`,
        {
          userId: admin.UserId,
          title: 'New Account Registration',
          message: `${firstName.trim()} ${lastName.trim()} (${huId}) registered as ${accountRole}. Approve or reject this account.`,
        }
      );
    }

    res.status(201).json({
      pendingApproval: true,
      user,
      message: `Your ${accountRole} account was submitted. An administrator must approve it before you can sign in.`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { universityId, email, password, portalRole } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let result;

    if (portalRole === 'admin') {
      result = await query(
        `SELECT UserId, UniversityId, Email, PasswordHash, FirstName, LastName, Role, Department, ProfileImageUrl,
                IsActive, AccountStatus
         FROM Users WHERE LOWER(Email) = @email AND Role = 'admin'`,
        { email: normalizedEmail }
      );
      if (!result.recordset.length) {
        return res.status(401).json({ error: 'Invalid admin email or password' });
      }
    } else {
      if (!universityId || !String(universityId).trim()) {
        return res.status(400).json({ error: 'University ID is required for student and teacher login' });
      }
      const idCheck = validateUniversityId(universityId);
      if (!idCheck.ok) {
        return res.status(400).json({ error: idCheck.error });
      }
      result = await query(
        `SELECT UserId, UniversityId, Email, PasswordHash, FirstName, LastName, Role, Department, ProfileImageUrl,
                IsActive, AccountStatus
         FROM Users WHERE UniversityId = @universityId AND LOWER(Email) = @email`,
        { universityId: idCheck.id, email: normalizedEmail }
      );
    }

    if (!result.recordset.length) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.recordset[0];
    const valid = await bcrypt.compare(password, user.PasswordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    if (user.AccountStatus === 'pending') {
      return res.status(403).json({
        error: 'Your account is waiting for administrator approval. You cannot sign in until an admin accepts your registration.',
        code: 'pending_approval',
      });
    }

    if (!user.IsActive || user.AccountStatus !== 'approved') {
      return res.status(403).json({ error: 'This account is not active. Contact the administrator.' });
    }

    delete user.PasswordHash;
    delete user.AccountStatus;
    await query(
      'UPDATE Users SET LastLoginAt = SYSUTCDATETIME(), LastSeenAt = SYSUTCDATETIME() WHERE UserId = @userId',
      { userId: user.UserId }
    );
    const token = signToken(user);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', authMiddleware, attachUserDetails, (req, res) => {
  res.json({ user: req.userDetails });
});

router.put('/profile', authMiddleware, attachUserDetails, async (req, res) => {
  try {
    const { firstName, lastName, department, profileImageUrl, phone, bio, contactInfo } = req.body;
    if (profileImageUrl !== undefined && profileImageUrl !== null && profileImageUrl !== '') {
      if (typeof profileImageUrl !== 'string' || !profileImageUrl.startsWith('data:image/')) {
        return res.status(400).json({ error: 'Profile image must be a valid image file' });
      }
      if (profileImageUrl.length > 600000) {
        return res.status(400).json({ error: 'Profile image is too large (max ~400KB)' });
      }
    }
    await query(
      `UPDATE Users SET
         FirstName = @firstName,
         LastName = @lastName,
         Department = @department,
         ProfileImageUrl = @profileImageUrl,
         Phone = @phone,
         Bio = @bio,
         ContactInfo = @contactInfo,
         UpdatedAt = SYSUTCDATETIME()
       WHERE UserId = @userId`,
      {
        firstName: (firstName || req.userDetails.FirstName).trim(),
        lastName: (lastName || req.userDetails.LastName).trim(),
        department: department ?? req.userDetails.Department,
        profileImageUrl: profileImageUrl === '' ? null : (profileImageUrl ?? req.userDetails.ProfileImageUrl ?? null),
        phone: phone ?? req.userDetails.Phone ?? null,
        bio: bio ?? req.userDetails.Bio ?? null,
        contactInfo: contactInfo ?? req.userDetails.ContactInfo ?? null,
        userId: req.user.userId,
      }
    );
    const updated = await query(
      'SELECT UserId, UniversityId, Email, FirstName, LastName, Role, Department, ProfileImageUrl, Phone, Bio, ContactInfo FROM Users WHERE UserId = @userId',
      { userId: req.user.userId }
    );
    res.json({ user: updated.recordset[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** Update password (students/teachers) or email (admin only). Admin cannot change password or HU ID. */
router.put('/credentials', authMiddleware, attachUserDetails, async (req, res) => {
  try {
    const { currentPassword, newPassword, email } = req.body;
    if (!currentPassword) {
      return res.status(400).json({ error: 'Current password is required to save account changes' });
    }

    const row = await query(
      'SELECT UserId, PasswordHash, Role, UniversityId, Email FROM Users WHERE UserId = @userId',
      { userId: req.user.userId }
    );
    if (!row.recordset.length) return res.status(404).json({ error: 'User not found' });

    const account = row.recordset[0];
    const valid = await bcrypt.compare(currentPassword, account.PasswordHash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    const isAdmin = account.Role === 'admin';
    const updates = [];
    const params = { userId: req.user.userId };

    if (isAdmin) {
      if (newPassword) {
        return res.status(403).json({ error: 'Administrator passwords are fixed by the system and cannot be changed here.' });
      }
      if (req.body.universityId) {
        return res.status(403).json({ error: 'Administrators sign in with email only — University ID is not used.' });
      }
      if (email) {
        const normalized = email.toLowerCase().trim();
        const dup = await query(
          'SELECT UserId FROM Users WHERE Email = @email AND UserId <> @userId',
          { email: normalized, userId: req.user.userId }
        );
        if (dup.recordset.length) {
          return res.status(409).json({ error: 'That email is already in use' });
        }
        params.email = normalized;
        updates.push('Email = @email');
      }
      if (!updates.length) {
        return res.status(400).json({ error: 'Provide an updated email address' });
      }
    } else {
      if (email || req.body.universityId) {
        return res.status(403).json({ error: 'Only your password can be changed. Contact admin for ID or email updates.' });
      }
      if (!newPassword) {
        return res.status(400).json({ error: 'Provide a new password' });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters' });
      }
      params.passwordHash = await bcrypt.hash(newPassword, 12);
      params.plain = newPassword;
      updates.push('PasswordHash = @passwordHash', 'PlainPassword = @plain');
    }

    updates.push('UpdatedAt = SYSUTCDATETIME()');
    await query(`UPDATE Users SET ${updates.join(', ')} WHERE UserId = @userId`, params);

    const updated = await query(
      `SELECT UserId, UniversityId, Email, FirstName, LastName, Role, Department, ProfileImageUrl
       FROM Users WHERE UserId = @userId`,
      { userId: req.user.userId }
    );
    const user = updated.recordset[0];
    const token = signToken(user);
    res.json({ user, token, message: 'Account updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/heartbeat', authMiddleware, async (req, res) => {
  try {
    const { query } = await import('../db.js');
    await query('UPDATE Users SET LastSeenAt = SYSUTCDATETIME() WHERE UserId = @userId', { userId: req.user.userId });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
