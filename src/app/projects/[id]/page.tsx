"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Plus, Users, Clock, AlertCircle, CheckCircle2, Sparkles, MessageSquare, Send, X, Bot, RefreshCw } from "lucide-react";
import React from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

export default function ProjectDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  // AI Assistant State & Hook
  const [showAiChat, setShowAiChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, status: chatStatus, sendMessage, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { projectId },
    }),
    onFinish: () => {
      fetchProject();
    },
    onError: (err) => {
      console.error("AI PM Assistant error:", err);
    },
  });

  const [input, setInput] = useState("");
  const isLoading = chatStatus === "streaming" || chatStatus === "submitted";

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  };

  // Auto-scroll to the bottom of the chat list
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleQuickAction = (text: string) => {
    sendMessage({ text });
  };

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "Medium",
    dueDate: "",
    status: "To Do",
    assigneeId: "",
  });

  const [newMember, setNewMember] = useState({
    email: "",
    role: "Member",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchProject();
      fetchAllUsers();
    }
  }, [status, router, projectId]);

  const fetchAllUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch all users", error);
    }
  };

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
      } else {
        router.push("/projects");
      }
    } catch (error) {
      console.error("Failed to fetch project", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });
      if (res.ok) {
        setShowTaskModal(false);
        setNewTask({ title: "", description: "", priority: "Medium", dueDate: "", status: "To Do", assigneeId: "" });
        fetchProject();
      }
    } catch (error) {
      console.error("Create task error", error);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMember),
      });
      if (res.ok) {
        setShowMemberModal(false);
        setNewMember({ email: "", role: "Member" });
        fetchProject();
      } else {
        const data = await res.json();
        alert(data.message);
      }
    } catch (error) {
      console.error("Add member error", error);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchProject();
      }
    } catch (error) {
      console.error("Update task error", error);
    }
  };

  const updateTaskAssignee = async (taskId: string, newAssigneeId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId: newAssigneeId === "unassigned" ? null : newAssigneeId }),
      });
      if (res.ok) {
        fetchProject();
      }
    } catch (error) {
      console.error("Update task assignee error", error);
    }
  };

  if (loading || status === "loading") {
    return <div className="flex-grow flex items-center justify-center">Loading...</div>;
  }

  if (!project) return null;

  const isAdmin = project.currentUserRole === "Admin";

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30";
      case "Medium": return "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/30";
      case "Low": return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30";
      default: return "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-800";
    }
  };

  const renderColumn = (statusName: string) => {
    const columnTasks = project.tasks.filter((t: any) => t.status === statusName);
    return (
      <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl p-4 min-h-[500px]">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4 px-2 flex items-center justify-between">
          {statusName}
          <span className="bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 text-xs py-1 px-2 rounded-full shadow-sm">
            {columnTasks.length}
          </span>
        </h3>
        <div className="space-y-3">
          {columnTasks.map((task: any) => (
            <div key={task.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">{task.title}</h4>
              </div>
              {task.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{task.description}</p>
              )}
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs px-2 py-1 rounded-md font-medium ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
                {task.dueDate && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-700 gap-2">
                {isAdmin ? (
                  <select
                    value={task.assignee?.id || "unassigned"}
                    onChange={(e) => updateTaskAssignee(task.id, e.target.value)}
                    className="text-xs border-gray-200 dark:border-gray-600 rounded-md py-1 pr-6 pl-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors w-28 truncate"
                  >
                    <option value="unassigned">Unassigned</option>
                    {allUsers.map((user: any) => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md w-28 truncate">
                    {task.assignee?.name || "Unassigned"}
                  </div>
                )}
                <select
                  value={task.status}
                  onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                  className="text-xs border-gray-200 dark:border-gray-600 rounded-md py-1 pr-6 pl-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
              </div>
            </div>
          ))}
          {columnTasks.length === 0 && (
            <div className="text-center py-8 text-sm text-gray-400 dark:text-gray-500">
              No tasks yet
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-2xl">{project.description}</p>
        </div>
        {isAdmin && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowMemberModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border-2 border-gray-200 dark:border-gray-700 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Users className="w-4 h-4" />
              Add Member
            </button>
            <button
              onClick={() => setShowTaskModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderColumn("To Do")}
        {renderColumn("In Progress")}
        {renderColumn("Done")}
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create New Task</h2>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={3}
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newTask.status}
                    onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assignee</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newTask.assigneeId}
                  onChange={(e) => setNewTask({ ...newTask, assigneeId: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {allUsers.map((user: any) => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Add Team Member</h2>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User Email</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                >
                  <option value="Member">Member</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating AI Assistant Button */}
      <button
        onClick={() => setShowAiChat(!showAiChat)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
        title="AI PM Assistant"
      >
        {showAiChat ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
      </button>

      {/* Sliding AI Panel */}
      <div
        className={`fixed top-16 right-0 bottom-0 z-30 w-full sm:w-[420px] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          showAiChat ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">AI PM Assistant</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Gemini 2.5 Agent</p>
            </div>
          </div>
          <button
            onClick={() => setShowAiChat(false)}
            className="p-1 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-grow overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/40 text-blue-500 dark:text-blue-400 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-950 dark:text-white text-sm">Welcome to your AI PM Workspace</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-[280px]">
                  I can help you analyze workload, decompose goals, update task status, and manage this project.
                </p>
              </div>

              {/* Quick Suggestions */}
              <div className="w-full pt-4 space-y-2">
                <button
                  onClick={() => handleQuickAction("Summarize project status and overdue tasks")}
                  className="w-full text-left p-3 text-xs bg-gray-50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/20 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 rounded-xl transition-colors flex items-center gap-2"
                >
                  📋 Summarize project status & overdue tasks
                </button>
                <button
                  onClick={() => handleQuickAction("Analyze workload distribution among team members")}
                  className="w-full text-left p-3 text-xs bg-gray-50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/20 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 rounded-xl transition-colors flex items-center gap-2"
                >
                  📊 Analyze member workloads
                </button>
                <button
                  onClick={() => handleQuickAction("Suggest and create 3 subtasks to launch the marketing campaign")}
                  className="w-full text-left p-3 text-xs bg-gray-50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/20 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 rounded-xl transition-colors flex items-center gap-2"
                >
                  💡 Suggest/create subtasks for a goal
                </button>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role !== "user" && (
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl max-w-[80%] text-sm ${
                    message.role === "user"
                      ? "bg-blue-600 text-white rounded-tr-none shadow-sm"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200/50 dark:border-gray-700/50 shadow-sm"
                  }`}
                >
                  {message.parts.map((part, idx) => {
                    if (part.type === "text") {
                      return (
                        <p key={idx} className="whitespace-pre-wrap leading-relaxed">
                          {part.text}
                        </p>
                      );
                    }
                    if (part.type === "reasoning") {
                      return (
                        <p key={idx} className="text-xs italic text-gray-500 dark:text-gray-400 border-l-2 border-gray-300 dark:border-gray-600 pl-2 py-0.5 my-1">
                          {part.text}
                        </p>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-2xl rounded-tl-none border border-gray-200/50 dark:border-gray-700/50 flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
              </div>
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-xl text-xs flex items-start gap-2 shadow-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">AI Assistant Error</p>
                <p className="mt-0.5">{error.message || "An unexpected error occurred. Please verify your Gemini API Key or check server logs."}</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <form
          onSubmit={handleSendMessage}
          className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80 backdrop-blur-sm"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the AI PM..."
              className="flex-grow px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
