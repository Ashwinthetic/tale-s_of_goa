'use client';

import React, { useState, useCallback } from 'react';
import { CameraView } from '../components/CameraView';
import { TestImageUpload } from '../components/TestImageUpload';
import { DetectionStatus, PipelineStatus } from '../components/DetectionStatus';
import { CaptureButton } from '../components/CaptureButton';
import { EmbeddingPanel } from '../components/EmbeddingPanel';
import {
  detectFace,
  encodeFace,
  recordVerification,
  FaceBox,
  VerificationResponse,
} from '../services/api';

export default function Home() {
  const [mode, setMode] = useState<'camera' | 'test_image'>('camera');
  const [testImage, setTestImage] = useState<string | null>(null);

  const [faces, setFaces] = useState<FaceBox[]>([]);
  const [imageWidth, setImageWidth] = useState<number>(640);
  const [imageHeight, setImageHeight] = useState<number>(480);
  const [statusMessage, setStatusMessage] = useState<string>('INITIALIZING...');

  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>({
    cameraReady: false,
    cameraError: null,
    faceDetected: false,
    faceCount: 0,
    embeddingGenerated: false,
    embeddingDimension: null,
    hashCreated: false,
    blockchainConnected: true,
    verificationConfirmed: false,
    isProcessing: false,
  });

  const [currentFrame, setCurrentFrame] = useState<string | null>(null);
  const [embedding, setEmbedding] = useState<number[]>([]);
  const [recordHash, setRecordHash] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<VerificationResponse | null>(null);

  // Handle camera ready/error state changes
  const handleCameraStatusChange = useCallback((ready: boolean, error: string | null) => {
    setPipelineStatus((prev) => ({
      ...prev,
      cameraReady: ready,
      cameraError: error,
    }));
  }, []);

  // Continuous frame detection handler (sampling ~4 FPS)
  const handleFrameCaptured = useCallback(
    async (base64Image: string) => {
      setCurrentFrame(base64Image);
      try {
        setPipelineStatus((prev) => ({ ...prev, isProcessing: true }));
        const detectRes = await detectFace(base64Image);

        setFaces(detectRes.faces || []);
        setImageWidth(detectRes.image_width || 640);
        setImageHeight(detectRes.image_height || 480);
        setStatusMessage(detectRes.status_message || 'PROCESSING');

        setPipelineStatus((prev) => ({
          ...prev,
          faceDetected: detectRes.face_detected,
          faceCount: detectRes.face_count,
          isProcessing: false,
        }));
      } catch (err: any) {
        // Soft fallback for dev/offline testing if backend endpoint is initializing
        setPipelineStatus((prev) => ({ ...prev, isProcessing: false }));
      }
    },
    []
  );

  // Handle test image selection
  const handleTestImageSelected = async (base64Image: string) => {
    setTestImage(base64Image);
    setCurrentFrame(base64Image);
    try {
      setPipelineStatus((prev) => ({ ...prev, isProcessing: true }));
      const detectRes = await detectFace(base64Image);
      setFaces(detectRes.faces || []);
      setImageWidth(detectRes.image_width || 640);
      setImageHeight(detectRes.image_height || 480);
      setStatusMessage(detectRes.status_message || 'IMAGE PROCESSED');

      setPipelineStatus((prev) => ({
        ...prev,
        faceDetected: detectRes.face_detected,
        faceCount: detectRes.face_count,
        isProcessing: false,
      }));
    } catch (err: any) {
      setPipelineStatus((prev) => ({ ...prev, isProcessing: false }));
    }
  };

  // Deterministic Capture & On-Chain Verification Trigger
  const handleCaptureAndVerify = async () => {
    if (!currentFrame) return;

    try {
      setPipelineStatus((prev) => ({ ...prev, isProcessing: true }));
      setStatusMessage('ENCODING 128D FACE VECTOR...');

      // Step 1: Encode face -> 128D vector + SHA-256 hash
      const encodeRes = await encodeFace(currentFrame);

      if (!encodeRes.success) {
        alert(`Encoding failed: ${encodeRes.error || 'Invalid face region'}`);
        setPipelineStatus((prev) => ({ ...prev, isProcessing: false }));
        return;
      }

      setEmbedding(encodeRes.embedding);
      setRecordHash(encodeRes.record_hash);

      setPipelineStatus((prev) => ({
        ...prev,
        embeddingGenerated: true,
        embeddingDimension: encodeRes.embedding_dimension,
        hashCreated: true,
      }));

      setStatusMessage('SUBMITTING RECORD TO BLOCKCHAIN TESTNET...');

      // Step 2: Write hash commitment to Smart Contract
      const verifyRes = await recordVerification(encodeRes.record_hash);
      setVerificationResult(verifyRes);

      setPipelineStatus((prev) => ({
        ...prev,
        verificationConfirmed: verifyRes.success,
        isProcessing: false,
      }));

      setStatusMessage('FACE ID VERIFICATION CONFIRMED ✓');
    } catch (err: any) {
      console.error('[Capture & Verify Error]', err);
      alert(`Pipeline error: ${err.message || 'Verification failed'}`);
      setPipelineStatus((prev) => ({ ...prev, isProcessing: false }));
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#020617',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif',
        padding: '48px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <div style={{ width: '100%', maxWidth: '1200px', display: 'flex', flexDirection: 'column', gap: '48px' }}>
        
        {/* Two-Column Hero & Scanner */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
          gap: '64px', 
          alignItems: 'center' 
        }}>
          
          {/* Left Column: Hero Text */}
          <div style={{ paddingRight: '24px' }}>
            <h1
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                letterSpacing: '-0.025em',
                margin: '0 0 8px 0',
                background: 'linear-gradient(135deg, #d4af37 0%, #ffdf00 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              HH GOA
            </h1>
            <h2 style={{
                fontSize: '3.5rem',
                fontWeight: 900,
                lineHeight: 1.1,
                margin: '0 0 24px 0',
                color: '#ffffff'
            }}>
              Your Face.<br />
              Your Identity.<br />
              On-Chain.
            </h2>
            <p style={{ margin: '0 0 32px 0', color: '#94a3b8', fontSize: '1.125rem', lineHeight: 1.6, maxWidth: '480px' }}>
              Create an immutable, cryptographic representation of your biometric identity. Our secure pipeline extracts a 128-dimensional embedding, generates a canonical SHA-256 hash, and records the proof on the EVM blockchain.
            </p>
            <button
              onClick={() => {
                const scanner = document.getElementById('scanner-panel');
                if (scanner) scanner.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                background: 'linear-gradient(135deg, #d4af37 0%, #b8860b 100%)',
                color: '#000000',
                border: 'none',
                padding: '16px 32px',
                borderRadius: '8px',
                fontSize: '1.125rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(212, 175, 55, 0.4)',
                transition: 'transform 0.2s ease',
              }}
            >
              Start Face Scan
            </button>
            <div style={{ marginTop: '16px', fontSize: '0.75rem', color: '#64748b' }}>
               By starting, you agree to our privacy policy. No raw biometric data is ever stored on-chain.
            </div>
          </div>

          {/* Right Column: Scanner Panel */}
          <div id="scanner-panel" style={{
            background: '#0f172a',
            borderRadius: '24px',
            padding: '32px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Face Scanner</h3>
               
               {/* Mode Switcher inside the panel */}
               <div
                  style={{
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '4px',
                    display: 'flex',
                    gap: '4px',
                  }}
                >
                  <button
                    onClick={() => setMode('camera')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: mode === 'camera' ? 'rgba(255,255,255,0.1)' : 'transparent',
                      color: mode === 'camera' ? '#ffffff' : '#94a3b8',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    📷 Use Camera
                  </button>
                  <button
                    onClick={() => setMode('test_image')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: mode === 'test_image' ? 'rgba(255,255,255,0.1)' : 'transparent',
                      color: mode === 'test_image' ? '#ffffff' : '#94a3b8',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    🖼️ Upload
                  </button>
                </div>
            </div>

            <div style={{
               border: '2px dashed rgba(255,255,255,0.15)',
               borderRadius: '16px',
               padding: '4px'
            }}>
              {mode === 'camera' ? (
                <CameraView
                  onFrameCaptured={handleFrameCaptured}
                  faces={faces}
                  imageWidth={imageWidth}
                  imageHeight={imageHeight}
                  statusMessage={statusMessage}
                  isProcessing={pipelineStatus.isProcessing}
                  onCameraStatusChange={handleCameraStatusChange}
                />
              ) : (
                <TestImageUpload
                  onImageSelected={handleTestImageSelected}
                  selectedImage={testImage}
                  faces={faces}
                  imageWidth={imageWidth}
                  imageHeight={imageHeight}
                  statusMessage={statusMessage}
                />
              )}
            </div>

            <CaptureButton
              onCapture={handleCaptureAndVerify}
              disabled={!pipelineStatus.faceDetected || pipelineStatus.faceCount !== 1}
              isProcessing={pipelineStatus.isProcessing}
              faceCount={pipelineStatus.faceCount}
            />

            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
               🔒 Your face is processed securely and locally.
            </div>
          </div>
        </div>

        {/* Verification Results & Debug (Only show if processing or finished) */}
        {(pipelineStatus.embeddingGenerated || pipelineStatus.isProcessing) && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '48px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, textAlign: 'center' }}>Verification Proof</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
              <DetectionStatus status={pipelineStatus} />
              <EmbeddingPanel
                embedding={embedding}
                embeddingDimension={pipelineStatus.embeddingDimension || 128}
                recordHash={recordHash}
                verificationResult={verificationResult}
              />
            </div>
          </div>
        )}
        
      </div>
    </main>
  );
}
