"use client";

import { useState } from "react";
import Link from "next/link";
import Sidebar from "../components/Sidebar";
import SidebarToggle from "../components/SidebarToggle";

export default function Navbar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(true); // تغييرها لاحقًا عند تفعيل `Auth`
  const [notificationCount, setNotificationCount] = useState(3); // عدد الإشعارات الجديدة

  return (
    <div className="flex h-screen">
      {/* Sidebar ثابت على اليسار */}
      <Sidebar isOpen={isSidebarOpen} />

      {/* باقي الصفحة */}
      <div className="flex-1 flex flex-col">
        {/* 🔵 Navbar */}
        <nav className="bg-blue-600 dark:bg-gray-900 text-white p-4 flex justify-between items-center">
          {/* زر فتح/إغلاق Sidebar */}
          <SidebarToggle toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

          {/* 🔍 شريط البحث */}
          <div className="flex-1 m-auto mx-4">
            <input
              type="text"
              placeholder="Search..."
              className="w-1/2 px-4 py-2 rounded-lg text-black dark:text-white bg-gray-100 dark:bg-gray-800"
            />
          </div>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <div className="relative">
                {/* صورة المستخدم */}
                <img
                  src="https://via.placeholder.com/40"
                  alt="User"
                  className="w-10 h-10 rounded-full cursor-pointer"
                />
                {/* البادج (Badge) */}
                {notificationCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                    {notificationCount}
                  </span>
                )}
              </div>
            ) : (
              <>
                <Link href="/register">
                  <button className="bg-gray-200 text-black px-4 py-2 rounded">Register</button>
                </Link>
                <Link href="/login">
                  <button className="bg-gray-300 text-black px-4 py-2 rounded">Login</button>
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
}
