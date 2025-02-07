import Navbar from "./components/Navbar";

export default function Home() {
  return (
    <div className="h-screen flex flex-col">
      {/* 🔵 Navbar */}
      <Navbar />

      {/* 🏠 المحتوى الرئيسي */}
      <main className="flex-1 p-4 bg-gray-50 dark:bg-gray-900 text-black dark:text-white">
        <h1 className="text-3xl font-bold">Welcome to QuizNest</h1>
        <p className="mt-2 text-lg">Start creating and managing your quiz sets!</p>
      </main>
    </div>
  );
}
