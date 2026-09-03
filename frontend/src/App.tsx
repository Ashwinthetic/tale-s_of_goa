import { useState, useCallback, useEffect } from 'react';
import { CameraView } from './components/CameraView';
import { TestImageUpload } from './components/TestImageUpload';
import { DetectionStatus, PipelineStatus } from './components/DetectionStatus';
import { CaptureButton } from './components/CaptureButton';
import { EmbeddingPanel } from './components/EmbeddingPanel';
import { FaceComparisonView } from './components/FaceComparisonView';
import { PixelInspectionPanel } from './components/PixelInspectionPanel';
import {
  detectFace,
  encodeFace,
  recordVerification,
  FaceBox,
  PixelStats,
  VerificationResponse,
} from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState<'compare' | 'register'>('compare');
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  // Single Face Registration State
  const [mode, setMode] = useState<'camera' | 'test_image'>('camera');
  const [testImage, setTestImage] = useState<string | null>(null);
  const [faces, setFaces] = useState<FaceBox[]>([]);
  const [imageWidth, setImageWidth] = useState<number>(640);
  const [imageHeight, setImageHeight] = useState<number>(480);
  const [statusMessage, setStatusMessage] = useState<string>('INITIALIZING...');
  const [pixelStats, setPixelStats] = useState<PixelStats | undefined>(undefined);
  const [rgbCrop, setRgbCrop] = useState<string | undefined>(undefined);
  const [grayCrop, setGrayCrop] = useState<string | undefined>(undefined);
  const [eqCrop, setEqCrop] = useState<string | undefined>(undefined);

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

  // Periodically check Python FastAPI backend status (every 3 seconds)
  useEffect(() => {
    const checkBackend = () => {
      fetch('http://localhost:8000/')
        .then((res) => res.json())
        .then(() => setBackendOnline(true))
        .catch(() => setBackendOnline(false));
    };

    checkBackend();
    const interval = setInterval(checkBackend, 3000);
    return () => clearInterval(interval);
  }, []);

  // Handle camera status changes
  const handleCameraStatusChange = useCallback((ready: boolean, error: string | null) => {
    setPipelineStatus((prev) => ({
      ...prev,
      cameraReady: ready,
      cameraError: error,
    }));
  }, []);

  // Continuous frame detection handler
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
        if (detectRes.pixel_stats) setPixelStats(detectRes.pixel_stats);
        if (detectRes.rgb_crop_base64) setRgbCrop(detectRes.rgb_crop_base64);
        if (detectRes.grayscale_crop_base64) setGrayCrop(detectRes.grayscale_crop_base64);
        if (detectRes.equalized_crop_base64) setEqCrop(detectRes.equalized_crop_base64);

        setPipelineStatus((prev) => ({
          ...prev,
          faceDetected: detectRes.face_detected,
          faceCount: detectRes.face_count,
          isProcessing: false,
        }));
      } catch (err) {
        setPipelineStatus((prev) => ({ ...prev, isProcessing: false }));
      }
    },
    []
  );

  // Handle test image upload
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
      if (detectRes.pixel_stats) setPixelStats(detectRes.pixel_stats);
      if (detectRes.rgb_crop_base64) setRgbCrop(detectRes.rgb_crop_base64);
      if (detectRes.grayscale_crop_base64) setGrayCrop(detectRes.grayscale_crop_base64);
      if (detectRes.equalized_crop_base64) setEqCrop(detectRes.equalized_crop_base64);

      setPipelineStatus((prev) => ({
        ...prev,
        faceDetected: detectRes.face_detected,
        faceCount: detectRes.face_count,
        isProcessing: false,
      }));
    } catch (err) {
      setPipelineStatus((prev) => ({ ...prev, isProcessing: false }));
    }
  };

  // Single Face Capture & On-Chain Verification
  const handleCaptureAndVerify = async () => {
    if (!currentFrame) return;

    try {
      setPipelineStatus((prev) => ({ ...prev, isProcessing: true }));
      setStatusMessage('EXTRACTING 128D FACE VECTOR...');

      const encodeRes = await encodeFace(currentFrame);

      if (!encodeRes.success) {
        alert(`Encoding failed: ${encodeRes.error || 'Invalid face region'}`);
        setPipelineStatus((prev) => ({ ...prev, isProcessing: false }));
        return;
      }

      setEmbedding(encodeRes.embedding);
      setRecordHash(encodeRes.record_hash);
      if (encodeRes.pixel_stats) setPixelStats(encodeRes.pixel_stats);
      if (encodeRes.rgb_crop_base64) setRgbCrop(encodeRes.rgb_crop_base64);
      if (encodeRes.grayscale_crop_base64) setGrayCrop(encodeRes.grayscale_crop_base64);
      if (encodeRes.equalized_crop_base64) setEqCrop(encodeRes.equalized_crop_base64);

      setPipelineStatus((prev) => ({
        ...prev,
        embeddingGenerated: true,
        embeddingDimension: encodeRes.embedding_dimension,
        hashCreated: true,
      }));

      setStatusMessage('SUBMITTING RECORD TO EVM BLOCKCHAIN...');

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
        background: 'radial-gradient(ellipse at top, #0f172a 0%, #020617 100%)',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif',
        padding: '36px 20px 60px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth: '1240px', display: 'flex', flexDirection: 'column', gap: '36px' }}>
        
        {/* Navigation Header */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '20px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.5rem' }}>🌴</span>
              <h1
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 900,
                  letterSpacing: '-0.03em',
                  margin: 0,
                  background: 'linear-gradient(135deg, #d4af37 0%, #ffdf00 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                HH GOA
              </h1>
              <span style={{
                background: 'rgba(212, 175, 55, 0.15)',
                color: '#d4af37',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}>
                TASK #3 PIPELINE
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>
              Biometric 128D Face Embedding & EVM Blockchain Verification Engine
            </p>
          </div>

          {/* Backend Health Badge & Tab Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            
            {/* Backend Status Indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '0.75rem',
            }}>
              <span style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: backendOnline ? '#10b981' : '#ef4444',
                boxShadow: backendOnline ? '0 0 8px #10b981' : '0 0 8px #ef4444',
              }} />
              <span style={{ color: backendOnline ? '#a7f3d0' : '#fca5a5' }}>
                FastAPI: {backendOnline ? 'Online (Port 8000)' : 'Offline'}
              </span>
            </div>

            {/* Mode Tabs */}
            <div style={{
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              padding: '4px',
              display: 'flex',
              gap: '4px',
            }}>
              <button
                onClick={() => setActiveTab('compare')}
                style={{
                  background: activeTab === 'compare' ? 'linear-gradient(135deg, #d4af37 0%, #b8860b 100%)' : 'transparent',
                  color: activeTab === 'compare' ? '#000000' : '#94a3b8',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                ⚡ 1-to-1 Verification & Social Matcher
              </button>

              <button
                onClick={() => setActiveTab('register')}
                style={{
                  background: activeTab === 'register' ? 'linear-gradient(135deg, #d4af37 0%, #b8860b 100%)' : 'transparent',
                  color: activeTab === 'register' ? '#000000' : '#94a3b8',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                📸 Face ID Registration & Proof
              </button>
            </div>

          </div>
        </header>

        {/* Backend Offline Guidance Banner */}
        {backendOnline === false && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid #ef4444',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.25rem' }}>⚠️</span>
              <div>
                <strong style={{ color: '#fca5a5' }}>FastAPI Backend is Offline (port 8000)</strong>
                <p style={{ margin: '2px 0 0 0', color: '#cbd5e1', fontSize: '0.8125rem' }}>
                  The frontend cannot connect to the Python computer vision API. Please start the backend server in a terminal:
                </p>
              </div>
            </div>
            <code style={{
              background: '#020617',
              color: '#38bdf8',
              padding: '6px 12px',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '0.8125rem',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              cd backend &amp;&amp; python run.py
            </code>
          </div>
        )}

        {/* TAB 1: 1-TO-1 FACE COMPARISON & SOCIAL MEDIA MATCHER */}
        {activeTab === 'compare' && (
          <FaceComparisonView />
        )}

        {/* TAB 2: SINGLE FACE ID REGISTRATION & ON-CHAIN PROOF */}
        {activeTab === 'register' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
              gap: '48px', 
              alignItems: 'center' 
            }}>
              
              {/* Left Column: Description */}
              <div>
                <h2 style={{
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  lineHeight: 1.15,
                  margin: '0 0 16px 0',
                  color: '#ffffff',
                }}>
                  Biometric Face ID<br />
                  Registration Engine
                </h2>
                <p style={{ margin: '0 0 24px 0', color: '#94a3b8', fontSize: '1.05rem', lineHeight: 1.6 }}>
                  Live camera frames are analyzed with OpenCV to isolate facial bounding boxes. The cropped face region undergoes <strong>8-bit Grayscale Conversion (<code style={{ color: '#38bdf8' }}>cv2.COLOR_BGR2GRAY</code>)</strong> and <strong>Histogram Equalization</strong> before being encoded into a <strong>128-dimensional numerical vector</strong>, hashed via <strong>canonical SHA-256</strong>, and anchored immutably to the <strong>EVM Smart Contract</strong>.
                </p>
                <div style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  fontSize: '0.8125rem',
                  color: '#cbd5e1',
                }}>
                  <div>🖼️ <strong>Grayscale & Equalization:</strong> Normalizes lighting and contrast for invariant 128D vectors.</div>
                  <div>🔒 <strong>Privacy Assured:</strong> Raw photos are never stored on-chain.</div>
                  <div>⚡ <strong>Deterministic:</strong> L2-normalized 128D mathematical vectors.</div>
                  <div>⛓️ <strong>Tamper-Proof:</strong> Smart contract commits 32-byte cryptographic hashes.</div>
                </div>
              </div>

              {/* Right Column: Scanner View */}
              <div style={{
                background: '#0f172a',
                borderRadius: '24px',
                padding: '28px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>Single Face Ingestion</h3>
                  
                  <div style={{
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '3px',
                    display: 'flex',
                    gap: '4px',
                  }}>
                    <button
                      onClick={() => setMode('camera')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: mode === 'camera' ? 'rgba(255,255,255,0.15)' : 'transparent',
                        color: mode === 'camera' ? '#ffffff' : '#94a3b8',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      📷 Camera
                    </button>
                    <button
                      onClick={() => setMode('test_image')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: mode === 'test_image' ? 'rgba(255,255,255,0.15)' : 'transparent',
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
                  padding: '4px',
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
              </div>

            </div>

            {/* Pixel Data & Grayscale Inspection Panel */}
            <PixelInspectionPanel
              title="Camera Ingestion — Grayscale Output & Pixel Inspection"
              pixelStats={pixelStats}
              rgbCropBase64={rgbCrop}
              grayscaleCropBase64={grayCrop}
              equalizedCropBase64={eqCrop}
              accentColor="#d4af37"
            />

            {/* Results Section */}
            {(pipelineStatus.embeddingGenerated || pipelineStatus.isProcessing) && (
              <div style={{
                borderTop: '1px solid rgba(255,255,255,0.1)',
                paddingTop: '36px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
              }}>
                <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, textAlign: 'center' }}>
                  Cryptographic Biometric Proof
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
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
        )}

      </div>
    </main>
  );
}
