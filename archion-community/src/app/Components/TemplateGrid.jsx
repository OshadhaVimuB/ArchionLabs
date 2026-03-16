"use client";
import TemplateCard from "./TemplateCard";

export default function TemplateGrid({
  templates = [],
  deleteMode,
  selectedIds,
  setSelectedIds,
  searchTerm,
  filter
}) {

  // 1️⃣ Search filtering
  let visibleTemplates = templates.filter(template =>
    template.title.toLowerCase().includes((searchTerm || "").toLowerCase())
  );

  // 2️⃣ Sorting
  if (filter === "top") {
    visibleTemplates.sort((a, b) => (b.likes || 0) - (a.likes || 0));
  }

  if (filter === "trending") {
    visibleTemplates.sort((a, b) => (b.views || 0) - (a.views || 0));
  }

  if (filter === "recent") {
    visibleTemplates.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  function handleSelect(id) {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
    if(selectedDate) {
      visibleTemplates = visibleTemplates.filter(template =>
        new Date(template.createdAt).toDateString() === selectedDate.toDateString()
      );
  
}
  }

  return (
    <div className="bg-zinc-900 min-h-screen px-8 py-6">

      <div className="grid grid-cols-4 gap-6">

        {visibleTemplates.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
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