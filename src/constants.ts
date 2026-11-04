// src/ constants.ts: constates de geometría, colores y físicas del juego
// Usado por el ciclo principal y generadores para crear las primitivas 3D de la escena.

// Color del cielo 
export const CLEAR_COLOR: readonly [number, number, number, number] = [0.53, 0.81, 0.92, 1];

// Color del suelo 
export const GROUND_COLOR: readonly [number, number, number, number] = [0.55, 0.34, 0.19, 1];

// Color gris oscuro de la torreta
export const TURRET_COLOR: readonly [number, number, number, number] = [0.25, 0.25, 0.25, 1];

// Colores de las barras de fuerza
export const BARRA_ENCENDIDA: readonly [number, number, number, number] = [0.1, 0.95, 0.2, 1];
export const BARRA_APAGADA: readonly [number, number, number, number] = [0.02, 0.2, 0.06, 1];

/** Drawing buffer size in pixels, 4:3. CSS scales the canvas to fit the window; the buffer stays fixed. */
export const CANVAS_WIDTH = 1024;
export const CANVAS_HEIGHT = 768;

/** Cube colors, RGBA. Space cycles through them in this order. */
export const COLORS: readonly (readonly [number, number, number, number])[] = [
  [0, 1, 1, 1], // cyan
  [1, 0, 1, 1], // magenta
  [1, 1, 0, 1], // yellow
];

// 24 vertices (4 per face), not 8 corners. A corner is shared by 3 faces, but a vertex holds
// only one normal. Each face needs its own normal for flat lighting, so each face gets its own 4 vertices.
/** Interleaved vertex data: x, y, z, nx, ny, nz per vertex. Half-size 0.5, counter-clockwise seen from outside. */
export const CUBE_VERTICES = new Float32Array([
  //   x      y      z    nx  ny  nz
  // +Z face (front)
  -0.5, -0.5,  0.5,   0,  0,  1, // bottom left
   0.5, -0.5,  0.5,   0,  0,  1, // bottom right
   0.5,  0.5,  0.5,   0,  0,  1, // top right
  -0.5,  0.5,  0.5,   0,  0,  1, // top left
  // -Z face (back)
   0.5, -0.5, -0.5,   0,  0, -1,
  -0.5, -0.5, -0.5,   0,  0, -1,
  -0.5,  0.5, -0.5,   0,  0, -1,
   0.5,  0.5, -0.5,   0,  0, -1,
  // +X face (right)
   0.5, -0.5,  0.5,   1,  0,  0,
   0.5, -0.5, -0.5,   1,  0,  0,
   0.5,  0.5, -0.5,   1,  0,  0,
   0.5,  0.5,  0.5,   1,  0,  0,
  // -X face (left)
  -0.5, -0.5, -0.5,  -1,  0,  0,
  -0.5, -0.5,  0.5,  -1,  0,  0,
  -0.5,  0.5,  0.5,  -1,  0,  0,
  -0.5,  0.5, -0.5,  -1,  0,  0,
  // +Y face (top)
  -0.5,  0.5,  0.5,   0,  1,  0,
   0.5,  0.5,  0.5,   0,  1,  0,
   0.5,  0.5, -0.5,   0,  1,  0,
  -0.5,  0.5, -0.5,   0,  1,  0,
  // -Y face (bottom)
  -0.5, -0.5, -0.5,   0, -1,  0,
   0.5, -0.5, -0.5,   0, -1,  0,
   0.5, -0.5,  0.5,   0, -1,  0,
  -0.5, -0.5,  0.5,   0, -1,  0,
]);

/** Two triangles per face, 36 indices. Each face: (0, 1, 2) and (0, 2, 3), both counter-clockwise. */
export const CUBE_INDICES = new Uint16Array([
   0,  1,  2,   0,  2,  3, // +Z
   4,  5,  6,   4,  6,  7, // -Z
   8,  9, 10,   8, 10, 11, // +X
  12, 13, 14,  12, 14, 15, // -X
  16, 17, 18,  16, 18, 19, // +Y
  20, 21, 22,  20, 22, 23, // -Y
]);

// Hacemos los puntos del cañon
const lados = 16;
const verticesCañon: number[] = [];
const indicesCañon: number[] = [];

for (let i = 0; i <= lados; i++) {
  let angulo = i * 2 * Math.PI / lados;
  let x = Math.cos(angulo);
  let y = Math.sin(angulo);

  verticesCañon.push(x / 2, y / 2, -0.5, x, y, 0);
  verticesCañon.push(x / 2, y / 2, 0.5, x, y, 0);
}

// Hacemos los triangulos
for (let i = 0; i < lados; i++) {
  let p = i * 2;

  indicesCañon.push(p, p + 2, p + 1);
  indicesCañon.push(p + 1, p + 2, p + 3);
}

export const CAÑON_VERTICES = new Float32Array(verticesCañon);
export const CAÑON_INDICES = new Uint16Array(indicesCañon);

export const STRIDE_BYTES = 6 * 4; // 4 bytes per float (Float32)
export const NORMAL_OFFSET_BYTES = 3 * 4;

// Color negro en formato RGBA para renderizar el proyectil
export const COLOR_PROYECTIL: readonly [number, number, number, number] = [0, 0, 0, 1];

// Color anaranjado rojizo en formato RGBA para los tres objetivos
export const COLOR_OBJETIVO: readonly [number, number, number, number] = [1, 0.27, 0, 1];

// Radio base para modelar la esfera del proyectil
export const RADIO_PROYECTIL = 0.2;

// Radio para las esferas de los objetivos flotantes
export const RADIO_OBJETIVO = 0.5;

// Aceleración gravitatoria terrestre en metros sobre segundos al cuadrado
export const GRAVEDAD = -9.8;

// Valores escalares de rapidez inicial para los niveles 1, 2 y 3
export const RAPIDEZ_FUERZA: readonly [number, number, number] = [8.0, 12.0, 16.0];
