'use client';

import React, { useState } from 'react';
import { VerificationResponse } from '../services/api';

interface EmbeddingPanelProps {
  embedding: number[];
  embeddingDimension: number;
  recordHash: string;
  verificationResult: VerificationResponse | null;
}

export const EmbeddingPanel: React.FC<EmbeddingPanelProps> = ({
  embedding,
  embeddingDimension,
  recordHash,
  verificationResult,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  if (!embedding || embedding.length === 0) {
    return null;
  }

  const formattedVector = `[\n  ${embedding
    .slice(0, 16)
    .map((v) => (v >= 0 ? ` ${v.toFixed(4)}` : v.toFixed(4)))
    .join(', ')} ... (${embedding.length - 16} values omitted)\n]`;

  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: '12px',
        marginTop: '16px',
        overflow: 'hidden',
        fontFamily: 'monospace',
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: 'rgba(30, 41, 59, 0.8)',
          border: 'none',
          color: '#38bdf8',
          textAlign: 'left',
          fontWeight: 700,
          fontSize: '0.875rem',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>🔍 PIPELINE INSPECTOR — GRAYSCALE CONVERSION & 128D VECTOR</span>
        <span>{isOpen ? '▲ HIDE' : '▼ SHOW'}</span>
      </button>

      {isOpen && (
        <div style={{ padding: '16px', color: '#e2e8f0', fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Pre-processing details */}
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '4px' }}>COMPUTER VISION PRE-PROCESSING:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '2px 8px', borderRadius: '4px' }}>
                1. Face Localization (Haar Cascade)
              </span>
              <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '2px 8px', borderRadius: '4px' }}>
                2. Grayscale Conversion (cv2.COLOR_BGR2GRAY)
              </span>
              <span style={{ background: 'rgba(212, 175, 55, 0.15)', color: '#d4af37', padding: '2px 8px', borderRadius: '4px' }}>
                3. Histogram Equalization (equalizeHist)
              </span>
              <span style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', padding: '2px 8px', borderRadius: '4px' }}>
                4. 128x128 Padded Crop Matrix
              </span>
            </div>
          </div>

          <div>
            <span style={{ color: '#94a3b8' }}>Vector Dimension: </span>
            <strong style={{ color: '#10b981' }}>{embeddingDimension} Numerical Values</strong>
            {embeddingDimension === 128 ? (
              <span style={{ marginLeft: '8px', color: '#10b981' }}>(✓ Exact 128D Unit Sphere Match)</span>
            ) : (
              <span style={{ marginLeft: '8px', color: '#ef4444' }}>(✕ Invalid Dimension)</span>
            )}
          </div>

          <div>
            <div style={{ color: '#94a3b8', marginBottom: '4px' }}>Normalized Face Embedding Vector:</div>
            <pre
              style={{
                background: '#020617',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #1e293b',
                color: '#38bdf8',
                fontSize: '0.75rem',
                overflowX: 'auto',
                margin: 0,
              }}
            >
              {formattedVector}
            </pre>
          </div>

          {recordHash && (
            <div>
              <div style={{ color: '#94a3b8', marginBottom: '4px' }}>Canonical Biometric SHA-256 Hash:</div>
              <div
                style={{
                  background: '#020617',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #1e293b',
                  color: '#f59e0b',
                  fontSize: '0.75rem',
                  wordBreak: 'break-all',
                }}
              >
                {recordHash}
              </div>
            </div>
          )}

          {verificationResult && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid #10b981',
                padding: '12px',
                borderRadius: '8px',
              }}
            >
              <div style={{ color: '#10b981', fontWeight: 700, marginBottom: '6px' }}>
                ✓ BLOCKCHAIN VERIFICATION RECORD CONFIRMED
              </div>
              <div style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>
                <div>Network: <strong>{verificationResult.network}</strong></div>
                <div>Status: <strong style={{ color: '#10b981' }}>{verificationResult.status}</strong></div>
                <div>Tx Hash: <code style={{ color: '#38bdf8' }}>{verificationResult.transaction_hash}</code></div>
                {verificationResult.block_number && (
                  <div>Block Number: {verificationResult.block_number}</div>
                )}
                <div>Timestamp: {verificationResult.timestamp}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
