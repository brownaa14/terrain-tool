'use client'

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { BBox } from '@/types/terrain'

type MapPanelProps = {
    onBboxChange: (bbox: BBox) => void
    bbox: BBox | null
}

export default function MapPanel({ onBboxChange, bbox }: MapPanelProps) {
    const mapContainer = useRef<HTMLDivElement>(null)
    const map = useRef<maplibregl.Map | null>(null)

    const [isDrawMode, setIsDrawMode] = useState(false)
    const isDrawModeRef = useRef(false)

    const isDrawing = useRef(false)
    const startPoint = useRef<[number, number] | null>(null)

    useEffect(() => {
        isDrawModeRef.current = isDrawMode
    }, [isDrawMode])

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
            [bbox.west, bbox.north]
        ]

        source.setData({
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [coords] },
            properties: {}
        })

        map.current.fitBounds(
            [[bbox.west, bbox.south], [bbox.east, bbox.north]],
            { padding: 80, duration: 1000 }
        )
    })

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
                paint: {
                    'fill-color': '#2d6a4f',
                    'fill-opacity': 0.08
                }
            })

            map.current!.addLayer({
                id: 'bbox-outline',
                type: 'line',
                source: 'bbox',
                paint: {
                    'line-color': '#2d6a4f',
                    'line-width': 1.5
                }
            })


            // mousedown, mousemove, mouseup are all registered at the same level
            // never nest event listeners inside each other
            map.current!.on('mousedown', (e) => {
                if (!isDrawModeRef.current) return
                isDrawing.current = true
                startPoint.current = [e.lngLat.lng, e.lngLat.lat]
                map.current!.dragPan.disable()
            })

            map.current!.on('mousemove', (e) => {
                if (!isDrawing.current || !startPoint.current) return

                const [startLng, startLat] = startPoint.current
                const endLng = e.lngLat.lng
                const endLat = e.lngLat.lat

                const coords = [
                    [startLng, startLat],
                    [endLng, startLat],
                    [endLng, endLat],
                    [startLng, endLat],
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

                onBboxChange({
                    west: Math.min(startLng, e.lngLat.lng),
                    east: Math.max(startLng, e.lngLat.lng),
                    south: Math.min(startLat, e.lngLat.lat),
                    north: Math.max(startLat, e.lngLat.lat)
                })

                startPoint.current = null
                setIsDrawMode(false)
            })
        })

        return () => {
            map.current?.remove()
            map.current = null
        }
    }, [])

    return (
        <div className="w-full h-full relative">
            <div ref={mapContainer} className="w-full h-full" />

            <button
                onClick={() => setIsDrawMode(prev => !prev)}
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