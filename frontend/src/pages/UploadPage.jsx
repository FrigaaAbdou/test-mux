import React from 'react';
import { useNavigate } from 'react-router-dom';
import VideoUploader from '../components/VideoUploader';
import { ArrowLeft } from 'lucide-react';

export default function UploadPage() {
  const navigate = useNavigate();

  const handleUploadComplete = () => {
    // Navigate back to home page after successful upload
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <button
          onClick={() => navigate('/')}
          className="mb-6 text-gray-600 hover:text-gray-800 flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to videos
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Upload New Video
          </h1>
          <p className="text-gray-600">
            Share your content with the world
          </p>
        </div>

        <VideoUploader onUploadComplete={handleUploadComplete} />
      </div>
    </div>
  );
} 