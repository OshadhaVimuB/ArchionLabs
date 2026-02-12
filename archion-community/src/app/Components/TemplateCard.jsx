import Link from "next/link";

export default function TemplateCard({ id, title, author, image }) {
  return (
    <Link href={`/templates/${id}`}>
      <div className="perspective-1000">
        <div className="bg-zinc-800 rounded-lg overflow-hidden transition-transform duration-300 transform hover:rotate-1 hover:scale-105 hover:shadow-2xl cursor-pointer">

          {/* Image */}
          <div className="h-48 bg-zinc-700 overflow-hidden">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
            />
          </div>

          {/* Info Section */}
          <div className="p-3">
            <h3 className="font-semibold text-white text-sm">
              {title}
            </h3>

            <p className="text-zinc-400 text-xs mt-1">
              {author}
            </p>

            <div className="flex justify-between items-center mt-2 text-zinc-400 text-xs">
              <span>❤️ 42</span>
              <span>👁 120</span>
            </div>
          </div>

        </div>
      </div>
    </Link>
  );
}