import React, { useState } from 'react';
import { UploadCloud, Camera, AlertCircle, RefreshCw, Cpu } from 'lucide-react';

export default function JunctionIngestionDeck({ onAnalysisComplete, onReset }) {
  const directions = ['north', 'south', 'east', 'west'];
  
  const [files, setFiles] = useState({
    north: null,
    south: null,
    east: null,
    west: null
  });

  const [previews, setPreviews] = useState({
    north: null,
    south: null,
    east: null,
    west: null
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleRemoveImages = () => {
    // Revoke object URLs
    Object.values(previews).forEach(url => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    });

    setFiles({
      north: null,
      south: null,
      east: null,
      west: null
    });

    setPreviews({
      north: null,
      south: null,
      east: null,
      west: null
    });

    setErrorMsg(null);

    if (onReset) {
      onReset();
    }
  };

  const handleFileChange = (dir, file) => {
    if (!file) return;
    setFiles(prev => ({ ...prev, [dir]: file }));
    setPreviews(prev => ({ ...prev, [dir]: URL.createObjectURL(file) }));
    setErrorMsg(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, dir) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileChange(dir, file);
    }
  };

  const handleAnalyze = async () => {
    // Verify that at least one file is uploaded
    const hasFiles = Object.values(files).some(f => f !== null);
    if (!hasFiles) {
      setErrorMsg('Please upload at least one camera feed image before analyzing.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);

    const token = localStorage.getItem('token');
    const formData = new FormData();
    directions.forEach(dir => {
      if (files[dir]) {
        formData.append(dir, files[dir]);
      }
    });

    try {
      const res = await fetch('/api/traffic/analyze-junction', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const result = await res.json();
      if (res.ok && result.status === 'success') {
        if (onAnalysisComplete) {
          onAnalysisComplete(result);
        }
      } else {
        setErrorMsg(result.message || 'Junction analysis failed.');
      }
    } catch (err) {
      console.error('Error analyzing junction:', err);
      setErrorMsg('Network error communicating with the traffic server.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <section className="bg-[#0A192F]/60 backdrop-blur-md border border-[#00B4D8]/20 p-6 rounded-2xl font-mono text-xs space-y-5">
      <div className="flex items-center justify-between border-b border-[#00B4D8]/20 pb-3">
        <span className="text-cyan-400 font-bold flex items-center gap-1.5 uppercase">
          <Cpu className="h-4 w-4 text-[#00B4D8]" />
          4-Way Camera Feed Upload Deck
        </span>
        <span className="bg-[#00B4D8]/10 text-[#00B4D8] border border-[#00B4D8]/30 px-2 py-0.5 rounded text-[8px] font-bold">
          JUNCTION_INGEST
        </span>
      </div>

      <p className="text-[10px] text-slate-400 leading-relaxed">
        Upload live intersection approach frames. The YOLOv8 computer vision model will evaluate vehicle queue length and update the active WebGL junction timers automatically.
      </p>

      {/* 4 Dropzones Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {directions.map((dir) => {
          const preview = previews[dir];
          const hasFile = files[dir] !== null;

          return (
            <div
              key={dir}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, dir)}
              className={`relative h-32 rounded-xl border border-dashed flex flex-col items-center justify-center p-2 text-center transition-all bg-[#03045E]/40 ${
                hasFile 
                  ? 'border-[#00B4D8]/60 bg-[#0077B6]/10' 
                  : 'border-[#00B4D8]/20 hover:border-[#00B4D8]/50 hover:bg-[#03045E]/70'
              }`}
            >
              {preview ? (
                <div className="w-full h-full relative group rounded-lg overflow-hidden">
                  <img
                    src={preview}
                    alt={`${dir} feed`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-[#020C24]/80 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer">
                    <UploadCloud className="h-4 w-4 text-cyan-400" />
                    <span className="text-[8px] text-slate-300">Replace Feed</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(dir, e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {/* Approach Badge */}
                  <span className="absolute bottom-1 left-1 bg-[#020C24]/90 border border-[#00B4D8]/30 px-1.5 py-0.5 rounded text-[8px] font-bold text-cyan-300 uppercase">
                    {dir}
                  </span>
                </div>
              ) : (
                <label className="w-full h-full flex flex-col items-center justify-center gap-2 cursor-pointer">
                  <Camera className="h-5 w-5 text-slate-500 hover:text-cyan-400 transition-colors" />
                  <div>
                    <span className="text-[9px] font-bold text-[#CAF0F8] block uppercase">
                      {dir} APPROACH
                    </span>
                    <span className="text-[7px] text-slate-400">
                      Drop or Click
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(dir, e.target.files[0])}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          );
        })}
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/30 text-red-200 text-[10px] flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 w-full">
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-center tracking-wider text-[10px] uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
            isAnalyzing
              ? 'bg-[#0077B6]/30 border border-[#00B4D8]/20 text-[#00B4D8] cursor-not-allowed'
              : 'bg-gradient-to-r from-[#0077B6] to-[#00B4D8] border border-[#00B4D8]/50 text-[#CAF0F8] hover:shadow-[0_0_15px_rgba(0,180,216,0.35)] shadow-md'
          }`}
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>ANALYZING CAMERA FEEDS...</span>
            </>
          ) : (
            <>
              <UploadCloud className="h-3.5 w-3.5" />
              <span>ANALYZE JUNCTION & ADJUST 3D TIMERS</span>
            </>
          )}
        </button>

        {Object.values(files).some(f => f !== null) && (
          <button
            onClick={handleRemoveImages}
            disabled={isAnalyzing}
            className="py-3 px-6 rounded-xl font-bold text-center tracking-wider text-[10px] uppercase flex items-center justify-center gap-2 border border-red-500/40 bg-red-950/20 text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-all cursor-pointer shadow-md disabled:opacity-50"
          >
            REMOVE IMAGES
          </button>
        )}
      </div>
    </section>
  );
}
