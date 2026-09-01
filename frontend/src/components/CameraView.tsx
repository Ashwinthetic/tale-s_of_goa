'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FaceOverlay } from './FaceOverlay';
import { FaceBox } from '../services/api';

interface CameraViewProps {
  onFrameCaptured: (base64Image: string) => void;
  faces: FaceBox[];
  imageWidth: number;
  imageHeight: number;
  statusMessage: string;
  samplingIntervalMs?: number;
  isProcessing: boolean;
  onCameraStatusChange?: (ready: boolean, error: string | null) => void;
}

export const CameraView: React.FC<CameraViewProps> = ({
  onFrameCaptured,
  faces,
  imageWidth,
  imageHeight,
  statusMessage,
  samplingIntervalMs = 250,
  isProcessing,
  onCameraStatusChange,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });

  // Update container dimensions on resize
  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      setContainerDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
    }
  }, []);

  useEffect(() => {
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [updateDimensions]);

  // Request camera stream
  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        setCameraError(null);
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            setCameraReady(true);
            updateDimensions();
            onCameraStatusChange?.(true, null);
          };
        }
      } catch (err: any) {
        console.error('[Camera Error]', err);
        const errMsg = err?.message || 'Permission denied or no camera device found';
        setCameraError(errMsg);
        setCameraReady(false);
        onCameraStatusChange?.(false, errMsg);
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onCameraStatusChange, updateDimensions]);

  // Frame sampling loop using offscreen canvas
  useEffect(() => {
    if (!cameraReady || cameraError) return;

    const interval = setInterval(() => {
      if (isProcessing) return; // Stale frame protection: skip if backend request in flight

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;

      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        onFrameCaptured(dataUrl);
      }
    }, samplingIntervalMs);

    return () => clearInterval(interval);
  }, [cameraReady, cameraError, isProcessing, samplingIntervalMs, onFrameCaptured]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '420px',
        background: '#020617',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {cameraError ? (
        <div style={{ textAlign: 'center', padding: '24px', color: '#ef4444' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📷 ✕</div>
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '8px' }}>
            Camera Access Required
          </div>
          <div style={{ fontSize: '0.875rem', color: '#94a3b8', maxWidth: '400px' }}>
            Camera access is required to generate your Face ID. Please allow camera permissions in your browser settings.
          </div>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)', // Mirror webcam display
            }}
          />

          <FaceOverlay
            faces={faces}
            imageWidth={imageWidth}
            imageHeight={imageHeight}
            containerWidth={containerDimensions.width}
            containerHeight={containerDimensions.height}
            statusMessage={statusMessage}
          />

          {/* Status banner */}
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              background: 'rgba(2, 6, 23, 0.85)',
              backdropFilter: 'blur(8px)',
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#f8fafc',
              fontSize: '0.75rem',
              fontWeight: 600,
              fontFamily: 'monospace',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: faces.length === 1 ? '#10b981' : faces.length > 1 ? '#f59e0b' : '#ef4444',
              }}
            />
            {statusMessage || 'SEARCHING FOR FACE...'}
          </div>
        </>
      )}
    </div>
  );
};
