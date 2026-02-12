import Link from "next/link";

export default function TemplateCard({ id, title }) {
  return (
    <Link href={`/templates/${id}`}>
      <div className="border p-4 rounded hover:shadow cursor-pointer">
        <h2 className="font-semibold">{title}</h2>
      </div>
    </Link>
  );
}