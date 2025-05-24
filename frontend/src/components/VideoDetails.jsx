import React, { useState, useEffect } from 'react';
import mammoth from 'mammoth';
import { 
  ThumbsUp, 
  Share2, 
  MessageCircle, 
  Eye,
  Tag,
  Calendar,
  Settings,
  User,
  Edit3,
  Check,
  X,
  FileText,
  Upload,
  Loader
} from 'lucide-react';
import RichTextEditor from './RichTextEditor';

export default function VideoDetails({ video, onMetadataUpdate }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState(video?.description || '');
  const [wordFileStatus, setWordFileStatus] = useState({ loading: false, fileName: null });
  const API_BASE = 'http://localhost:5001';

  useEffect(() => {
    if (video?._id) {
      fetchComments();
      incrementViewCount();
    }
  }, [video?._id]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`${API_BASE}/videos/${video._id}/comments`);
      const data = await response.json();
      if (data.success) {
        setComments(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const incrementViewCount = async () => {
    try {
      const response = await fetch(`${API_BASE}/videos/${video._id}/view`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success && onMetadataUpdate) {
        onMetadataUpdate({ ...video, metadata: data.data });
      }
    } catch (error) {
      console.error('Failed to increment view count:', error);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/videos/${video._id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newComment,
          author: {
            name: 'Anonymous User', // Replace with actual user data
            id: 'anonymous',
            avatar: null
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        setNewComment('');
        await fetchComments();
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDescription = async () => {
    try {
      const response = await fetch(`${API_BASE}/videos/${video._id}/metadata`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: editedDescription
        })
      });

      const data = await response.json();
      if (data.success && onMetadataUpdate) {
        onMetadataUpdate({ ...video, description: editedDescription });
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to update description:', error);
    }
  };

  const handleWordFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setWordFileStatus({ loading: true, fileName: file.name });

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      setEditedDescription(result.value);
      setWordFileStatus({ loading: false, fileName: file.name });
    } catch (error) {
      console.error('Failed to convert Word document:', error);
      alert('Failed to convert Word document. Please try again.');
      setWordFileStatus({ loading: false, fileName: null });
    }
  };

  if (!video) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Video Metadata */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {video.title}
            </h1>
            <div className="relative">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-500">
                      {wordFileStatus.fileName && (
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>Imported: {wordFileStatus.fileName}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept=".docx,.doc"
                        onChange={handleWordFileUpload}
                        className="hidden"
                        id="word-file-upload"
                        disabled={wordFileStatus.loading}
                      />
                      <label
                        htmlFor="word-file-upload"
                        className={`inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-800 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                          wordFileStatus.loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'
                        }`}
                      >
                        {wordFileStatus.loading ? (
                          <>
                            <Loader className="w-4 h-4 mr-1.5 animate-spin" />
                            Converting...
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4 mr-1.5" />
                            Import Word Document
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                  <div className="border border-gray-300 rounded-md overflow-hidden">
                    <RichTextEditor
                      value={editedDescription}
                      onChange={setEditedDescription}
                      height="400px"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveDescription}
                      className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors"
                    >
                      <Check className="w-4 h-4 mr-1.5" />
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditedDescription(video.description);
                      }}
                      className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-800 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      <X className="w-4 h-4 mr-1.5" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="group relative">
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: video.description }}
                  />
                  <button
                    onClick={() => setIsEditing(true)}
                    className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
                    title="Edit description"
                  >
                    <Edit3 className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <button className="text-gray-600 hover:text-blue-600 p-2">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center">
            <Eye className="w-4 h-4 mr-1" />
            {video.metadata?.views || 0} views
          </div>
          <div className="flex items-center">
            <ThumbsUp className="w-4 h-4 mr-1" />
            {video.metadata?.likes || 0} likes
          </div>
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            {new Date(video.createdAt).toLocaleDateString()}
          </div>
          <div className="flex items-center">
            <Tag className="w-4 h-4 mr-1" />
            {video.category}
          </div>
          <div className="flex items-center">
            <User className="w-4 h-4 mr-1" />
            {video.author?.name || 'Anonymous'}
          </div>
        </div>

        {video.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {video.tags.map((tag, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Comments Section */}
      {video.settings?.allowComments && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <MessageCircle className="w-5 h-5 mr-2" />
            Comments ({comments.length})
          </h2>

          {/* Comment Form */}
          <form onSubmit={handleSubmitComment} className="mb-6">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </button>
          </form>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment._id} className="border-b border-gray-100 pb-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    {comment.author.avatar ? (
                      <img 
                        src={comment.author.avatar} 
                        alt={comment.author.name}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <User className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {comment.author.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-600">{comment.content}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <button className="flex items-center gap-1 hover:text-blue-600">
                        <ThumbsUp className="w-4 h-4" />
                        {comment.likes}
                      </button>
                      <button className="flex items-center gap-1 hover:text-blue-600">
                        <MessageCircle className="w-4 h-4" />
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 