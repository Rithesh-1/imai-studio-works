"use client";

import { useState, useCallback } from "react";

interface UseInpaintCanvasReturn {
  isCanvasOpen: boolean;
  currentImageUrl: string | null;
  openCanvas: (imageUrl: string) => void;
  closeCanvas: () => void;
  handleInpaintComplete: (resultUrl: string) => void;
}

interface UseInpaintCanvasProps {
  onInpaintComplete?: (resultUrl: string) => void;
}

export function useInpaintCanvas(props?: UseInpaintCanvasProps): UseInpaintCanvasReturn {
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  const openCanvas = useCallback((imageUrl: string) => {
    setCurrentImageUrl(imageUrl);
    setIsCanvasOpen(true);
  }, []);

  const closeCanvas = useCallback(() => {
    setIsCanvasOpen(false);
    setCurrentImageUrl(null);
  }, []);

  const handleInpaintComplete = useCallback((resultUrl: string) => {
    // Call the provided callback to add the inpainted image to the chat
    if (props?.onInpaintComplete) {
      props.onInpaintComplete(resultUrl);
    }
    
    console.log("Inpaint completed:", resultUrl);
    
    // Close the canvas after completion
    closeCanvas();
  }, [closeCanvas, props]);

  return {
    isCanvasOpen,
    currentImageUrl,
    openCanvas,
    closeCanvas,
    handleInpaintComplete,
  };
} 