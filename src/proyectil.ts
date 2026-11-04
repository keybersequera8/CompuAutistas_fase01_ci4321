// src/proyectil.ts: define la clase Proyectil y su posicionamiento en el punto de montaje
// Usado por el ciclo principal en main.ts para gestionar y renderizar la bala

import { mat4, vec3 } from 'gl-matrix';
// Importa las constantes físicas de gravedad y rapidez según nivel de fuerza
import { GRAVEDAD, RAPIDEZ_FUERZA } from './constants';
// Importa la clase Tiempo para consultar el delta del ciclo de juego
import { Tiempo } from './tiempo'; 

// Representa los estados posibles del proyectil durante la partida
export type EstadoProyectil = 'disponible' | 'en_vuelo';

// La clase Proyectil gestiona el estado, poisición y el anclaje de la esfera a la punta
// del cańon antes del lanzamiento

export class Proyectil {
    // Almacena las coordenadas (x, y, z) actuales en el espacio del mundo
    public posicion: vec3;

    // Indica si el proyectil está lista para ser disparado o si ya está en el aire
    public estado: EstadoProyectil;

    // Almacena el vector de velocidad inicial fijo al momento de disparar
    velocidadInicial: [number, number, number] = [0, 0, 0];
    // Guarda las coordenadas de origen donde inició el disparo actual
    posicionInicial: [number, number, number] = [0, 0, 0];

    // Almacena la magnitud escalar de la velocidad al momento del disparo
    public  rapidez: number = 0;
    // Almacena el vector unitario de dirección del disparo en 3D
    public direccion: vec3 = vec3.fromValues(0, 0, 0);
    // Registra la velocidad vertical actual afectada por la aceleración de la gravedad
    public velocidadY: number = 0;

    // Inicializa un nuevo proyectil en el origen con estado "disponible"
    constructor() {
        this.posicion = vec3.fromValues(0, 0, 0);
        this.estado = 'disponible';
    }

    // Actualiza la posición del proyectil anclándola a la punta del cańón si está disponible
    public actualizarEnReposo(xTorreta: number, anguloGrados: number): void {
        // Evita recalcular el anclaje si la bala ya fue disparada
        if (this.estado !== 'disponible') return;

        // Crea una matriz de transformación para representar el punto de montaje jerárquico
        const matrizMontaje = mat4.create();

        // Traslada el pivote de rotación del cańon en la torreta
        mat4.translate(matrizMontaje, matrizMontaje, [xTorreta, 0.93, -0.3]);

        // Rota el sistema de coordenadas según el ángulo de elevación del tubo
        mat4.rotateX(matrizMontaje, matrizMontaje, (anguloGrados * Math.PI) / 180);

        // Desplaza hasta el extremo final del tubo donde reposa la bala
        mat4.translate(matrizMontaje, matrizMontaje, [0, 0, -1.3]);

        // Extrae la posición resultante y la guarda en el proyectil
        vec3.transformMat4(this.posicion, [0, 0, 0], matrizMontaje);
    }

    // Inicia el disparo calculando la velocidad y dirección según ángulo y fuerza
    disparar(anguloGrados: number, nivelFuerza: number): void {
        // Ignora la orden si ya existe un proyectil en el aire
        if (this.estado !== 'disponible') return;

        // Marca el proyectil como no disponible durante su trayectoria en vuelo
        this.estado = 'en_vuelo';

        // Fija la posición de salida copiando las coordenadas actuales del tubo
        this.posicionInicial = [
            this.posicion[0],
            this.posicion[1],
            this.posicion[2],
        ];

        // Convierte el ángulo de elevación del cańón de grados a radianes
        const rad = (anguloGrados * Math.PI) / 180;
        
        // Obtiene y guarda la rapidez escalar según el nivel de fuerza elegido
        this.rapidez = RAPIDEZ_FUERZA[nivelFuerza - 1];

        // Define el vector unitario de dirección según la inclinación del tubo
        vec3.set(this.direccion, 0, Math.sin(rad), -Math.cos(rad));

        // Calcula y guarda las componentes del vector velocidad inicial en 3D
        this.velocidadInicial = [
            0,
            this.direccion[1] * this.rapidez,
            this.direccion[2] * this.rapidez,
        ];

        // Inicializa la velocidad vertical para aplicarle gravedad en cada cuadro
        this.velocidadY = this.velocidadInicial[1];
    }

    // Reinicia el proyectil a su estado disponible y actualiza su posición de reposo
    public reiniciar(xTorreta: number, anguloGrados: number): void {
        this.estado = 'disponible';
        this.actualizarEnReposo(xTorreta, anguloGrados);
    }

    // Calcula y actualiza la posición parabólica del proyectil usando el tiempo delta
    public actualizar(t: Tiempo): void {
        // Ignora la actualización física si el proyectil no está volando
        if (this.estado !== 'en_vuelo') return;

        // Multiplica primero los escalares para optimizar el cálculo del desplazamiento
        const desplazamiento = this.rapidez * t.delta;

        // Avanza la posición en X y Z multiplicando escalar por dirección
        this.posicion[0] += desplazamiento * this.direccion[0];
        this.posicion[2] += desplazamiento * this.direccion[2];

        // Actualiza la posición vertical y aplica la aceleración de la gravedad
        this.posicion[1] += this.velocidadY * t.delta + 0.5 * GRAVEDAD * t.delta * t.delta;
        this.velocidadY += GRAVEDAD * t.delta;
    }
}