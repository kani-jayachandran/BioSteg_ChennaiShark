import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [expiryTime, setExpiryTime] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!expiryTime) {
      setError('Please set an expiry time');
      return;
    }

    const expiry = new Date(expiryTime);
    if (expiry <= new Date()) {
      setError('Expiry time must be in the future');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('expiryTime', expiryTime);

      await axios.post('/api/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess('Document uploaded and secured successfully!');
      setTimeout(() => {
        navigate('/vault');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Get minimum datetime (current time + 1 hour)
  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">📤 Upload Document</h1>
            <p className="text-gray-600 mt-2">
              Your document will be encrypted with AES-256 and hidden using steganography
            </p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Select Document
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-500 transition duration-300">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <span className="text-5xl mb-4">📁</span>
                  {file ? (
                    <div>
                      <p className="text-gray-900 font-semibold">{file.name}</p>
                      <p className="text-gray-500 text-sm mt-1">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-700 font-semibold">
                        Click to select a file
                      </p>
                      <p className="text-gray-500 text-sm mt-1">
                        Max size: 10MB
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Document Expiry Time
              </label>
              <input
                type="datetime-local"
                value={expiryTime}
                onChange={(e) => setExpiryTime(e.target.value)}
                min={getMinDateTime()}
                className="input-field"
                required
              />
              <p className="text-gray-500 text-sm mt-2">
                After this time, the document cannot be accessed
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">🔒 Security Features</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ AES-256 encryption</li>
                <li>✓ LSB steganography in PNG image</li>
                <li>✓ Time-based access control</li>
                <li>✓ Multimodal authentication required for extraction</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full btn-primary"
            >
              {uploading ? 'Uploading and Encrypting...' : '🔐 Upload & Secure Document'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Upload;
