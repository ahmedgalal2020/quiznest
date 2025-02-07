"use client";

import Link from "next/link";
import { useState } from "react";

export default function Sidebar({ isOpen }) {
  const [isLoggedIn, setIsLoggedIn] = useState(true); // سيتم استبداله بحالة فعلية لاحقًا

  return (
    <aside
      className={`h-screen bg-gray-100 dark:bg-gray-800 p-4 shadow-lg transition-all duration-300 ${
        isOpen ? "w-64" : "w-20"
      }`}
    >
      <ul className="space-y-4">
        <li>
          <Link href="/" className="block p-2">
            🏠 {isOpen && "Home"}
          </Link>
        </li>
        <li>
          <Link href="/folders" className="block p-2">
            📂 {isOpen && "Folders"}
          </Link>
        </li>
        <li>
          <Link href="/sets" className="block p-2">
            📚 {isOpen && "Sets"}
          </Link>
        </li>

        {/* ✅ إظهار زر "Logout" فقط إذا كان المستخدم مسجل الدخول */}
        {isLoggedIn && (
          <li>
            <button className="text-red-500 p-2 w-full text-left">
              🚪 {isOpen && "Logout"}
            </button>
          </li>
        )}
      </ul>

      {/* ✅ إظهار زر البروفايل فقط إذا كان المستخدم مسجل الدخول */}
      {isLoggedIn && (
        <div className="absolute bottom-6 left-4">
          <button className="flex items-center gap-2 bg-gray-300 dark:bg-gray-700 p-2 rounded">
            <img
              src="https://via.placeholder.com/40"
              className="w-8 h-8 rounded-full"
            />
            {isOpen && "Profile"}
          </button>
        </div>
      )}
    </aside>
  );
}
