"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    darkMode: false,
    notifications: true,
    language: "en",
    studyReminders: true
  });
  
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Load user settings from localStorage
    const savedSettings = localStorage.getItem("userSettings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
    
    // Check system preference for dark mode
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setSettings(prev => ({ ...prev, darkMode: true }));
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    // Apply dark mode setting
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Save settings to localStorage
    localStorage.setItem("userSettings", JSON.stringify(settings));
  }, [settings]);

  const handleToggle = (setting) => {
    setSettings(prev => {
      const newSettings = { ...prev, [setting]: !prev[setting] };
      return newSettings;
    });
    
    toast.success(`${setting} setting updated`);
  };

  const handleSelectChange = (setting, value) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
    toast.success(`${setting} setting updated`);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-lg">Please log in to view settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="space-y-6">
          {/* Appearance */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Appearance</h2>
            <div className="flex items-center justify-between">
              <label htmlFor="darkMode" className="text-sm font-medium">
                Dark Mode
              </label>
              <div className="relative inline-block w-12 h-6">
                <input
                  type="checkbox"
                  id="darkMode"
                  className="opacity-0 w-0 h-0"
                  checked={settings.darkMode}
                  onChange={() => handleToggle('darkMode')}
                />
                <span
                  className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors ${
                    settings.darkMode ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute h-4 w-4 left-1 bottom-1 bg-white rounded-full transition-transform ${
                      settings.darkMode ? 'transform translate-x-6' : ''
                    }`}
                  ></span>
                </span>
              </div>
            </div>
          </div>
          
          {/* Language */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Language</h2>
            <div className="flex items-center justify-between">
              <label htmlFor="language" className="text-sm font-medium">
                Interface Language
              </label>
              <select
                id="language"
                value={settings.language}
                onChange={(e) => handleSelectChange('language', e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              >
                <option value="en">English</option>
                <option value="ar">Arabic</option>
                <option value="de">German</option>
                <option value="fr">French</option>
                <option value="es">Spanish</option>
              </select>
            </div>
          </div>
          
          {/* Notifications */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Notifications</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="notifications" className="text-sm font-medium">
                  Enable Notifications
                </label>
                <div className="relative inline-block w-12 h-6">
                  <input
                    type="checkbox"
                    id="notifications"
                    className="opacity-0 w-0 h-0"
                    checked={settings.notifications}
                    onChange={() => handleToggle('notifications')}
                  />
                  <span
                    className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors ${
                      settings.notifications ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute h-4 w-4 left-1 bottom-1 bg-white rounded-full transition-transform ${
                        settings.notifications ? 'transform translate-x-6' : ''
                      }`}
                    ></span>
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <label htmlFor="studyReminders" className="text-sm font-medium">
                  Study Reminders
                </label>
                <div className="relative inline-block w-12 h-6">
                  <input
                    type="checkbox"
                    id="studyReminders"
                    className="opacity-0 w-0 h-0"
                    checked={settings.studyReminders}
                    onChange={() => handleToggle('studyReminders')}
                    disabled={!settings.notifications}
                  />
                  <span
                    className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors ${
                      settings.studyReminders && settings.notifications
                        ? 'bg-blue-600'
                        : 'bg-gray-300'
                    } ${!settings.notifications ? 'opacity-50' : ''}`}
                  >
                    <span
                      className={`absolute h-4 w-4 left-1 bottom-1 bg-white rounded-full transition-transform ${
                        settings.studyReminders && settings.notifications ? 'transform translate-x-6' : ''
                      }`}
                    ></span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Account */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Account</h2>
            <div className="space-y-3">
              <button
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                onClick={() => router.push('/profile')}
              >
                Edit Profile
              </button>
              <button
                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm block"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
