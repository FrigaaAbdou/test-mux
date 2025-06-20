import React, { useState, useEffect } from 'react';
import { Video, CheckCircle, Clock, AlertCircle, Play, Trash2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const [videos, setVideos] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const API_BASE = 'http://localhost:5001';

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE}/videos`);
      const data = await response.json();
      if (data.success) {
        setVideos(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch videos');
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
      setError(error.message);
      // Don't let API errors break the UI
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'awaiting_upload':
        return <Video className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ready':
        return 'Ready to play';
      case 'processing':
        return 'Processing...';
      case 'awaiting_upload':
        return 'Awaiting upload';
      default:
        return 'Error';
    }
  };

  const getVideoThumbnail = (playbackId) => {
    if (!playbackId) return null;
    return `https://image.mux.com/${playbackId}/thumbnail.jpg?time=0`;
  };

  const handleDelete = async (videoId) => {
    if (!window.confirm('Are you sure you want to delete this video?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`${API_BASE}/videos/${videoId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        setVideos(videos.filter(v => v._id !== videoId));
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Failed to delete video:', error);
      alert('Failed to delete video: ' + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading videos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 relative">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Video Upload Manager
          </h1>
          <p className="text-gray-600">
            Upload and manage your video content with Mux streaming
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 font-medium">Unable to connect to backend</p>
                <p className="text-red-600 text-sm mt-1">
                  Make sure your backend server is running on port 5001
                </p>
                <button
                  onClick={fetchVideos}
                  className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Videos List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Video className="w-5 h-5 mr-2" />
            Uploaded Videos ({videos.length})
          </h2>

          {videos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No videos uploaded yet</p>
              <button
                onClick={() => navigate('/upload')}
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Upload Your First Video
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {videos.map((video) => (
                <div 
                  key={video._id} 
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {/* Video Thumbnail */}
                    <div 
                      onClick={() => video.status === 'ready' && navigate(`/videos/${video._id}`)}
                      className={`w-48 aspect-video bg-gray-100 rounded-md overflow-hidden flex-shrink-0 ${
                        video.status === 'ready' ? 'cursor-pointer hover:opacity-75' : ''
                      }`}
                    >
                      {video.muxPlaybackId ? (
                        <img
                          src={getVideoThumbnail(video.muxPlaybackId)}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Video Info */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          {getStatusIcon(video.status)}
                          <h3 
                            onClick={() => video.status === 'ready' && navigate(`/videos/${video._id}`)}
                            className={`font-medium text-gray-900 ml-2 ${
                              video.status === 'ready' ? 'cursor-pointer hover:text-blue-600' : ''
                            }`}
                          >
                            {video.title}
                          </h3>
                        </div>
                        <button
                          onClick={() => handleDelete(video._id)}
                          disabled={isDeleting}
                          className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition-colors"
                          title="Delete video"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{getStatusText(video.status)}</span>
                        {video.duration && (
                          <span>{Math.round(video.duration)}s</span>
                        )}
                        <span>
                          {new Date(video.createdAt).toLocaleDateString()}
                        </span>
                        {video.metadata?.views > 0 && (
                          <span>{video.metadata.views} views</span>
                        )}
                        {video.category && (
                          <span>{video.category}</span>
                        )}
                      </div>

                      {/* Play Button */}
                      {video.status === 'ready' && video.muxPlaybackId && (
                        <button
                          onClick={() => navigate(`/videos/${video._id}`)}
                          className="mt-3 inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors"
                        >
                          <Play className="w-4 h-4 mr-1.5" />
                          Play Video
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Upload Button */}
      <button
        onClick={() => navigate('/upload')}
        className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
        title="Upload new video"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}