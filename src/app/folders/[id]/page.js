"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";

export default function FolderDetailPage({ params }) {
  const [folder, setFolder] = useState(null);
  const [sets, setSets] = useState([]);
  const [allSets, setAllSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddSetModal, setShowAddSetModal] = useState(false);
  const { user, token } = useAuth();
  const router = useRouter();
  const folderId = params.id;

  useEffect(() => {
    if (user) {
      fetchFolderDetails();
      fetchSetsInFolder();
    }
  }, [user, folderId]);

  const fetchFolderDetails = async () => {
    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching folder: ${response.status}`);
      }
      
      const data = await response.json();
      setFolder(data);
    } catch (error) {
      console.error("Error fetching folder details:", error);
      toast.error("Failed to load folder details");
    }
  };

  const fetchSetsInFolder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sets?folderId=${folderId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching sets: ${response.status}`);
      }
      
      const data = await response.json();
      setSets(data);
    } catch (error) {
      console.error("Error fetching sets:", error);
      toast.error("Failed to load sets");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllSets = async () => {
    try {
      const response = await fetch(`/api/sets`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching all sets: ${response.status}`);
      }
      
      const data = await response.json();
      // Filter out sets that are already in this folder
      const setsNotInFolder = data.filter(set => set.folderId !== parseInt(folderId));
      setAllSets(setsNotInFolder);
    } catch (error) {
      console.error("Error fetching all sets:", error);
      toast.error("Failed to load sets");
    }
  };

  const handleAddSetClick = () => {
    fetchAllSets();
    setShowAddSetModal(true);
  };

  const handleAddSetToFolder = async (setId) => {
    try {
      const response = await fetch("/api/sets/add-to-folder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          setId,
          folderId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add set to folder");
      }
      
      const updatedSet = await response.json();
      
      // Update the UI
      setAllSets(allSets.filter(set => set.id !== updatedSet.id));
      setSets([updatedSet, ...sets]);
      
      toast.success("Set added to folder");
    } catch (error) {
      console.error("Error adding set to folder:", error);
      toast.error(error.message || "Failed to add set to folder");
    }
  };

  const handleRemoveSetFromFolder = async (setId) => {
    try {
      const response = await fetch("/api/sets/remove-from-folder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          setId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove set from folder");
      }
      
      const updatedSet = await response.json();
      
      // Update the UI
      setSets(sets.filter(set => set.id !== updatedSet.id));
      
      toast.success("Set removed from folder");
    } catch (error) {
      console.error("Error removing set from folder:", error);
      toast.error(error.message || "Failed to remove set from folder");
    }
  };

  const navigateToSet = (setId) => {
    router.push(`/sets/${setId}`);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-lg">Please log in to view folder details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href="/folders" className="text-blue-600 hover:text-blue-800 mb-2 inline-block">
            &larr; Back to Folders
          </Link>
          <h1 className="text-2xl font-bold">
            {loading ? "Loading..." : folder?.name || "Folder"}
          </h1>
        </div>
        <button
          onClick={handleAddSetClick}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Add Sets
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : sets.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">This folder doesn't have any sets yet.</p>
          <button
            onClick={handleAddSetClick}
            className="mt-4 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 inline-block"
          >
            Add sets to this folder
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sets.map((set) => (
            <div
              key={set.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start">
                <div className="text-3xl mr-3">📚</div>
                <div className="flex-1">
                  <h3 className="font-semibold">{set.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {set.description || "No description"}
                  </p>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <span>{set.flashcardsCount || 0} cards</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(set.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex flex-col space-y-2 ml-2">
                  <button
                    onClick={() => navigateToSet(set.id)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                  >
                    View
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveSetFromFolder(set.id);
                    }}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for adding sets to folder */}
      {showAddSetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add Sets to Folder</h2>
              <button
                onClick={() => setShowAddSetModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {allSets.length === 0 ? (
              <p className="text-center py-4">No sets available to add.</p>
            ) : (
              <div className="space-y-3">
                {allSets.map((set) => (
                  <div
                    key={set.id}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 flex justify-between items-center"
                  >
                    <div>
                      <h3 className="font-medium">{set.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {set.flashcardsCount || 0} cards
                      </p>
                    </div>
                    <button
                      onClick={() => handleAddSetToFolder(set.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-6 text-right">
              <button
                onClick={() => setShowAddSetModal(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
