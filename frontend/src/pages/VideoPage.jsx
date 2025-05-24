import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer';
import VideoDetails from '../components/VideoDetails';
import { ArrowLeft } from 'lucide-react';

export default function VideoPage() {
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const API_BASE = 'http://localhost:5001';

  useEffect(() => {
    fetchVideo();
  }, [id]);

  const fetchVideo = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE}/videos/${id}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error);
      }
      
      setVideo(data.data);
    } catch (error) {
      console.error('Failed to fetch video:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMetadataUpdate = (updatedVideo) => {
    setVideo(updatedVideo);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading video...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="text-blue-600 hover:text-blue-800 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to videos
            </button>
          </div>
        </div>
      </div>
    );
  }

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

        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 mb-4">
            <VideoPlayer
              playbackId={video.muxPlaybackId}
              title={video.title}
            />
          </div>
          <VideoDetails 
            video={video}
            onMetadataUpdate={handleMetadataUpdate}
          />
        </div>
      </div>
    </div>
  );
} 