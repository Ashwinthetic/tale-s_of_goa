'use client';

import React from 'react';
import { FaceBox } from '../services/api';

interface FaceOverlayProps {
  faces: FaceBox[];
  imageWidth: number;
  imageHeight: number;
  containerWidth: number;
  containerHeight: number;
  statusMessage?: string;
  isMirrored?: boolean;
}

export const FaceOverlay: React.FC<FaceOverlayProps> = ({
  faces,
  imageWidth,
  imageHeight,
  containerWidth,
  containerHeight,
  isMirrored = true,
}) => {
  if (!containerWidth || !containerHeight || !imageWidth || !imageHeight || faces.length === 0) {
    return null;
  }

  const scaleX = containerWidth / imageWidth;
  const scaleY = containerHeight / imageHeight;

  const isSingleFace = faces.length === 1;
  const boxColor = isSingleFace ? '#10b981' : '#f59e0b';

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: `${containerWidth}px`,
        height: `${containerHeight}px`,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {faces.map((box, index) => {
        const top = box.top * scaleY;
        const width = (box.right - box.left) * scaleX;
        const height = (box.bottom - box.top) * scaleY;

        // On mirrored webcam: left coordinate must be mapped from the right side of the unmirrored frame
        const left = isMirrored
          ? (imageWidth - box.right) * scaleX
          : box.left * scaleX;

        return (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: `${Math.max(0, top)}px`,
              left: `${Math.max(0, left)}px`,
              width: `${width}px`,
              height: `${height}px`,
              border: `2px solid ${boxColor}`,
              borderRadius: '8px',
              boxShadow: `0 0 16px ${boxColor}66, inset 0 0 8px ${boxColor}33`,
              transition: 'all 0.12s ease-out',
            }}
          >
            {/* Top-left corner bracket */}
            <div
              style={{
                position: 'absolute',
                top: '-3px',
                left: '-3px',
                width: '12px',
                height: '12px',
                borderTop: `4px solid ${boxColor}`,
                borderLeft: `4px solid ${boxColor}`,
              }}
            />
            {/* Bottom-right corner bracket */}
            <div
              style={{
                position: 'absolute',
                bottom: '-3px',
                right: '-3px',
                width: '12px',
                height: '12px',
                borderBottom: `4px solid ${boxColor}`,
                borderRight: `4px solid ${boxColor}`,
              }}
            />

            {/* Status pill badge */}
            <div
              style={{
                position: 'absolute',
                top: '-26px',
                left: '0px',
                background: boxColor,
                color: '#0f172a',
                padding: '2px 8px',
                fontSize: '10px',
                fontWeight: 800,
                fontFamily: 'monospace',
                borderRadius: '4px',
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
              }}
            >
              {isSingleFace ? '✓ 1 FACE DETECTED' : `⚠️ MULTIPLE FACES (${faces.length})`}
            </div>
          </div>
        );
      })}
    </div>
  );
};
