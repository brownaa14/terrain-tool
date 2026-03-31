// app/api/dem/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { fetchElevationGrid } from '@/lib/dem'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const bbox = {
        west: parseFloat(searchParams.get('west') ?? '0'),
        south: parseFloat(searchParams.get('south') ?? '0'),
        east: parseFloat(searchParams.get('east') ?? '0'),
        north: parseFloat(searchParams.get('north') ?? '0'),
    }
    const resolution = Math.min(parseInt(searchParams.get('resolution') ?? '100'), 100)

    try {
        const data = await fetchElevationGrid(bbox, resolution)
        return NextResponse.json(data)
    } catch (err) {
        console.error('DEM fetch error:', err)
        return NextResponse.json(
            { error: err instanceof Error ? err.message : String(err) },
            { status: 500 }
        )
    }
}