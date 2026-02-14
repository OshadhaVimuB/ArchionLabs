"use client";
import Navbar from "./Components/Navbar.jsx";
import FilterBar from "./Components/FilterBar";
import UploadTemplate from "./Components/UploadTemplate";
import TemplateGrid from "./Components/TemplateGrid.jsx";
import { useState } from "react";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  return(
  <>
   
   
  <h1>Community Library</h1>

  <FilterBar
  searchTerm={searchTerm}
  setSearchTerm={setSearchTerm}
/>
   <TemplateGrid searchTerm={searchTerm} />
  <UploadTemplate/>
  <h1>Community Library</h1>

  </>

  )
  
}