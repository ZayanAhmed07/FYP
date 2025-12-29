// Run this script with: node create-admin.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

async function createAdmin() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/ExpertRaah');
    console.log('Connected to MongoDB');

    // Hash the password
    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    // Check if admin exists
    const existingAdmin = await mongoose.connection.db.collection('users').findOne({ 
      email: 'admin@expertaah.com' 
    });

    if (existingAdmin) {
      // Update existing admin
      const result = await mongoose.connection.db.collection('users').updateOne(
        { email: 'admin@expertaah.com' },
        { 
          $set: { 
            password: hashedPassword,
            roles: ['admin'], 
            accountType: 'admin', 
            isVerified: true,
            name: 'Admin User'
          } 
        }
      );
      console.log('Existing admin user updated:', result);
    } else {
      // Create new admin
      const result = await mongoose.connection.db.collection('users').insertOne({
        email: 'admin@expertaah.com',
        password: hashedPassword,
        name: 'Admin User',
        roles: ['admin'],
        accountType: 'admin',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('New admin user created:', result);
    }

    console.log('\n✅ Admin account ready!');
    console.log('📧 Email: admin@expertaah.com');
    console.log('🔑 Password: Admin@123');
    console.log('\nYou can now login at http://localhost:5173/login');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createAdmin();
