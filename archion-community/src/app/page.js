"use client";
import Navbar from "./Components/Navbar.jsx";
import Link from "next/link";
import FilterBar from "./Components/FilterBar";
import UploadTemplate from "./Components/UploadTemplate";
import TemplateGrid from "./Components/TemplateGrid.jsx";
import DeleteTemplate from "./Components/DeleteTemplate.jsx"
import { useState } from "react";
import { useEffect } from "react";




export default function Home() {
  const [templates, setTemplates] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  useEffect(() => {
  fetch("http://localhost:5000/templates")
    .then(res => res.json())
    .then(data => setTemplates(data))
    .catch(err => console.error(err));
}, []);
  return(
  <>
  
   
   
  <h1>Community Library</h1>

  <FilterBar
  searchTerm={searchTerm}
  setSearchTerm={setSearchTerm}
/>
  <div className="flex justify-between items-center px-8 mt-6">
     <button
     onClick={async () => {
  if (deleteMode) {

    for (let id of selectedIds) {
      await fetch(`http://localhost:5000/templates/${id}`, {
        method: "DELETE"
      });
    }

    setSelectedIds([]);
    setDeleteMode(false);

    // Reload templates from backend
    const res = await fetch("http://localhost:5000/templates");
    const data = await res.json();
    setTemplates(data);

  } else {
    setDeleteMode(true);
  }
}}
  className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 text-white"
>
  {deleteMode ? "Confirm Delete" : "Delete Template"}
</button>
   </div>
  <div className="flex justify-between items-center w-full mb-6">

  <Link href="/upload">
    <button className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded text-white">
      + Upload Template
    </button>
  </Link>

</div>


  <TemplateGrid searchTerm={searchTerm}
   templates={templates}
   deleteMode={deleteMode}
   selectedIds={selectedIds}
   setSelectedIds={setSelectedIds}
   selectedDate={selectedDate}
    />
  <h1>Community Library</h1>

  </>

  )
  
}