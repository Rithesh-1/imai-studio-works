"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Brush, 
  Eraser, 
  Undo, 
  Redo, 
  Download, 
  X, 
  Settings,
  Image as ImageIcon,
  Palette,
  Sparkles,
  Upload,
  Trash2
} from "lucide-react";

interface InpaintCanvasProps {
  imageUrl: string;
  onClose: () => void;
  onInpaintComplete: (resultUrl: string) => void;
}

interface CanvasState {
  isDrawing: boolean;
  brushSize: number;
  isEraser: boolean;
  history: ImageData[];
  historyIndex: number;
}

export default function InpaintCanvas({ 
  imageUrl, 
  onClose, 
  onInpaintComplete 
}: InpaintCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [isEraser, setIsEraser] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);

  const [canvasState, setCanvasState] = useState<CanvasState>({
    isDrawing: false,
    brushSize: 20,
    isEraser: false,
    history: [],
    historyIndex: -1,
  });

  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [originalImageDimensions, setOriginalImageDimensions] = useState({ width: 0, height: 0 });
  const retryCountRef = useRef(0);

  // Initialize canvas when image loads
  useEffect(() => {
    const image = imageRef.current;
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    
    if (!image || !canvas || !maskCanvas) return;

    // Reset retry count for new image
    retryCountRef.current = 0;
    
    // Load image with proper URL handling
    if (!imageUrl || imageUrl.trim() === '') {
      console.error("Invalid image URL:", imageUrl);
      setIsCanvasReady(true);
      setIsImageLoading(false);
      return;
    }

    // Handle different URL types
    let finalImageUrl = imageUrl;
    if (imageUrl.startsWith('http') && !imageUrl.includes(window.location.hostname)) {
      // External image - try with CORS first
      image.crossOrigin = "anonymous";
    } else if (imageUrl.startsWith('/')) {
      // Local image - no CORS needed
      image.crossOrigin = "";
    } else {
      // Other cases - try with CORS
      image.crossOrigin = "anonymous";
    }

    image.loading = "eager"; // Force eager loading
    image.src = finalImageUrl;

    const handleImageLoad = () => {
      const ctx = canvas.getContext("2d");
      const maskCtx = maskCanvas.getContext("2d");
      if (!ctx || !maskCtx) return;

      // Store original image dimensions
      setOriginalImageDimensions({
        width: image.naturalWidth,
        height: image.naturalHeight
      });

      // Calculate canvas size to fit the container while maintaining aspect ratio
      const container = canvas.parentElement;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const imageAspectRatio = image.naturalWidth / image.naturalHeight;
      const containerAspectRatio = containerRect.width / containerRect.height;

      let canvasWidth, canvasHeight;
      if (imageAspectRatio > containerAspectRatio) {
        // Image is wider than container
        canvasWidth = containerRect.width;
        canvasHeight = containerRect.width / imageAspectRatio;
      } else {
        // Image is taller than container
        canvasHeight = containerRect.height;
        canvasWidth = containerRect.height * imageAspectRatio;
      }

      // Set canvas size
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      maskCanvas.width = canvasWidth;
      maskCanvas.height = canvasHeight;

      // Clear and draw image on main canvas
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.drawImage(image, 0, 0, canvasWidth, canvasHeight);

      // Initialize mask canvas with transparent background
      maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);

      // Create initial history state
      const blankImageData = ctx.createImageData(canvas.width, canvas.height);
      setCanvasState(prev => ({
        ...prev,
        history: [blankImageData],
        historyIndex: 0,
      }));

      console.log("Canvas initialized with size:", canvasWidth, "x", canvasHeight);
      setIsCanvasReady(true);
      setIsImageLoading(false);
    };

    const handleImageError = (error: Event) => {
      console.warn("Image loading failed, attempting retry...");
      console.log("Image URL:", imageUrl);
      console.log("Retry attempt:", retryCountRef.current + 1);
      
      // Retry logic with different CORS settings
      if (retryCountRef.current < 2) {
        retryCountRef.current += 1;
        
        if (retryCountRef.current === 1) {
          // First retry: try without CORS
          console.log("Retry 1: Trying without CORS...");
          image.crossOrigin = "";
          image.src = imageUrl;
        } else if (retryCountRef.current === 2) {
          // Second retry: try with proxy for external images
          if (imageUrl.startsWith('http') && !imageUrl.includes(window.location.hostname)) {
            console.log("Retry 2: Trying with proxy...");
            image.crossOrigin = "anonymous";
            image.src = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
          } else {
            // For local images, just create placeholder
            console.log("Creating placeholder canvas for local image...");
            createPlaceholderCanvas();
          }
        }
      } else {
        // All retries failed, create placeholder
        console.warn("All retry attempts failed, creating placeholder canvas...");
        createPlaceholderCanvas();
      }
    };

    const createPlaceholderCanvas = () => {
      const canvas = canvasRef.current;
      const maskCanvas = maskCanvasRef.current;
      if (canvas && maskCanvas) {
        const ctx = canvas.getContext("2d");
        const maskCtx = maskCanvas.getContext("2d");
        if (ctx && maskCtx) {
          // Set default canvas size
          const container = canvas.parentElement;
          if (container) {
            const containerRect = container.getBoundingClientRect();
            canvas.width = containerRect.width;
            canvas.height = containerRect.height;
            maskCanvas.width = containerRect.width;
            maskCanvas.height = containerRect.height;
            
            // Draw placeholder
            ctx.fillStyle = "#f0f0f0";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#666";
            ctx.font = "16px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Image failed to load", canvas.width / 2, canvas.height / 2);
            
            // Initialize mask canvas
            maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
            
            // Create blank history
            const blankImageData = ctx.createImageData(canvas.width, canvas.height);
            setCanvasState(prev => ({
              ...prev,
              history: [blankImageData],
              historyIndex: 0,
            }));
          }
        }
      }
      
      setIsCanvasReady(true);
      setIsImageLoading(false);
    };

    const handleResize = () => {
      if (image.complete) {
        handleImageLoad();
      }
    };

    image.addEventListener("load", handleImageLoad);
    image.addEventListener("error", handleImageError);
    window.addEventListener("resize", handleResize);
    
    return () => {
      image.removeEventListener("load", handleImageLoad);
      image.removeEventListener("error", handleImageError);
      window.removeEventListener("resize", handleResize);
    };
  }, [imageUrl]);

  // Save canvas state to history
  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setCanvasState(prev => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(imageData);
      
      return {
        ...prev,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  }, []);

  // Undo function
  const handleUndo = useCallback(() => {
    if (canvasState.historyIndex > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      const newIndex = canvasState.historyIndex - 1;
      ctx.putImageData(canvasState.history[newIndex], 0, 0);
      
      setCanvasState(prev => ({
        ...prev,
        historyIndex: newIndex,
      }));
    }
  }, [canvasState.historyIndex, canvasState.history]);

  // Redo function
  const handleRedo = useCallback(() => {
    if (canvasState.historyIndex < canvasState.history.length - 1) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      const newIndex = canvasState.historyIndex + 1;
      ctx.putImageData(canvasState.history[newIndex], 0, 0);
      
      setCanvasState(prev => ({
        ...prev,
        historyIndex: newIndex,
      }));
    }
  }, [canvasState.historyIndex, canvasState.history]);

  // Mouse event handlers
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas || !maskCanvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if coordinates are within canvas bounds
    if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) return;

    const ctx = canvas.getContext("2d");
    const maskCtx = maskCanvas.getContext("2d");
    if (!ctx || !maskCtx) return;

    // Only draw if we're actually drawing or if mouse button is pressed
    if (!canvasState.isDrawing && e.buttons === 0) return;

    // Draw on the mask canvas with solid grey color (like reference implementation)
    maskCtx.fillStyle = 'rgb(120, 120, 120)';
    maskCtx.globalCompositeOperation = 'source-over';
    
    // Draw a solid circle at the current position
    maskCtx.beginPath();
    maskCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    maskCtx.fill();

    // Update main canvas to show visual feedback
    // Draw the original image
    const image = imageRef.current;
    if (image && image.complete) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      
      // Add visual feedback for masked areas with a visible overlay
      ctx.globalCompositeOperation = "multiply";
      ctx.globalAlpha = 0.6; // More visible overlay
      ctx.drawImage(maskCanvas, 0, 0);
      
      // Reset composite operation
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1.0;
    }
  }, [canvasState.isDrawing, brushSize]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    setCanvasState(prev => ({ ...prev, isDrawing: true }));
    // Start drawing immediately on mouse down
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas || !maskCanvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if coordinates are within canvas bounds
    if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) return;

    const ctx = canvas.getContext("2d");
    const maskCtx = maskCanvas.getContext("2d");
    if (!ctx || !maskCtx) return;

    // Draw on mask canvas with solid grey color
    maskCtx.fillStyle = 'rgb(120, 120, 120)';
    maskCtx.globalCompositeOperation = 'source-over';
    
    // Draw a solid circle at the current position
    maskCtx.beginPath();
    maskCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    maskCtx.fill();

    // Update main canvas to show visual feedback
    const image = imageRef.current;
    if (image && image.complete) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      
      // Add visual feedback for masked areas with a visible overlay
      ctx.globalCompositeOperation = "multiply";
      ctx.globalAlpha = 0.6; // More visible overlay
      ctx.drawImage(maskCanvas, 0, 0);
      
      // Reset composite operation
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1.0;
    }
  }, [brushSize]);

  const handleMouseUp = useCallback(() => {
    setCanvasState(prev => ({ ...prev, isDrawing: false }));
    saveToHistory();
  }, [saveToHistory]);

  // Clear mask function
  const clearMask = useCallback(() => {
    const maskCanvas = maskCanvasRef.current;
    const canvas = canvasRef.current;
    if (!maskCanvas || !canvas) return;

    const maskCtx = maskCanvas.getContext("2d");
    const ctx = canvas.getContext("2d");
    if (!maskCtx || !ctx) return;

    // Clear mask canvas
    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    
    // Redraw main canvas with original image only
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const image = imageRef.current;
    if (image && image.complete) {
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    }
  }, []);

  // Handle reference image upload
  const handleReferenceImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setReferenceImages(prev => [...prev, result]);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  // Remove reference image
  const removeReferenceImage = useCallback((index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Create original image data for API
  const createOriginalImageData = useCallback(() => {
    const image = imageRef.current;
    if (!image || !image.complete) return null;

    // Create a temporary canvas for the original size image
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return null;

    // Check if image is too large for API (OpenAI has limits)
    const maxDimension = 2048;
    let finalWidth = originalImageDimensions.width;
    let finalHeight = originalImageDimensions.height;
    
    if (originalImageDimensions.width > maxDimension || originalImageDimensions.height > maxDimension) {
      const ratio = Math.min(maxDimension / originalImageDimensions.width, maxDimension / originalImageDimensions.height);
      finalWidth = Math.floor(originalImageDimensions.width * ratio);
      finalHeight = Math.floor(originalImageDimensions.height * ratio);
    }
    
    // Use final dimensions
    tempCanvas.width = finalWidth;
    tempCanvas.height = finalHeight;
    
    // Draw the image with proper scaling
    tempCtx.drawImage(image, 0, 0, finalWidth, finalHeight);
    
    // Convert to base64 PNG
    return tempCanvas.toDataURL('image/png');
  }, [originalImageDimensions]);

  // Create mask data for API (dark grey regions)
  const createMaskData = useCallback(() => {
    const image = imageRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!image || !image.complete || !maskCanvas) return null;

    // Create a temporary canvas for the original size image
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return null;

    // Check if image is too large for API (OpenAI has limits)
    const maxDimension = 2048;
    let finalWidth = originalImageDimensions.width;
    let finalHeight = originalImageDimensions.height;
    
    if (originalImageDimensions.width > maxDimension || originalImageDimensions.height > maxDimension) {
      const ratio = Math.min(maxDimension / originalImageDimensions.width, maxDimension / originalImageDimensions.height);
      finalWidth = Math.floor(originalImageDimensions.width * ratio);
      finalHeight = Math.floor(originalImageDimensions.height * ratio);
    }
    
    // Use final dimensions
    tempCanvas.width = finalWidth;
    tempCanvas.height = finalHeight;
    
    // Draw the original image at final size
    tempCtx.drawImage(image, 0, 0, finalWidth, finalHeight);
    
    // Create a mask canvas at final size
    const originalMaskCanvas = document.createElement('canvas');
    const originalMaskCtx = originalMaskCanvas.getContext('2d');
    if (!originalMaskCtx) return null;
    
    originalMaskCanvas.width = finalWidth;
    originalMaskCanvas.height = finalHeight;
    
    // Scale the mask from display size to final size
    originalMaskCtx.drawImage(maskCanvas, 0, 0, finalWidth, finalHeight);
    
    // Get the mask data to identify masked regions
    const maskData = originalMaskCtx.getImageData(0, 0, finalWidth, finalHeight);
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    
    // Fill masked regions with dark grey (like reference implementation)
    for (let i = 0; i < maskData.data.length; i += 4) {
      if (maskData.data[i] > 0 || maskData.data[i + 1] > 0 || maskData.data[i + 2] > 0) {
        // This pixel is masked - fill it with dark grey for API
        imageData.data[i] = 50;      // R (dark grey)
        imageData.data[i + 1] = 50;  // G (dark grey)
        imageData.data[i + 2] = 50;  // B (dark grey)
        imageData.data[i + 3] = 255; // A (full opacity)
      }
    }
    
    // Put the modified image data back
    tempCtx.putImageData(imageData, 0, 0);
    
    // Convert to base64 PNG
    return tempCanvas.toDataURL('image/png');
  }, [originalImageDimensions]);

  // Process inpainting
  const handleProcessInpainting = useCallback(async () => {
    if (!prompt.trim()) {
      alert("Please enter a prompt for inpainting");
      return;
    }

    setIsProcessing(true);

    try {
      // Create original image data
      const originalImageData = createOriginalImageData();
      if (!originalImageData) {
        throw new Error("Failed to create original image data");
      }

      // Create mask data
      const maskData = createMaskData();
      if (!maskData) {
        throw new Error("Failed to create mask data");
      }

      // Prepare request data
      const requestData = {
        imageData: originalImageData,
        maskData: maskData,
        referenceImages: referenceImages,
        prompt: prompt.trim(),
      };

      console.log("Sending inpainting request:", {
        prompt: requestData.prompt,
        hasReferenceImages: referenceImages.length > 0,
        originalImageSize: Math.round(originalImageData.length / 1024),
        maskDataSize: Math.round(maskData.length / 1024)
      });

      const response = await fetch("/api/inpainting", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.firebaseUrl) {
        console.log("Inpainting completed successfully");
        console.log("✅ Using Firebase URL from API response:", result.firebaseUrl);
        onInpaintComplete(result.firebaseUrl);
      } else if (result.success && result.imageData) {
        console.log("Inpainting completed successfully, using base64 fallback");
        // Convert base64 to blob URL for display (fallback)
        const base64Data = result.imageData;
        const blob = await fetch(`data:image/png;base64,${base64Data}`).then(res => res.blob());
        const imageUrl = URL.createObjectURL(blob);
        onInpaintComplete(imageUrl);
      } else {
        throw new Error(result.error || "Inpainting failed");
      }
    } catch (error) {
      console.error("Inpainting error:", error);
      alert(`Inpainting failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsProcessing(false);
    }
  }, [prompt, referenceImages, createOriginalImageData, createMaskData, onInpaintComplete]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "z":
            e.preventDefault();
            if (e.shiftKey) {
              handleRedo();
            } else {
              handleUndo();
            }
            break;
          case "y":
            e.preventDefault();
            handleRedo();
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl h-full max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold">Inpaint Canvas</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex gap-4 p-4 overflow-hidden min-h-0">
          {/* Canvas Area */}
          <div className="flex-1 relative bg-gray-100 rounded-lg overflow-hidden">
            {isImageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <p className="text-sm text-gray-600">Loading image...</p>
                </div>
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                ref={imageRef}
                alt="Original"
                className="max-w-full max-h-full object-contain"
                style={{ display: "none" }}
                crossOrigin="anonymous"
              />
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-full object-contain cursor-crosshair"
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseUp}
              />
              <canvas
                ref={maskCanvasRef}
                className="absolute inset-0 pointer-events-none"
                style={{ opacity: 0, visibility: 'hidden' }}
              />
            </div>
          </div>

          {/* Controls Panel */}
          <div className="w-80 space-y-4 overflow-y-auto">
            {/* Tools */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    variant={!isEraser ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsEraser(false)}
                    className="flex-1"
                  >
                    <Brush className="w-4 h-4 mr-1" />
                    Brush
                  </Button>
                  <Button
                    variant={isEraser ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsEraser(true)}
                    className="flex-1"
                  >
                    <Eraser className="w-4 h-4 mr-1" />
                    Eraser
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUndo}
                    disabled={canvasState.historyIndex <= 0}
                  >
                    <Undo className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRedo}
                    disabled={canvasState.historyIndex >= canvasState.history.length - 1}
                  >
                    <Redo className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearMask}
                    title="Clear Mask"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Brush Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Brush Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-xs text-gray-600">Size</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="flex-1"
                    />
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ 
                        width: `${Math.min(brushSize, 20)}px`, 
                        height: `${Math.min(brushSize, 20)}px`,
                        backgroundColor: isEraser ? '#ff6b6b' : '#4f46e5'
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{brushSize}px</span>
                </div>
              </CardContent>
            </Card>

            {/* Reference Images */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Reference Images</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleReferenceImageUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Reference
                  </Button>
                </div>
                
                {referenceImages.length > 0 && (
                  <div className="space-y-2">
                    {referenceImages.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageUrl}
                          alt={`Reference ${index + 1}`}
                          className="w-full h-20 object-cover rounded border"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeReferenceImage(index)}
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Prompt */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Prompt</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  placeholder="Describe what you want to add or change..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[80px] w-full p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </CardContent>
            </Card>

            {/* Process Button */}
            <Button
              onClick={handleProcessInpainting}
              disabled={isProcessing || !prompt.trim() || !isCanvasReady}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Process Inpainting
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 