// src/proyectil.ts: define la clase Proyectil y su posicionamiento en el punto de montaje
// Usado por el ciclo principal en main.ts para gestionar y renderizar la bala

import { mat4, vec3 } from 'gl-matrix';
import { RAPIDEZ_FUERZA } from './constants';

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
        // Obtiene la rapidez escalar correspondiente al nivel de fuerza elegido
        const rapidez = RAPIDEZ_FUERZA[nivelFuerza - 1];

        // Calcula y guarda las componentes del vector velocidad inicial en 3D
        this.velocidadInicial = [
            0,
            Math.sin(rad) * rapidez,
            -Math.cos(rad) * rapidez,
        ];
    }

    // Reinicia el proyectil a su estado disponible y actualiza su posición de reposo
    public reiniciar(xTorreta: number, anguloGrados: number): void {
        this.estado = 'disponible';
        this.actualizarEnReposo(xTorreta, anguloGrados);
    }

    // 
}