const mongoose = require("../db");

const templateSchema = new mongoose.Schema({
  title: String,
  author: String,
  modelUrl: String,
  thumbnailUrl: String,
  createdAt: String,
  likes: { type: Number, default: 0 },
  views: { type: Number, default: 0 }
});

module.exports = mongoose.model("Template", templateSchema);