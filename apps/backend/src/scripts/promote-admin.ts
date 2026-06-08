import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const email = process.argv[2];

if (!email) {
  console.error('Usage: ts-node src/scripts/promote-admin.ts <email>');
  process.exit(1);
}

if (!MONGODB_URI) {
  console.error('MONGODB_URI not set in .env');
  process.exit(1);
}

async function promoteToAdmin() {
  await mongoose.connect(MONGODB_URI!);

  const result = await mongoose.connection
    .collection('users')
    .findOneAndUpdate(
      { email: email.toLowerCase() },
      { $addToSet: { roles: 'admin' } },
      { returnDocument: 'after' }
    );

  if (!result) {
    console.error(`No user found with email: ${email}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`Promoted to admin: ${result.email} — roles: ${(result.roles as string[]).join(', ')}`);
  await mongoose.disconnect();
}

promoteToAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
