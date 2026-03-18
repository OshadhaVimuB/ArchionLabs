"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import ModelViewer from "./ModelViewer";

export default function TemplateCard({ template, deleteMode, selectedIds, setSelectedIds }) {

  const [timeAgo, setTimeAgo] = useState("");

  // ❤️ Like system
  const [likes, setLikes] = useState(template.likes || 0);
  const [liked, setLiked] = useState(false);

  // correct download URL
  const modelUrl = template.modelUrl
    ? `http://localhost:5000${template.modelUrl}`
    : null;

  function calculateTimeAgo(dateString) {
    const now = new Date();
    const past = new Date(dateString);

    if (isNaN(past)) return "Just now";

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

    updateTime();
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, [template.createdAt]);

  function handleLike(e){
    e.stopPropagation();
    if(liked){
      setLikes(likes - 1);
    }else{
      setLikes(likes + 1);
    }
    setLiked(!liked);
  }

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

        <Link href={`/model/${template.id}`} className="block">

  <div
    className="h-48 bg-zinc-700 overflow-hidden"
    
  >
    <img src={`http://localhost:5000${template.thumbnailUrl || "/thumbnails/default.png"}`}></img>
  </div>


          <div className="p-3">
            <h3 className="font-semibold text-white text-sm">
              {template.title}
            </h3>

            <p className="text-zinc-400 text-xs mt-1">
              {template.author}
            </p>

            <p className="text-zinc-500 text-xs mt-1">
              {timeAgo}
            </p>
          </div>

        </Link>

        <div className="flex justify-between items-center px-3 pb-3 text-xs">

          <a
            href={modelUrl}
            download
            onClick={(e) => e.stopPropagation()}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-white text-sm"
          >
            Download
          </a>

          <div className="flex gap-3 text-zinc-400">

            <button
              onClick={handleLike}
              className={`flex items-center gap-1 hover:text-red-400 transition ${
                liked ? "text-red-500" : "text-zinc-400"
              }`}
            >
              ❤️ {likes}
            </button>

            <button
  onClick={(e) => {
    e.stopPropagation();
    window.location.href = `/edit/${template.id}`;
  }}
  className="text-xs bg-yellow-500 px-2 py-1 rounded"
>
  Edit
</button>



            

            <span>👁 0</span>

          </div>

        </div>

      </div>
    </div>
  );
}