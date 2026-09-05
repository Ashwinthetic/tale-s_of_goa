'use client';

import React from 'react';

export interface PipelineStatus {
  cameraReady: boolean;
  cameraError: string | null;
  faceDetected: boolean;
  faceCount: number;
  embeddingGenerated: boolean;
  embeddingDimension: number | null;
  hashCreated: boolean;
  blockchainConnected: boolean;
  verificationConfirmed: boolean;
  isProcessing: boolean;
}

interface DetectionStatusProps {
  status: PipelineStatus;
}

export const DetectionStatus: React.FC<DetectionStatusProps> = ({ status }) => {
  const getFaceStatusBadge = () => {
    if (status.faceCount === 0) {
      return <span style={{ color: '#ef4444' }}>✕ NO FACE DETECTED</span>;
    }
    if (status.faceCount === 1) {
      return <span style={{ color: '#10b981' }}>✓ 1 FACE DETECTED</span>;
    }
    return <span style={{ color: '#f59e0b' }}>⚠️ MULTIPLE FACES ({status.faceCount})</span>;
  };

  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.9)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: '20px',
      color: '#f8fafc',
      fontFamily: 'monospace',
      fontSize: '0.875rem'
    }}>
      <div style={{
        fontSize: '1rem',
        fontWeight: 700,
        marginBottom: '16px',
        letterSpacing: '0.05em',
        color: '#38bdf8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span>HH GOA FACE ID STATUS</span>
        {status.isProcessing && (
          <span style={{ fontSize: '0.75rem', color: '#f59e0b', animation: 'pulse 1.5s infinite' }}>
            ● PROCESSING...
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
          <span style={{ color: '#94a3b8' }}>1. CAMERA</span>
          <span>
            {status.cameraReady ? (
              <span style={{ color: '#10b981' }}>● READY</span>
            ) : (
              <span style={{ color: '#ef4444' }}>✕ {status.cameraError || 'DISCONNECTED'}</span>
            )}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
          <span style={{ color: '#94a3b8' }}>2. FACE DETECTION</span>
          <span>{getFaceStatusBadge()}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
          <span style={{ color: '#94a3b8' }}>3. GRAYSCALE CONVERSION</span>
          <span>
            {status.faceDetected ? (
              <span style={{ color: '#10b981' }}>✓ 8-BIT GRAY + HIST EQUALIZED</span>
            ) : (
              <span style={{ color: '#64748b' }}>○ WAITING FACE</span>
            )}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
          <span style={{ color: '#94a3b8' }}>4. FACE EMBEDDING</span>
          <span>
            {status.embeddingGenerated ? (
              <span style={{ color: '#10b981' }}>✓ {status.embeddingDimension}D GENERATED</span>
            ) : (
              <span style={{ color: '#64748b' }}>○ WAITING CAPTURE</span>
            )}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
          <span style={{ color: '#94a3b8' }}>5. BIOMETRIC HASH</span>
          <span>
            {status.hashCreated ? (
              <span style={{ color: '#10b981' }}>✓ SHA-256 CREATED</span>
            ) : (
              <span style={{ color: '#64748b' }}>○ WAITING CAPTURE</span>
            )}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
          <span style={{ color: '#94a3b8' }}>6. BLOCKCHAIN</span>
          <span>
            {status.blockchainConnected ? (
              <span style={{ color: '#10b981' }}>● TESTNET READY</span>
            ) : (
              <span style={{ color: '#ef4444' }}>✕ NOT CONNECTED</span>
            )}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
          <span style={{ color: '#94a3b8' }}>7. VERIFICATION</span>
          <span>
            {status.verificationConfirmed ? (
              <span style={{ color: '#10b981', fontWeight: 700 }}>✓ CONFIRMED ON-CHAIN</span>
            ) : (
              <span style={{ color: '#64748b' }}>○ WAITING</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
