/**
 * AircraftModelLayer
 * Pure WebGL custom MapLibre layer — no Three.js, no external models.
 * Draws a simple airplane silhouette (triangle + wings) at the aircraft lat/lon.
 */
import maplibregl from 'maplibre-gl';
import type { CustomLayerInterface, CustomRenderMethodInput } from 'maplibre-gl';

export interface AircraftPosition {
    lon: number;
    lat: number;
    heading: number; // degrees, 0 = north
}

// ── Shaders ────────────────────────────────────────────────────────────────
const VS = `
    attribute vec2 a_pos;
    uniform mat4 u_matrix;
    uniform vec3 u_mercator; // [x, y, scale]
    uniform float u_heading; // radians
    void main() {
        // Rotate the local vertex by heading
        float s = sin(u_heading);
        float c = cos(u_heading);
        float rx = a_pos.x * c - a_pos.y * s;
        float ry = a_pos.x * s + a_pos.y * c;
        // Place in Mercator space
        vec4 world = vec4(
            u_mercator.x + rx * u_mercator.z,
            u_mercator.y + ry * u_mercator.z,
            0.0, 1.0
        );
        gl_Position = u_matrix * world;
    }
`;

const FS = `
    precision mediump float;
    uniform vec4 u_color;
    void main() {
        gl_FragColor = u_color;
    }
`;

// ── Airplane shape vertices (local Mercator units, forward = +Y) ────────────
// 0 = fuselage body (6 vertices → 4 triangles fan)
// All coordinates are in "model space" — will be scaled & rotated by shader
const AIRPLANE_VERTS = new Float32Array([
    // Nose triangle
    0.0, 1.0,   // tip (nose)
    -0.15, 0.4,
    0.15, 0.4,

    // Body middle
    -0.15, 0.4,
    0.15, 0.4,
    -0.12, -0.5,

    -0.12, -0.5,
    0.15, 0.4,
    0.12, -0.5,

    // Left wing
    -0.15, 0.1,
    -0.75, -0.05,
    -0.12, -0.25,

    // Right wing
    0.15, 0.1,
    0.75, -0.05,
    0.12, -0.25,

    // Tail left
    -0.1, -0.45,
    -0.35, -0.65,
    -0.1, -0.65,

    // Tail right
    0.1, -0.45,
    0.35, -0.65,
    0.1, -0.65,
]);

// ────────────────────────────────────────────────────────────────────────────

export class AircraftModelLayer implements CustomLayerInterface {
    id = 'aircraft-3d';
    type = 'custom' as const;

    private gl!: WebGLRenderingContext | WebGL2RenderingContext;
    private program!: WebGLProgram;
    private vbo!: WebGLBuffer;
    private map!: maplibregl.Map;
    private position: AircraftPosition;

    // Uniform locations
    private uMatrix!: WebGLUniformLocation;
    private uMercator!: WebGLUniformLocation;
    private uHeading!: WebGLUniformLocation;
    private uColor!: WebGLUniformLocation;
    private aPos!: number;

    constructor(position: AircraftPosition) {
        this.position = position;
    }

    update(position: AircraftPosition) {
        this.position = position;
        this.map?.triggerRepaint();
    }

    private compileShader(src: string, type: number): WebGLShader {
        const gl = this.gl;
        const sh = gl.createShader(type)!;
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
            console.error('[AircraftLayer] Shader error:', gl.getShaderInfoLog(sh));
        }
        return sh;
    }

    onAdd(map: maplibregl.Map, gl: WebGLRenderingContext | WebGL2RenderingContext) {
        this.map = map;
        this.gl = gl;

        // Build program
        const prog = gl.createProgram()!;
        gl.attachShader(prog, this.compileShader(VS, gl.VERTEX_SHADER));
        gl.attachShader(prog, this.compileShader(FS, gl.FRAGMENT_SHADER));
        gl.linkProgram(prog);
        this.program = prog;

        // Cache locations
        this.uMatrix = gl.getUniformLocation(prog, 'u_matrix')!;
        this.uMercator = gl.getUniformLocation(prog, 'u_mercator')!;
        this.uHeading = gl.getUniformLocation(prog, 'u_heading')!;
        this.uColor = gl.getUniformLocation(prog, 'u_color')!;
        this.aPos = gl.getAttribLocation(prog, 'a_pos');

        // Upload vertex data
        const buf = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, AIRPLANE_VERTS, gl.STATIC_DRAW);
        this.vbo = buf;
    }

    onRemove() {
        this.gl.deleteBuffer(this.vbo);
        this.gl.deleteProgram(this.program);
    }

    render(_gl: WebGLRenderingContext | WebGL2RenderingContext, options: CustomRenderMethodInput) {
        const gl = this.gl;

        // Get the proj matrix from MapLibre v5
        const matrix: number[] = (options as any)?.defaultProjectionData?.mainMatrix;
        if (!matrix) return;

        // Compute Mercator position & scale
        const merc = maplibregl.MercatorCoordinate.fromLngLat(
            [this.position.lon, this.position.lat], 0
        );
        // meterInMercatorCoordinateUnits * 40_000 gives ~40km so we use a smaller multiplier
        // Aim for a visual size of ~1–2km so it's prominent when zoomed in
        const scale = merc.meterInMercatorCoordinateUnits() * 2500;
        const headingRad = (-(this.position.heading || 0) * Math.PI) / 180;

        gl.useProgram(this.program);

        // Set uniforms
        gl.uniformMatrix4fv(this.uMatrix, false, matrix);
        gl.uniform3f(this.uMercator, merc.x, merc.y, scale);
        gl.uniform1f(this.uHeading, headingRad);
        gl.uniform4f(this.uColor, 0.2, 0.8, 1.0, 1.0); // cyan-white

        // Bind & draw
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.enableVertexAttribArray(this.aPos);
        gl.vertexAttribPointer(this.aPos, 2, gl.FLOAT, false, 0, 0);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // Draw each triangle (each 3 vertices)
        const count = AIRPLANE_VERTS.length / 2;
        gl.drawArrays(gl.TRIANGLES, 0, count);

        gl.disableVertexAttribArray(this.aPos);
    }
}
