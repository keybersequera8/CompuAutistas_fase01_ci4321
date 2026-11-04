// Rotating cube, FixedFunction (FF) version.
import './style.css';
import { mat3, mat4 } from 'gl-matrix';
import { ATTRIB, createFixedFunction, LIGHTING } from './vendor/ff/ff';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CLEAR_COLOR,
  CUBE_INDICES,
  CUBE_VERTICES,
  GROUND_COLOR,
  BARRA_ENCENDIDA,
  BARRA_APAGADA,
  TURRET_COLOR,
  CAÑON_VERTICES,
  CAÑON_INDICES,
  NORMAL_OFFSET_BYTES,
  STRIDE_BYTES,
  COLOR_PROYECTIL,
  RADIO_PROYECTIL,
} from './constants';

// Importa el generador de mallas esféricas y la clase Proyectil
import { generarEsfera } from './esfera';
import { Proyectil } from './proyectil';

// Importa el controlador de tiempo para gestionar el ciclo del juego
import { Tiempo } from './tiempo';

type FF = ReturnType<typeof createFixedFunction>;
 
const MAX_DT = 0.1; // seconds

// Step 1. Get the WebGL2 context.
function getContext(canvas: HTMLCanvasElement): WebGL2RenderingContext {
  const gl = canvas.getContext('webgl2');
  if (!gl) throw new Error('WebGL2 is not available.');
  return gl;
}

// Step 2. Shaders and program: FF creates and owns them.
// Step 3. Vertex specification: copy the vertex and index data to the GPU.
function createVertexBuffer(gl: WebGL2RenderingContext, data: Float32Array): WebGLBuffer {
  const buffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  return buffer;
}

function createIndexBuffer(gl: WebGL2RenderingContext, data: Uint16Array): WebGLBuffer {
  const buffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
  return buffer;
}

// Step 4. Describe how the vertex data is laid out, using FF's attribute slots.
// No ATTRIB.COLOR: lit colors come from the material.
function createVAO(gl: WebGL2RenderingContext, vertices: WebGLBuffer, indices: WebGLBuffer): WebGLVertexArrayObject {
  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertices);
  gl.enableVertexAttribArray(ATTRIB.POSITION);
  gl.vertexAttribPointer(ATTRIB.POSITION, 3, gl.FLOAT, false, STRIDE_BYTES, 0);
  gl.enableVertexAttribArray(ATTRIB.NORMAL);
  gl.vertexAttribPointer(ATTRIB.NORMAL, 3, gl.FLOAT, false, STRIDE_BYTES, NORMAL_OFFSET_BYTES);
  // The VAO remembers the ELEMENT_ARRAY_BUFFER bound while it is bound.
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
  gl.bindVertexArray(null);
  return vao;
}

// Step 5. Pipeline state: canvas size, viewport, clear color, depth test, face culling.
function setupState(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement): void {
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(...CLEAR_COLOR);
  gl.enable(gl.DEPTH_TEST); // new vs. the triangle: nearer faces must hide farther ones
  gl.enable(gl.CULL_FACE); // skip back faces; front faces are counter-clockwise (the default)
}

// Step 6. Scene: lighting, one directional light, camera.
function setupScene(ff: FF): void {
  ff.enable(LIGHTING);
  ff.setGlobalAmbient([0.2, 0.2, 0.2, 1]); // the FF default, set explicitly to make it visible

  // The light TRAVELS in direction (-1, -1, -0.5): down, left, slightly away from the camera.
  // FF's position (w = 0) points TOWARD the light, so the sign flips: (1, 1, 0.5, 0).
  // Passing the travel direction instead lights the faces that point away from the light.
  ff.setLight(0, { position: [1, 1, 0.5, 0], diffuse: [1, 1, 1, 1] });
  ff.enableLight(0);

  const view = mat4.lookAt(mat4.create(), [0, 6, 21], [0, 1, -8], [0, 1, 0]);
  ff.setViewMatrix(view);
  // Aspect = width / height of the drawing buffer (4:3). A wrong aspect stretches the cube.
  const projection = mat4.perspective(mat4.create(), Math.PI / 4, CANVAS_WIDTH / CANVAS_HEIGHT, 0.1, 100);
  ff.setProjectionMatrix(projection);
}

// ---------------------------------------------------------------------------
// Game loop. Every frame does three separate phases:
//   1. processInput: read what the user did.
//   2. update(dt): advance the simulation by the elapsed time dt.
//   3. render: draw the current state.
// Keep the phases apart: render never changes the state, and update never calls WebGL.
// ---------------------------------------------------------------------------

// Game state: everything the simulation needs, nothing about WebGL.
const state = {x: 0, anguloCañon: 45, movimientoX: 0, movimientoAngulo: 0, fuerza: 1};

// Instancia el proyectil principal del juego para controlar su estado y posición
const proyectil = new Proyectil();

// Input: the keydown listener only records presses. processInput handles them later, once per frame.

// Guardamos las flechas
let izq = false;
let der = false;
let subir = false;
let bajar = false;
// Guardamos la tecla R
let rPresionada = false;
// Registra si el jugador presionó Espacio para disparar
let espacioPresionado = false;

// Vemos que flecha se esta usando
function cambiarFlecha(e: KeyboardEvent, valor: boolean): void {
  if (e.code === 'ArrowLeft') izq = valor;
  else if (e.code === 'ArrowRight') der = valor;
  else if (e.code === 'ArrowUp') subir = valor;
  else if (e.code === 'ArrowDown') bajar = valor;
  else return;

  e.preventDefault();
}

function setupInput(): void {
  window.addEventListener('keydown', (e) => {
    cambiarFlecha(e, true);
    // Vemos si se presiono R
    if (e.code === 'KeyR' && !e.repeat) {
      rPresionada = true;
    }

    // Registra la intención de disparo al presionar la tecla Espacio sin repetición
    if (e.code === 'Space' && !e.repeat) {
      espacioPresionado = true;
      e.preventDefault();
    }

    // Cambiamos el nivel de fuerza
    if (e.code === 'Digit1') state.fuerza = 1;
    if (e.code === 'Digit2') state.fuerza = 2;
    if (e.code === 'Digit3') state.fuerza = 3;
  });

  window.addEventListener('keyup', (e) => {
    cambiarFlecha(e, false);
  });
}

// Vemos hacia donde se quiere mover el tanque
function processInput(): void {
  state.movimientoX = 0;
  state.movimientoAngulo = 0;

  if (izq) state.movimientoX = -1;
  if (der) state.movimientoX = 1;

  if (subir) state.movimientoAngulo = 1;
  if (bajar) state.movimientoAngulo = -1;
  // Reiniciamos el tanque y devuelve el proyectil al tubo con R
  if (rPresionada) {
    state.x = 0; 
    state.anguloCañon = 45;
    proyectil.reiniciar(state.x, state.anguloCañon); 
    rPresionada = false;
  }

  // Acciona el disparo del proyectil si se presionó Espacio y está disponible
  if (espacioPresionado) {
    if (proyectil.estado == 'disponible') {
      proyectil.disparar(state.anguloCañon, state.fuerza);
    }
    espacioPresionado = false;
  }
}

// Actualiza el estado de al torreta y el proyectil en cada cuadro
function update(t: Tiempo): void {
  // Extrae el delta de tiempo en segundos para los cálculos cinemáticos
  const dt = t.delta;

  // Movemos el tanque
  if (state.movimientoX < 0) state.x -= 5 * dt;
  if (state.movimientoX > 0) state.x += 5 * dt;

  if (state.x < -10) state.x = -10;
  if (state.x > 10) state.x = 10;

  // Movemos el cañon
  if (state.movimientoAngulo > 0) state.anguloCañon += 40 * dt;
  if (state.movimientoAngulo < 0) state.anguloCañon -= 40 * dt;

  if (state.anguloCañon < 5) state.anguloCañon = 5;
  if (state.anguloCañon > 90) state.anguloCañon = 90;

  // Sincroniza la posición del proyectil con al punta del cańón en reposo
  proyectil.actualizarEnReposo(state.x, state.anguloCañon);

  // Actualiza la trayectoria parabólica del proyectil si se encuentra en vuelo
  proyectil.actualizar(t);
}

// Usamos estas matrices para colocar las figuras
const model = mat4.create();
const normalMatrix = mat3.create();

function render(
  gl: WebGL2RenderingContext, 
  ff: FF, 
  vao: WebGLVertexArrayObject, 
  vaoCañon: WebGLVertexArrayObject,
  vaoProyectil: WebGLVertexArrayObject,
  numIndicesProyectil: number
): void {
  
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.bindVertexArray(vao);

  // Le ponemos el color al tanque
  ff.setMaterial({
    ambient: TURRET_COLOR,
    diffuse: TURRET_COLOR
  });

  // Hacemos la base del tanque con el cubo
  const altoBase = 0.65;

  mat4.identity(model);
  mat4.translate(model, model, [state.x, altoBase / 2, 0]);
  mat4.scale(model, model, [1.6, altoBase, 1.2]);

  mat3.normalFromMat4(normalMatrix, model);
  ff.setModelMatrix(model);
  ff.setNormalMatrix(normalMatrix);

  ff.drawElements(gl.TRIANGLES, CUBE_INDICES.length, gl.UNSIGNED_SHORT, 0);

  // Hacemos la parte de arriba con otro cubo
  const altoArriba = 0.45;

  mat4.identity(model);
  mat4.translate(model, model, [state.x, altoBase + altoArriba / 2, 0]);
  mat4.scale(model, model, [0.9, altoArriba, 0.9]);

  mat3.normalFromMat4(normalMatrix, model);
  ff.setModelMatrix(model);
  ff.setNormalMatrix(normalMatrix);

  ff.drawElements(gl.TRIANGLES, CUBE_INDICES.length, gl.UNSIGNED_SHORT, 0);

  // Hacemos el cañon con el cilindro
  
  mat4.identity(model);
  mat4.translate(model, model, [state.x, 0.93, -0.3]);
  mat4.rotateX(model, model, state.anguloCañon * Math.PI / 180);
  mat4.translate(model, model, [0, 0, -0.65]);
  mat4.scale(model, model, [0.3, 0.3, 1.3]);

  mat3.normalFromMat4(normalMatrix, model);
  ff.setModelMatrix(model);
  ff.setNormalMatrix(normalMatrix);

  gl.bindVertexArray(vaoCañon);
  ff.drawElements(gl.TRIANGLES, CAÑON_INDICES.length, gl.UNSIGNED_SHORT, 0);
  
  // Hacemos las 3 barras del tanque
  gl.bindVertexArray(vao);

  let barra = 1;
  let y = 0.17;

  while (barra <= 3) {
    let color = BARRA_APAGADA;

    if (barra <= state.fuerza) {
      color = BARRA_ENCENDIDA;
    }

    mat4.identity(model);
    mat4.translate(model, model, [state.x, y, 0.62]);
    mat4.scale(model, model, [0.65, 0.1, 0.1]);

    mat3.normalFromMat4(normalMatrix, model);
    ff.setModelMatrix(model);
    ff.setNormalMatrix(normalMatrix);

    ff.setMaterial({
      ambient: color,
      diffuse: color
    });

    ff.drawElements(gl.TRIANGLES, CUBE_INDICES.length, gl.UNSIGNED_SHORT, 0);

    barra = barra + 1;
    y = y + 0.16;
  }

  // Creamos el suelo con el cubo
  const ancho = 24;
  const alto = 0.2;
  const largo = 20;

  mat4.identity(model);
  mat4.translate(model, model, [0, -0.1, -4]);
  mat4.scale(model, model, [ancho, alto, largo]);

  // Calculamos las normales y actualizamos las matrices
  mat3.normalFromMat4(normalMatrix, model);
  ff.setModelMatrix(model);
  ff.setNormalMatrix(normalMatrix);

  // Le ponemos el color marron y dibujamos el suelo
  ff.setMaterial({
    ambient: GROUND_COLOR,
    diffuse: GROUND_COLOR
  });

  gl.bindVertexArray(vao);
  
  ff.drawElements(gl.TRIANGLES, CUBE_INDICES.length, gl.UNSIGNED_SHORT, 0);

  // Posiciona la matriz de modelo en las coordenadas actuales del proyectil
  mat4.identity(model);
  mat4.translate(model, model, proyectil.posicion);

  // Calcula la matriz normal y actualiza las matrices en el pipeline gráfico
  mat3.normalFromMat4(normalMatrix, model);
  ff.setModelMatrix(model);
  ff.setNormalMatrix(normalMatrix);

  // Asigna el material negro al proyectil y dibuja su malla esférica
  ff.setMaterial({
    ambient: COLOR_PROYECTIL,
    diffuse: COLOR_PROYECTIL,
  });
  gl.bindVertexArray(vaoProyectil);
  ff.drawElements(gl.TRIANGLES, numIndicesProyectil, gl.UNSIGNED_SHORT, 0);
}

function run(canvas: HTMLCanvasElement): void {
  const gl = getContext(canvas);
  const ff = createFixedFunction(gl, { debug: true });
  const vertices = createVertexBuffer(gl, CUBE_VERTICES);
  const indices = createIndexBuffer(gl, CUBE_INDICES);
  const vao = createVAO(gl, vertices, indices);
  // Preparamos el cañon
  const verticesCañon = createVertexBuffer(gl, CAÑON_VERTICES);
  const indicesCañon = createIndexBuffer(gl, CAÑON_INDICES);
  const vaoCañon = createVAO(gl, verticesCañon, indicesCañon);
  // Genera la geometría de la esfera para el proyectil y crea su VAO
  const mallaProyectil = generarEsfera(RADIO_PROYECTIL);
  const verticesProyectil = createVertexBuffer(gl, mallaProyectil.vertices);
  const indicesProyectil = createIndexBuffer(gl, mallaProyectil.indices);
  const vaoProyectil = createVAO(gl, verticesProyectil, indicesProyectil);

  // Posiciona el proyectil en la punta del cańón antes del primer cuadro
  proyectil.actualizarEnReposo(state.x, state.anguloCañon);

  setupState(gl, canvas);
  setupScene(ff);
  setupInput();

  // Instancia el controlador de tiempo
  let tiempo: Tiempo | null = null;

  function frame(now: number): void {
    // Inicializa el reloj en el primer cuadro o actualiza el tiempo transcurrido
    if (tiempo === null) {
      tiempo = new Tiempo(now);
    } else {
      tiempo.actualizar(now, MAX_DT);
    }
    
    processInput();
    update(tiempo);
    render(gl, ff, vao, vaoCañon, vaoProyectil, mallaProyectil.indices.length);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// Page scaffolding: create the canvas and start the cube.
const canvas = document.createElement('canvas');
document.getElementById('stage')!.append(canvas);
run(canvas);
