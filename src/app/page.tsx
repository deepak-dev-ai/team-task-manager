import Link from "next/link";
import { ArrowRight, CheckCircle2, Users, LayoutDashboard } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-16 text-center">
        <div className="space-y-6">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight">
            Manage your team's tasks with <span className="text-blue-600">ease</span>.
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            TeamTask is a powerful collaborative project management tool designed to help your team stay organized, focused, and productive.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-transparent text-lg font-medium rounded-full shadow-lg text-white bg-blue-600 hover:bg-blue-700 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
            >
              Get Started for Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-gray-200 text-lg font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
            >
              Log In
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 pt-12 border-t border-gray-100">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-left">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Track Progress</h3>
            <p className="text-gray-600">Keep track of what's to do, in progress, and done. Never lose sight of your goals.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-left">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Collaborate</h3>
            <p className="text-gray-600">Add members to your projects and assign tasks. Work together seamlessly.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-left">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Insightful Dashboard</h3>
            <p className="text-gray-600">Get a bird's-eye view of all your projects and tasks in one intuitive dashboard.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
