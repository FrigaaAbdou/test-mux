const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Mux = require('@mux/mux-node');
require('dotenv').config();

const app = express();

// Initialize Mux with error handling
console.log('🔄 Initializing Mux client...');
console.log('🔑 Mux credentials status:', {
  tokenId: process.env.MUX_TOKEN_ID ? '✓ Present' : '✗ Missing',
  tokenSecret: process.env.MUX_TOKEN_SECRET ? '✓ Present' : '✗ Missing'
});

const muxClient = new Mux(process.env.MUX_TOKEN_ID, process.env.MUX_TOKEN_SECRET);
const Video = muxClient.Video;

// Test Mux client by trying to list uploads
Video.Uploads.list()
  .then(() => {
    console.log('✅ Mux client initialized and tested successfully');
  })
  .catch(error => {
    console.error('❌ Failed to test Mux client:', error);
    process.exit(1);
  });

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Video Schema
const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  muxAssetId: String,
  muxPlaybackId: String,
  muxUploadId: String,
  status: { 
    type: String, 
    enum: ['awaiting_upload', 'uploading', 'processing', 'ready', 'error'], 
    default: 'awaiting_upload' 
  },
  duration: Number,
  // New fields for enhanced content
  category: { type: String, required: true },
  tags: [String],
  thumbnail: {
    url: String,
    type: { type: String, enum: ['auto', 'custom'], default: 'auto' }
  },
  metadata: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 }
  },
  visibility: { 
    type: String, 
    enum: ['public', 'private', 'unlisted'], 
    default: 'public' 
  },
  author: {
    name: { type: String, required: true },
    id: { type: String, required: true }, // This would be the user ID in a real auth system
    avatar: String
  },
  settings: {
    allowComments: { type: Boolean, default: true },
    allowRatings: { type: Boolean, default: true },
    autoplay: { type: Boolean, default: true }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Comment Schema
const commentSchema = new mongoose.Schema({
  videoId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Video',
    required: true 
  },
  author: {
    name: { type: String, required: true },
    id: { type: String, required: true },
    avatar: String
  },
  content: { type: String, required: true },
  likes: { type: Number, default: 0 },
  replies: [{
    author: {
      name: { type: String, required: true },
      id: { type: String, required: true },
      avatar: String
    },
    content: { type: String, required: true },
    likes: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const VideoModel = mongoose.model('Video', videoSchema);
const CommentModel = mongoose.model('Comment', commentSchema);

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Video Upload Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Create upload URL for direct upload to Mux
app.post('/create-upload', async (req, res) => {
  let video;
  try {
    const { 
      title, 
      description, 
      category, 
      tags, 
      visibility,
      author,
      settings 
    } = req.body;

    if (!Video?.Uploads?.create) {
      throw new Error('Mux Video.Uploads.create is not available');
    }

    console.log('📝 Creating upload for:', title);

    // Create video record in database
    video = new VideoModel({
      title: title || 'Untitled Video',
      description: description || '',
      category: category || 'Uncategorized',
      tags: tags || [],
      visibility: visibility || 'public',
      author: author || {
        name: 'Anonymous',
        id: 'anonymous',
        avatar: null
      },
      settings: {
        ...{
          allowComments: true,
          allowRatings: true,
          autoplay: true
        },
        ...settings
      },
      status: 'awaiting_upload'
    });

    await video.save();
    console.log('💾 Video saved to database:', video._id);

    // Create direct upload URL from Mux
    console.log('🔄 Attempting to create Mux upload...');
    const upload = await Video.Uploads.create({
      new_asset_settings: {
        playback_policy: ['public'],
        test: false
      },
      cors_origin: process.env.FRONTEND_URL || '*'
    });

    if (!upload || !upload.url) {
      throw new Error('Failed to get upload URL from Mux');
    }

    video.muxUploadId = upload.id;
    await video.save();

    res.json({
      success: true,
      message: 'Upload URL created successfully',
      data: {
        videoId: video._id,
        title: video.title,
        status: video.status,
        uploadUrl: upload.url,
        uploadId: upload.id
      }
    });

  } catch (error) {
    console.error('❌ Create upload error:', error);
    if (video?._id) {
      await VideoModel.findByIdAndDelete(video._id);
    }
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to create upload URL'
    });
  }
});

// Get all videos
app.get('/videos', async (req, res) => {
  try {
    const videos = await VideoModel.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: videos,
      count: videos.length
    });
  } catch (error) {
    console.error('❌ Get videos error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch videos' 
    });
  }
});

// Get single video
app.get('/videos/:id', async (req, res) => {
  try {
    const video = await VideoModel.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ 
        success: false,
        error: 'Video not found' 
      });
    }

    // Get asset details from Mux if available
    if (video.muxAssetId) {
      try {
        const asset = await Video.Assets.get(video.muxAssetId);
        if (asset.duration !== video.duration || asset.status !== video.status) {
          video.duration = asset.duration;
          video.status = asset.status === 'ready' ? 'ready' : 'processing';
          await video.save();
        }
      } catch (muxError) {
        console.log('⚠️ Could not fetch Mux asset details:', muxError.message);
      }
    }

    res.json({
      success: true,
      data: video
    });
  } catch (error) {
    console.error('❌ Get video error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch video' 
    });
  }
});

// Delete video
app.delete('/videos/:id', async (req, res) => {
  try {
    const video = await VideoModel.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({ 
        success: false,
        error: 'Video not found' 
      });
    }

    // Delete from Mux if asset exists
    if (video.muxAssetId) {
      try {
        // Delete the asset
        await Video.Assets.del(video.muxAssetId);
        console.log('🗑️ Deleted asset from Mux:', video.muxAssetId);
      } catch (muxError) {
        console.error('❌ Failed to delete asset from Mux:', muxError);
      }
    }

    // Delete the upload if it exists
    if (video.muxUploadId) {
      try {
        // Delete the upload
        await Video.Uploads.del(video.muxUploadId);
        console.log('🗑️ Deleted upload from Mux:', video.muxUploadId);
      } catch (muxError) {
        console.error('❌ Failed to delete upload from Mux:', muxError);
      }
    }

    // Delete from database
    await VideoModel.findByIdAndDelete(req.params.id);
    console.log('🗑️ Deleted from database:', req.params.id);

    res.json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete video error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete video',
      details: error.message
    });
  }
});

// Webhook to handle Mux events
app.post('/webhooks/mux', express.json(), async (req, res) => {
  try {
    const event = req.body;
    console.log('📡 Mux webhook received:', {
      type: event.type,
      environment: event.environment,
      assetId: event.data?.id,
      assetState: event.data?.status,
      uploadId: event.data?.upload_id
    });

    // Handle asset creation from upload
    if (event.type === 'video.asset.created') {
      const uploadId = event.data.upload_id;
      const assetId = event.data.id;
      
      console.log('🎥 Processing asset creation:', { uploadId, assetId });
      
      const video = await VideoModel.findOne({ muxUploadId: uploadId });
      if (!video) {
        console.error('❌ No video found for upload ID:', uploadId);
        return res.status(404).send('Video not found');
      }

      video.muxAssetId = assetId;
      video.status = 'processing';
      await video.save();
      console.log(`✅ Video ${video.title} asset created and processing`);
    }

    // Handle asset ready state
    if (event.type === 'video.asset.ready') {
      const assetId = event.data.id;
      const uploadId = event.data.upload_id;
      console.log('🎬 Processing asset ready:', { assetId, uploadId });
      
      // Try to find by asset ID first
      let video = await VideoModel.findOne({ muxAssetId: assetId });
      
      // If not found, try to find by upload ID
      if (!video && uploadId) {
        video = await VideoModel.findOne({ muxUploadId: uploadId });
      }
      
      if (!video) {
        console.error('❌ No video found for asset ID:', assetId, 'or upload ID:', uploadId);
        return res.status(404).send('Video not found');
      }
      
      video.status = 'ready';
      video.duration = event.data.duration;
      video.muxPlaybackId = event.data.playback_ids?.[0]?.id;
      await video.save();
      console.log(`🎉 Video ${video.title} is ready for streaming`);
    }

    // Handle asset errors
    if (event.type === 'video.asset.errored') {
      const assetId = event.data.id;
      const uploadId = event.data.upload_id;
      console.log('❌ Processing asset error:', { assetId, uploadId, error: event.data.errors });
      
      // Try to find by asset ID first
      let video = await VideoModel.findOne({ muxAssetId: assetId });
      
      // If not found, try to find by upload ID
      if (!video && uploadId) {
        video = await VideoModel.findOne({ muxUploadId: uploadId });
      }
      
      if (video) {
        video.status = 'error';
        await video.save();
        console.error(`❌ Video ${video.title} processing failed:`, event.data.errors);
      }
    }

    res.status(200).send('Webhook processed successfully');
  } catch (error) {
    console.error('💥 Webhook processing error:', error);
    res.status(400).json({ 
      error: 'Webhook processing failed',
      details: error.message
    });
  }
});

// Add routes for comments
app.post('/videos/:videoId/comments', async (req, res) => {
  try {
    const { videoId } = req.params;
    const { content, author } = req.body;

    const video = await VideoModel.findById(videoId);
    if (!video) {
      return res.status(404).json({ success: false, error: 'Video not found' });
    }

    if (!video.settings.allowComments) {
      return res.status(403).json({ success: false, error: 'Comments are disabled for this video' });
    }

    const comment = new CommentModel({
      videoId,
      content,
      author
    });

    await comment.save();

    res.json({
      success: true,
      data: comment
    });
  } catch (error) {
    console.error('❌ Create comment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/videos/:videoId/comments', async (req, res) => {
  try {
    const { videoId } = req.params;
    const comments = await CommentModel.find({ videoId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: comments
    });
  } catch (error) {
    console.error('❌ Get comments error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add route for video metadata updates
app.patch('/videos/:id/metadata', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Fields that can be updated
    const allowedUpdates = [
      'title',
      'description',
      'category',
      'tags',
      'visibility',
      'settings'
    ];

    // Filter out any fields that aren't in allowedUpdates
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {});

    const video = await VideoModel.findByIdAndUpdate(
      id,
      { 
        ...filteredUpdates,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!video) {
      return res.status(404).json({ success: false, error: 'Video not found' });
    }

    res.json({
      success: true,
      data: video
    });
  } catch (error) {
    console.error('❌ Update video metadata error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add route for incrementing view count
app.post('/videos/:id/view', async (req, res) => {
  try {
    const { id } = req.params;
    
    const video = await VideoModel.findByIdAndUpdate(
      id,
      { $inc: { 'metadata.views': 1 } },
      { new: true }
    );

    if (!video) {
      return res.status(404).json({ success: false, error: 'Video not found' });
    }

    res.json({
      success: true,
      data: video.metadata
    });
  } catch (error) {
    console.error('❌ Increment view count error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('💥 Global error:', error);
  res.status(500).json({ 
    success: false,
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route not found',
    path: req.path
  });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`📹 Create upload: POST http://localhost:${PORT}/create-upload`);
  console.log(`📋 Get videos: GET http://localhost:${PORT}/videos`);
  console.log(`🎯 Webhook: POST http://localhost:${PORT}/webhooks/mux`);
});