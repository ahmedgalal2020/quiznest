"use client";

import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { FaBook, FaGraduationCap, FaTrophy, FaChartLine, FaPlus, FaFire, FaStar } from 'react-icons/fa';

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const [recentSets, setRecentSets] = useState([]);
  const [stats, setStats] = useState({
    totalSets: 0,
    completedSets: 0,
    masteredCards: 0,
    studyStreak: 0,
    level: 1,
    xpPoints: 0
  });
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Fetch user stats
        const statsRes = await fetch('/api/users/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        // Fetch recent sets
        const setsRes = await fetch('/api/sets/recent', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        // Fetch recent achievements
        const achievementsRes = await fetch('/api/achievements/recent', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (statsRes.ok && setsRes.ok && achievementsRes.ok) {
          const statsData = await statsRes.json();
          const setsData = await setsRes.json();
          const achievementsData = await achievementsRes.json();

          setStats(statsData);
          setRecentSets(setsData.sets); // Extract the sets array from the response
          setAchievements(achievementsData.achievements); // Extract the achievements array from the response
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Welcome to QuizNest
              {user && `, ${user.name}`}!
            </h1>
            <p className="text-xl mb-8">
              Create, share, and master knowledge through interactive quizzes
            </p>
            {!isAuthenticated ? (
              <div className="space-x-4">
                <Link
                  href="/register"
                  className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  Get Started
                </Link>
                <Link
                  href="/login"
                  className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            ) : (
              <Link
                href="/quizzes/create"
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors inline-flex items-center"
              >
                <FaPlus className="mr-2" />
                Create New Quiz
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {isAuthenticated ? (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <FaBook className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm">Total Sets</h3>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {stats.totalSets}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                    <FaStar className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm">Mastered Cards</h3>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {stats.masteredCards}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
                    <FaFire className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm">Study Streak</h3>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {stats.studyStreak} days
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                    <FaTrophy className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm">Level</h3>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {stats.level}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Sets */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Sets</h2>
                <Link
                  href="/sets/create"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaPlus className="inline-block mr-2" />
                  New Set
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentSets.map((set) => (
                  <Link
                    key={set.id}
                    href={`/sets/${set.id}`}
                    className="block bg-gray-50 dark:bg-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {set.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {set.description || 'No description'}
                    </p>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-blue-600 dark:text-blue-400">
                        {set._count?.flashcards || 0} cards
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {new Date(set.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Achievements */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Recent Achievements
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="w-12 h-12 mx-auto mb-2">
                      <Image
                        src={achievement.icon}
                        alt={achievement.title}
                        width={48}
                        height={48}
                        className="object-contain"
                      />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {achievement.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {achievement.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Guest View
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
              Why Choose QuizNest?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <FaBook className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Create Custom Quizzes
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Design personalized quizzes with various question types
                </p>
              </div>

              <div className="text-center">
                <div className="bg-green-100 dark:bg-green-900 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <FaGraduationCap className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Learn and Improve
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Track your progress and improve your knowledge
                </p>
              </div>

              <div className="text-center">
                <div className="bg-purple-100 dark:bg-purple-900 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <FaTrophy className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Compete and Share
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Share quizzes and compete with others
                </p>
              </div>
            </div>
          </div>
        )}
      </div>



    </div>
  );
}