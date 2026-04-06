'use client';

import { useState } from 'react';
import { BBox, TerrainParams, RegionInfo } from '@/types/terrain';
import MapPanel from './components/MapPanel';
import ConfigPanel from './components/ConfigPanel';
import PreviewCanvas from './components/PreviewCanvas';

const DEFAULT_PARAMS: TerrainParams = {
  zScale: 2.0,
  baseThickness: 3,
  resolution: 200,
  printWidth: 150,
  printDepth: 112,
  aspectRatioLocked: true,
};

export default function TerrainPage() {
  const [bbox, setBbox] = useState<BBox | null>(null);
  const [regionInfo, setRegionInfo] = useState<RegionInfo | null>(null);
  const [params, setParams] = useState<TerrainParams>(DEFAULT_PARAMS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [presetBbox, setPresetBbox] = useState<BBox | null>(null);

  function handleParamsChange(updated: Partial<TerrainParams>) {
    setParams(prev => ({ ...prev, ...updated }));
  };

  //toast notifications
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  async function handleGenerate() {
    if (!bbox) return;
    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bbox,
          zScale: params.zScale,
          baseThickness: params.baseThickness,
          resolution: params.resolution,
          printWidth: params.printWidth,
          printDepth: params.printDepth,
        })
      });

      if (!response.ok) throw new Error('Generation failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'terrain.stl';
      a.click();
      URL.revokeObjectURL(url);

      showToast('STL downloaded successfully', 'success');

    } catch (err) {
      console.error('STL generation failed:', err);
      showToast('Generation failed, try a smaller region or lower resolution', 'error');
    } finally {
      setIsGenerating(false);
    };
  };
  return (
    <div className='flex flex-col h-screen overflow-hidden bg-white'>
      <header className='h-12 flex items-center px-4 gap-3 border-b border-gray-400 shrink-0'>

        <span className='text-sm font-medium'>Topo Mesh</span>

        <span className='ml-auto text-xs text-gray-400'>
          {bbox ? "adjust your region or configure below" : "Draw a region on the map to begin"}
        </span>
      </header>

      <div className='flex flex-1 overflow-hidden'>
        <main className='flex-1 relative'>
          <MapPanel
            onBboxChange={setBbox}
            bbox={bbox}
            presetBbox={presetBbox}
            isDrawMode={isDrawMode}
            onDrawModeChange={setIsDrawMode}
            onSizeError={(msg) => showToast(msg, 'error')}
          />
        </main>

        <aside className='w-80 flex flex-col border-1 border-gray-400 overflow-hidden'>
          <PreviewCanvas bbox={bbox} params={params} />
          <ConfigPanel
            params={params}
            onParamsChange={handleParamsChange}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            onBboxChange={setBbox}
            onPresetSelect={setPresetBbox}
          />
        </aside>

        {toast && (
          <div
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-md text-sm text-white shadow-lg transition-all ${toast.type === 'error' ? 'bg-red-600' : 'bg-gray-900'
              }`}
          >
          </div>
        )}
      </div>
    </div >
  );
};
