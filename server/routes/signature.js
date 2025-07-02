const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Doc = require('../models/Doc');
const Signature = require('../models/Signature');
const Audit = require('../models/Audit');
const auditLogger = require('../middleware/auditLogger');

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

// Send a public signature link via email
router.post('/send-link', async (req, res) => {
    const { docId, recipientEmail } = req.body;
    if (!docId || !recipientEmail) {
        return res.status(400).json({ message: 'Missing docId or recipientEmail' });
    }
    const token = jwt.sign({ docId }, JWT_SECRET, { expiresIn: '24h' });
    const signUrl = `http://localhost:3000/sign/${token}`;
    const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
            user: 'greg.beer13@ethereal.email',
            pass: 'DJeckGr66j7KwPZtrb'
        }
    });
    const mailOptions = {
        from: '"DocuSign Clone" <no-reply@docu-sign-clone.com>',
        to: recipientEmail,
        subject: "Sign this document",
        text: `Please sign the document: ${signUrl}`,
        html: `<p>Please sign the document: <a href="${signUrl}">${signUrl}</a></p>`
    };
    try {
        await transporter.sendMail(mailOptions);
        res.json({ message: 'Signature link sent!', signUrl });
    } catch (err) {
        res.status(500).json({ message: 'Failed to send email', error: err.message });
    }
});

// Route to sign a document and log audit
router.post('/sign', auditLogger, async (req, res) => {
    res.json({ message: "Document signed and audit logged." });
});

// Public signature page API
router.get('/public/:token', async (req, res) => {
    const { token } = req.params;
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        const docId = payload.docId || payload.id;
        if (!docId) return res.status(400).json({ message: 'Invalid token payload' });
        const doc = await Doc.findById(docId);
        if (!doc) return res.status(404).json({ message: 'Document not found' });
        res.json({ doc });
    } catch (err) {
        res.status(400).json({ message: 'Invalid or expired link' });
    }
});

// Save signature positions for a document (bulk, using fileId)
router.post("/positions", async (req, res) => {
    try {
        const { fileId, positions } = req.body;
        if (!fileId || !positions || !Array.isArray(positions)) {
            return res.status(400).json({ message: "Invalid data" });
        }
        // Optionally: remove this line if you want to keep old signatures
        // await Signature.deleteMany({ fileId });
        const created = await Signature.insertMany(
            positions.map(pos => ({
                fileId,
                coordinates: { x: pos.x, y: pos.y, page: pos.page || 1 },
                signer: pos.signer,
                status: pos.status || "pending",
            }))
        );
        res.status(201).json(created);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Save a single signature (using fileId)
router.post("/", async (req, res) => {
    try {
        const { fileId, signer, coordinates } = req.body;
        if (!fileId || !signer || !coordinates) {
            return res.status(400).json({ message: "Invalid data" });
        }
        const signature = new Signature({
            fileId,
            signer,
            coordinates,
        });
        await signature.save();
        res.status(201).json(signature);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Route to get all signatures for a file (ALWAYS returns an array)
router.get('/by-file/:fileId', async (req, res) => {
    try {
        const signatures = await Signature.find({ fileId: req.params.fileId });
        res.json(Array.isArray(signatures) ? signatures : []);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch signatures", error: err.message });
    }
});

// Route to update signature status (accept/reject)
router.put('/status/:signatureId', async (req, res) => {
    const { status, rejectionReason } = req.body;
    if (!["signed", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
    }
    try {
        const update = { status };
        if (status === "rejected") {
            update.rejectionReason = rejectionReason || "";
        } else {
            update.rejectionReason = "";
        }
        const signature = await Signature.findByIdAndUpdate(
            req.params.signatureId,
            update,
            { new: true }
        );
        if (!signature) return res.status(404).json({ message: "Signature not found" });
        res.json({ message: "Signature status updated", signature });
    } catch (err) {
        res.status(500).json({ message: "Failed to update status", error: err.message });
    }
});

// Route to get audit trail for a document
router.get('/audit/:fileId', async (req, res) => {
    try {
        const audits = await Audit.find({ fileId: req.params.fileId }).sort({ timestamp: 1 });
        res.json({ audits });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch audit trail", error: err.message });
    }
});

// Test route
router.get('/test', (req, res) => {
    res.send('Signature routes are working!');
});

module.exports = router;