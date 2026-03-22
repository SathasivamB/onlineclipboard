const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DB_FILE = path.join(__dirname, 'db.json');

// Ensure target directories exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({}));
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 1024 * 1024 * 1024 } // 1GB limit
});

// Database helpers
const readDb = () => JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
const writeDb = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

// File Upload Endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const db = readDb();
  
  // Generate a simple sequential ID (1, 2, 3...)
  const existingIds = Object.keys(db).map(Number).filter(n => !isNaN(n));
  const nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
  const id = nextId.toString();

  
  db[id] = {
    originalName: req.file.originalname,
    filename: req.file.filename,
    mimetype: req.file.mimetype,
    size: req.file.size,
    uploadedAt: new Date().toISOString()
  };
  
  writeDb(db);
  
  res.json({ id, originalName: req.file.originalname, message: 'File uploaded successfully' });
});

// File Info Endpoint
app.get('/api/info/:id', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const fileData = db[id];
  
  if (!fileData) {
    return res.status(404).json({ error: 'File not found. Please check the ID.' });
  }
  res.json({ originalName: fileData.originalName, size: fileData.size });
});

// File Retrieval Endpoint
app.get('/api/download/:id', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const fileData = db[id];
  
  if (!fileData) {
    return res.status(404).json({ error: 'File not found. Please check the ID.' });
  }
  
  const filePath = path.join(UPLOADS_DIR, fileData.filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File went missing from the server filesystem.' });
  }

  // Uses res.download which automatically sets appropriate Content-Disposition headers for downloading
  res.download(filePath, fileData.originalName);
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
