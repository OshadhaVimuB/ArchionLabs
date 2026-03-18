"use client"

import { ChevronRight, Plus } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function Header({ user, title = "Portfolio" }: { user: any, title?: string }) {
  const router = useRouter()
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"
  const avatarUrl = user?.user_metadata?.avatar_url || ""

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const openApp = (urlStr: string) => {
    window.open(urlStr, "_blank")
  }

  return (
    <header className="flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] transition-colors h-16">
      {/* Left side: Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
        <span className="cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors font-medium">{userName}</span>
        <ChevronRight className="w-4 h-4 text-zinc-400 dark:text-zinc-600" />
        <span className="text-zinc-900 dark:text-zinc-100 font-semibold cursor-pointer">
          {title}
        </span>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-4">
        {/* Create Button Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none">
            <div className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90 rounded-md text-sm font-medium transition-colors shadow-sm cursor-pointer border border-transparent">
              <Plus className="w-4 h-4" /> Create Project
              <div className="w-px h-4 bg-zinc-700 dark:bg-zinc-300 mx-1"></div>
              <div className="w-2 h-2 border-l-[1.5px] border-b-[1.5px] border-current rotate-[-45deg] mb-1 opacity-70"></div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-[#18181b] border-zinc-200 dark:border-zinc-800 shadow-md">
            <div className="px-2 py-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Select Module
            </div>
            <DropdownMenuItem 
              onClick={() => openApp(process.env.NEXT_PUBLIC_ARCHION_BUILD_FRONTEND_URL || "http://localhost:3001")}
              className="cursor-pointer py-2"
            >
              Archion Build
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => openApp(process.env.NEXT_PUBLIC_ARCHION_SIM_FRONTEND_URL || "http://localhost:3002")}
              className="cursor-pointer py-2"
            >
              Archion Sim
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => openApp(process.env.NEXT_PUBLIC_ARCHION_VIEWER_FRONTEND_URL || "http://localhost:3003")}
              className="cursor-pointer py-2"
            >
              Archion Viewer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none rounded-full ring-offset-background focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600">
            <Avatar className="w-8 h-8 shrink-0 cursor-pointer shadow-sm border border-zinc-200 dark:border-zinc-800">
               {avatarUrl ? <AvatarImage src={avatarUrl} /> : <AvatarFallback className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium">{userName.charAt(0)}</AvatarFallback>}
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-[#18181b] border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm shadow-md p-1">
            <div className="px-2 py-2 text-xs text-zinc-500 dark:text-zinc-400 truncate border-b border-zinc-200 dark:border-zinc-800 mb-1">
              Signed in as<br/>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{user?.email}</span>
            </div>
            <DropdownMenuItem 
              onClick={() => router.push("/dashboard/settings")}
              className="cursor-pointer py-2 px-2 rounded"
            >
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer py-2 px-2 rounded">
              Billing
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-200 dark:bg-zinc-800 my-1" />
            <DropdownMenuItem 
              onClick={handleSignOut}
              className="cursor-pointer text-red-600 dark:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/50 focus:text-red-700 dark:focus:text-red-400 py-2 px-2 rounded"
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
