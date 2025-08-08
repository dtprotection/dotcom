import mongoose from 'mongoose';
import { Admin } from '../models/admin.model';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const createInitialAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dtprotection';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create initial admin user
    const admin = new Admin({
      username: 'admin',
      email: 'admin@dtprotection.com',
      password: 'admin123456', // This will be hashed automatically
      role: 'super_admin',
      isActive: true
    });

    await admin.save();
    
    console.log('✅ Initial admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123456');
    console.log('⚠️  Please change the password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
};

// Run the script
createInitialAdmin();
