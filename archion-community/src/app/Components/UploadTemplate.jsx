import Link from "next/link";

export default function UploadTemplate() {
  return (
    <div className="px-8 py-4 bg-zinc-900">
      <Link
        href="/upload"
        className="inline-block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-500"
      >
        + Upload Template
      </Link>
    </div>
  );
}