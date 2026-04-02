import { NextRequest } from 'next/server'
import { fetchElevationGrid } from '@/lib/dem'
import { buildMesh } from '@/lib/mesh'
import { meshToSTL } from '@/lib/stl'

export async function POST(req: NextRequest) {
    const body = await req.json()
    const { bbox, zScale, baseThickness, resolution, printWidth, printDepth } = body

    try {
        console.log('Step 1: fetching elevation grid...');
        const { grid } = await fetchElevationGrid(bbox, Math.min(resolution, 500));
        console.log('Step 2: grid fetched, rows:', grid.length);

        const mesh = buildMesh(grid, zScale, baseThickness, printWidth, printDepth);
        console.log('Step 3: mesh built, vertices:', mesh.vertices.length);

        const stl = meshToSTL(mesh);
        console.log('Step 4: STL built, size:', stl.byteLength);

        return new Response(stl, {
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': 'attachment; filename=terrain.stl',
            }
        });
    } catch (err) {
        console.error('STL generation error:', err)
        return Response.json(
            { error: err instanceof Error ? err.message : String(err) },
            { status: 500 }
        );
    };
};