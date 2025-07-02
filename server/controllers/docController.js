const fs = require("fs");
const path = require("path");
const { PDFDocument, rgb } = require("pdf-lib");
const Doc = require("../models/docModel");
const Signature = require("../models/Signature");

exports.uploadDoc = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file uploaded" });

        const doc = new Doc({
            user: req.user.id,
            filename: req.file.originalname,
            path: req.file.path,
        });

        await doc.save();
        res.status(201).json({ message: "File uploaded successfully", doc });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.getDocs = async (req, res) => {
    try {
        const docs = await Doc.find({ user: req.user.id }).sort({ uploadedAt: -1 });
        res.json(docs);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// Day 8: Generate signed PDF
exports.signPdf = async (req, res) => {
    try {
        const { docId } = req.body;
        if (!docId) return res.status(400).json({ message: "Missing docId" });

        // Find the document
        const doc = await Doc.findById(docId);
        if (!doc) return res.status(404).json({ message: "Document not found" });

        // Find signatures for this document
        const signatures = await Signature.find({ fileId: docId });

        // Load the PDF
        const pdfPath = doc.path; // <-- FIXED: use the absolute path directly
        const pdfBytes = fs.readFileSync(pdfPath);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        // ...existing code...
        // Embed signatures (as text)
        for (const sig of signatures) {
            const page = pdfDoc.getPage((sig.coordinates.page || 1) - 1);
            page.drawText(sig.signer + " (signed)", {
                x: sig.coordinates.x,
                y: page.getHeight() - sig.coordinates.y,
                size: 18,
                color: rgb(0, 0.53, 0.71),
            });
        }

        // Save the signed PDF
        const signedFilename = `signed_${doc.filename}`;
        const signedPath = path.join(__dirname, "..", "uploads", signedFilename);
        const signedPdfBytes = await pdfDoc.save();
        fs.writeFileSync(signedPath, signedPdfBytes);

        res.status(200).json({
            message: "Signed PDF generated",
            url: `/uploads/${signedFilename}`,
            filename: signedFilename
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to sign PDF", error: err.message });
    }
};