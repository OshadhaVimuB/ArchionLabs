import { Header } from "@/components/dashboard/Header";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch projects from Supabase gracefully
  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  return (
    <>
      <Header user={user} title="All projects" />
      <main className="flex-1 overflow-y-auto p-8 bg-zinc-50/50 dark:bg-[#09090b] transition-colors">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Projects</h1>
          <div className="flex items-center gap-2">
             <button className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors rounded"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg></button>
             <button className="p-1.5 text-zinc-900 bg-zinc-200 dark:text-zinc-100 dark:bg-zinc-800 rounded"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg></button>
          </div>
        </div>

        {(!projects || projects.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
             <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <svg className="w-8 h-8 text-zinc-500 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
             </div>
             {error ? (
                <>
                  <p className="text-xl text-zinc-900 dark:text-white font-semibold mb-2">Error connecting to Supabase</p>
                  <p className="text-sm text-zinc-500 max-w-sm mt-1">Make sure you ran the `supabase_schema.sql` script to create the projects table.</p>
                </>
             ) : (
                <>
                  <p className="text-xl text-zinc-900 dark:text-white font-semibold mb-2">No projects yet</p>
                  <p className="text-sm text-zinc-500 max-w-sm">Use the "Create Project" button in the header to launch a module and start designing.</p>
                </>
             )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project) => (
              <a href={`/dashboard/project/${project.id}`} key={project.id} className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md transition-all cursor-pointer group flex flex-col h-full">
                 <div className="aspect-[16/10] bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center p-8 opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500">
                        {/* Abstract representation of a layout */}
                        <div className="w-full h-full border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-950 flex overflow-hidden shadow-sm">
                           <div className="w-1/3 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18181b]"></div>
                           <div className="flex-1 flex flex-col">
                              <div className="border-b border-zinc-200 dark:border-zinc-800 h-1/4"></div>
                              <div className="flex-1"></div>
                           </div>
                        </div>
                    </div>
                 </div>
                 <div className="p-4 flex-1 flex flex-col justify-center">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate mb-1">{project.name}</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                       Edited {new Date(project.updated_at).toLocaleDateString()}
                    </p>
                 </div>
              </a>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
