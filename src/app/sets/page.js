"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";

export default function SetsPage() {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchSets();
    }
  }, [user]);

  const fetchSets = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sets`, {
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

  const navigateToSet = (setId) => {
    router.push(`/sets/${setId}`);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-lg">Please log in to view your sets</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Sets</h1>
        <Link
          href="/sets/create"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Create New Set
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : sets.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">You don't have any sets yet.</p>
          <Link
            href="/sets/create"
            className="mt-4 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 inline-block"
          >
            Create your first set
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sets.map((set) => (
            <div
              key={set.id}
              onClick={() => navigateToSet(set.id)}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start">
                <div className="text-3xl mr-3">📚</div>
                <div>
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
