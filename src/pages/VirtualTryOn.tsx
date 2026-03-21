import { useState, useEffect, useRef } from 'react';
import { Camera, X, RefreshCw, CheckCircle, Sparkles, Ruler, Info, Share2, MessageCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import ARScene from '../components/VTO/ARScene';
// Removing direct imports of MediaPipe as they move to the Worker

export default function VirtualTryOn() {
  const [isCameraActive, setIsCameraActive] = useState(false);
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
  const [performanceMode, setPerformanceMode] = useState<'high' | 'eco'>('high');
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const selectedGlassesRef = useRef<any>(null); // Ref to avoid stale closures
  const landmarksRef = useRef<any>(null); // New Ref for high-performance data flow
  const workerRef = useRef<Worker | null>(null);
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const isMeasuringRef = useRef(false);
  const calibrationScaleRef = useRef<number | null>(null);
  const pdHistoryRef = useRef<number[]>([]);
  const { t } = useLanguage();

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    selectedGlassesRef.current = selectedGlasses;
    isMeasuringRef.current = isMeasuring;
    calibrationScaleRef.current = calibrationScale;
  }, [selectedGlasses, isMeasuring, calibrationScale]);

  useEffect(() => {
    fetchGlasses();
  }, []);

  useEffect(() => {
    if (!isCameraActive) {
      workerRef.current?.terminate();
      workerRef.current = null;
      setIsWorkerReady(false);
      return;
    }

    const worker = new Worker(new URL('../workers/vtoWorker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = (event) => {
      const { type, landmarks: detectedLandmarks } = event.data;
      if (type === 'READY') {
        setIsWorkerReady(true);
      } else if (type === 'RESULTS') {
        landmarksRef.current = detectedLandmarks;
        if (!landmarks) setLandmarks(detectedLandmarks);
        handlePdUpdate(detectedLandmarks);
      }
    };

    worker.postMessage({
      type: 'INIT',
      data: { cdnPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh' }
    });

    let frameId: number;
    const processFrame = async () => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        try {
          // In eco mode, we skip every other frame for AI processing
          if (performanceMode === 'eco' && frameId % 2 === 0) {
            frameId = requestAnimationFrame(processFrame);
            return;
          }

          const imageBitmap = await createImageBitmap(videoRef.current);
          worker.postMessage({
            type: 'PROCESS',
            data: { image: imageBitmap }
          }, [imageBitmap]);
        } catch (e) { }
      }
      frameId = requestAnimationFrame(processFrame);
    };

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: performanceMode === 'high' ? 1920 : 1280 },
            height: { ideal: performanceMode === 'high' ? 1080 : 720 },
            facingMode: 'user'
          }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            processFrame();
          };
        }
      } catch (err) { }
    };

    startCamera();

    return () => {
      cancelAnimationFrame(frameId);
      worker.terminate();
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, [isCameraActive, isWorkerReady, performanceMode]);

  const handlePdUpdate = (face: any) => {
    let currentPd = 0;

    if (calibrationScaleRef.current && face[468] && face[473]) {
      const leftIris = face[468];
      const rightIris = face[473];
      const normalizedDistance = Math.sqrt(
        Math.pow(rightIris.x - leftIris.x, 2) + Math.pow(rightIris.y - leftIris.y, 2)
      );
      currentPd = Math.round(normalizedDistance * calibrationScaleRef.current);
    } else if (isMeasuringRef.current && !calibrationScaleRef.current) {
      const p1 = face[33];
      const p2 = face[263];
      const distanceInPixels = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
      currentPd = Math.round(distanceInPixels * 380);
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
    const { data } = await supabase.from('products').select('*').limit(3);
    if (data && data.length > 0) {
      const formattedData = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        image: p.image_url,
        modelUrl: p.model_3d_url,
      }));
      setGlassesList(formattedData);
      setSelectedGlasses(formattedData[0]);
    }
  }

  const handleCapture = () => {
    if (!videoRef.current) return;

    setIsFlashActive(true);
    setTimeout(() => setIsFlashActive(false), 150);

    const video = videoRef.current;
    const canvas3d = document.querySelector('canvas');
    if (!canvas3d) return;

    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = video.videoWidth;
    captureCanvas.height = video.videoHeight;
    const ctx = captureCanvas.getContext('2d');

    if (ctx) {
      // 1. Draw Video (Mirrored to match UI)
      ctx.translate(captureCanvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      // 2. Draw 3D Overlay
      // We need to scale the 3D canvas to match the original video resolution
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

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Camera Viewfinder */}
          <div className="w-full lg:w-2/3 bg-black rounded-3xl overflow-hidden aspect-video relative shadow-2xl border border-bel-light/10">
            {!isCameraActive ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-bel-dark/50 backdrop-blur-sm">
                <div className="w-20 h-20 bg-bel-accent rounded-full flex items-center justify-center mb-6 shadow-lg shadow-bel-accent/30">
                  <Camera size={40} className="text-bel-dark" />
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-medium mb-4">{t('vto.allow_camera')}</h3>
                <p className="text-bel-light/70 mb-8 max-w-md">
                  {t('vto.camera_desc')}
                </p>
                <button
                  onClick={() => setIsCameraActive(true)}
                  className="bg-white text-bel-dark px-6 py-3 sm:px-8 sm:py-4 rounded-full font-medium hover:bg-bel-accent hover:text-bel-dark transition-colors"
                >
                  {t('vto.activate_camera')}
                </button>
              </div>
            ) : (
              <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
                {/* Real-time Video Feed */}
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                  playsInline
                />

                {/* 3D AR Overlay */}
                {!capturedImage && (
                  <ARScene
                    landmarksRef={landmarksRef}
                    videoElement={videoRef.current}
                    modelUrl={selectedGlasses?.modelUrl}
                    productId={selectedGlasses?.id}
                    productName={selectedGlasses?.name}
                    performanceMode={performanceMode}
                  />
                )}

                {!landmarks && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-20">
                    <div className="text-center">
                      <RefreshCw className="animate-spin mx-auto mb-4 text-bel-accent" size={32} />
                      <p className="text-bel-light/50 font-mono text-sm uppercase tracking-widest">{t('vto.init_ar')}</p>
                    </div>
                  </div>
                )}

                {/* Overlay UI */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={() => setPerformanceMode(prev => prev === 'high' ? 'eco' : 'high')}
                    className={`h-10 px-4 backdrop-blur-md rounded-full flex items-center gap-2 transition-all border ${performanceMode === 'high'
                      ? 'bg-bel-accent/20 border-bel-accent text-bel-accent'
                      : 'bg-black/50 border-white/20 text-white/50'
                      }`}
                    title={t('vto.performance')}
                  >
                    <RefreshCw size={16} className={performanceMode === 'high' ? 'animate-spin-slow' : ''} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {performanceMode === 'high' ? t('vto.high_fidelity') : t('vto.battery_saver')}
                    </span>
                  </button>
                  <button
                    onClick={() => setIsCameraActive(false)}
                    className="w-10 h-10 bg-black/50 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
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

                {/* Captured Preview */}
                {capturedImage && (
                  <div className="absolute inset-0 z-40 bg-black flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in-95">
                    <img src={capturedImage} className="max-w-full max-h-[70%] rounded-2xl shadow-2xl mb-6 shadow-bel-accent/20" alt="Captured" />
                    <div className="flex gap-3">
                      <button
                        onClick={() => setCapturedImage(null)}
                        className="bg-white/10 backdrop-blur-md text-white px-6 py-3 rounded-full font-medium hover:bg-white/20 transition-all border border-white/10"
                      >
                        {t('vto.redo')}
                      </button>
                      <button
                        onClick={handleDownload}
                        className="bg-white text-bel-dark px-6 py-3 rounded-full font-bold hover:bg-bel-light transition-all flex items-center gap-2"
                      >
                        <Share2 size={18} />
                        {t('vto.download')}
                      </button>
                      <button
                        onClick={handleShare}
                        className="bg-bel-accent text-bel-dark px-8 py-3 rounded-full font-bold hover:scale-105 transition-all flex items-center gap-2 shadow-lg shadow-bel-accent/20"
                      >
                        <MessageCircle size={18} />
                        {t('vto.share_whatsapp')}
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
                        className="w-80 h-48 border-4 border-bel-accent rounded-xl relative z-40 flex items-center justify-center overflow-hidden bg-bel-accent/5 backdrop-blur-[2px]"
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

          {/* Glasses Selection */}
          <div className="w-full lg:w-1/3 bg-bel-light text-bel-dark rounded-3xl p-8 shadow-xl">
            <h3 className="font-serif text-2xl font-bold mb-6">{t('vto.available_models')}</h3>

            <div className="space-y-4 mb-8">
              {glassesList.map((glasses) => (
                <button
                  key={glasses.id}
                  onClick={() => setSelectedGlasses(glasses)}
                  className={`w-full flex items-center p-4 rounded-2xl border transition-all ${selectedGlasses?.id === glasses.id
                    ? 'border-bel-accent bg-bel-accent/5 shadow-md'
                    : 'border-bel-dark/10 hover:border-bel-accent/50 hover:bg-white'
                    }`}
                >
                  <div className="w-20 h-20 bg-white rounded-xl overflow-hidden mr-4 flex-shrink-0 flex items-center justify-center p-2">
                    <img src={glasses.image} alt={glasses.name} className="w-full h-full object-cover mix-blend-multiply" />
                  </div>
                  <div className="text-left flex-grow">
                    <div className="text-xs text-bel-accent font-semibold uppercase tracking-wider mb-1">{glasses.brand}</div>
                    <h4 className="font-medium text-lg">{glasses.name}</h4>
                  </div>
                  {selectedGlasses?.id === glasses.id && (
                    <CheckCircle className="text-bel-accent ml-2" size={24} />
                  )}
                </button>
              ))}
            </div>

            {/* PD Measurement Section */}
            <div className="border-t border-bel-dark/10 pt-6 mt-6">
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
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex items-center gap-2 text-bel-dark font-medium">
                      <RefreshCw className="animate-spin" size={18} />
                      {t('vto.measuring')}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-bel-gray p-6 rounded-2xl mt-8">
              <h4 className="font-medium mb-2">{t('vto.need_help')}</h4>
              <p className="text-sm text-bel-dark/70 mb-4">
                {t('vto.help_desc')}
              </p>
              <button className="w-full border border-bel-dark text-bel-dark py-3 rounded-xl font-medium hover:bg-bel-dark hover:text-white transition-colors">
                {t('vto.book_appointment')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
