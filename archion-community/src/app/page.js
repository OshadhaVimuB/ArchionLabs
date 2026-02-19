"use client";
import Navbar from "./Components/Navbar.jsx";
import FilterBar from "./Components/FilterBar";
import UploadTemplate from "./Components/UploadTemplate";
import TemplateGrid from "./Components/TemplateGrid.jsx";
import { useState } from "react";
const initialTemplates = [
  {
    id: 1,
    title: "Modern Apartment Interior",
    author: "MysticalChimp",
    image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511",
    createdAt: new Date("2024-01-01"),
  },
  {
    id: 2,
    title: "uiuiuiui",
    author: "TechUser",
    image: "https://images.unsplash.com/photo-1607746882042-944635dfe10e",
    createdAt: new Date("2024-01-03"),
  }
];
import DeleteTemplate from "./Components/DeleteTemplate.jsx";

export default function Home() {
  const [templates, setTemplates] = useState(initialTemplates);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteMode, setDeleteMode] = useState(false);
const [selectedIds, setSelectedIds] = useState([]);
  
  return(
  <>
   
   
  <h1>Community Library</h1>

  <FilterBar
  searchTerm={searchTerm}
  setSearchTerm={setSearchTerm}
/>
  <div className="flex justify-between items-center px-8 mt-6">
     <UploadTemplate />
     <button
  onClick={() => {
    if (deleteMode) {
      setTemplates(
        templates.filter(t => !selectedIds.includes(t.id))
      );
      setSelectedIds([]);
      setDeleteMode(false);
    } else {
      setDeleteMode(true);
    }
  }}
  className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 text-white"
>
  {deleteMode ? "Confirm Delete" : "Delete Template"}
</button>
   </div>

  <TemplateGrid searchTerm={searchTerm}
   templates={templates}
   deleteMode={deleteMode}
   selectedIds={selectedIds}
   setSelectedIds={setSelectedIds}
    />
  <h1>Community Library</h1>

  </>

  )
  
}