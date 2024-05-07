const express = require('express');
const multer = require('multer');
const path = require('path');

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + '-' + Date.now() + path.extname(file.originalname),
    );
  },
});

// Initialize multer upload
const upload = multer({ storage: storage });

// Serve static files from the 'uploads' directory
router.use(express.static('uploads'));

// POST route for uploading a single file
router.post('/image', upload.single('image'), (req, res) => {
  console.log('uploading image...');
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  res.send(`File uploaded: <img src="${req.file.path}" />`);
});

module.exports = router;
