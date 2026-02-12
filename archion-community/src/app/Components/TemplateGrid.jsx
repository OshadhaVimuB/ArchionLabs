import TemplateCard from "./TemplateCard";

export default function TemplateGrid() {

  const templates = [
    {
      id: 1,
      title: "Modern Apartment Interior",
      author: "MysticalChimp",
      image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511"
    },
    {
      id: 2,
      title: "Cute Character Model",
      author: "TechUser",
      image: "https://images.unsplash.com/photo-1607746882042-944635dfe10e"
    },
    {
      id: 3,
      title: "Industrial Pipes System",
      author: "ArchionDev",
      image: "https://images.unsplash.com/photo-1581091870627-3b5de8d2f76c"
    },
    {
      id: 4,
      title: "Office Layout Design",
      author: "DesignerPro",
      image: "https://images.unsplash.com/photo-1492724441997-5dc865305da7"
    }
  ];

  return (
    <div className="bg-zinc-900 min-h-screen px-8 py-6">
      <div className="grid grid-cols-4 gap-6">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            id={template.id}
            title={template.title}
            author={template.author}
            image={template.image}
          />
        ))}
      </div>
    </div>
  );
}