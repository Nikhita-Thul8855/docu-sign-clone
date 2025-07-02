const mongoose = require("mongoose");

const auditSchema = new mongoose.Schema({
    fileId: { type: mongoose.Schema.Types.ObjectId, ref: "Doc", required: true },
    signer: { type: String, required: true }, // or ObjectId if you have users
    action: { type: String, default: "signed" },
    ip: { type: String },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Audit", auditSchema);