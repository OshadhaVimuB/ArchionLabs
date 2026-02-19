const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let templates = [
  {
    id: 1,
    title: "Modern Apartment Interior",
    author: "MysticalChimp"
  },
  {
    id: 2,
    title: "Cute Character Model",
    author: "TechUser"
  }
];

// GET templates
app.get("/templates", (req, res) => {
  res.json(templates);
});

// DELETE template
app.delete("/templates/:id", (req, res) => {
  const id = parseInt(req.params.id);
  templates = templates.filter(t => t.id !== id);
  res.json({ message: "Deleted successfully" });
});

// POST new template
app.post("/templates", (req, res) => {
  const newTemplate = req.body;
  templates.push(newTemplate);
  res.json(newTemplate);
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});