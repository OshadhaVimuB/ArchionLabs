import Link from "next/link";

export default function ModelCard({ model }) {
  return (
    <Link href={`/model/${model.id}`}>
      <div className="border rounded-lg overflow-hidden hover:shadow cursor-pointer">
        <img src={model.image} alt={model.title} />
        <div className="p-2">
          <h3 className="font-semibold">{model.title}</h3>
          <p className="text-sm text-gray-600">{model.author}</p>
          <p className="text-sm">❤️ {model.likes}</p>
        </div>
      </div>
    </Link>
  );
}