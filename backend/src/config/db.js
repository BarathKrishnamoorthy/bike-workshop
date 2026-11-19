const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('<username>')) {
    console.log('\n⚠️  [MongoDB Notice]: MONGODB_URI is not configured in backend/.env');
    console.log('💡  To connect your live MongoDB Atlas database:');
    console.log('    1. Create a free cluster on MongoDB Atlas (https://www.mongodb.com/cloud/atlas)');
    console.log('    2. Copy your connection string into backend/.env');
    console.log('    3. Example: MONGODB_URI=mongodb+srv://user:pass@cluster0.abcde.mongodb.net/bike_workshop\n');
    console.log('📦  Initializing in-memory local data store fallback for immediate testing & preview...\n');
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`\n✅  [MongoDB Atlas Connected]: ${conn.connection.host}`);
    console.log(`📦  Database: ${conn.connection.name}\n`);
    return true;
  } catch (error) {
    console.error(`\n❌  [MongoDB Connection Error]: ${error.message}`);
    console.log('📦  Falling back to in-memory local data store so you can test the application smoothly.\n');
    return false;
  }
};

const getStatus = () => isConnected;

module.exports = { connectDB, getStatus };
