import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import WebcamCapture from '../components/WebcamCapture';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    fingerprintPin: '1234'
  });
  const [faceImage, setFaceImage] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    console.log('Registration form submitted:', {
      hasName: !!formData.name,
      hasEmail: !!formData.email,
      hasPassword: !!formData.password,
      hasFaceImage: !!faceImage
    });

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Make face image optional
    if (faceImage) {
      // Validate face image format if provided
      if (typeof faceImage !== 'string' || !faceImage.startsWith('data:image/')) {
        setError('Invalid face image format. Please capture again.');
        return;
      }
    }

    // Validate PIN
    if (!/^\d{4}$/.test(formData.fingerprintPin)) {
      setError('PIN must be exactly 4 digits');
      return;
    }

    setLoading(true);

    try {
      console.log('Sending registration request...');
      const response = await axios.post('/api/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        faceImage: faceImage || undefined,
        fingerprintPin: formData.fingerprintPin
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Registration successful:', response.data);
      login(response.data.token, response.data.user);
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      console.error('Error response:', err.response?.data);
      
      const errorMessage = err.response?.data?.message 
        || err.response?.data?.errors?.[0]?.msg
        || err.message 
        || 'Registration failed';
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg px-4 py-8">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            🔐 Bio_Steg
          </h1>
          <p className="text-gray-600 mt-2">Create Your Secure Account</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input-field"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-field"
                placeholder="••••••••"
                minLength="6"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Fingerprint PIN (4 digits)
              </label>
              <input
                type="text"
                name="fingerprintPin"
                value={formData.fingerprintPin}
                onChange={handleChange}
                className="input-field"
                placeholder="1234"
                pattern="[0-9]{4}"
                maxLength="4"
                required
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <label className="block text-gray-700 font-semibold mb-4 text-center">
              📸 Capture Your Face for Biometric Authentication (Optional)
            </label>
            <p className="text-sm text-gray-500 text-center mb-4">
              You can skip this step and add it later
            </p>
            <div className="flex justify-center">
              <WebcamCapture onCapture={setFaceImage} captured={faceImage} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-600 hover:text-purple-700 font-semibold">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
