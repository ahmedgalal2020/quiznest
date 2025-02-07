"use client";

export default function SidebarToggle({ toggleSidebar }) {
  return (
    <button onClick={toggleSidebar} className="text-2xl p-2 focus:outline-none">
      ☰
    </button>
  );
}
