// lib/stl.ts

import { Mesh } from './mesh'

export function meshToSTL(mesh: Mesh): Buffer {
    const triangleCount = mesh.indices.length / 3

    // STL binary format:
    // 80 bytes header + 4 bytes triangle count + (triangleCount * 50 bytes)
    // Each triangle: 12 bytes normal + 3x12 bytes vertices + 2 bytes attribute
    const bufferSize = 80 + 4 + triangleCount * 50
    const buffer = Buffer.alloc(bufferSize)

    // Write 80-byte header (can be anything, we'll use a description)
    buffer.write('Terrain Tool STL export'.padEnd(80, ' '), 0, 'ascii')

    // Write triangle count as a 32-bit unsigned integer
    buffer.writeUInt32LE(triangleCount, 80)

    let offset = 84

    for (let i = 0; i < mesh.indices.length; i += 3) {
        const i0 = mesh.indices[i] * 3
        const i1 = mesh.indices[i + 1] * 3
        const i2 = mesh.indices[i + 2] * 3

        // Get the three vertices of this triangle
        const ax = mesh.vertices[i0], ay = mesh.vertices[i0 + 1], az = mesh.vertices[i0 + 2]
        const bx = mesh.vertices[i1], by = mesh.vertices[i1 + 1], bz = mesh.vertices[i1 + 2]
        const cx = mesh.vertices[i2], cy = mesh.vertices[i2 + 1], cz = mesh.vertices[i2 + 2]

        // Compute the face normal via cross product of two edges
        const ex = bx - ax, ey = by - ay, ez = bz - az
        const fx = cx - ax, fy = cy - ay, fz = cz - az
        const nx = ey * fz - ez * fy
        const ny = ez * fx - ex * fz
        const nz = ex * fy - ey * fx
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1

        // Write normal (3 x float32)
        buffer.writeFloatLE(nx / len, offset); offset += 4
        buffer.writeFloatLE(ny / len, offset); offset += 4
        buffer.writeFloatLE(nz / len, offset); offset += 4

        // Write three vertices (3 x 3 x float32)
        for (const [x, y, z] of [[ax, ay, az], [bx, by, bz], [cx, cy, cz]]) {
            buffer.writeFloatLE(x, offset); offset += 4
            buffer.writeFloatLE(y, offset); offset += 4
            buffer.writeFloatLE(z, offset); offset += 4
        }

        // Write 2-byte attribute (unused, set to 0)
        buffer.writeUInt16LE(0, offset); offset += 2
    }

    return buffer
}