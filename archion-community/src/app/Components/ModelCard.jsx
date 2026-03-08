import Link from "next/link";

function timeAgo(date) {

  const seconds = Math.floor((new Date() - new Date(date)) / 1000);

  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(seconds / 3600);
  const days = Math.floor(seconds / 86400);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return minutes + " minutes ago";
  if (hours < 24) return hours + " hours ago";
  return days + " days ago";
}

export default function ModelCard({ model }) {
  return (
    <Link href={`/model/${model.id}`}>
      <div className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden 
      shadow-lg hover:scale-105 hover:shadow-xl transition duration-200 cursor-pointer">

        {/* Preview */}
        <div className="w-full h-52 bg-zinc-700 flex items-center justify-center">
          <img
            src={model.image || "/models/test.glb"}
            alt={model.title}
            className="max-h-full object-contain"
          />
        </div>

        {/* Info */}
        <div className="p-4">

          <h3 className="text-white font-semibold text-lg">
            {model.title}
          </h3>

          <p className="text-sm text-zinc-400 mt-1">
            {model.author}
          </p>

          {/* Time */}
          <p className="text-xs text-zinc-500 mt-1">
            {model.createdAt ? timeAgo(model.createdAt) : "Just now"}
          </p>

          {/* Stats */}
          <div className="flex items-center justify-between mt-3 text-sm text-zinc-400">
            <span>❤️ {model.likes || 0}</span>
            <span>👁 {model.views || 0}</span>
          </div>

        </div>

      </div>
    </Link>
  );
}