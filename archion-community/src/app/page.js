import Navbar from "./Components/Navbar.jsx";
import FilterBar from "./Components/FilterBar";
import UploadTemplate from "./Components/UploadTemplate";
import TemplateGrid from "./Components/TemplateGrid.jsx";

export default function Home() {
  return(
  <>
  <Navbar/>
  <FilterBar/>
  <UploadTemplate/>
  <TemplateGrid />
  <h1>Community Library</h1>

  </>

  )
  
}