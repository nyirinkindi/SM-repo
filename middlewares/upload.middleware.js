/**
 * middlewares/upload.middleware.js
 * File upload handling with multer
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Organize by file type
    let folder = 'others';
    
    if (file.mimetype.includes('pdf')) {
      folder = 'pdfs';
    } else if (file.mimetype.includes('image')) {
      folder = 'images';
    } else if (file.mimetype.includes('video')) {
      folder = 'videos';
    }
    
    const destPath = path.join(uploadDir, folder);
    
    // Create folder if it doesn't exist
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }
    
    cb(null, destPath);
  },
  
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    const sanitizedBasename = basename.replace(/[^a-zA-Z0-9]/g, '_');
    
    cb(null, `${sanitizedBasename}-${uniqueSuffix}${ext}`);
  }
});

// File filter for security
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedMimes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'video/mp4',
    'video/mpeg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype}`), false);
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
});

// Export different upload configurations
module.exports = {
  // Single file upload
  single: (fieldName = 'file') => upload.single(fieldName),
  
  // Multiple files upload (same field)
  array: (fieldName = 'files', maxCount = 10) => upload.array(fieldName, maxCount),
  
  // Multiple files upload (different fields)
  fields: (fields) => upload.fields(fields),
  
  // Any files
  any: () => upload.any(),
  
  // No file upload (for testing)
  none: () => upload.none(),
  
  // Default export (single file)
  default: upload.single('file'),
};

// Error handler middleware for multer errors
module.exports.handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large. Maximum size is 50MB',
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Unexpected field in file upload',
      });
    }
    return res.status(400).json({
      error: `Upload error: ${err.message}`,
    });
  }
  
  if (err) {
    return res.status(400).json({
      error: err.message || 'File upload failed',
    });
  }
  
  next();
};