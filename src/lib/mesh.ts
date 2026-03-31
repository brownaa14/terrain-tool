// lib/mesh.ts

export type Mesh = {
    vertices: Float32Array
    indices: Uint32Array
    normals: Float32Array
}

export function buildMesh(
    grid: number[][],
    zScale: number,
    baseThickness: number,
    printWidth: number,
    printDepth: number
): Mesh {
    const rows = grid.length
    const cols = grid[0].length

    const vertices: number[] = []
    const indices: number[] = []

    let elevMin = Infinity
    let elevMax = -Infinity
    for (const row of grid) {
        for (const val of row) {
            if (val < elevMin) elevMin = val
            if (val > elevMax) elevMax = val
        }
    }

    const elevRange = elevMax - elevMin || 1

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = (col / (cols - 1)) * printWidth
            const y = (row / (rows - 1)) * printDepth

            const normalised = (grid[row][col] - elevMin) / elevRange
            const z = baseThickness + normalised * zScale * 10  // 10mm max terrain height

            vertices.push(x, y, z)
        }
    }

    for (let row = 0; row < rows - 1; row++) {
        for (let col = 0; col < cols - 1; col++) {
            const topLeft = row * cols + col
            const topRight = topLeft + 1
            const bottomLeft = (row + 1) * cols + col
            const bottomRight = bottomLeft + 1

            indices.push(topLeft, bottomLeft, topRight)
            indices.push(topRight, bottomLeft, bottomRight)
        }
    }

    return {
        vertices: new Float32Array(vertices),
        indices: new Uint32Array(indices),
        normals: new Float32Array(vertices.length),
    }
}