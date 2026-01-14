import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import WebcamCapture from '../components/WebcamCapture';

const Vault = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showExtractModal, setShowExtractModal] = useState(false);
  const [capturedFace, setCapturedFace] = useState(null);
  const [fingerprintPin, setFingerprintPin] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get('/api/documents');
      setDocuments(response.data.documents);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExtractClick = (doc) => {
    if (doc.isExpired) {
      alert('This document has expired and cannot be accessed');
      return;
    }
    setSelectedDoc(doc);
    setShowExtractModal(true);
    setError('');
    setCapturedFace(null);
    setFingerprintPin('');
  };

  const handleExtract = async () => {
    if (!capturedFace) {
      setError('Please capture your face');
      return;
    }

    // Validate face image format
    if (typeof capturedFace !== 'string' || !capturedFace.startsWith('data:image/')) {
      setError('Invalid face image format. Please capture again.');
      return;
    }

    if (!fingerprintPin) {
      setError('Please enter your fingerprint PIN');
      return;
    }

    // Validate PIN format
    if (fingerprintPin.length !== 4 || !/^\d{4}$/.test(fingerprintPin)) {
      setError('PIN must be exactly 4 digits');
      return;
    }

    setExtracting(true);
    setError('');

    try {
      const response = await axios.post(
        `/api/documents/extract/${selectedDoc._id}`,
        {
          faceImage: capturedFace,
          fingerprintPin: fingerprintPin
        },
        {
          responseType: 'blob',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Create download link from blob
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', selectedDoc.originalFilename);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setShowExtractModal(false);
      alert('Document extracted and downloaded successfully!');
    } catch (err) {
      // Handle blob error response safely
      if (err.response && err.response.data instanceof Blob) {
        try {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const errorData = JSON.parse(reader.result);
              setError(errorData.message || 'Extraction failed. Please verify your biometrics.');
            } catch {
              setError('Extraction failed. Please verify your biometrics.');
            }
          };
          reader.onerror = () => {
            setError('Extraction failed. Please verify your biometrics.');
          };
          reader.readAsText(err.response.data);
        } catch {
          setError('Extraction failed. Please verify your biometrics.');
        }
      } else {
        setError(err.response?.data?.message || err.message || 'Extraction failed. Please verify your biometrics.');
      }
    } finally {
      setExtracting(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await axios.delete(`/api/documents/${docId}`);
      setDocuments(documents.filter(doc => doc._id !== docId));
      alert('Document deleted successfully');
    } catch (error) {
      alert('Failed to delete document');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">🔒 Secure Vault</h1>
          <p className="text-gray-600 mt-2">
            Your encrypted documents protected by steganography
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <span className="text-6xl">📭</span>
            <p className="text-gray-500 mt-4">No documents in vault</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <div
                key={doc._id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-4xl">📄</span>
                  {doc.isExpired ? (
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                      Expired
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      Active
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-gray-900 mb-2 truncate">
                  {doc.originalFilename}
                </h3>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p>📅 Uploaded: {new Date(doc.uploadTime).toLocaleDateString()}</p>
                  <p>⏰ Expires: {new Date(doc.expiryTime).toLocaleDateString()}</p>
                  <p>📊 Size: {(doc.fileSize / 1024).toFixed(2)} KB</p>
                  <p>🔄 Accessed: {doc.accessCount} times</p>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleExtractClick(doc)}
                    disabled={doc.isExpired}
                    className={`flex-1 py-2 rounded-lg font-semibold transition duration-300 ${
                      doc.isExpired
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    Extract
                  </button>
                  <button
                    onClick={() => handleDelete(doc._id)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-300"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Extract Modal */}
      {showExtractModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              🔐 Multimodal Authentication
            </h2>
            <p className="text-gray-600 mb-6">
              Complete biometric verification to extract: <strong>{selectedDoc?.originalFilename}</strong>
            </p>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Step 1: Face Verification</h3>
                <WebcamCapture onCapture={setCapturedFace} captured={capturedFace} />
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Step 2: Fingerprint PIN</h3>
                <input
                  type="password"
                  value={fingerprintPin}
                  onChange={(e) => setFingerprintPin(e.target.value)}
                  placeholder="Enter 4-digit PIN"
                  maxLength="4"
                  className="input-field"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleExtract}
                  disabled={extracting || !capturedFace || !fingerprintPin}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {extracting ? 'Verifying & Extracting...' : '✅ Verify & Extract'}
                </button>
                <button
                  onClick={() => setShowExtractModal(false)}
                  disabled={extracting}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vault;
