import { useState, useEffect, useRef } from 'react';
import { Camera, X, RefreshCw, CheckCircle, Sparkles, Ruler, Info, Share2, MessageCircle, Image as ImageIcon, Video } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import vtoBackground from '../assets/vto-background.png';
import ARScene from '../components/VTO/ARScene';
// Stable face-api.js integration (CPU-only for maximum compatibility)

export default function VirtualTryOn() {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [tryOnMode, setTryOnMode] = useState<'photo' | 'video' | null>(null);
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [isPhotoProcessing, setIsPhotoProcessing] = useState(false);
  const [pinnedImage, setPinnedImage] = useState<string | null>(null);
  const [selectedGlasses, setSelectedGlasses] = useState<any>(null);
  const [glassesList, setGlassesList] = useState<any[]>([]);
  const [landmarks, setLandmarks] = useState<any>(null);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationScale, setCalibrationScale] = useState<number | null>(null);
  const [pd, setPd] = useState<number | null>(null);
  const [isPdStable, setIsPdStable] = useState(false);
  const [showPdInfo, setShowPdInfo] = useState(false);
  const [isFlashActive, setIsFlashActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [photoDimensions, setPhotoDimensions] = useState<{ width: number, height: number } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const landmarksRef = useRef<any>(null);
  const animFrameRef = useRef<number>(0);
  const isMeasuringRef = useRef(false);
  const calibrationScaleRef = useRef<number | null>(null);
  const pdHistoryRef = useRef<number[]>([]);
  const { t } = useLanguage();

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // ── Chargement des modèles face-api.js (CPU, pas de WebGL) ───────────────
  useEffect(() => {
    fetchGlasses();
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.14/model';
    const faceapi = (window as any).faceapi;
    if (!faceapi) {
      // Réessayer quand face-api.js est chargé
      const interval = setInterval(() => {
        const fa = (window as any).faceapi;
        if (fa) {
          clearInterval(interval);
          loadModels(fa, MODEL_URL);
        }
      }, 300);
      return () => clearInterval(interval);
    }
    loadModels(faceapi, MODEL_URL);
  }, []);

  async function loadModels(faceapi: any, modelUrl: string) {
    try {
      // Forcer le backend CPU pour éviter toute dépendance à WebGL
      if (faceapi.tf) {
        await faceapi.tf.setBackend('cpu');
        await faceapi.tf.ready();
      }
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
        faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
      ]);
      console.log('face-api.js models loaded (CPU backend)');
    } catch (e) {
      console.error('face-api model load error:', e);
    }
  }

  // ── Tracking Vidéo (face-api.js, CPU) ────────────────────────────────────
  useEffect(() => {
    if (!isCameraActive) {
      cancelAnimationFrame(animFrameRef.current);
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
      landmarksRef.current = null;
      setLandmarks(null);
      return;
    }

    let active = true;

    const startCamera = async () => {
      setCameraError(null);
      try {
        // Force cleanup of any previous stream before requesting a new one
        if (videoRef.current?.srcObject) {
          (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
          videoRef.current.srcObject = null;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
        });
        if (!videoRef.current || !active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        videoRef.current.srcObject = stream;
        await new Promise<void>(resolve => {
          videoRef.current!.onloadedmetadata = () => resolve();
        });
        await videoRef.current.play();
        processLoop();
      } catch (err: any) {
        console.error('Camera error:', err);
        if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setCameraError("La caméra est déjà utilisée par un autre onglet ou une autre application.");
        } else if (err.name === 'NotAllowedError') {
          setCameraError("L'accès à la caméra a été refusé. Veuillez autoriser l'accès dans les paramètres de votre navigateur.");
        } else {
          setCameraError("Impossible d'accéder à la caméra. Veuillez vérifier vos branchements.");
        }
        setIsCameraActive(false);
      }
    };

    const processLoop = async () => {
      const faceapi = (window as any).faceapi;
      if (!faceapi || !videoRef.current || !active) {
        animFrameRef.current = requestAnimationFrame(processLoop);
        return;
      }

      try {
        const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 });
        const result = await faceapi
          .detectSingleFace(videoRef.current, options)
          .withFaceLandmarks();

        if (result && active) {
          const pts = result.landmarks.positions;
          const vw = videoRef.current?.videoWidth || 640;
          const vh = videoRef.current?.videoHeight || 480;

          // Construire un tableau de 68 points normalisés
          const lm = pts.map((p: any) => ({ x: p.x / vw, y: p.y / vh, z: 0 }));

          landmarksRef.current = lm;
          setLandmarks(lm);
          handlePdUpdate(lm);
        } else if (active) {
          landmarksRef.current = null;
        }
      } catch (_) {}

      if (active) {
        animFrameRef.current = requestAnimationFrame(processLoop);
      }
    };

    startCamera();

    return () => {
      active = false;
      cancelAnimationFrame(animFrameRef.current);
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, [isCameraActive]);

  // ── Mode Photo (face-api.js) ───────────────────────────────────────────
  useEffect(() => {
    if (tryOnMode !== 'photo' || !uploadedPhoto) return;
    const faceapi = (window as any).faceapi;
    if (!faceapi) return;

    setIsPhotoProcessing(true);
    setLandmarks(null);
    landmarksRef.current = null;

    const img = new Image();
    img.onload = async () => {
      try {
        // Use a larger input size for static photo for better precision
        const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.3 });
        const result = await faceapi.detectSingleFace(img, options).withFaceLandmarks();
        if (result) {
          const pts = result.landmarks.positions;
          const vw = img.width;
          const vh = img.height;
          setPhotoDimensions({ width: vw, height: vh });
          const lm = pts.map((p: any) => ({ x: p.x / vw, y: p.y / vh, z: 0 }));

          landmarksRef.current = lm;
          setLandmarks(lm);
        }
      } catch (e) {
        console.error("Photo process error", e);
      }
      setIsPhotoProcessing(false);
    };
    img.src = uploadedPhoto;
  }, [uploadedPhoto, tryOnMode]);

  const handlePdUpdate = (face: any) => {
    let currentPd = 0;

    if (calibrationScaleRef.current && face[33] && face[263]) {
      const p1 = face[33];
      const p2 = face[263];
      const normalizedDistance = Math.sqrt(
        Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
      );
      currentPd = Math.round(normalizedDistance * calibrationScaleRef.current);
    } else if (isMeasuringRef.current && !calibrationScaleRef.current && face[33] && face[263]) {
      const p1 = face[33];
      const p2 = face[263];
      const distanceInPixels = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
      currentPd = Math.round(distanceInPixels * 380); // Estimate based on screen density
    }

    if (currentPd > 30 && currentPd < 100) {
      const history = pdHistoryRef.current;
      history.push(currentPd);
      if (history.length > 5) history.shift();

      // Calculate average of the last 5 for stability
      const sum = history.reduce((a, b) => a + b, 0);
      const avg = Math.round(sum / history.length);

      // Check if values are stable (low variance)
      const isStable = history.length >= 3 && history.every(v => Math.abs(v - avg) <= 1);
      if (isStable !== isPdStable) setIsPdStable(isStable);

      // Only set state if we have enough points and avg is different
      if (history.length >= 3 && avg !== pd) {
        setPd(avg);
      }
    }
  };


  async function fetchGlasses() {
    const { data } = await supabase.from('products').select('*').not('image_url', 'is', null);
    if (data && data.length > 0) {
      const formattedData = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        image: p.image_url,
        tryOnImage: p.model_3d_url || p.image_url,
        modelUrl: p.model_3d_url,
      }));
      setGlassesList(formattedData);
      setSelectedGlasses(formattedData[0]);
    }
  }

  const handleCapture = () => {
    const canvas3d = document.querySelector('canvas');
    if (!canvas3d) return;

    let sourceElement: HTMLVideoElement | HTMLImageElement | null = null;
    let sourceWidth = 0;
    let sourceHeight = 0;

    if (tryOnMode === 'video' && videoRef.current) {
      sourceElement = videoRef.current;
      sourceWidth = videoRef.current.videoWidth;
      sourceHeight = videoRef.current.videoHeight;
    } else if (tryOnMode === 'photo') {
      const photoEl = document.getElementById('photo-element') as HTMLImageElement;
      if (photoEl) {
        sourceElement = photoEl;
        sourceWidth = photoEl.naturalWidth;
        sourceHeight = photoEl.naturalHeight;
      }
    }

    if (!sourceElement || sourceWidth === 0) return;

    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = sourceWidth;
    captureCanvas.height = sourceHeight;
    const ctx = captureCanvas.getContext('2d');

    if (ctx) {
      setIsFlashActive(true);
      setTimeout(() => setIsFlashActive(false), 150);

      ctx.translate(captureCanvas.width, 0);
      ctx.scale(-1, 1);

      if (sourceElement instanceof HTMLVideoElement) {
        ctx.drawImage(sourceElement, 0, 0, captureCanvas.width, captureCanvas.height);
      } else {
        ctx.drawImage(sourceElement, 0, 0, captureCanvas.width, captureCanvas.height);
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(canvas3d, 0, 0, captureCanvas.width, captureCanvas.height);

      const dataUrl = captureCanvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(dataUrl);
    }
  };

  const handleDownload = () => {
    if (!capturedImage) return;
    const link = document.createElement('a');
    link.href = capturedImage;
    link.download = `bel-optique-tryon-${selectedGlasses?.name || 'glasses'}.jpg`;
    link.click();
  };

  const handleShare = () => {
    const pdText = pd ? `\n\n- Mon Écart Pupillaire (EP) : ${pd} mm` : '';
    const baseMessage = t('wa.interest').replace('{name}', selectedGlasses?.name || '');
    const fullMessage = `${baseMessage}${pdText}\n\nVoici mon choix !`;
    const whatsappUrl = `https://wa.me/242044744456?text=${encodeURIComponent(fullMessage)}`;
    window.open(whatsappUrl, '_blank');
  };

  const startCalibration = () => {
    setIsCalibrating(true);
    setPd(null);
  };

  const completeCalibration = () => {
    if (overlayRef.current && videoRef.current) {
      const rect = overlayRef.current.getBoundingClientRect();
      const videoRect = videoRef.current.getBoundingClientRect();

      // Standard card width is 85.6mm
      // We calculate the normalized width of the calibration box
      const normalizedBoxWidth = rect.width / videoRect.width;
      const mmPerNormalizedUnit = 85.6 / normalizedBoxWidth;

      setCalibrationScale(mmPerNormalizedUnit);
      calibrationScaleRef.current = mmPerNormalizedUnit; // Immediate update for the worker loop
      setIsCalibrating(false);
      setIsMeasuring(true);
    }
  };

  return (
    <div className="bg-bel-dark min-h-screen text-bel-light py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold mb-4 flex items-center justify-center gap-3">
            <Sparkles className="text-bel-accent" size={36} />
            {t('vto.title')}
          </h1>
          <p className="text-bel-light/70 max-w-2xl mx-auto">
            {t('vto.subtitle')}
          </p>
        </div>

        <div className="flex flex-col gap-8">
          {/* Main Viewer Area */}
          <div className="flex flex-col xl:flex-row gap-4 justify-center items-center w-full max-w-7xl mx-auto">
            <div className="w-full max-w-5xl max-h-[80vh] bg-zinc-900 rounded-3xl overflow-hidden aspect-[4/3] sm:aspect-video relative shadow-2xl border border-white/10">
              {/* Background Image layer */}
              <img src={vtoBackground} className="absolute inset-0 w-full h-full object-cover opacity-60 z-0" alt="" />
              
              {!isCameraActive && tryOnMode !== 'photo' ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-8 text-center bg-bel-dark/80">
                  <h3 className="font-serif text-2xl sm:text-3xl font-medium mb-8 text-white">{t('vto.title') || "Choisissez votre mode d'essai"}</h3>
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Mode Photo */}
                    <div
                      className="bg-white/5 p-6 rounded-3xl border border-white/10 flex flex-col items-center hover:bg-white/10 transition-colors w-64 group cursor-pointer"
                      onClick={() => setTryOnMode('photo')}
                    >
                      <div className="w-16 h-16 bg-bel-accent/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-bel-accent transition-colors">
                        <ImageIcon size={32} className="text-bel-accent group-hover:text-bel-dark transition-colors" />
                      </div>
                      <h4 className="text-xl font-bold mb-2 text-white">Mode Photo</h4>
                      <p className="text-sm text-bel-light/60 mb-6 flex-grow">Uploadez une photo de face pour un essai statique ultra-précis.</p>
                      <button className="w-full bg-bel-accent text-bel-dark px-4 py-2 rounded-full font-bold hover:scale-105 transition-transform">
                        Choisir
                      </button>
                    </div>

                    {/* Mode Video */}
                    <div
                      className="bg-white/5 p-6 rounded-3xl border border-white/10 flex flex-col items-center hover:bg-white/10 transition-colors w-64 group cursor-pointer"
                      onClick={() => { setTryOnMode('video'); setIsCameraActive(true); }}
                    >
                      <div className="w-16 h-16 bg-bel-accent/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-bel-accent transition-colors">
                        <Video size={32} className="text-bel-accent group-hover:text-bel-dark transition-colors" />
                      </div>
                      <h4 className="text-xl font-bold mb-2 text-white">Vidéo Live</h4>
                      <p className="text-sm text-bel-light/60 mb-6 flex-grow">Utilisez votre webcam pour voir les lunettes en mouvement.</p>
                      <button className="w-full bg-bel-accent text-bel-dark px-4 py-2 rounded-full font-bold hover:scale-105 transition-transform">
                        Choisir
                      </button>
                    </div>
                  </div>
                </div>
              ) : tryOnMode === 'photo' && !uploadedPhoto ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-bel-dark/80">
                  <h3 className="font-serif text-2xl sm:text-3xl font-medium mb-4 text-white">Uploadez votre photo</h3>
                  <p className="text-bel-light/70 mb-8 max-w-md">Assurez-vous que votre visage est bien éclairé et bien de face.</p>
                  <label className="cursor-pointer bg-bel-accent text-bel-dark px-8 py-4 rounded-full font-bold shadow-xl shadow-bel-accent/20 hover:scale-105 transition-all flex items-center gap-3">
                    <ImageIcon size={24} />
                    Sélectionner une image
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const url = URL.createObjectURL(e.target.files[0]);
                        setUploadedPhoto(url);
                      }
                    }} />
                  </label>
                  <button onClick={() => setTryOnMode(null)} className="mt-6 text-white/50 hover:text-white underline">Retour</button>
                </div>
              ) : tryOnMode === 'photo' && uploadedPhoto ? (
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                  <img src={uploadedPhoto} className="absolute inset-0 w-full h-full object-contain scale-x-[-1] z-10" alt="Uploaded face" />

                  {isPhotoProcessing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20">
                      <RefreshCw className="animate-spin text-bel-accent" size={32} />
                    </div>
                  )}

                  {!isPhotoProcessing && landmarks && (
                    <ARScene
                      landmarksRef={landmarksRef}
                      videoElement={null}
                      sourceWidth={photoDimensions?.width}
                      sourceHeight={photoDimensions?.height}
                      imageUrl={selectedGlasses?.tryOnImage || selectedGlasses?.image}
                      productId={selectedGlasses?.id}
                      productName={selectedGlasses?.name}
                      objectFit="contain"
                    />
                  )}

                  <div className="absolute top-4 right-4 flex gap-2 z-50">
                    <button
                      onClick={handleCapture}
                      className="w-10 h-10 bg-black/50 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors text-white"
                      title="Capturer"
                    >
                      <Camera size={20} />
                    </button>
                    <button
                      onClick={() => { setUploadedPhoto(null); setTryOnMode(null); }}
                      className="w-10 h-10 bg-black/50 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors text-white"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Real-time Video Feed */}
                  <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-contain scale-x-[-1] z-10"
                    style={{ filter: 'none' }}
                    playsInline
                    autoPlay
                    muted
                  />

                  {/* 3D AR Overlay */}
                  {!capturedImage && (
                    <ARScene
                      landmarksRef={landmarksRef}
                      videoElement={videoRef.current}
                      imageUrl={selectedGlasses?.tryOnImage || selectedGlasses?.image}
                      productId={selectedGlasses?.id}
                      productName={selectedGlasses?.name}
                      objectFit="contain"
                    />
                  )}

                  {cameraError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50 p-6 text-center">
                      <div className="max-w-xs">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <X size={32} className="text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Erreur Caméra</h3>
                        <p className="text-sm text-bel-light/70 mb-6">{cameraError}</p>
                        <button
                          onClick={() => setIsCameraActive(false)}
                          className="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-bel-accent transition-colors"
                        >
                          Fermer
                        </button>
                      </div>
                    </div>
                  )}

                  {!landmarks && !cameraError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20">
                      <div className="text-center">
                        <RefreshCw className="animate-spin mx-auto mb-4 text-bel-accent" size={32} />
                        <p className="text-bel-light/50 font-mono text-sm uppercase tracking-widest">{t('vto.init_ar')}</p>
                      </div>
                    </div>
                  )}

                  {/* Overlay UI */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={() => setIsCameraActive(false)}
                      className="w-10 h-10 bg-black/50 border border-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-50">
                    <div className="w-64 h-24 border-2 border-dashed border-bel-accent/50 rounded-xl flex items-center justify-center">
                      <span className="text-bel-accent/50 text-xs font-mono">{t('vto.detect_zone')}</span>
                    </div>
                  </div>

                  {/* Flash Effect */}
                  {isFlashActive && (
                    <div className="absolute inset-0 bg-white z-50 animate-flash" />
                  )}
                  {/* Captured Preview Overlay */}
                  {capturedImage && (
                    <div className="absolute inset-0 z-40 bg-black flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in-95">
                      <img src={capturedImage} className="max-w-full max-h-[70%] rounded-2xl shadow-2xl mb-6 shadow-bel-accent/20" alt="Captured" />
                      <div className="flex flex-wrap justify-center gap-3">
                        <button
                          onClick={() => setCapturedImage(null)}
                          className="bg-white/10 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-full font-medium hover:bg-white/20 transition-all border border-white/10"
                        >
                          {t('vto.redo') || "Refaire"}
                        </button>

                        <button
                          onClick={() => { setPinnedImage(capturedImage); setCapturedImage(null); }}
                          className="bg-bel-accent text-bel-dark px-4 py-2 sm:px-6 sm:py-3 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2"
                        >
                          <ImageIcon size={18} />
                          {"Comparer"}
                        </button>

                        <button
                          onClick={handleDownload}
                          className="bg-white/10 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-full font-medium hover:bg-white/20 transition-all"
                        >
                          {t('vto.download') || "Télécharger"}
                        </button>
                      </div>
                    </div>
                  )}
                  {/* Main Action Button */}
                  {!isCalibrating && !capturedImage ? (
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
                      <button
                        onClick={handleCapture}
                        className="bg-bel-accent text-bel-dark px-8 py-4 rounded-full font-bold shadow-xl shadow-bel-accent/20 hover:scale-105 transition-all flex items-center gap-3 pointer-events-auto"
                      >
                        <Camera size={24} />
                        {t('vto.capture_btn')}
                      </button>
                    </div>
                  ) : null}

                  {/* Calibration Overlay */}
                  {isCalibrating && (
                    <div className="absolute inset-0 z-30 pointer-events-none">
                      <div className="absolute inset-0 bg-black/60 pointer-events-auto" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                        <div className="text-center mb-8 z-40">
                          <p className="text-bel-accent font-bold mb-2">CALIBRATION</p>
                          <p className="text-white text-sm max-w-xs">{t('vto.calib_instruction') || "Alignez votre carte de fidélité ou bancaire dans le rectangle."}</p>
                        </div>

                        <div
                          ref={overlayRef}
                          className="w-80 h-48 border-4 border-bel-accent rounded-xl relative z-40 flex items-center justify-center overflow-hidden bg-bel-accent/5"
                        >
                          {/* Card Silhouette Guide */}
                          <div className="absolute inset-4 border-2 border-dashed border-bel-accent/40 rounded-lg flex flex-col items-center justify-center">
                            <div className="w-12 h-8 border border-bel-accent/30 rounded-sm mb-2 self-start ml-4" /> {/* Chip placeholder */}
                            <div className="w-3/4 h-2 bg-bel-accent/20 rounded-full mb-2" />
                            <div className="w-1/2 h-2 bg-bel-accent/20 rounded-full" />
                          </div>
                          <div className="absolute inset-0 border-[20px] border-bel-accent/10 rounded-lg" />
                          <Ruler className="text-bel-accent opacity-50 relative z-10" size={48} />
                        </div>

                        <button
                          onClick={completeCalibration}
                          className="mt-8 bg-bel-accent text-bel-dark px-10 py-4 rounded-full font-bold shadow-xl z-40 pointer-events-auto hover:scale-105 transition-all"
                        >
                          {t('vto.calib_confirm')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Side-by-Side Pinned Image */}
            {pinnedImage && (
              <div className="w-full xl:w-1/2 max-w-5xl bg-black rounded-3xl overflow-hidden aspect-[4/3] sm:aspect-video relative shadow-2xl border border-bel-accent animate-in slide-in-from-right">
                <img src={pinnedImage} className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" alt="Pinned Try-on" />
                <div className="absolute top-4 left-4 bg-bel-accent text-bel-dark px-3 py-1 rounded-full text-xs font-bold uppercase">
                  Comparaison
                </div>
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => setPinnedImage(null)}
                    className="w-10 h-10 bg-black/50 border border-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Glasses Selection & Info */}
          <div className="w-full max-w-6xl mx-auto space-y-8">
            {/* New Horizontal Glasses Selection Carousel */}
            <div className="w-full bg-bel-light text-bel-dark rounded-3xl p-6 shadow-xl relative">
              <h3 className="font-serif text-xl font-bold mb-4">{t('vto.available_models') || "Modèles disponibles"}</h3>
              <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
                {glassesList.map((glasses) => (
                  <button
                    key={glasses.id}
                    onClick={() => setSelectedGlasses(glasses)}
                    className={`flex-shrink-0 w-48 flex flex-col items-center p-4 rounded-2xl border transition-all snap-start relative ${selectedGlasses?.id === glasses.id
                      ? 'border-bel-accent bg-bel-accent/5 shadow-md ring-2 ring-bel-accent/50 ring-offset-2 ring-offset-bel-light'
                      : 'border-bel-dark/10 hover:border-bel-accent/50 hover:bg-white'
                      }`}
                  >
                    <div className="w-full h-24 bg-white rounded-xl overflow-hidden mb-3 flex items-center justify-center p-2">
                      <img src={glasses.image} alt={glasses.name} className="w-full h-full object-cover mix-blend-multiply" />
                    </div>
                    <div className="text-center w-full">
                      <div className="text-[10px] text-bel-accent font-semibold uppercase tracking-wider mb-1 truncate">{glasses.brand}</div>
                      <h4 className="font-medium text-sm truncate w-full">{glasses.name}</h4>
                    </div>
                    {selectedGlasses?.id === glasses.id && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="text-bel-accent bg-white rounded-full" size={20} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Info Row (PD & Help) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* PD Measurement Section */}
              <div className="bg-bel-light text-bel-dark rounded-3xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-xl font-bold flex items-center gap-2">
                    <Ruler size={20} className="text-bel-accent" />
                    {t('vto.measure_pd')}
                  </h3>
                  <button
                    onClick={() => setShowPdInfo(!showPdInfo)}
                    className="text-bel-dark/40 hover:text-bel-accent transition-colors"
                  >
                    <Info size={18} />
                  </button>
                </div>

                {showPdInfo && (
                  <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-xs mb-4 animate-in fade-in slide-in-from-top-2">
                    {t('vto.measure_info')}
                  </div>
                )}

                <div className="bg-bel-gray/50 p-6 rounded-2xl border border-dashed border-bel-dark/10 relative overflow-hidden">
                  {pd ? (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${isPdStable ? 'bg-green-100 text-green-700' : 'bg-bel-accent/20 text-bel-accent'
                          }`}>
                          {isPdStable ? <CheckCircle size={10} /> : <RefreshCw size={10} className="animate-spin" />}
                          {isPdStable ? t('vto.stable') : t('vto.stabilizing')}
                        </div>
                      </div>
                      <div className="text-4xl font-bold text-bel-accent mb-1">{pd} mm</div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-bel-dark/40">
                        {t('vto.ep')} {!calibrationScale && `(${t('vto.estimate')})`}
                      </div>
                      <button
                        onClick={() => setPd(null)}
                        className="mt-4 text-xs font-semibold text-bel-dark/60 hover:text-bel-dark underline"
                      >
                        {t('vto.redo')}
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm text-bel-dark/70 mb-4">
                        {t('vto.measure_instruction')}
                      </p>
                      <button
                        onClick={() => {
                          if (!isCameraActive) setIsCameraActive(true);
                          setTryOnMode('video');
                          startCalibration();
                        }}
                        className="bg-bel-dark text-white px-6 py-3 rounded-xl font-medium hover:bg-bel-accent hover:text-bel-dark transition-all w-full flex items-center justify-center gap-2"
                      >
                        <Ruler size={18} />
                        {t('vto.measure_btn')}
                      </button>
                    </div>
                  )}

                  {isMeasuring && !pd && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <div className="flex items-center gap-2 text-bel-dark font-medium">
                        <RefreshCw className="animate-spin" size={18} />
                        {t('vto.measuring')}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Help & Appointment */}
              <div className="bg-bel-light text-bel-dark rounded-3xl p-6 shadow-xl flex flex-col justify-center">
                <h3 className="font-serif text-xl font-bold mb-2">{t('vto.need_help') || "Besoin de conseils ?"}</h3>
                <p className="text-sm text-bel-dark/70 mb-6">
                  {t('vto.help_desc') || "Prenez rendez-vous en magasin pour un essai physique."}
                </p>
                <button className="w-full border-2 border-bel-dark text-bel-dark py-4 rounded-xl font-bold hover:bg-bel-dark hover:text-white transition-colors">
                  {t('vto.book_appointment') || "Prendre Rendez-vous"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
