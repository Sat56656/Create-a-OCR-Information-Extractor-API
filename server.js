const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Endpoint for file upload and OCR processing
app.post('/upload', upload.single('aadhaar'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    // Process the uploaded image using Tesseract.js
    Tesseract.recognize(
        req.file.path,
        'eng',
        { logger: m => console.log(m) }
    ).then(({ data: { text } }) => {
        const extractedInfo = extractInfo(text);
        res.json({ extractedInfo });
    }).catch(err => {
        console.error(err);
        res.status(500).json({ error: 'OCR processing failed' });
    });
});

// Function to extract information from OCR text
function extractInfo(text) {
    const nameMatch = text.match(/Name:\s*([^\n]*)/);
    const aadhaarMatch = text.match(/\b\d{4}\s\d{4}\s\d{4}\b/);

    return {
        name: nameMatch ? nameMatch[1].trim() : null,
        aadhaarNumber: aadhaarMatch ? aadhaarMatch[0].replace(/\s/g, '') : null
    };
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
