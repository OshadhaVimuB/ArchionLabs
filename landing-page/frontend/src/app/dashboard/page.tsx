import { Header } from "@/components/dashboard/Header";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Hammer, Eye, FolderOpen, Clock } from "lucide-react";
import { DeleteProjectButton } from "@/components/dashboard/DeleteProjectButton";

/** Lucide icon component by source type */
function SourceBadge({ source }: { source: string }) {
  switch (source) {
    case "build":
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/50 px-2 py-0.5 rounded-full">
          <Hammer className="w-3 h-3" />
          Build
        </span>
      );
    case "viewer":
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-950/50 px-2 py-0.5 rounded-full">
          <Eye className="w-3 h-3" />
          Viewer
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
          <FolderOpen className="w-3 h-3" />
          Manual
        </span>
      );
  }
}

/** Human-readable relative time string */
function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

/** Build the URL to re-open a project in its source app */
function getProjectLink(project: {
  id: string;
  source: string | null;
  source_project_id: string | null;
}): string {
  const buildUrl =
    process.env.NEXT_PUBLIC_ARCHION_BUILD_FRONTEND_URL || "http://localhost:3001";
  const viewerUrl =
    process.env.NEXT_PUBLIC_ARCHION_VIEWER_FRONTEND_URL || "http://localhost:3003";

  if (project.source === "build" && project.source_project_id) {
    return `${buildUrl}?project_id=${project.source_project_id}`;
  }
  if (project.source === "viewer" && project.source_project_id) {
    return `${viewerUrl}?project_id=${project.source_project_id}`;
  }
  return `/dashboard/project/${project.id}`;
}

/** Whether a project link should open in a new tab */
function isExternalLink(source: string | null): boolean {
  return source === "build" || source === "viewer";
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Use admin client (bypasses RLS) so we can see ALL projects,
  // including anonymous ones with user_id = NULL.
  // Falls back to the regular client if service role key is missing.
  const adminClient = createAdminClient();
  const queryClient = adminClient ?? supabase;

  // Fetch all projects from Supabase
  const { data: projects, error } = await queryClient
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  // Split into recent (top 5) and rest
  const recentProjects = projects?.slice(0, 5) ?? [];
  const allProjects = projects ?? [];

  return (
    <>
      <Header user={user} title="All projects" />
      <main className="flex-1 overflow-y-auto p-8 bg-zinc-50/50 dark:bg-[#09090b] transition-colors">

        {/* ── Recent Projects Section ── */}
        {recentProjects.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-zinc-500" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Recent
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {recentProjects.map((project) => (
                <div key={`recent-${project.id}`} className="relative group">
                  <DeleteProjectButton projectId={project.id} projectName={project.name} />
                  <a
                    href={getProjectLink(project)}
                    target={isExternalLink(project.source) ? "_blank" : undefined}
                    rel={isExternalLink(project.source) ? "noopener noreferrer" : undefined}
                    className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-lg transition-all cursor-pointer flex flex-col h-full"
                  >
                    <div className="aspect-[16/10] bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 relative overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center p-6 opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500">
                        <div className="w-full h-full border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-950 flex overflow-hidden shadow-sm">
                          <div className="w-1/3 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18181b]" />
                          <div className="flex-1 flex flex-col">
                            <div className="border-b border-zinc-200 dark:border-zinc-800 h-1/4" />
                            <div className="flex-1" />
                          </div>
                        </div>
                      </div>
                      {/* Source badge overlay */}
                      <div className="absolute top-2 right-2 z-10">
                        <SourceBadge source={project.source || "manual"} />
                      </div>
                    </div>
                    <div className="p-3 flex-1 flex flex-col justify-center">
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate mb-0.5">
                        {project.name}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {timeAgo(project.updated_at)}
                      </p>
                    </div>
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── All Projects Section ── */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            All Projects
          </h1>
          <div className="flex items-center gap-2">
            <button className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors rounded">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
            <button className="p-1.5 text-zinc-900 bg-zinc-200 dark:text-zinc-100 dark:bg-zinc-800 rounded">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </div>
        </div>

        {(!allProjects || allProjects.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <svg className="w-8 h-8 text-zinc-500 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            {error ? (
              <>
                <p className="text-xl text-zinc-900 dark:text-white font-semibold mb-2">Error connecting to Supabase</p>
                <p className="text-sm text-zinc-500 max-w-sm mt-1">Make sure you ran the `supabase_schema.sql` script to create the projects table.</p>
              </>
            ) : (
              <>
                <p className="text-xl text-zinc-900 dark:text-white font-semibold mb-2">No projects yet</p>
                <p className="text-sm text-zinc-500 max-w-sm">Use the &quot;Create Project&quot; button in the header to launch a module and start designing.</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {allProjects.map((project) => (
              <div key={project.id} className="relative group">
                <DeleteProjectButton projectId={project.id} projectName={project.name} />
                <a
                  href={getProjectLink(project)}
                  target={isExternalLink(project.source) ? "_blank" : undefined}
                  rel={isExternalLink(project.source) ? "noopener noreferrer" : undefined}
                  className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md transition-all cursor-pointer flex flex-col h-full"
                >
                  <div className="aspect-[16/10] bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center p-8 opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500">
                      <div className="w-full h-full border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-950 flex overflow-hidden shadow-sm">
                        <div className="w-1/3 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18181b]" />
                        <div className="flex-1 flex flex-col">
                          <div className="border-b border-zinc-200 dark:border-zinc-800 h-1/4" />
                          <div className="flex-1" />
                        </div>
                      </div>
                    </div>
                    {/* Source badge overlay */}
                    <div className="absolute top-2 right-2 z-10">
                      <SourceBadge source={project.source || "manual"} />
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-center">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate mb-1">{project.name}</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {timeAgo(project.updated_at)}
                    </p>
                  </div>
                </a>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
