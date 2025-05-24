import React, { useState } from 'react';
import { Upload, Video, Tag, Settings, FileText, Check, Loader } from 'lucide-react';
import mammoth from 'mammoth';
import RichTextEditor from './RichTextEditor';

export default function VideoUploader({ onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Uncategorized');
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [settings, setSettings] = useState({
    allowComments: true,
    allowRatings: true,
    autoplay: true
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [wordFileStatus, setWordFileStatus] = useState({ loading: false, fileName: null });

  const API_BASE = 'http://localhost:5001';

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    } else {
      alert('Please select a valid video file');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async () => {
    if (!selectedFile || !title) {
      alert('Please select a file and enter a title');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Create upload URL
      const createResponse = await fetch(`${API_BASE}/create-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
          visibility,
          settings,
          author: {
            name: 'Anonymous User', // Replace with actual user data
            id: 'anonymous',
            avatar: null
          }
        })
      });

      const createData = await createResponse.json();
      
      if (!createData.success) {
        throw new Error(createData.error);
      }

      // Step 2: Upload file to Mux
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      });

      xhr.onload = function() {
        if (xhr.status === 200 || xhr.status === 201) {
          console.log('Upload completed successfully');
          // Reset form
          setSelectedFile(null);
          setTitle('');
          setDescription('');
          setCategory('Uncategorized');
          setTags('');
          setVisibility('public');
          setSettings({
            allowComments: true,
            allowRatings: true,
            autoplay: true
          });
          setUploadProgress(0);
          setUploading(false);
          // Notify parent component
          onUploadComplete();
        } else {
          throw new Error('Upload failed');
        }
      };

      xhr.onerror = function() {
        throw new Error('Upload failed');
      };

      xhr.open('PUT', createData.data.uploadUrl);
      xhr.send(selectedFile);

    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload video: ' + error.message);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-8">
      {/* Upload Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Upload className="w-5 h-5 mr-2" />
          Upload New Video
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
                id="video-upload"
                disabled={uploading}
              />
              <label 
                htmlFor="video-upload" 
                className="cursor-pointer flex flex-col items-center"
              >
                <Video className="w-8 h-8 text-gray-400 mb-2" />
                {selectedFile ? (
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Click to select video file
                  </p>
                )}
              </label>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={uploading}
                >
                  <option value="Uncategorized">Uncategorized</option>
                  <option value="Education">Education</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Gaming">Gaming</option>
                  <option value="Music">Music</option>
                  <option value="Tech">Tech</option>
                  <option value="Vlogs">Vlogs</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="tag1, tag2, tag3"
                  disabled={uploading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visibility
                </label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={uploading}
                >
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter video title"
                disabled={uploading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Settings className="w-4 h-4 mr-1" />
                Video Settings
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.allowComments}
                    onChange={(e) => setSettings({...settings, allowComments: e.target.checked})}
                    className="mr-2"
                    disabled={uploading}
                  />
                  Allow comments
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.allowRatings}
                    onChange={(e) => setSettings({...settings, allowRatings: e.target.checked})}
                    className="mr-2"
                    disabled={uploading}
                  />
                  Allow ratings
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.autoplay}
                    onChange={(e) => setSettings({...settings, autoplay: e.target.checked})}
                    className="mr-2"
                    disabled={uploading}
                  />
                  Enable autoplay
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description Editor */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="sticky top-0 z-10">
          <h2 className="text-xl font-semibold p-6 pb-2 flex items-center border-b border-gray-200">
            <Tag className="w-5 h-5 mr-2" />
            Video Description
          </h2>
          <div className="px-6 py-2 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
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
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    
                    setWordFileStatus({ loading: true, fileName: file.name });
                    
                    try {
                      const arrayBuffer = await file.arrayBuffer();
                      const result = await mammoth.convertToHtml({ arrayBuffer });
                      setDescription(result.value);
                      setWordFileStatus({ loading: false, fileName: file.name });
                    } catch (error) {
                      console.error('Failed to convert Word document:', error);
                      alert('Failed to convert Word document. Please try again.');
                      setWordFileStatus({ loading: false, fileName: null });
                    }
                  }}
                  className="hidden"
                  id="word-file-upload"
                  disabled={uploading || wordFileStatus.loading}
                />
                <label
                  htmlFor="word-file-upload"
                  className={`inline-flex items-center px-3 py-1.5 bg-white text-gray-800 rounded-full text-sm font-medium transition-colors cursor-pointer border border-gray-300 ${
                    wordFileStatus.loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
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
          </div>
        </div>
        <div className="max-w-[850px] mx-auto px-8 pb-8">
          <div className="min-h-[1056px] bg-white">
            <RichTextEditor
              value={description}
              onChange={setDescription}
              height="calc(100vh - 100px)"
            />
          </div>
        </div>
      </div>

      {/* Upload Button */}
      <div className="fixed bottom-8 right-8 flex gap-4">
        <button
          onClick={handleUpload}
          disabled={!selectedFile || !title || uploading}
          className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg flex items-center gap-2"
        >
          <Upload className="w-5 h-5" />
          {uploading ? `Uploading... ${uploadProgress}%` : 'Upload Video'}
        </button>
      </div>

      {uploading && (
        <div className="fixed bottom-24 right-8 w-64 bg-white rounded-lg shadow-lg p-4">
          <div className="mb-2 text-sm font-medium text-gray-700">Upload Progress</div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
} 