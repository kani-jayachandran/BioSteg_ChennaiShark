import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalDocuments: 0,
    activeDocuments: 0,
    expiredDocuments: 0
  });
  const [recentDocs, setRecentDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/documents');
      const documents = response.data.documents;

      const active = documents.filter(doc => !doc.isExpired).length;
      const expired = documents.filter(doc => doc.isExpired).length;

      setStats({
        totalDocuments: documents.length,
        activeDocuments: active,
        expiredDocuments: expired
      });

      setRecentDocs(documents.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your secure documents with advanced encryption and biometric protection
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Documents</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalDocuments}
                </p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <span className="text-3xl">📁</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Active Documents</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {stats.activeDocuments}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <span className="text-3xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Expired Documents</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {stats.expiredDocuments}
                </p>
              </div>
              <div className="bg-red-100 rounded-full p-3">
                <span className="text-3xl">⏰</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/upload"
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition duration-300"
            >
              <span className="text-2xl">📤</span>
              <span className="font-semibold">Upload Document</span>
            </Link>
            <Link
              to="/vault"
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition duration-300"
            >
              <span className="text-2xl">🔒</span>
              <span className="font-semibold">View Vault</span>
            </Link>
            <Link
              to="/logs"
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-teal-600 text-white py-4 rounded-lg hover:from-green-700 hover:to-teal-700 transition duration-300"
            >
              <span className="text-2xl">📊</span>
              <span className="font-semibold">Access Logs</span>
            </Link>
          </div>
        </div>

        {/* Recent Documents */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Documents</h2>
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : recentDocs.length === 0 ? (
            <p className="text-gray-500">No documents yet. Upload your first document!</p>
          ) : (
            <div className="space-y-3">
              {recentDocs.map((doc) => (
                <div
                  key={doc._id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">📄</span>
                    <div>
                      <p className="font-semibold text-gray-900">{doc.originalFilename}</p>
                      <p className="text-sm text-gray-500">
                        Uploaded: {new Date(doc.uploadTime).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {doc.isExpired ? (
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                        Expired
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
