const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

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
app.get("/templates/:id", (req, res) => {

  const id = parseInt(req.params.id);

  const template = templates.find(t => t.id === id);

  if (!template) {
    return res.status(404).json({ message: "Template not found" });
  }

  res.json(template);

});
// DELETE template
app.delete("/templates/:id", (req, res) => {
  const id = parseInt(req.params.id);
  templates = templates.filter(t => t.id !== id);
  res.json({ message: "Deleted successfully" });
});
app.post("/upload-model", upload.fields([
  { name: "model", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 }
]), (req, res) => {

  const modelFile = req.files["model"]?.[0];
  const thumbnailFile = req.files["thumbnail"]?.[0];

  if (!modelFile) {
    return res.status(400).json({ message: "Model file is required" });
  }

  const newTemplate = {
    id: Date.now(),
    title: req.body.title,
    author: req.body.author,
    modelUrl: "/models/" + modelFile.filename,
    thumbnailUrl: thumbnailFile
      ? "/thumbnails/" + thumbnailFile.filename
      : null,
    createdAt: new Date().toISOString()
  };

  templates.push(newTemplate);

  res.json(newTemplate);
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});