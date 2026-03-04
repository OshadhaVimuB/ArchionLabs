"Use client";
import Link from "next/link";
import ModelViewer from "./ModelViewer";
import {useState,useEffect} from "react";

export default function TemplateCard({ template,deleteMode,selectedIds,setSelectedIds }) {
    const [timeAgo, setTimeAgo] = useState("");
    console.log(setSelectedIds);

function calculateTimeAgo(dateString) {
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now - past) / 1000);

  const minutes = Math.floor(diffInSeconds / 60);
  const hours = Math.floor(diffInSeconds / 3600);
  const days = Math.floor(diffInSeconds / 86400);

  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hours ago`;
  if (days < 7) return `${days} days ago`;

  const weeks = Math.floor(days / 7);
  return `${weeks} weeks ago`;
}
useEffect(() => {
  function updateTime() {
    setTimeAgo(calculateTimeAgo(template.createdAt));
  }

  updateTime(); // run immediately

  const interval = setInterval(updateTime, 60000); // update every minute

  return () => clearInterval(interval);
}, [template.createdAt]);

  return (
    <div className="relative">
      {deleteMode && (
  <input
  type="checkbox"
  checked={selectedIds.includes(template.id)}
  onChange={(e) => {
    if (e.target.checked) {
      setSelectedIds([...selectedIds, template.id]);
    } else {
      setSelectedIds(selectedIds.filter(id => id !== template.id));
    }
  }}
  />
)}

      <div className="relative bg-zinc-800 rounded-lg overflow-hidden transition-transform duration-300 hover:scale-105 cursor-pointer">
        {/* Clickable Image + Title Section */}
        <Link href={`/model/${template.id}`} className="block cursor-pointer">
          <div className="h-48 bg-zinc-700 overflow-hidden">
            <ModelViewer modelUrl={"/models/test.glb"}/>
          </div>

          <div className="p-3">
            <h3 className="font-semibold text-white text-sm">
              {template.title}
            </h3>

            <p className="text-zinc-400 text-xs mt-1">
              {template.author}
            </p>
            <p className="text-zinc-500 text-xs mt-1">
              {template.timeAgo}
            </p>
          </div>
        </Link>

        {/* Footer Section */}
        <div className="flex justify-between items-center px-3 pb-3 text-xs">
          <a
            href={template.modelUrl}
            download
            className="bg-blue-500 px-3 py-1 rounded"
          >
            Download
          </a>

          <div className="flex gap-3 text-zinc-400">
            <span>❤️ 42</span>
            <span>👁 120</span>
          </div>
        </div>

      </div>
    </div>
  );
}