import admin from 'firebase-admin';
import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';

/**
# Default claims only
npm run bootstrap:admin

# Add custom claims
npx ts-node scripts/bootstrap-admin.ts --sa ./ai-api-5c92d-firebase-adminsdk-fbsvc-2df8c90eaf.json --claim canVote=true --claim maxRequests=1000

# Mix booleans, numbers, strings
npx ts-node scripts/bootstrap-admin.ts --claim flag=true --claim level=5 --claim tier=premium
 */
function getArg(name: string) {
  const idx = process.argv.indexOf(name);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

// Parse custom claims from args like: --claim canVote=true --claim maxRequests=1000
function parseClaims(): Record<string, any> {
  const claims: Record<string, any> = {
    role: 'admin',
    canUseGpt: true,
  };

  for (let i = 0; i < process.argv.length; i++) {
    if (process.argv[i] === '--claim' && process.argv[i + 1]) {
      const pair = process.argv[i + 1];
      const [key, value] = pair.split('=');
      if (key && value) {
        // Try to parse as JSON for booleans, numbers, etc.
        try {
          claims[key] = JSON.parse(value);
        } catch {
          // Default to string if not valid JSON
          claims[key] = value;
        }
      }
    }
  }

  return claims;
}

// Usage:
// ts-node scripts/bootstrap-admin.ts --sa ./service-account.json --uid <UID>
// or: ts-node scripts/bootstrap-admin.ts --sa ./service-account.json (reads UID from AI_API_ADMIN_ID in .env)
// or: GOOGLE_APPLICATION_CREDENTIALS=<path> ts-node scripts/bootstrap-admin.ts [--uid <UID>]
// or: npm run bootstrap:admin (uses both env vars or --sa/--uid args)
const saPathInput = getArg('--sa') ?? process.env.GOOGLE_APPLICATION_CREDENTIALS;
const uidInput = getArg('--uid') ?? process.env.AI_API_ADMIN_ID;

// Debug logging (uncomment if needed)
// console.debug('process.argv:', process.argv);
// console.debug('saPathInput:', saPathInput);
// console.debug('uidInput:', uidInput);

if (!saPathInput || typeof saPathInput !== 'string') {
  console.error('❌ Error: Missing service account path.');
  console.error('Usage: ts-node scripts/bootstrap-admin.ts --sa <path> [--uid <UID>]');
  console.error('   or: GOOGLE_APPLICATION_CREDENTIALS=<path> ts-node scripts/bootstrap-admin.ts [--uid <UID>]');
  console.error('   Note: UID defaults to AI_API_ADMIN_ID from .env');
  process.exit(1);
}
if (!uidInput || typeof uidInput !== 'string') {
  console.error('❌ Error: Missing uid argument.');
  console.error('Usage: ts-node scripts/bootstrap-admin.ts --sa <path> --uid <UID>');
  console.error('   or: set AI_API_ADMIN_ID in .env and use: ts-node scripts/bootstrap-admin.ts --sa <path>');
  process.exit(1);
}

// Resolve path relative to repo root if needed
const resolvedPath = path.isAbsolute(saPathInput) ? saPathInput : path.resolve(process.cwd(), saPathInput);

if (!fs.existsSync(resolvedPath)) {
  throw new Error(`Service account file not found: ${resolvedPath}`);
}

const raw = fs.readFileSync(resolvedPath, 'utf8');
const serviceAccount = JSON.parse(raw);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

async function main(uid: string) {
  const claims = parseClaims();

  try {
    await admin.auth().setCustomUserClaims(uid, claims);

    const user = await admin.auth().getUser(uid);
    console.log('✅ Bootstrapped claims for:', uid);
    console.log('customClaims:', user.customClaims ?? {});
    process.exit(0);
  } catch (error) {
    console.error('❌ bootstrap-admin failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main(uidInput);
