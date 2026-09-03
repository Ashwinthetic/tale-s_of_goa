import React from 'react';
import { FaceBox } from '../services/api';

export interface FaceOverlayProps {
  faces: FaceBox[];
  imageWidth: number;
  imageHeight: number;
  containerWidth?: number;
  containerHeight?: number;
  statusMessage?: string;
  isMirrored?: boolean;
  color?: string;
}

export const FaceOverlay: React.FC<FaceOverlayProps> = ({
  faces,
  imageWidth,
  imageHeight,
  containerWidth,
  containerHeight,
  isMirrored = false,
  color,
}) => {
  if (!imageWidth || !imageHeight || faces.length === 0) {
    return null;
  }

  // If container dimensions are not provided, use percentage scaling relative to image coordinates
  const usePercentage = !containerWidth || !containerHeight;
  const isSingleFace = faces.length === 1;
  const boxColor = color || (isSingleFace ? '#10b981' : '#f59e0b');

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: containerWidth ? `${containerWidth}px` : '100%',
        height: containerHeight ? `${containerHeight}px` : '100%',
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {faces.map((box, index) => {
        let topStyle: string;
        let leftStyle: string;
        let widthStyle: string;
        let heightStyle: string;

        if (usePercentage) {
          topStyle = `${(box.top / imageHeight) * 100}%`;
          heightStyle = `${((box.bottom - box.top) / imageHeight) * 100}%`;
          widthStyle = `${((box.right - box.left) / imageWidth) * 100}%`;
          leftStyle = isMirrored
            ? `${((imageWidth - box.right) / imageWidth) * 100}%`
            : `${(box.left / imageWidth) * 100}%`;
        } else {
          const scaleX = (containerWidth as number) / imageWidth;
          const scaleY = (containerHeight as number) / imageHeight;
          topStyle = `${Math.max(0, box.top * scaleY)}px`;
          heightStyle = `${(box.bottom - box.top) * scaleY}px`;
          widthStyle = `${(box.right - box.left) * scaleX}px`;
          leftStyle = isMirrored
            ? `${(imageWidth - box.right) * scaleX}px`
            : `${box.left * scaleX}px`;
        }

        return (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: topStyle,
              left: leftStyle,
              width: widthStyle,
              height: heightStyle,
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
                top: '-24px',
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
              {isSingleFace ? '✓ FACE DETECTED' : `⚠️ MULTIPLE FACES (${faces.length})`}
            </div>
          </div>
        );
      })}
    </div>
  );
};
