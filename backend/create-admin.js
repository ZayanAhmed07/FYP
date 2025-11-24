// Run this script with: node create-admin.js
const mongoose = require('mongoose');

async function createAdmin() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/ExpertRaah');
    console.log('Connected to MongoDB');

    const result = await mongoose.connection.db.collection('users').updateOne(
      { email: 'admin@expertaah.com' },
      { 
        $set: { 
          roles: ['admin'], 
          accountType: 'admin', 
          isVerified: true 
        } 
      }
    );

    console.log('Admin user updated:', result);
    console.log('\n✅ Admin account created successfully!');
    console.log('📧 Email: admin@expertaah.com');
    console.log('🔑 Password: Admin@123');
    console.log('\nYou can now login at http://localhost:3000/login');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createAdmin();
