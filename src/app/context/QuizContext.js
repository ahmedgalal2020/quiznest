"use client";

import { createContext, useState, useEffect } from "react";
import { Toaster } from 'react-hot-toast';

export const QuizContext = createContext();

export default function QuizProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [usersRes, foldersRes] = await Promise.all([
          fetch("/api/users"),
          fetch("/api/folders"),
        ]);

        const usersData = await usersRes.json();
        const foldersData = await foldersRes.json();

        setUsers(usersData);
        setFolders(foldersData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <QuizContext.Provider value={{ users, folders, loading, setFolders }}>
      <Toaster position="top-center" />

      {children}
    </QuizContext.Provider>
  );
}
