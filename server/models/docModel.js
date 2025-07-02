const mongoose = require("mongoose");

const docSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    filename: String,
    path: String,
    uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Doc", docSchema);