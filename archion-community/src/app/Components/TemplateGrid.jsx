"use client";
import TemplateCard from "./TemplateCard";

export default function TemplateGrid({ templates, deleteMode, selectedIds, setSelectedIds ,searchTerm }) {
  
const filteredTemplates = templates.filter((template) =>
  template.title.toLowerCase().includes(searchTerm.toLowerCase())
);
function handleSelect(id) {
  if (selectedIds.includes(id)) {
    setSelectedIds(selectedIds.filter(item => item !== id));
  } else {
    setSelectedIds([...selectedIds, id]);
  }
}



  return (
    <div className="bg-zinc-900 min-h-screen px-8 py-6">
      <div className="grid grid-cols-4 gap-6">
        {filteredTemplates.map((template) => (
          <TemplateCard
            key={template.id}
            id={template.id}
            title={template.title}
            author={template.author}
            image={template.image}
            download={template.download}
            createdAt={template.createdAt}
            deleteMode={deleteMode}
            selectedIds={selectedIds}
            handleSelect={handleSelect}
            setSelectedIds={setSelectedIds}

          />
        ))}
      </div>
    </div>
  );
}