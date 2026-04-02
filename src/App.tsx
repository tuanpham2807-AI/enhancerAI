import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  Image as ImageIcon, 
  Sparkles, 
  Palette, 
  Maximize, 
  User, 
  Trash2, 
  Download, 
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Split
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { processImage, RestorationTask } from './services/gemini';

interface ImageState {
  original: string | null;
  processed: string | null;
  loading: boolean;
  error: string | null;
  task: RestorationTask | null;
}

export default function App() {
  const [state, setState] = useState<ImageState>({
    original: null,
    processed: null,
    loading: false,
    error: null,
    task: null,
  });

  const [sliderPosition, setSliderPosition] = useState(50);
  const isDraggingSlider = useRef(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setState({
          original: e.target?.result as string,
          processed: null,
          loading: false,
          error: null,
          task: null,
        });
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    multiple: false,
  } as any);

  const handleRestoration = async (task: RestorationTask) => {
    if (!state.original) return;

    setState(prev => ({ ...prev, loading: true, error: null, task }));

    try {
      const result = await processImage(state.original, task);
      setState(prev => ({ ...prev, processed: result, loading: false }));
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: err instanceof Error ? err.message : 'An error occurred during processing' 
      }));
    }
  };

  const handleDownload = () => {
    if (!state.processed) return;
    const link = document.createElement('a');
    link.href = state.processed;
    link.download = `restored-photo-${Date.now()}.png`;
    link.click();
  };

  const reset = () => {
    setState({
      original: null,
      processed: null,
      loading: false,
      error: null,
      task: null,
    });
  };

  const handleSliderMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDraggingSlider.current) return;
    
    const container = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const position = ((clientX - container.left) / container.width) * 100;
    setSliderPosition(Math.min(Math.max(position, 0), 100));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">Restorer<span className="text-blue-600">AI</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#" className="hover:text-blue-600 transition-colors">How it works</a>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
              <CheckCircle2 size={12} />
              Unlimited
            </div>
            <a href="#" className="hover:text-blue-600 transition-colors">API</a>
          </nav>
          <button className="bg-slate-900 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-slate-800 transition-colors">
            Get Started
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 md:py-12">
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Left Column: Controls */}
          <div className="lg:col-span-4 space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Restore your memories</h1>
              <p className="text-slate-500">Professional AI photo restoration in seconds. Unlimited colorization, fixes, and upscaling for all your photos.</p>
            </div>

            {!state.original ? (
              <div 
                {...getRootProps()} 
                className={cn(
                  "border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 text-center min-h-[300px]",
                  isDragActive ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-blue-400 hover:bg-slate-50"
                )}
              >
                <input {...getInputProps()} />
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Upload className="text-blue-600 w-8 h-8" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Click or drag photo here</p>
                  <p className="text-sm text-slate-500 mt-1">Supports JPG, PNG, WEBP (Max 10MB)</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">Restoration Tools</h3>
                    <button 
                      onClick={reset}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                      title="Remove image"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <ToolButton 
                      icon={<Sparkles size={18} className="text-white" />}
                      label="Full Pro Restoration"
                      description="All features at once (Color + Fix + Upscale)"
                      onClick={() => handleRestoration('full_pro')}
                      active={state.task === 'full_pro'}
                      loading={state.loading && state.task === 'full_pro'}
                      className="bg-linear-to-r from-indigo-600 to-blue-600 border-none text-white hover:from-indigo-700 hover:to-blue-700 shadow-md"
                      iconBg="bg-white/20"
                      labelColor="text-white"
                      descColor="text-blue-100"
                      chevronColor="text-white/50"
                    />
                    <div className="h-px bg-slate-100 my-2" />
                    <ToolButton 
                      icon={<Sparkles size={18} />}
                      label="Basic Restoration"
                      description="Fix cracks, noise & sharpen"
                      onClick={() => handleRestoration('restore')}
                      active={state.task === 'restore'}
                      loading={state.loading && state.task === 'restore'}
                    />
                    <ToolButton 
                      icon={<Palette size={18} />}
                      label="Colorize"
                      description="B&W to vibrant color"
                      onClick={() => handleRestoration('colorize')}
                      active={state.task === 'colorize'}
                      loading={state.loading && state.task === 'colorize'}
                    />
                    <ToolButton 
                      icon={<Maximize size={18} />}
                      label="Upscale 2x"
                      description="Enhance resolution & detail"
                      onClick={() => handleRestoration('upscale')}
                      active={state.task === 'upscale'}
                      loading={state.loading && state.task === 'upscale'}
                    />
                    <ToolButton 
                      icon={<User size={18} />}
                      label="Portrait Outpaint"
                      description="Extend body & studio BG"
                      onClick={() => handleRestoration('outpaint')}
                      active={state.task === 'outpaint'}
                      loading={state.loading && state.task === 'outpaint'}
                    />
                    <ToolButton 
                      icon={<Trash2 size={18} />}
                      label="Remove Background"
                      description="Save as transparent PNG"
                      onClick={() => handleRestoration('remove_bg')}
                      active={state.task === 'remove_bg'}
                      loading={state.loading && state.task === 'remove_bg'}
                    />
                  </div>
                </div>

                {state.processed && (
                  <button 
                    onClick={handleDownload}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                  >
                    <Download size={20} />
                    Download PNG Result
                  </button>
                )}
              </div>
            )}

            {state.error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3 text-red-700 text-sm">
                <AlertCircle className="shrink-0" size={18} />
                <p>{state.error}</p>
              </div>
            )}
          </div>

          {/* Right Column: Preview */}
          <div className="lg:col-span-8">
            <div className="bg-slate-200 rounded-3xl overflow-hidden aspect-square md:aspect-video relative group border border-slate-300 shadow-inner">
              {!state.original ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <ImageIcon size={48} strokeWidth={1} />
                  <p className="font-medium">No image selected</p>
                </div>
              ) : (
                <div 
                  className="absolute inset-0 cursor-col-resize select-none"
                  onMouseMove={handleSliderMove}
                  onTouchMove={handleSliderMove}
                  onMouseDown={() => isDraggingSlider.current = true}
                  onMouseUp={() => isDraggingSlider.current = false}
                  onMouseLeave={() => isDraggingSlider.current = false}
                  onTouchStart={() => isDraggingSlider.current = true}
                  onTouchEnd={() => isDraggingSlider.current = false}
                >
                  {/* Original Image (Background) */}
                  <img 
                    src={state.original} 
                    alt="Original" 
                    className="absolute inset-0 w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />

                  {/* Processed Image (Foreground) */}
                  {state.processed && (
                    <div 
                      className="absolute inset-0 overflow-hidden"
                      style={{ width: `${sliderPosition}%` }}
                    >
                      <img 
                        src={state.processed} 
                        alt="Processed" 
                        className="absolute inset-0 w-full h-full object-contain"
                        style={{ width: `${100 / (sliderPosition / 100)}%` }}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  {/* Loading Overlay */}
                  <AnimatePresence>
                    {state.loading && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-4 z-20"
                      >
                        <RefreshCw className="w-10 h-10 animate-spin text-blue-400" />
                        <div className="text-center">
                          <p className="font-bold text-lg">AI is working its magic...</p>
                          <p className="text-sm text-white/70">This may take up to 30 seconds</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Slider Control */}
                  {state.processed && !state.loading && (
                    <>
                      <div 
                        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg z-10"
                        style={{ left: `${sliderPosition}%` }}
                      >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-xl flex items-center justify-center border border-slate-200">
                          <Split size={16} className="text-slate-600" />
                        </div>
                      </div>
                      <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium z-10">
                        Before
                      </div>
                      <div className="absolute bottom-4 right-4 bg-blue-600/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium z-10">
                        After
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Features Info */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <FeatureCard 
                icon={<CheckCircle2 className="text-green-500" size={20} />}
                title="AI Face Sharpening"
                description="Automatically detects and enhances facial features for crystal clear portraits."
              />
              <FeatureCard 
                icon={<CheckCircle2 className="text-green-500" size={20} />}
                title="Deep Colorization"
                description="Uses neural networks trained on millions of photos for accurate color prediction."
              />
              <FeatureCard 
                icon={<CheckCircle2 className="text-green-500" size={20} />}
                title="Smart Outpainting"
                description="Intelligently fills in missing parts of the photo to create a full composition."
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>© 2026 RestorerAI. Powered by Google Gemini. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function ToolButton({ 
  icon, 
  label, 
  description, 
  onClick, 
  active, 
  loading,
  className,
  iconBg,
  labelColor,
  descColor,
  chevronColor
}: { 
  icon: React.ReactNode, 
  label: string, 
  description: string, 
  onClick: () => void,
  active?: boolean,
  loading?: boolean,
  className?: string,
  iconBg?: string,
  labelColor?: string,
  descColor?: string,
  chevronColor?: string
}) {
  return (
    <button 
      onClick={onClick}
      disabled={loading}
      className={cn(
        "w-full flex items-center gap-4 p-3 rounded-xl border transition-all text-left group",
        active 
          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/20" 
          : "border-slate-100 hover:border-blue-200 hover:bg-slate-50",
        loading && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
        active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600",
        iconBg
      )}>
        {loading ? <RefreshCw size={18} className="animate-spin" /> : icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("font-semibold text-sm truncate", labelColor || "text-slate-900")}>{label}</p>
        <p className={cn("text-xs truncate", descColor || "text-slate-500")}>{description}</p>
      </div>
      <ChevronRight size={16} className={cn("transition-transform", active && "translate-x-1", chevronColor || "text-slate-300", active && !chevronColor && "text-blue-500")} />
    </button>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
      <div className="flex items-center gap-3">
        {icon}
        <h4 className="font-bold text-slate-900 text-sm">{title}</h4>
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}
