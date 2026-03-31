'use client'

import { BBox, TerrainParams } from '@/types/terrain'

type ConfigPanelProps = {
    params: TerrainParams
    onParamsChange: (updated: Partial<TerrainParams>) => void
    onGenerate: () => void
    isGenerating: boolean
    onBboxChange: (bbox: BBox) => void
}

export default function ConfigPanel({
    params,
    onParamsChange,
    onGenerate,
    isGenerating,
    onBboxChange
}: ConfigPanelProps) {

    // When print width changes, if aspect ratio is locked
    // recalculate depth to maintain the same proportions
    function handleWidthChange(width: number) {
        if (params.aspectRatioLocked) {
            const ratio = params.printDepth / params.printWidth
            onParamsChange({
                printWidth: width,
                printDepth: Math.round(width * ratio)
            })
        } else {
            onParamsChange({ printWidth: width })
        }
    }

    // Same idea but for depth
    function handleDepthChange(depth: number) {
        if (params.aspectRatioLocked) {
            const ratio = params.printWidth / params.printDepth
            onParamsChange({
                printDepth: depth,
                printWidth: Math.round(depth * ratio)
            })
        } else {
            onParamsChange({ printDepth: depth })
        }
    }

    return (
        // flex flex-col lets us stack sections vertically
        // overflow-y-auto gives the panel its own scroll if content is too tall
        <div className="flex flex-col flex-1 overflow-y-auto">

            {/* ── Sliders ── */}
            <div className="flex flex-col gap-5 p-4 border-b border-gray-100">

                <p className="text-xs text-gray-400 uppercase tracking-widest">Vertical</p>

                {/* Z-scale slider */}
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-baseline">
                        <label className="text-sm text-gray-700">Z-scale</label>
                        {/* toFixed(1) formats the number to 1 decimal place e.g. 2.0 */}
                        <span className="text-sm text-gray-400 tabular-nums">{params.zScale.toFixed(1)}×</span>
                    </div>
                    <input
                        type="range"
                        min={0.5}
                        max={5}
                        step={0.5}
                        value={params.zScale}
                        // e.target.value is always a string from HTML inputs
                        // parseFloat converts it back to a number
                        onChange={e => onParamsChange({ zScale: parseFloat(e.target.value) })}
                        className="w-full accent-green-800"
                    />
                </div>

                {/* Base thickness slider */}
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-baseline">
                        <label className="text-sm text-gray-700">Base thickness</label>
                        <span className="text-sm text-gray-400 tabular-nums">{params.baseThickness} mm</span>
                    </div>
                    <input
                        type="range"
                        min={1}
                        max={10}
                        step={1}
                        value={params.baseThickness}
                        onChange={e => onParamsChange({ baseThickness: parseInt(e.target.value) })}
                        className="w-full accent-green-800"
                    />
                </div>
            </div>

            {/* ── Print dimensions ── */}
            <div className="flex flex-col gap-3 p-4 border-b border-gray-100">

                <p className="text-xs text-gray-400 uppercase tracking-widest">Print dimensions</p>

                {/* Three column grid: width input, lock button, depth input */}
                <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center">

                    <div className="flex flex-col gap-1 items-center">
                        <span className="text-xs text-gray-400">width</span>
                        <input
                            type="number"
                            min={50}
                            max={300}
                            value={params.printWidth}
                            onChange={e => handleWidthChange(parseInt(e.target.value))}
                            className="w-full text-center text-sm border border-gray-200 rounded-md py-1.5 px-2"
                        />
                    </div>

                    {/* Lock button — toggles aspect ratio locking */}
                    <button
                        onClick={() => onParamsChange({ aspectRatioLocked: !params.aspectRatioLocked })}
                        className="p-1.5 border border-gray-200 rounded-md hover:bg-gray-50"
                        title={params.aspectRatioLocked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
                    >
                        {params.aspectRatioLocked ? (
                            // Locked padlock icon
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <rect x="2" y="5" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
                                <path d="M4 5V3.5a2 2 0 014 0V5" stroke="currentColor" strokeWidth="1.2" />
                            </svg>
                        ) : (
                            // Unlocked padlock icon
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <rect x="2" y="5" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
                                <path d="M4 5V3.5a2 2 0 014 0V5" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 1" />
                            </svg>
                        )}
                    </button>

                    <div className="flex flex-col gap-1 items-center">
                        <span className="text-xs text-gray-400">depth</span>
                        <input
                            type="number"
                            min={50}
                            max={300}
                            value={params.printDepth}
                            onChange={e => handleDepthChange(parseInt(e.target.value))}
                            className="w-full text-center text-sm border border-gray-200 rounded-md py-1.5 px-2"
                        />
                    </div>
                </div>

                <p className="text-xs text-gray-400 text-center">mm</p>
            </div>

            {/* ── Mesh resolution ── */}
            <div className="flex flex-col gap-3 p-4 border-b border-gray-100">

                <p className="text-xs text-gray-400 uppercase tracking-widest">Export</p>

                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-baseline">
                        <label className="text-sm text-gray-700">Mesh resolution</label>
                        <span className="text-sm text-gray-400 tabular-nums">{params.resolution} pts</span>
                    </div>
                    <input
                        type="range"
                        min={50}
                        max={400}
                        step={50}
                        value={params.resolution}
                        onChange={e => onParamsChange({ resolution: parseInt(e.target.value) })}
                        className="w-full accent-green-800"
                    />
                </div>
            </div>

            {/* ── Presets ── */}
            <div className="flex flex-col gap-3 p-4 border-b border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-widest">Presets</p>
                <div className="flex flex-wrap gap-2">
                    {[
                        { name: 'Grand Canyon', bbox: { west: -112.2, east: -111.8, south: 36.0, north: 36.3 } },
                        { name: 'Matterhorn', bbox: { west: 7.6, east: 7.8, south: 45.9, north: 46.1 } },
                        { name: 'Kilauea', bbox: { west: -155.3, east: -155.1, south: 19.3, north: 19.5 } },
                        { name: 'Crater Lake', bbox: { west: -122.2, east: -121.9, south: 42.8, north: 43.0 } },
                        { name: 'Fuji', bbox: { west: 138.6, east: 138.9, south: 35.2, north: 35.5 } },
                    ].map(preset => (
                        <button
                            key={preset.name}
                            // onParamsChange only updates params, we need a separate
                            // prop to update bbox — we'll wire this up next
                            onClick={() => onBboxChange(preset.bbox)}
                            className="text-xs px-2.5 py-1 border border-gray-200 rounded-md hover:bg-gray-50 text-gray-600"
                        >
                            {preset.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Generate button + progress ── */}
            <div className="p-4 flex flex-col gap-3 mt-auto">

                {/* Only show progress when generating */}
                {isGenerating && (
                    <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between">
                            {['Fetching', 'Processing', 'Meshing', 'Ready'].map((stage, i) => (
                                <span key={stage} className="text-xs text-gray-400">{stage}</span>
                            ))}
                        </div>
                        <div className="h-0.5 bg-gray-100 rounded-full">
                            <div className="h-0.5 bg-gray-800 rounded-full w-1/4 transition-all duration-500" />
                        </div>
                    </div>
                )}

                <button
                    onClick={onGenerate}
                    disabled={isGenerating}
                    className="w-full py-2.5 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isGenerating ? 'Generating...' : 'Generate STL'}
                </button>
            </div>
        </div>
    )
}