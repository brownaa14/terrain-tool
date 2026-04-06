'use client'

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { BBox } from '@/types/terrain';

type MapPanelProps = {
    onBboxChange: (bbox: BBox) => void
    bbox: BBox | null
    presetBbox: BBox | null
    isDrawMode: boolean
    onDrawModeChange: (val: boolean) => void
    onSizeError: (message: string) => void
}

export default function MapPanel({
    onBboxChange,
    bbox,
    presetBbox,
    isDrawMode,
    onDrawModeChange,
    onSizeError
}: MapPanelProps) {
    const mapContainer = useRef<HTMLDivElement>(null)
    const map = useRef<maplibregl.Map | null>(null)
    const isDrawModeRef = useRef(false)
    const isDrawing = useRef(false)
    const startPoint = useRef<[number, number] | null>(null)

    // Sync isDrawMode prop into ref so map event handlers can read it
    useEffect(() => {
        isDrawModeRef.current = isDrawMode
    }, [isDrawMode])

    // Update the rectangle when bbox changes
    useEffect(() => {
        if (!map.current) return
        const source = map.current.getSource('bbox') as maplibregl.GeoJSONSource
        if (!source) return

        if (!bbox) {
            source.setData({
                type: 'Feature',
                geometry: { type: 'Polygon', coordinates: [[]] },
                properties: {}
            })
            return
        }

        const coords = [
            [bbox.west, bbox.north],
            [bbox.east, bbox.north],
            [bbox.east, bbox.south],
            [bbox.west, bbox.south],
            [bbox.west, bbox.north],
        ]

        source.setData({
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [coords] },
            properties: {}
        })
    }, [bbox])

    // Only zoom when a preset is selected
    useEffect(() => {
        if (!map.current || !presetBbox) return
        map.current.fitBounds(
            [[presetBbox.west, presetBbox.south], [presetBbox.east, presetBbox.north]],
            { padding: 80, duration: 1000 }
        )
    }, [presetBbox])

    // Initialise the map once
    useEffect(() => {
        if (!mapContainer.current || map.current) return

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: 'https://tiles.openfreemap.org/styles/bright',
            center: [0, 20],
            zoom: 2,
        })

        map.current.on('load', () => {
            map.current!.addSource('bbox', {
                type: 'geojson',
                data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[]] }, properties: {} }
            })

            map.current!.addLayer({
                id: 'bbox-fill',
                type: 'fill',
                source: 'bbox',
                paint: { 'fill-color': '#2d6a4f', 'fill-opacity': 0.08 }
            })

            map.current!.addLayer({
                id: 'bbox-outline',
                type: 'line',
                source: 'bbox',
                paint: { 'line-color': '#2d6a4f', 'line-width': 1.5 }
            })

            // Helper to clear the rectangle
            function clearBboxSource() {
                const source = map.current!.getSource('bbox') as maplibregl.GeoJSONSource
                if (!source) return
                source.setData({
                    type: 'Feature',
                    geometry: { type: 'Polygon', coordinates: [[]] },
                    properties: {}
                })
            }

            map.current!.on('mousedown', (e) => {
                if (!isDrawModeRef.current) return
                isDrawing.current = true
                startPoint.current = [e.lngLat.lng, e.lngLat.lat]
                map.current!.dragPan.disable()
            })

            map.current!.on('mousemove', (e) => {
                if (!isDrawing.current || !startPoint.current) return

                const [startLng, startLat] = startPoint.current
                const coords = [
                    [startLng, startLat],
                    [e.lngLat.lng, startLat],
                    [e.lngLat.lng, e.lngLat.lat],
                    [startLng, e.lngLat.lat],
                    [startLng, startLat],
                ]

                const source = map.current!.getSource('bbox') as maplibregl.GeoJSONSource
                source.setData({
                    type: 'Feature',
                    geometry: { type: 'Polygon', coordinates: [coords] },
                    properties: {}
                })
            })

            map.current!.on('mouseup', (e) => {
                if (!isDrawing.current || !startPoint.current) return

                isDrawing.current = false
                map.current!.dragPan.enable()

                const [startLng, startLat] = startPoint.current
                const newBbox = {
                    west: Math.min(startLng, e.lngLat.lng),
                    east: Math.max(startLng, e.lngLat.lng),
                    south: Math.min(startLat, e.lngLat.lat),
                    north: Math.max(startLat, e.lngLat.lat),
                }

                const width = newBbox.east - newBbox.west
                const height = newBbox.north - newBbox.south

                if (width > 2 || height > 2) {
                    onSizeError('Region too large — please draw an area smaller than 2° × 2°')
                    clearBboxSource()
                } else {
                    onBboxChange(newBbox)  // ← was missing before
                }

                startPoint.current = null
                onDrawModeChange(false)
            })
        })

        return () => {
            map.current?.remove()
            map.current = null
        }
    }, [])

    return (
        <div className="w-full h-full relative">
            <div
                ref={mapContainer}
                className="w-full h-full"
                style={{ cursor: isDrawMode ? 'crosshair' : 'grab' }}
            />
            <button
                onClick={() => onDrawModeChange(!isDrawMode)}
                className={`absolute top-3 left-3 z-10 flex items-center gap-2 text-sm px-3 py-1.5 rounded-md border ${isDrawMode
                        ? 'bg-green-800 text-white border-green-900'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
            >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <rect x="1" y="1" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.2" />
                </svg>
                {isDrawMode ? 'Drawing...' : 'Draw region'}
            </button>
        </div>
    )
}