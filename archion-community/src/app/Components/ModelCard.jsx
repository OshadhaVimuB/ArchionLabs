import Link from "next/link";

export default function ModelCard({ model }) {
  return (
    <Link href={`/model/${model.id}`}>
      <div className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden 
      shadow-lg hover:scale-105 hover:shadow-xl transition duration-200 cursor-pointer">

        {/* Preview */}
        <div className="w-full h-52 bg-zinc-700 flex items-center justify-center">
          <img
            src={model.image}
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

          {/* Stats */}
          <div className="flex items-center justify-between mt-3 text-sm text-zinc-400">
            <span>❤️ {model.likes}</span>
            <span>👁 {model.views}</span>
          </div>
        </div>

      </div>
    </Link>
  );
}