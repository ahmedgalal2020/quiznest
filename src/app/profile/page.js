"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FaCamera, FaSpinner, FaUser } from "react-icons/fa";
import Image from "next/image";

// الثوابت
const DEFAULT_AVATAR = "/images/default-avatar.png";
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// دوال المساعدة
const getAvatarUrl = (name) => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128`;
};

const validateImage = (file) => {
  if (!file) return { isValid: false, error: 'No file selected' };
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { isValid: false, error: 'Please select a valid image file (JPEG, PNG, GIF, or WebP)' };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { isValid: false, error: 'Image size must be less than 5MB' };
  }
  return { isValid: true, error: null };
};

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    image: DEFAULT_AVATAR
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const fileInputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
          router.push("/login");
          return;
        }

        const userData = JSON.parse(storedUser);
        setUser(userData);
        setFormData({
          name: userData.name || "",
          email: userData.email || "",
          image: userData.image || getAvatarUrl(userData.name)
        });
      } catch (error) {
        console.error("Authentication error:", error);
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  const handleImageClick = () => fileInputRef.current?.click();

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    const validation = validateImage(file);
    
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    try {
      setIsImageUploading(true);
      setError(null);
  
      const formData = new FormData();
      formData.append('file', file);
  
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
  
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }
  
      const { url } = await uploadResponse.json();
  
      // تحديث بيانات المستخدم
      const updateResponse = await fetch("/api/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: user.id,
          name: formData.get('name') || user.name,
          email: formData.get('email') || user.email,
          image: url
        }),
      });
  
      if (!updateResponse.ok) {
        throw new Error('Failed to update profile image');
      }
  
      const updatedUser = await updateResponse.json();
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setFormData(prev => ({ ...prev, image: url }));
      showSuccessMessage('Profile image updated successfully');
  
    } catch (error) {
      console.error('Image upload error:', error);
      setError(error.message || 'Failed to upload image');
      setFormData(prev => ({
        ...prev,
        image: user?.image || getAvatarUrl(user?.name)
      }));
    } finally {
      setIsImageUploading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value.trim()
    }));
    setError(null);
  };

  const validateForm = () => {
    if (!formData.name.trim()) return { isValid: false, error: 'Name is required' };
    if (!formData.email.trim()) return { isValid: false, error: 'Email is required' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }
    return { isValid: true, error: null };
  };

  const showSuccessMessage = (message) => {
    setSuccess(true);
    setError(null);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleSaveChanges = async () => {
    if (!user) return;

    const validation = validateForm();
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          ...formData
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      const updatedUser = await res.json();
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      showSuccessMessage('Profile updated successfully');

    } catch (error) {
      setError(error.message);
      console.error("Profile update error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <FaSpinner className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Profile Settings
        </h2>

        {/* Success Message */}
        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">Profile updated successfully!</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Profile Image Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative group">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-blue-100 hover:border-blue-300 transition-colors">
              {isImageUploading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                  <FaSpinner className="animate-spin h-8 w-8 text-blue-500" />
                </div>
              ) : (
                <>
                  <Image
                    src={formData.image || getAvatarUrl(formData.name)}
                    alt={formData.name || "Profile"}
                    width={128}
                    height={128}
                    className="object-cover w-full h-full"
                    onError={() => {
                      setFormData(prev => ({
                        ...prev,
                        image: getAvatarUrl(prev.name)
                      }));
                    }}
                  />
                  <div
                    onClick={handleImageClick}
                    className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <FaCamera className="h-8 w-8 text-white" />
                  </div>
                </>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept={ALLOWED_IMAGE_TYPES.join(',')}
              className="hidden"
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">Click to change profile picture</p>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your full name"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <FaUser className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email address"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-400">@</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveChanges}
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <FaSpinner className="animate-spin h-5 w-5" />
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}