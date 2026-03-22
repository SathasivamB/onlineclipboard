const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = require('docx');
const fs = require('fs');

async function generateDoc() {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 24 }
        }
      }
    },
    sections: [
      {
        properties: {},
        children: [
          // ========== TITLE ==========
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [
              new TextRun({ text: "Online Clipboard", bold: true, size: 52, color: "4F46E5", font: "Calibri" }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({ text: "Code Explanation + Portfolio Content", size: 28, color: "64748B", italics: true }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
            children: [
              new TextRun({ text: "Full-Stack React.js + Express.js Project", size: 24, color: "94A3B8" }),
            ],
          }),

          // ===================================================
          // ========== PART A: PORTFOLIO CONTENT ==========
          // ===================================================
          heading("PART A — Portfolio Content"),
          para("Use the following sections directly in your portfolio website to describe this project."),
          para(""),

          // --- PROJECT DESCRIPTION ---
          subHeading("Project Title"),
          para("Online Clipboard — File Sharing Platform"),
          para(""),

          subHeading("Project Description"),
          para("Online Clipboard is a full-stack web application that enables users to upload any type of file — images, ZIP archives, PDFs, videos, documents, and more — and instantly receive a simple numeric ID (1, 2, 3…). Anyone with that ID can retrieve and download the exact original file, preserving its name, extension, and content. The platform supports files up to 1 GB and features a modern, responsive UI with drag-and-drop functionality, real-time upload progress tracking, and a glassmorphism-styled interface."),
          para(""),

          subHeading("Tech Stack"),
          bullet("Frontend: React.js, Tailwind CSS, Axios, Lucide React Icons, React Toastify"),
          bullet("Backend: Node.js, Express.js, Multer (file handling), CORS"),
          bullet("Storage: Local filesystem with JSON-based metadata mapping"),
          para(""),

          // --- FEATURES ---
          subHeading("Key Features"),
          bullet("Universal File Upload: Supports any file type — ZIP, images (PNG, JPG, GIF), PDFs, Word documents, videos, and more — with no format restrictions."),
          bullet("Simple Numeric ID System: Every uploaded file receives a clean, sequential numeric ID (1, 2, 3…) making it extremely easy to share and remember."),
          bullet("Drag & Drop Upload: Users can drag files directly onto the upload zone or click to browse — both methods are supported with animated visual feedback."),
          bullet("Real-Time Progress Tracking: A smooth progress bar shows the exact upload percentage in real-time using Axios's onUploadProgress callback."),
          bullet("One-Click ID Copy: After uploading, users can instantly copy the generated ID to their clipboard with a single click."),
          bullet("Native File Download: Retrieval uses native browser downloads via window.location.href, ensuring the original filename and extension are always preserved (e.g., archive.zip downloads as archive.zip, not as a text file)."),
          bullet("1 GB File Support: The backend is configured to accept files up to 1 GB using Multer's fileSize limit."),
          bullet("Toast Notifications: Success, error, and info messages are displayed as elegant pop-up toasts using React Toastify."),
          bullet("Responsive Glassmorphism UI: The interface uses Tailwind CSS with backdrop blur, gradient text, rounded cards, and smooth hover/active animations for a premium, modern look."),
          bullet("Tab-Based Navigation: Clean Upload/Retrieve tab switcher with icon labels and active state highlighting."),
          para(""),

          // --- CHALLENGES ---
          subHeading("Challenges Faced"),
          bullet("Cross-Origin Communication (CORS): The React dev server runs on port 3000/3001 while the Express API runs on port 5000. Without proper CORS configuration, the browser blocks all API requests. Solved by integrating the cors middleware on the Express server."),
          bullet("Preserving Original Filenames on Download: Initial implementation used Axios blob downloads, which stripped the original filename and extension — ZIP files would download as generic text files. Solved by switching to native browser downloads using window.location.href combined with Express's res.download() which correctly sets Content-Disposition headers."),
          bullet("Handling Large File Uploads: Uploading files close to 1 GB caused memory issues when using in-memory buffering. Solved by configuring Multer with diskStorage to stream files directly to disk, and using native browser downloads to avoid loading entire files into React's memory."),
          bullet("Drag-and-Drop Browser Defaults: Browsers natively try to open dropped files (e.g., displaying images or playing videos). Solved by calling e.preventDefault() in all three drag event handlers (dragover, dragleave, drop) to override the default behavior."),
          bullet("File Naming Conflicts: Multiple users uploading files with the same name (e.g., 'photo.jpg') would overwrite each other. Solved by prepending a timestamp + random number to each stored filename (e.g., '1711110000-839201-photo.jpg') while preserving the original name in the metadata database."),
          bullet("Sequential ID Generation: Needed a reliable way to generate sequential IDs even if entries are deleted. Solved by reading all existing numeric keys from the JSON database, finding the maximum, and incrementing by one."),
          para(""),

          // --- LEARNINGS ---
          subHeading("Key Learnings"),
          bullet("Full-Stack Architecture: Learned how to build and connect a separate React frontend and Express backend, understanding the client-server model where the frontend sends HTTP requests and the backend processes and responds."),
          bullet("File Upload Pipeline: Gained hands-on experience with the complete file upload lifecycle — from FormData construction in the browser, to multipart/form-data parsing with Multer on the server, to disk storage and metadata management."),
          bullet("REST API Design: Designed clean, purpose-specific API endpoints: POST /api/upload for creating resources, GET /api/info/:id for metadata queries, and GET /api/download/:id for file retrieval — following RESTful conventions."),
          bullet("React State Management: Deepened understanding of useState for managing multiple interdependent UI states (file selection, upload progress, success screens, tab navigation) and useRef for programmatic DOM interaction."),
          bullet("Event Handling in React: Learned the nuances of browser drag-and-drop events (dragover, dragleave, drop) and why e.preventDefault() is critical for custom drop zones."),
          bullet("Axios Advanced Features: Used Axios's onUploadProgress for real-time progress tracking and learned the difference between blob responses and native browser downloads for file retrieval."),
          bullet("UI/UX Design with Tailwind CSS: Practiced building a polished, production-quality interface using utility-first CSS — including gradients, glassmorphism (backdrop-blur), micro-animations, and responsive layouts."),
          bullet("Error Handling Patterns: Implemented defensive programming with try/catch/finally blocks, graceful error messages via toast notifications, and server-side validation (checking file existence on disk even after ID lookup)."),
          para(""),

          // ===================================================
          // ========== PART B: CODE EXPLANATION ==========
          // ===================================================
          heading("PART B — Complete Code Explanation"),
          para(""),

          // ========== PROJECT OVERVIEW ==========
          subHeading("1. Project Overview"),
          para("This project has two parts:"),
          bullet("Backend (server/server.js) — A Node.js + Express server that handles file storage, ID generation, and file retrieval."),
          bullet("Frontend (src/App.js) — A React.js application that provides a beautiful UI for uploading and retrieving files."),
          para(""),

          // ========== BACKEND ==========
          heading("2. Backend Code Explanation (server/server.js)"),
          para(""),

          subHeading("2.1 — Importing Dependencies"),
          codeBlock("const express = require('express');\nconst multer = require('multer');\nconst cors = require('cors');\nconst path = require('path');\nconst fs = require('fs');\nconst crypto = require('crypto');"),
          bullet("express — Web framework for creating the server and defining routes."),
          bullet("multer — Middleware for handling file uploads (multipart/form-data)."),
          bullet("cors — Allows the React frontend (port 3001) to communicate with the backend (port 5000)."),
          bullet("path — Built-in Node.js module for constructing file paths."),
          bullet("fs — Built-in module for reading/writing files on disk."),
          para(""),

          subHeading("2.2 — Creating the Express App"),
          codeBlock("const app = express();\napp.use(cors());\napp.use(express.json());"),
          bullet("express() creates the app instance."),
          bullet("app.use(cors()) accepts requests from any origin."),
          bullet("app.use(express.json()) enables JSON request body parsing."),
          para(""),

          subHeading("2.3 — Setting Up Storage Directories"),
          codeBlock("const UPLOADS_DIR = path.join(__dirname, 'uploads');\nconst DB_FILE = path.join(__dirname, 'db.json');\n\nif (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);\nif (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({}));"),
          bullet("UPLOADS_DIR — Folder where uploaded files are physically saved."),
          bullet("DB_FILE — JSON file acting as a database, mapping IDs to file metadata."),
          bullet("Both are auto-created on first run if they don't exist."),
          para(""),

          subHeading("2.4 — Multer Storage Configuration"),
          codeBlock("const storage = multer.diskStorage({\n  destination: (req, file, cb) => cb(null, UPLOADS_DIR),\n  filename: (req, file, cb) => {\n    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);\n    cb(null, uniqueSuffix + '-' + file.originalname);\n  }\n});\nconst upload = multer({ storage, limits: { fileSize: 1024 * 1024 * 1024 } });"),
          bullet("diskStorage saves files to disk (not memory) — critical for large files."),
          bullet("destination points to the uploads/ folder."),
          bullet("filename prepends a unique timestamp to prevent naming conflicts."),
          bullet("limits.fileSize is set to 1 GB (1024 * 1024 * 1024 bytes)."),
          para(""),

          subHeading("2.5 — Database Helpers"),
          codeBlock("const readDb = () => JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));\nconst writeDb = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));"),
          bullet("readDb() reads and parses db.json into a JavaScript object."),
          bullet("writeDb() writes data back to db.json as formatted JSON."),
          para(""),

          subHeading("2.6 — Upload Endpoint (POST /api/upload)"),
          codeBlock("app.post('/api/upload', upload.single('file'), (req, res) => {\n  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });\n\n  const db = readDb();\n  const existingIds = Object.keys(db).map(Number).filter(n => !isNaN(n));\n  const nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;\n  const id = nextId.toString();\n\n  db[id] = {\n    originalName: req.file.originalname,\n    filename: req.file.filename,\n    mimetype: req.file.mimetype,\n    size: req.file.size,\n    uploadedAt: new Date().toISOString()\n  };\n  writeDb(db);\n  res.json({ id, originalName: req.file.originalname, message: 'File uploaded successfully' });\n});"),
          bullet("upload.single('file') tells Multer to expect one file in a field called 'file'."),
          bullet("Sequential ID: Reads all existing keys, finds the maximum number, adds 1. Starts at 1 if empty."),
          bullet("Stores metadata (original name, disk filename, MIME type, size, timestamp) in db.json."),
          bullet("Responds with the generated ID."),
          para(""),

          subHeading("2.7 — Info Endpoint (GET /api/info/:id)"),
          codeBlock("app.get('/api/info/:id', (req, res) => {\n  const db = readDb();\n  const fileData = db[req.params.id];\n  if (!fileData) return res.status(404).json({ error: 'File not found.' });\n  res.json({ originalName: fileData.originalName, size: fileData.size });\n});"),
          bullet("A lightweight check used by the frontend to verify if an ID exists before downloading."),
          bullet("Returns 404 if not found, or basic file info if valid."),
          para(""),

          subHeading("2.8 — Download Endpoint (GET /api/download/:id)"),
          codeBlock("app.get('/api/download/:id', (req, res) => {\n  const db = readDb();\n  const fileData = db[req.params.id];\n  if (!fileData) return res.status(404).json({ error: 'File not found.' });\n\n  const filePath = path.join(UPLOADS_DIR, fileData.filename);\n  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing.' });\n\n  res.download(filePath, fileData.originalName);\n});"),
          bullet("res.download() streams the file and sets Content-Disposition headers automatically."),
          bullet("The second argument (fileData.originalName) ensures the browser saves the file with its ORIGINAL name and extension."),
          para(""),

          subHeading("2.9 — Starting the Server"),
          codeBlock("const PORT = 5000;\napp.listen(PORT, () => console.log(`Server running on port ${PORT}`));"),
          bullet("Starts the HTTP server on port 5000."),
          para(""),

          // ========== FRONTEND ==========
          heading("3. Frontend Code Explanation (src/App.js)"),
          para(""),

          subHeading("3.1 — Imports"),
          codeBlock("import React, { useState, useRef } from 'react';\nimport axios from 'axios';\nimport { Upload, Download, Copy, Check, File as FileIcon, Loader2 } from 'lucide-react';\nimport { ToastContainer, toast } from 'react-toastify';"),
          bullet("useState — React hook for reactive state variables."),
          bullet("useRef — React hook for referencing DOM elements (the hidden file input)."),
          bullet("axios — HTTP client for API calls to the backend."),
          bullet("lucide-react — SVG icon components."),
          bullet("react-toastify — Toast notification system."),
          para(""),

          subHeading("3.2 — State Variables"),
          codeBlock("const [activeTab, setActiveTab] = useState('upload');\nconst [file, setFile] = useState(null);\nconst [isUploading, setIsUploading] = useState(false);\nconst [uploadProgress, setUploadProgress] = useState(0);\nconst [uploadedId, setUploadedId] = useState('');\nconst [copied, setCopied] = useState(false);\nconst [isDragging, setIsDragging] = useState(false);\nconst fileInputRef = useRef(null);"),
          bullet("activeTab — Controls which tab is visible ('upload' or 'retrieve')."),
          bullet("file — The File object selected by the user."),
          bullet("isUploading / uploadProgress — Controls spinner and progress bar."),
          bullet("uploadedId — The ID returned after successful upload."),
          bullet("isDragging — True when a file is dragged over the drop zone (visual feedback)."),
          bullet("fileInputRef — Reference to the hidden <input type='file'> for programmatic clicking."),
          para(""),

          subHeading("3.3 — Drag & Drop Handlers"),
          codeBlock("const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };\nconst handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };\nconst handleDrop = (e) => {\n  e.preventDefault();\n  setIsDragging(false);\n  if (e.dataTransfer.files && e.dataTransfer.files[0]) {\n    setFile(e.dataTransfer.files[0]);\n  }\n};"),
          bullet("e.preventDefault() is ESSENTIAL — without it, the browser opens the file instead of letting React handle it."),
          bullet("e.dataTransfer.files contains the dropped files."),
          bullet("isDragging state provides visual highlights when hovering."),
          para(""),

          subHeading("3.4 — Upload Handler"),
          codeBlock("const handleUpload = async () => {\n  const formData = new FormData();\n  formData.append('file', file);\n  const response = await axios.post(`${API_BASE_URL}/upload`, formData, {\n    headers: { 'Content-Type': 'multipart/form-data' },\n    onUploadProgress: (progressEvent) => {\n      setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));\n    }\n  });\n  setUploadedId(response.data.id);\n};"),
          bullet("FormData is the browser API for constructing file upload payloads."),
          bullet("formData.append('file', file) — 'file' must match upload.single('file') on the backend."),
          bullet("onUploadProgress fires repeatedly during upload with loaded/total byte counts."),
          bullet("response.data.id contains the sequential ID returned by Express."),
          para(""),

          subHeading("3.5 — Retrieve Handler"),
          codeBlock("const handleRetrieve = async (e) => {\n  e.preventDefault();\n  await axios.get(`${API_BASE_URL}/info/${retrieveId}`);\n  window.location.href = `${API_BASE_URL}/download/${retrieveId}`;\n};"),
          bullet("First checks if the ID exists (via /api/info). If not, the catch block shows an error toast."),
          bullet("window.location.href triggers a NATIVE browser download — the browser sends a GET request, receives the file with Content-Disposition: attachment, and downloads it with its original filename."),
          bullet("This approach handles large files without memory issues."),
          para(""),

          subHeading("3.6 — Copy to Clipboard"),
          codeBlock("navigator.clipboard.writeText(uploadedId);\nsetCopied(true);\nsetTimeout(() => setCopied(false), 2000);"),
          bullet("navigator.clipboard.writeText() copies text to the system clipboard."),
          bullet("The copied state briefly shows a checkmark icon before resetting."),
          para(""),

          subHeading("3.7 — UI Structure"),
          bullet("Two tab buttons toggle between Upload and Retrieve views."),
          bullet("The drop zone uses onDragOver, onDragLeave, onDrop for drag-and-drop + onClick for file browsing."),
          bullet("Conditional rendering: if uploadedId is set → show success screen with the ID. Otherwise → show file picker."),
          bullet("Progress bar width is set dynamically: style={{ width: `${uploadProgress}%` }}."),
          bullet("Tailwind CSS classes: bg-gradient-to-r (gradients), backdrop-blur-xl (glassmorphism), animate-spin (loading spinner), rounded-3xl (rounded cards)."),
          para(""),

          // ========== REPRODUCE ==========
          heading("4. How to Build This Yourself"),
          bullet("Step 1: npx create-react-app my-clipboard"),
          bullet("Step 2: npm install axios lucide-react react-toastify"),
          bullet("Step 3: npm install -D tailwindcss@^3.4 postcss autoprefixer"),
          bullet("Step 4: Configure tailwind.config.js and add @tailwind directives to index.css"),
          bullet("Step 5: mkdir server && cd server && npm init -y && npm install express multer cors"),
          bullet("Step 6: Write server/server.js with upload, info, and download endpoints"),
          bullet("Step 7: Write src/App.js with upload form, drag-and-drop, progress bar, and retrieve form"),
          bullet("Step 8: Terminal 1: cd server && node server.js | Terminal 2: npm start"),
          para(""),

          // ========== KEY CONCEPTS ==========
          heading("5. Key Concepts Summary"),
          bullet("FormData + Multer — The standard way to upload files in web applications."),
          bullet("CORS — Required when frontend and backend run on different ports."),
          bullet("res.download() — Express built-in to stream files with correct headers."),
          bullet("window.location.href — Triggers native browser downloads efficiently."),
          bullet("useState + useRef — Core React hooks for state management and DOM interaction."),
          bullet("Conditional Rendering — Show different UI based on application state."),
          bullet("onUploadProgress — Axios feature for real-time upload tracking."),
          bullet("e.preventDefault() — Essential for custom drag-and-drop behavior."),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = "C:\\Users\\Sathasivam B\\Desktop\\OnlineClipboard_Code_Explanation.docx";
  fs.writeFileSync(outputPath, buffer);
  console.log("DOCX created successfully at: " + outputPath);
}

// Helper functions
function heading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    children: [new TextRun({ text, bold: true, size: 36, color: "4F46E5" })],
  });
}

function subHeading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 100 },
    children: [new TextRun({ text, bold: true, size: 28, color: "334155" })],
  });
}

function para(text) {
  return new Paragraph({
    spacing: { after: 100 },
    children: [new TextRun({ text, size: 24 })],
  });
}

function bullet(text) {
  return new Paragraph({
    spacing: { after: 80 },
    indent: { left: 400 },
    children: [
      new TextRun({ text: "\u2022 ", size: 24, bold: true, color: "4F46E5" }),
      new TextRun({ text, size: 22 }),
    ],
  });
}

function codeBlock(text) {
  return new Paragraph({
    spacing: { before: 100, after: 100 },
    indent: { left: 300 },
    border: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
    },
    shading: { fill: "F1F5F9" },
    children: [new TextRun({ text, font: "Consolas", size: 20, color: "1E293B" })],
  });
}

generateDoc().catch(console.error);
