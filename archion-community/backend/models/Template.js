const mongoose = require("mongoose");

const templateSchema = new mongoose.Schema({
  title: String,
  author: String,
  category: String,
  modelUrl: String,
  thumbnailUrl: String,
  likes: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Template", templateSchema);