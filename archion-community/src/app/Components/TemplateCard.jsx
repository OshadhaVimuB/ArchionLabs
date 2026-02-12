"Use client";
import Link from "next/link";

export default function TemplateCard({ id, title, author, image, download }) {
  return (
    <div className="perspective-1000">
      <div className="bg-zinc-800 rounded-lg overflow-hidden transition-transform duration-300 transform hover:rotate-1 hover:scale-105 hover:shadow-2xl">

        {/* Clickable Image + Title Section */}
        <Link href={`/templates/${id}`} className="block cursor-pointer">
          <div className="h-48 bg-zinc-700 overflow-hidden">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
            />
          </div>

          <div className="p-3">
            <h3 className="font-semibold text-white text-sm">
              {title}
            </h3>

            <p className="text-zinc-400 text-xs mt-1">
              {author}
            </p>
          </div>
        </Link>

        {/* Footer Section */}
        <div className="flex justify-between items-center px-3 pb-3 text-xs">
          <a
            href={download}
            download
            onClick={(e) => e.stopPropagation()}
            className="px-2 py-1 bg-zinc-700 rounded hover:bg-zinc-600"
          >
            ⬇ Download
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