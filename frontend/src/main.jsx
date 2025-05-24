import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './index.css'        // ← make sure this points to your Tailwind CSS
import HomePage from './App'
import VideoPage from './pages/VideoPage'
import UploadPage from './pages/UploadPage'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/videos/:id" element={<VideoPage />} />
        <Route path="/upload" element={<UploadPage />} />
      </Routes>
    </Router>
  </React.StrictMode>
)