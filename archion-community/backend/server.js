const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/models", express.static(path.join(__dirname, "../public/models")));



const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/models"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage: storage });



let templates = [
  {
    id: 1,
    title: "Modern Apartment Interior",
    author: "MysticalChimp",
    modelUrl: "/models/test.glb"
  },
  {
    id: 2,
    title: "Cute Character Model",
    author: "TechUser",
    modelUrl: "/models/test.glb"
  },
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
// DELETE template
app.delete("/templates/:id", (req, res) => {
  const id = parseInt(req.params.id);
  templates = templates.filter(t => t.id !== id);
  res.json({ message: "Deleted successfully" });
});

// POST new template
app.post("/upload-model", upload.single("model"), (req, res) => {

  const newTemplate = {
    id: Date.now(),
    title: req.body.title,
    author: req.body.author,
    modelUrl: "/models/" + req.file.filename,
    createdAt: new Date().toISOString()
  };

  templates.push(newTemplate);

  res.json(newTemplate);
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});