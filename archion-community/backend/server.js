require("./db");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const Template = require("./models/Template");

const app = express();
app.use(cors());
app.use(express.json());

const modelsPath = path.resolve(__dirname, "../public/models");
app.use("/models", express.static(modelsPath));
console.log("Serving models from:", modelsPath);
app.use("/thumbnails", express.static(path.join(__dirname, "../public/thumbnails")));


const generateThumbnail = require("./generateThumbnail");

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



let templates = [
 
];

// GET templates
app.get("/templates", async (req, res) => {

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
});
app.get("/templates/:id", async(req, res) => {

  const template = await Template.findById(req.params.id);

  if (!template) {
    return res.status(404).json({ message: "Template not found" });
  }

  res.json(template);

});
// DELETE template
app.delete("/templates/:id", async(req, res) => {

  await Template.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted successfully" });
});
app.post("/upload-model", upload.fields([
  { name: "model", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 }
]), async (req, res) => {

  try {

    const modelFile = req.files["model"]?.[0];
    

    if (!modelFile) {
      return res.status(400).json({ error: "Model required" });
    }

    let thumbnailUrl = "/thumbnails/default.png";

    if (req.files["thumbnail"]) {
      const thumbnailFile = req.files["thumbnail"][0];
      thumbnailUrl = "/thumbnails/" + thumbnailFile.filename;
    }

    const newTemplate = {
      title: req.body.title || "Untitled",
      author: req.body.author || "Unknown",
      modelUrl: "/models/" + modelFile.filename,
      thumbnailUrl,
      createdAt: new Date().toISOString(),
      likes: 0,
      views: 0
    };

    const saved = await Template.create(newTemplate);

    res.json(saved);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});
app.put("/templates/:id", upload.single("thumbnail"), async(req, res) => {
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
});


app.listen(5000, () => {
  console.log("Server running on port 5000");
});