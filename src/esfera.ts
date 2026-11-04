// src/esfera.ts: utilidades para modelar modelar primitivas esféricas en 3D.
// Usado para crear proyectiles y objetivos.

// Estructura de datos que almacena los arreglos de vértices e índices de una malla
export interface MallaEsfera {
    // Posiciones (x, y , z) y normales (nx, ny, nz) intercaladas
    vertices: Float32Array;
    // Índices de los triángulos que conforman la superficie
    indices: Uint16Array;
}

// Genera y devuelve los vértices e índices de una esfera según su radio y divisiones
export function generarEsfera(
    radio: number,
    latitudes: number = 16,
    longitudes: number = 16
): MallaEsfera {
    // Arreglo temporal para guardar componentes de vértices y normales
    const listaVertices: number[] = [];
    // Arreglo temporal para guardar la conectividad de los triángulos
    const listaIndices: number[] = [];

    // Recorre los anillos de latitud desde el polo norte al sur
    for (let lat = 0; lat <= latitudes; lat++) {
        // Calcula el ángulo polar phi entre -pi/2 y pi/2
        const phi = -Math.PI / 2 + (lat * Math.PI) / latitudes;
        const cosPhi = Math.cos(phi);
        const sinPhi = Math.sin(phi);

        // Recorre los segmentos de longitud alrededor del eje Y
        for (let lon = 0; lon <= longitudes; lon++) {
            // Calcula el ángulo azimutal theta entre 0 y 2pi
            const theta = (lon * 2 * Math.PI) / longitudes;
            const cosTheta = Math.cos(theta);
            const sinTheta = Math.sin(theta);

            // Calcula la normal unitaria en la superficie de la esfera
            const nx = sinTheta * cosPhi;
            const ny = sinPhi;
            const nz = cosTheta * cosPhi;

            // Calcula la posición multiplicando la normal por el radio
            const x = radio * nx;
            const y = radio * ny;
            const z = radio * nz;

            // Agrega poisición y normal intercaladas según el formato sugerido
            listaVertices.push(x, y, z, nx, ny, nz);
        }
    }

    // Genera los dos tri[angulos que forman cada cuadrilátero de la malla
    for (let lat = 0; lat < latitudes; lat++) {
        for (let lon = 0; lon < longitudes; lon++) {
            // Calcula el índice del primer vértice del cuadrilátero actual
            const primero = lat * (longitudes + 1) + lon;
            const segundo = primero + longitudes + 1;
            
            // Define el primer triángulo del cuadrilátero o abanico polar
            listaIndices.push(primero, segundo, primero + 1);
            // Define el segundo triángulo del cuadrilátero o abanico polar
            listaIndices.push(segundo, segundo + 1, primero + 1);
        }
    }

    // Convierte y retorna los arreglos en formatos tipados para WebGL
    return {
        vertices: new Float32Array(listaVertices),
        indices: new Uint16Array(listaIndices),
    };
}