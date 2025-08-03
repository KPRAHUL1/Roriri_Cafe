import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from '@zxing/library';


const QRScanner = ({ onScan, onError, isActive }) => {
  const scannerRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (!isActive) return;

    const codeReader = new BrowserMultiFormatReader();
    scannerRef.current = codeReader;

    codeReader
      .decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
        if (result) {
          onScan(result.getText());
          codeReader.reset(); // stop after successful scan
        }

        if (err && err.name !== 'NotFoundException') {
          console.error('Decode error:', err);
          onError?.(err.message);
        }
      });

    return () => {
      codeReader.reset();
    };
  }, [isActive]);

  return (
    <video ref={videoRef} className="w-full h-auto rounded-xl shadow-md" />
  );
};

export default QRScanner;
