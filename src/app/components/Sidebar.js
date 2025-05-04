"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

const getInitials = (name) => {
  if (!name) return 'UN';
  return name
    .split(' ')
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();
};

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showNewFolderForm, setShowNewFolderForm] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const { user, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Listen for sidebar toggle events from Navbar
    const handleToggle = (e) => setIsOpen(e.detail.isOpen);
    window.addEventListener('toggleSidebar', handleToggle);
    return () => window.removeEventListener('toggleSidebar', handleToggle);
  }, []);

  useEffect(() => {
    if (user) {
      fetchFolders();
    }
  }, [user]);

  const fetchFolders = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/folders?userId=${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching folders: ${response.status}`);
      }
      
      const data = await response.json();
      setFolders(data);
    } catch (error) {
      console.error("Error fetching folders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    
    if (!newFolderName.trim()) {
      toast.error("Folder name cannot be empty");
      return;
    }
    
    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newFolderName
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create folder");
      }
      
      const newFolder = await response.json();
      setFolders([newFolder, ...folders]);
      setNewFolderName("");
      setShowNewFolderForm(false);
      toast.success("Folder created successfully");
    } catch (error) {
      console.error("Error creating folder:", error);
      toast.error(error.message || "Failed to create folder");
    }
  };

  // Don't render sidebar if user is not logged in
  if (!user) return null;

  const navItems = [
    { href: "/", icon: "🏠", label: "Home" },
    { href: "/folders", icon: "📂", label: "Folders" },
    { href: "/sets", icon: "📚", label: "Sets" },
    { href: "/profile", icon: "👤", label: "Profile" },
    { href: "/settings", icon: "⚙️", label: "Settings" }
  ];

  return (
    <aside 
      className={`h-screen bg-blue-800 dark:bg-gray-800 p-4 shadow-lg transition-all duration-300 ${
        isOpen ? "w-64" : "w-20"
      } overflow-y-auto`}
    >
      {/* User Profile Section */}
      <div className="mb-8">
        <div className="flex flex-col items-center">
          <div className="relative w-16 h-16">
            {user?.image ? (
              <Image
                src={user.image}
                alt={user.name}
                width={64}
                height={64}
                className="rounded-full object-cover border-2 border-white dark:border-gray-700"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-medium border-2 border-white dark:border-gray-700">
                {getInitials(user.name)}
              </div>
            )}
          </div>
          {isOpen && (
            <div className="text-center mt-2">
              <h2 className="text-lg font-semibold text-white truncate">
                {user.name}
              </h2>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center px-3 py-2 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-gray-700 transition-colors group"
          >
            <span className="text-xl">{item.icon}</span>
            {isOpen && (
              <span className="ml-3 text-sm font-medium transition-opacity">
                {item.label}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Folders Section */}
      {isOpen && (
        <div className="mt-6 pt-4 border-t border-blue-700 dark:border-gray-700">
          <div className="flex justify-between items-center px-3 mb-2">
            <h3 className="text-xs font-semibold text-blue-200 dark:text-gray-400 uppercase">
              My Folders
            </h3>
            <button
              onClick={() => setShowNewFolderForm(!showNewFolderForm)}
              className="text-blue-200 hover:text-white"
            >
              {showNewFolderForm ? "✕" : "➕"}
            </button>
          </div>
          
          {/* New Folder Form */}
          {showNewFolderForm && (
            <form onSubmit={handleCreateFolder} className="px-3 mb-3">
              <div className="flex items-center">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder name"
                  className="w-full px-2 py-1 text-sm bg-blue-700 dark:bg-gray-700 text-white rounded-l-md border border-blue-600 dark:border-gray-600 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-r-md border border-blue-600"
                >
                  ✓
                </button>
              </div>
            </form>
          )}
          
          {/* Folders List */}
          <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
            {loading ? (
              <div className="px-3 py-2 text-blue-200">Loading folders...</div>
            ) : folders.length === 0 ? (
              <div className="px-3 py-2 text-blue-200 text-sm">No folders yet</div>
            ) : (
              folders.map((folder) => (
                <Link
                  key={folder.id}
                  href={`/folders/${folder.id}`}
                  className="flex items-center px-3 py-2 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="text-sm">📁</span>
                  <span className="ml-2 text-sm font-medium truncate">
                    {folder.name}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {isOpen && (
        <div className="mt-6 pt-4 border-t border-blue-700 dark:border-gray-700">
          <h3 className="px-3 text-xs font-semibold text-blue-200 dark:text-gray-400 uppercase">
            Quick Actions
          </h3>
          <div className="mt-2 space-y-1">
            <Link
              href="/sets/create"
              className="w-full flex items-center px-3 py-2 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="text-xl">➕</span>
              <span className="ml-3 text-sm font-medium">New Set</span>
            </Link>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="absolute bottom-4 left-4 right-4">
        {isOpen ? (
          <div className="px-3 py-2 text-xs text-blue-200 dark:text-gray-400">
            <p>&copy; 2024 QuizNest</p>
            <p>Version 1.0.0</p>
          </div>
        ) : (
          <div className="flex justify-center text-blue-200 dark:text-gray-400">
            <span>&copy;</span>
          </div>
        )}
      </div>
    </aside>
  );
}