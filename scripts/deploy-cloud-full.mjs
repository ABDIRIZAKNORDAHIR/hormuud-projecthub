/**
 * Cloud deploy — automates GitHub push + opens Supabase/Render/Vercel.
 * Supabase/Render/Vercel require ONE browser login each (your account).
 */
import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const REPO = 'https://github.com/ABDIRIZAKNORDAHIR/hormuud-projecthub';
const RENDER_URL = 'https://hormuud-projecthub.onrender.com';

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { cwd: root, stdio: 'inherit', shell: true });
}

function openUrl(url) {
  try {
    execSync(`start "" "${url}"`, { shell: true, stdio: 'ignore' });
  } catch {
    console.log('Open:', url);
  }
}

function readEnv(key) {
  const envPath = path.join(root, '.env');
  if (!fs.existsSync(envPath)) return '';
  const m = fs.readFileSync(envPath, 'utf8').match(new RegExp(`^${key}=(.+)$`, 'm'));
  return m?.[1]?.trim() || '';
}

console.log('\n========================================');
console.log('  ProjectHub — Full Cloud Deploy');
console.log('========================================\n');

// 1. Push latest code to GitHub
console.log('[1/5] Pushing code to GitHub...');
try {
  run('git add -A');
  try {
    run('git commit -m "Cloud deploy update"');
  } catch {
    console.log('(No new changes to commit)');
  }
  run('git push origin main');
  console.log('GitHub OK:', REPO, '\n');
} catch (e) {
  console.error('GitHub push failed. Run: gh auth login');
  process.exit(1);
}

// 2. Create Render env template
const groq = readEnv('GROQ_API_KEY');
const jwt = readEnv('JWT_SECRET') || 'projecthub-hu-cloud-jwt-change-me-32chars';
const renderEnv = `PASTE THESE IN RENDER → hormuud-projecthub → Environment → Save

DATABASE_URL=PASTE_FROM_SUPABASE_AFTER_STEP_2
DB_DRIVER=postgres
NODE_ENV=production
SERVE_STATIC=true
PUBLIC_DEPLOY=true
PORT=10000
JWT_SECRET=${jwt}
AI_PROVIDER=groq
GROQ_API_KEY=${groq || 'your-groq-key'}
GROQ_MODEL=llama-3.3-70b-versatile

---
PASTE IN VERCEL → Settings → Environment Variables:

RENDER_API_URL=${RENDER_URL}
`;
fs.writeFileSync(path.join(root, 'RENDER_ENV_COPY.txt'), renderEnv);
console.log('[2/5] Created RENDER_ENV_COPY.txt\n');

// 3. Open Supabase
console.log('[3/5] Opening Supabase — create database project...');
console.log('  → Name: projecthub');
console.log('  → Copy DATABASE_URL (Connection string URI)\n');
openUrl('https://supabase.com/dashboard/project/new');
openUrl('notepad "' + path.join(root, 'RENDER_ENV_COPY.txt') + '"');

// 4. Open Render Blueprint
console.log('[4/5] Opening Render — deploy API + database...');
console.log('  → New Blueprint → select hormuud-projecthub');
console.log('  → Paste env vars from RENDER_ENV_COPY.txt');
console.log('  → Wait until LIVE\n');
openUrl(`https://dashboard.render.com/blueprint/new?repo=${encodeURIComponent(REPO)}`);

// 5. Open Vercel
console.log('[5/5] Opening Vercel — deploy frontend...');
console.log('  → Import hormuud-projecthub from GitHub');
console.log('  → Add RENDER_API_URL from RENDER_ENV_COPY.txt');
console.log('  → Deploy\n');
openUrl(`https://vercel.com/new/clone?repository-url=${encodeURIComponent(REPO)}`);

console.log('========================================');
console.log('  BROWSER TABS OPENED — 3 QUICK STEPS');
console.log('========================================');
console.log(`
1. SUPABASE: Create project → copy DATABASE_URL → paste in RENDER_ENV_COPY.txt

2. RENDER: Blueprint → Apply → paste ALL env vars → Save → wait LIVE
   Test: ${RENDER_URL}/api/health

3. VERCEL: Import repo → add RENDER_API_URL → Deploy

When done, your Vercel URL will connect to API + database automatically.
`);
