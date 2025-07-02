const Audit = require("../models/Audit");

module.exports = async function (req, res, next) {
    // Call this middleware after a signature is completed
    const { fileId, signer } = req.body;
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    if (!fileId || !signer) return next();

    try {
        await Audit.create({
            fileId,
            signer,
            ip,
            action: "signed"
        });
    } catch (err) {
        console.error("Audit log error:", err);
    }
    next();
};