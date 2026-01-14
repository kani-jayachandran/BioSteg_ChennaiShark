import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';

const WebcamCapture = ({ onCapture, captured }) => {
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [error, setError] = useState('');

  const capture = useCallback(() => {
    try {
      setError('');
      
      if (!webcamRef.current) {
        setError('Webcam not initialized');
        return;
      }

      const imageSrc = webcamRef.current.getScreenshot();
      
      if (!imageSrc) {
        setError('Failed to capture image. Please try again.');
        return;
      }

      // Validate base64 format
      if (!imageSrc.startsWith('data:image/')) {
        setError('Invalid image format captured');
        return;
      }

      setImgSrc(imageSrc);
      onCapture(imageSrc);
    } catch (err) {
      console.error('Webcam capture error:', err);
      setError('Failed to capture image. Please check camera permissions.');
    }
  }, [webcamRef, onCapture]);

  const retake = () => {
    setImgSrc(null);
    setError('');
    onCapture(null);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
          {error}
        </div>
      )}
      
      {!imgSrc && !captured ? (
        <>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            screenshotQuality={0.92}
            className="rounded-lg border-4 border-purple-500"
            width={320}
            height={240}
            videoConstraints={{
              width: 640,
              height: 480,
              facingMode: "user"
            }}
          />
          <button
            type="button"
            onClick={capture}
            className="btn-primary"
          >
            📸 Capture Face
          </button>
        </>
      ) : (
        <>
          <img 
            src={imgSrc || captured} 
            alt="Captured face" 
            className="rounded-lg border-4 border-green-500"
            width={320}
            height={240}
          />
          {!captured && (
            <button
              type="button"
              onClick={retake}
              className="btn-secondary"
            >
              🔄 Retake
            </button>
          )}
          {(imgSrc || captured) && (
            <div className="text-sm text-green-600 font-semibold">
              ✓ Face captured successfully
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WebcamCapture;
