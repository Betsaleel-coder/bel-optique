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

                const lm = landmarksRef.current;
                if (lm) {
                    ctx.save();
                    ctx.translate(offsetX, offsetY);
                    
                    // -- Draw the loaded glasses image --
                    if (glassesImage && lm[36] && lm[45]) {
                        const px = (p: any) => ((1 - p.x) * renderWidth);
                        const py = (p: any) => (p.y * renderHeight);

                        // Subject's right eye (indices 36-41) -> drawn on right due to mirror
                        const eyeR_outer = lm[36];
                        // Subject's left eye (indices 42-47) -> drawn on left
                        const eyeL_outer = lm[45];

                        const rx = px(eyeR_outer);
                        const ry = py(eyeR_outer);
                        const lx = px(eyeL_outer);
                        const ly = py(eyeL_outer);

                        // Center point between the outer corners of both eyes
                        const centerX = (lx + rx) / 2;
                        const centerY = (ly + ry) / 2;

                        // Rotation angle
                        const angle = Math.atan2(ry - ly, rx - lx);

                        // Width: distance between outer corners + some margin for the frames
                        const dist = Math.sqrt(Math.pow(rx - lx, 2) + Math.pow(ry - ly, 2));
                        
                        // Human eye outer corner distance ~95mm. Standard glasses width ~142mm.
                        // Ratio is approx 1.5x. Since the glassesImage is now tightly cropped to the frames,
                        // targetWidth can be set exactly to 1.5 * dist!
                        const targetWidth = dist * 1.5;

                        const imgRatio = glassesImage.height / glassesImage.width;
                        const targetHeight = targetWidth * imgRatio;

                        ctx.translate(centerX, centerY);
                        ctx.rotate(angle);
                        
                        ctx.drawImage(
                            glassesImage, 
                            -targetWidth / 2, 
                            -targetHeight * 0.50, // Vertical shift to rest the bridge on the nose 
                            targetWidth, 
                            targetHeight
                        );
                    }
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
