"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { LayoutDashboard, CheckSquare, LogOut, LogIn, UserPlus } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-blue-600 dark:bg-blue-500 text-white p-2 rounded-lg">
                <CheckSquare size={24} />
              </div>
              <span className="font-bold text-xl text-gray-900 dark:text-white tracking-tight">TeamTask</span>
            </Link>
            
            {session && (
              <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                <Link href="/dashboard" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
                <Link href="/projects" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                  Projects
                </Link>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {session ? (
              <div className="flex items-center gap-4 ml-2">
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  {session.user?.name}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4 ml-2">
                <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  <LogIn className="w-4 h-4" />
                  Log in
                </Link>
                <Link href="/signup" className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors">
                  <UserPlus className="w-4 h-4" />
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
