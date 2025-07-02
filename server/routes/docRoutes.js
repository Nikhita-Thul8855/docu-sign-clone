const express = require("express");
const router = express.Router();
const docController = require("../controllers/docController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.post("/upload", protect, upload.single("pdf"), docController.uploadDoc);
router.get("/", protect, docController.getDocs); // <-- Add this line
router.post("/sign", protect, docController.signPdf);
module.exports = router;