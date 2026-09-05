'use client';

import React, { useRef, useState, useEffect } from 'react';
import { FaceBox } from '../services/api';
import { FaceOverlay } from './FaceOverlay';

interface TestImageUploadProps {
  onImageSelected: (base64Image: string) => void;
  selectedImage: string | null;
  faces?: FaceBox[];
  imageWidth?: number;
  imageHeight?: number;
  statusMessage?: string;
}

export const TestImageUpload: React.FC<TestImageUploadProps> = ({
  onImageSelected,
  selectedImage,
  faces = [],
  imageWidth = 640,
  imageHeight = 480,
  statusMessage = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerDim, setContainerDim] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (containerRef.current) {
      setContainerDim({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
    }
  }, [selectedImage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        onImageSelected(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ textAlign: 'center', width: '100%' }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />

      <div
        onClick={() => !selectedImage && fileInputRef.current?.click()}
        style={{
          border: '2px dashed rgba(56, 189, 248, 0.4)',
          borderRadius: '12px',
          padding: '16px',
          background: 'rgba(15, 23, 42, 0.6)',
          minHeight: '380px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {selectedImage ? (
          <div
            ref={containerRef}
            style={{
              position: 'relative',
              width: '100%',
              maxHeight: '380px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={selectedImage}
              alt="Selected Test Frame"
              onLoad={(e) => {
                const img = e.currentTarget;
                setContainerDim({
                  width: img.clientWidth,
                  height: img.clientHeight,
                });
              }}
              style={{
                maxWidth: '100%',
                maxHeight: '380px',
                borderRadius: '8px',
                objectFit: 'contain',
              }}
            />

            <FaceOverlay
              faces={faces}
              imageWidth={imageWidth}
              imageHeight={imageHeight}
              containerWidth={containerDim.width}
              containerHeight={containerDim.height}
              statusMessage={statusMessage}
              isMirrored={false}
            />

            <button
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(2, 6, 23, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#38bdf8',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🔄 Change Image
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{ cursor: 'pointer', padding: '32px' }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📁</div>
            <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '1rem', marginBottom: '6px' }}>
              Click to Upload Test Image
            </div>
            <div style={{ color: '#64748b', fontSize: '0.8125rem', maxWidth: '360px' }}>
              Upload a JPG or PNG containing a human face to test detection, 128D embedding extraction, and blockchain hashing.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
