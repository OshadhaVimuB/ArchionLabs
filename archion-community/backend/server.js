const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

const modelsPath = path.resolve(__dirname, "../public/models");
app.use("/models", express.static(modelsPath));
console.log("Serving models from:", modelsPath);

let generateThumbnail;
try {
  generateThumbnail = require("./generateThumbnail");
} catch (err) {
  console.warn("⚠ Thumbnail generation disabled (puppeteer not installed)");
  generateThumbnail = async () => {};
}

// ------------------------------------------------------------------
// Supabase JWT Authentication Middleware
// ------------------------------------------------------------------
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || "";

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const token = authHeader.split(" ")[1];

  if (!SUPABASE_JWT_SECRET) {
    return res.status(500).json({ error: "SUPABASE_JWT_SECRET is not configured" });
  }

  try {
    const decoded = jwt.verify(token, SUPABASE_JWT_SECRET, { algorithms: ["HS256"] });
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// ------------------------------------------------------------------
// File upload configuration
// ------------------------------------------------------------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/models"));
  },
  filename: function (req, file, cb) {

  const cleanName = file.originalname
    .replace(/\s+/g, "-")      // replace spaces
    .replace(/[()]/g, "");     // remove brackets

  cb(null, Date.now() + "-" + cleanName);
}
});
const upload = multer({ storage: storage });



let templates = [
 
];

// GET templates (public)
app.get("/templates", (req, res) => {

  const page = parseInt(req.query.page) || 1;
  const limit = 9;

  const start = (page - 1) * limit;
  const end = start + limit;

  const paginatedTemplates = templates.slice(start, end);

  res.json({
    templates: paginatedTemplates,
    total: templates.length
  });
 

});

// GET single template (public)
app.get("/templates/:id", (req, res) => {

  const id = parseInt(req.params.id);

  const template = templates.find(t => t.id === id);

  if (!template) {
    return res.status(404).json({ message: "Template not found" });
  }

  res.json(template);

});

// DELETE template (protected)
app.delete("/templates/:id", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  templates = templates.filter(t => t.id !== id);
  res.json({ message: "Deleted successfully" });
});

// POST new template (protected)
app.post("/upload-model", authMiddleware, upload.single("model"), async(req, res) => {
  const modelPath = "/models/" + req.file.filename;

  const thumbnailFile = req.file.filename.replace(".glb", ".png");

  const thumbnailPath = path.resolve(__dirname, "../public/thumbnails/" + thumbnailFile);

  await generateThumbnail(
    `http://localhost:5000${modelPath}`,
    thumbnailPath
  );

  const newTemplate = {
    id: Date.now(),
    title: req.body.title,
    author: req.body.author,
    userId: req.user.sub,  // Supabase user ID
    modelUrl: "/models/" + req.file.filename,
    createdAt: new Date().toISOString()
  };

  templates.push(newTemplate);

  res.json(newTemplate);
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});