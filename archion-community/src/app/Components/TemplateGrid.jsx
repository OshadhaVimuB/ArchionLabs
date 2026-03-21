"use client";
import TemplateCard from "./TemplateCard";

export default function TemplateGrid({
  templates = [],
  deleteMode,
  selectedIds,
  setSelectedIds
}) {

  function handleSelect(id) {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  }

  return (
    <div className="bg-zinc-900 min-h-screen px-4 sm:px-6 md:px-8 py-6">

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">

        {templates.map(template => (
          <TemplateCard
            key={template._id}
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