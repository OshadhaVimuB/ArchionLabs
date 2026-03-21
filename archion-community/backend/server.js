require("./db");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const Template = require("./models/Template");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

const modelsPath = path.resolve(__dirname, "../public/models");
app.use("/models", express.static(modelsPath));
console.log("Serving models from:", modelsPath);
app.use("/thumbnails", express.static(path.join(__dirname, "../public/thumbnails")));


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

    if (file.fieldname === "model") {
      cb(null, path.join(__dirname, "../public/models"));
    }

    if (file.fieldname === "thumbnail") {
      cb(null, path.join(__dirname, "../public/thumbnails"));
    }

  },

  filename: function (req, file, cb) {

    const cleanName = file.originalname
      .replace(/\s+/g, "-")
      .replace(/[()]/g, "");

    cb(null, Date.now() + "-" + cleanName);
  }
});
const upload = multer({ storage: storage });





// GET templates (public)
app.get("/templates", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const start = (page - 1) * limit;

    const templates = await Template.find()
      .sort({ createdAt: -1 })
      .skip(start)
      .limit(limit);

    const total = await Template.countDocuments();

    res.json({
      templates,
      total
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch templates" });
  }
});

// GET single template (public)
app.get("/templates/:id", async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    res.json(template);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch template" });
  }
});

// DELETE template (protected)
app.delete("/templates/:id", authMiddleware, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }
    
    // Optional: Add authorization check here if templates have an author/userId field
    // if (template.userId !== req.user.sub) return res.status(403).json({ error: "Unauthorized" });

    await Template.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete template" });
  }
});

// POST new template (protected)
app.post("/upload-model", authMiddleware, upload.fields([
  { name: "model", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 }
]), async (req, res) => {
  try {
    console.log("FILES:", req.files);
    const modelFile = req.files?.model?.[0];

    if (!modelFile) {
      return res.status(400).json({ error: "Model required" });
    }

    let thumbnailUrl = "/thumbnails/images.png";

    if (req.files?.thumbnail) {
      const thumbnailFile = req.files["thumbnail"][0];
      thumbnailUrl = "/thumbnails/" + thumbnailFile.filename;
    }

    const newTemplate = {
      title: req.body.title || "Untitled",
      author: req.body.author || "Unknown",
      category: req.body.category || "Uncategorized",
      userId: req.user.sub,  // Linking to Supabase user ID
      modelUrl: "/models/" + modelFile.filename,
      thumbnailUrl,
      createdAt: new Date().toISOString(),
      likes: 0,
      views: 0
    };

    const saved = await Template.create(newTemplate);
    res.json(saved);

  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message || "Upload failed" });
  }
});

// POST like a template
app.post("/templates/:id/like", async (req, res) => {
  try {
    const updated = await Template.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Like failed" });
  }
});

// POST mark template as viewed
app.post("/templates/:id/view", async (req, res) => {
  try {
    const updated = await Template.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "View update failed" });
  }
});

// PUT update existing template
app.put("/templates/:id", authMiddleware, upload.single("thumbnail"), async (req, res) => {
  try {
    const updateData = {};

    if (req.body.title) updateData.title = req.body.title;
    if (req.body.author) updateData.author = req.body.author;

    if (req.file) {
      updateData.thumbnailUrl = "/thumbnails/" + req.file.filename;
    }

    const updated = await Template.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(updated);

  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});