const dotenv = require('dotenv')
const { v2: cloudinary } = require('cloudinary');

dotenv.config();
          
cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME, 
  api_key: process.env.CLOUD_KEY, 
  api_secret: process.env.CLOUD_SECRET
});

module.exports = cloudinary;