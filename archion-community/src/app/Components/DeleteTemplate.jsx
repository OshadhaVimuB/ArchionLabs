export default function DeleteTemplate() {
  return (
<button
  onClick={() => {
    if (deleteMode) {
      // Confirm delete
      setTemplates(
        templates.filter(t => !selectedIds.includes(t.id))
      );
      setSelectedIds([]);
      setDeleteMode(false);
    } else {
      setDeleteMode(true);
    }
  }}
  className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
>
  {deleteMode ? "Confirm Delete" : "Delete Template"}
</button>
  );
}