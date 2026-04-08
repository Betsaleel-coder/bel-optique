import React, { useRef, useEffect, useState } from 'react';

interface ARSceneProps {
    landmarksRef: React.MutableRefObject<any>;
    videoElement: HTMLVideoElement | null;
    sourceWidth?: number;
    sourceHeight?: number;
    imageUrl?: string;
    productId?: string;
    productName?: string;
    objectFit?: 'cover' | 'contain';
}

// ─────────────────────────────────────────────────────────────────────────────
// ARScene – rendu Canvas 2D (pas de WebGL requis)
// ─────────────────────────────────────────────────────────────────────────────
export default function ARScene({ landmarksRef, videoElement, sourceWidth, sourceHeight, imageUrl, objectFit = 'cover' }: ARSceneProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);
    const [glassesImage, setGlassesImage] = useState<HTMLImageElement | null>(null);

    useEffect(() => {
        if (!imageUrl) {
            setGlassesImage(null);
            return;
        }
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0);
                try {
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;
                    
                    let minX = canvas.width;
                    let minY = canvas.height;
                    let maxX = 0;
                    let maxY = 0;

                    for (let i = 0; i < data.length; i += 4) {
                        const luma = (data[i] * 2 + data[i+1] * 3 + data[i+2]) / 6;
                        const px = (i / 4) % canvas.width;
                        const py = Math.floor((i / 4) / canvas.width);
                        
                        if (luma > 245) {
                            data[i+3] = 0;
                        } else {
                            if (luma > 220) {
                                data[i+3] = Math.floor(((245 - luma) / 25) * 255);
                            }
                            
                            // Track bounding box based on fully opaque pixels
                            // This natively ignores soft shadows, anti-aliased edges, and floor reflections
                            if (data[i+3] > 200) {
                                if (px < minX) minX = px;
                                if (px > maxX) maxX = px;
                                if (py < minY) minY = py;
                                if (py > maxY) maxY = py;
                            }
                        }
                    }
                    ctx.putImageData(imageData, 0, 0);

                    // If bounds found, create tight crop for perfect AR scaling
                    if (maxX > minX && maxY > minY) {
                        const pad = 10;
                        minX = Math.max(0, minX - pad);
                        maxX = Math.min(canvas.width, maxX + pad);
                        minY = Math.max(0, minY - pad);
                        maxY = Math.min(canvas.height, maxY + pad);

                        const cropW = maxX - minX;
                        const cropH = maxY - minY;

                        const croppedCanvas = document.createElement('canvas');
                        croppedCanvas.width = cropW;
                        croppedCanvas.height = cropH;
                        const croppedCtx = croppedCanvas.getContext('2d');
                        if (croppedCtx) {
                            croppedCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
                            const processedImg = new Image();
                            processedImg.onload = () => setGlassesImage(processedImg);
                            processedImg.src = croppedCanvas.toDataURL('image/png');
                            return;
                        }
                    }

                    // Fallback to full processed canvas if no bounds could be calculated
                    const processedImg = new Image();
                    processedImg.onload = () => setGlassesImage(processedImg);
                    processedImg.src = canvas.toDataURL('image/png');
                } catch (e) {
                    setGlassesImage(img);
                }
            } else {
                setGlassesImage(img);
            }
        };
        img.onerror = () => {
            const fallbackImg = new Image();
            fallbackImg.onload = () => setGlassesImage(fallbackImg);
            fallbackImg.src = imageUrl;
        };
        img.src = imageUrl;
    }, [imageUrl]);

    const lastLmRef = useRef<any[] | null>(null);
    const smoothedLmRef = useRef<any[] | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const render = () => {
            const w = canvas.offsetWidth;
            const h = canvas.offsetHeight;

            // Determine actual source bounds
            const sw = sourceWidth || (videoElement ? videoElement.videoWidth : 0);
            const sh = sourceHeight || (videoElement ? videoElement.videoHeight : 0);

            // Resize canvas if needed
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
            }

            ctx.clearRect(0, 0, w, h);

            // Calculate object-fit: cover sizing based on source dimensions
            if (sw > 0 && sh > 0) {
                const sourceRatio = sw / sh;
                const canvasRatio = w / h;
                
                let renderWidth = w;
                let renderHeight = h;
                let offsetX = 0;
                let offsetY = 0;

                if ((objectFit === 'cover' && canvasRatio > sourceRatio) || (objectFit === 'contain' && canvasRatio <= sourceRatio)) {
                    renderWidth = w;
                    renderHeight = w / sourceRatio;
                    offsetX = 0;
                    offsetY = (h - renderHeight) / 2;
                } else {
                    renderHeight = h;
                    renderWidth = h * sourceRatio;
                    offsetX = (w - renderWidth) / 2;
                    offsetY = 0;
                }

                const rawLm = landmarksRef.current;
                
                // -- Landmark Smoothing (EMA) --
                if (rawLm) {
                    if (!smoothedLmRef.current) {
                        smoothedLmRef.current = [...rawLm];
                    } else {
                        // Adaptive Smoothing with Dead-Zone: 
                        // If movement is extremely small, we lock the point (Dead-Zone).
                        // Small movement = very strong smoothing (low alpha) for stability.
                        // Large movement = less smoothing (higher alpha) for responsiveness.
                        smoothedLmRef.current = rawLm.map((p: any, i: number) => {
                            const prev = smoothedLmRef.current![i];
                            const dist = Math.sqrt(Math.pow(p.x - prev.x, 2) + Math.pow(p.y - prev.y, 2));
                            
                            // 1. Dead-Zone (If change is invisible, don't move at all)
                            if (dist < 0.0008) return prev; 

                            // 2. Adaptive Alpha (Range 0.01 to 0.75)
                            const minAlpha = 0.01; // Ultra-stable when slow
                            const maxAlpha = 0.75;
                            const sensitivity = 150; // Quicker transitions
                            const alpha = Math.min(maxAlpha, minAlpha + dist * sensitivity);

                            return {
                                x: p.x * alpha + prev.x * (1 - alpha),
                                y: p.y * alpha + prev.y * (1 - alpha),
                                z: p.z * alpha + (prev.z || 0) * (1 - alpha)
                            };
                        });
                    }
                } else {
                    smoothedLmRef.current = null;
                }

                const lm = smoothedLmRef.current;
                
                if (lm && glassesImage && lm[36] && lm[45]) {
                    ctx.save();
                    ctx.translate(offsetX, offsetY);
                    
                    const px = (p: any) => ((1 - p.x) * renderWidth);
                    const py = (p: any) => (p.y * renderHeight);

                    // 36-41: right eye contour, 42-47: left eye contour
                    const eyePoints = lm.slice(36, 48);
                    let sumX = 0, sumY = 0;
                    eyePoints.forEach((p: any) => {
                        sumX += px(p);
                        sumY += py(p);
                    });

                    // Center point: geometric mean of all 12 eye landmarks for maximum stability
                    const centerX = sumX / 12;
                    const centerY = sumY / 12;

                    // Reference coordinates (outer eye corners: 36 and 45) for rotation and scale
                    const rxO = px(lm[36]), ryO = py(lm[36]);
                    const lxO = px(lm[45]), lyO = py(lm[45]);

                    // Rotation angle based on outer eye corners
                    const angle = Math.atan2(ryO - lyO, rxO - lxO);

                    // Distance between outer corners for scaling
                    const dist = Math.sqrt(Math.pow(rxO - lxO, 2) + Math.pow(ryO - lyO, 2));
                    
                    // Standard scale factor
                    const targetWidth = dist * 1.55; 

                    const imgRatio = glassesImage.height / glassesImage.width;
                    const targetHeight = targetWidth * imgRatio;

                    ctx.translate(centerX, centerY);
                    ctx.rotate(angle);
                    
                    // Vertical adjustment: Shift down very slightly (3%) for perfect bridge alignment
                    const verticalOffset = targetHeight * 0.03;

                    ctx.drawImage(
                        glassesImage, 
                        -targetWidth / 2, 
                        -targetHeight / 2 + verticalOffset, 
                        targetWidth, 
                        targetHeight
                    );
                    ctx.restore();
                }
            }

            animRef.current = requestAnimationFrame(render);
        };

        render();

        return () => cancelAnimationFrame(animRef.current);
    }, [videoElement, landmarksRef, glassesImage]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            style={{ display: 'block' }}
        />
    );
}
