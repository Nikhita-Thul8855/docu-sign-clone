const mongoose = require("mongoose");

const signatureSchema = new mongoose.Schema({
    fileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doc",
        required: true,
    },
    signer: {
        type: String,
        required: true,
    },
    coordinates: {
        x: { type: Number, required: true },
        y: { type: Number, required: true },
        page: { type: Number, default: 1 },
    },
    status: {
        type: String,
        enum: ["pending", "signed", "rejected"], // <-- Add "rejected"
        default: "pending",
    },
    rejectionReason: { type: String, default: "" }, // <-- Add this
}, { timestamps: true });

module.exports = mongoose.model("Signature", signatureSchema);