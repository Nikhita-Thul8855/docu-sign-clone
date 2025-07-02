const mongoose = require("mongoose");

const docSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    // Add other fields as needed (e.g., uploader, upload date, etc.)
}, { timestamps: true });

module.exports = mongoose.models.Doc || mongoose.model("Doc", docSchema);