"use client";

import { useParams } from "next/navigation";
import ModelViewer from "../../Components/ModelViewer";
import Link from "next/link";
import { useRouter } from "next/router";

export default function TemplatePreview() {
  const params = useParams();
  const { id } = params;
  const router = useRouter();

  // Temporary mock data (later this comes from backend)
  const templates = [
    {
      id: "1",
      title: "Modern Apartment Interior",
      author: "MysticalChimp",
      image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511",
      download: "/template1.zip",
    },
    {
      id: "2",
      title: "Cute Character Model",
      author: "TechUser",
      image: "https://images.unsplash.com/photo-1607746882042-944635dfe10e",
      download: "/template1.zip",
    },
  ];

  const template = templates.find((t) => t.id === id);

  if (!template) {
    return <div className="text-white p-10">Template not found</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-10">

  <Link
    href="/"
    className="inline-block mb-6 px-4 py-2 bg-zinc-700 rounded hover:bg-zinc-600"
  >
    ← Back to Library
  </Link>

  <div className="max-w-4xl mx-auto bg-zinc-800 rounded-lg overflow-hidden shadow-xl">

    <div className="w-full h-96">
      <ModelViewer modelUrl="/models/test.glb" />
      <button onClick={()=>router.push("/")} className="px-4 py-2 bg-zinc-700 rounded text-white">
        Back to Library
      </button>
      <a href= "/models/test.glb" download className="px-4 py-2 bg-zinc-700 rounded">
        Download Model
      </a>
    </div>

    <div className="p-6">

      <h1 className="text-2xl font-bold">{template.title}</h1>

      <p className="text-zinc-400 mt-2">
        By {template.author}
      </p>

      <div className="mt-6 flex gap-4">

        <a
          href="/models/test.glb"
          download
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500"
        >
          ⬇ Download
        </a>

        <button className="px-4 py-2 bg-zinc-700 rounded hover:bg-zinc-600">
          ❤️ Like
        </button>

      </div>

    </div>

  </div>

</div>
  
  );
}