const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const docRoutes = require("./routes/docRoutes");
const signatureRoutes = require('./routes/signature'); // Make sure this matches the file name

const app = express();
const PORT = process.env.PORT || 5003;

// Main CORS for API routes
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://docu-sign-clone.vercel.app"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom CORS middleware for static file serving (PDF downloads)
app.use(
  "/uploads",
  (req, res, next) => {
    const allowedOrigins = [
      "http://localhost:3000",
      "https://docu-sign-clone.vercel.app"
    ];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
  },
  express.static(path.join(__dirname, "uploads"))
);

app.use(express.static(path.join(__dirname, "../client/public")));

app.use("/api/auth", authRoutes);
app.use("/api/docs", docRoutes);
app.use("/api/signatures", signatureRoutes);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/public/index.html"));
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });