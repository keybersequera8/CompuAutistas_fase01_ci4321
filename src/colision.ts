// src.colision.ts: funciones para detectar colisiones entre esferas y el suelo
// Usado por main.ts en el ciclo de actualización para validar impactos del proyectil

import { vec3 } from "gl-matrix";

// Verifica y retorna verdadero si dos esferas superpone usando distancias al cuadrado
export function colisionanEsferas(
    pos1: vec3,
    radio1: number,
    pos2: vec3,
    radio2: number
): boolean {
    // Calcula la diferencia en cada eje restando los vectores de posición
    const dx = pos1[0] - pos2[0];
    const dy = pos1[1] - pos2[1];
    const dz = pos1[2] - pos2[2];

    // Obtiene la magnitud al cuadrado del vector resultante sin usar raíz cuadrada
    const magnitudCuadrada = dx * dx + dy * dy + dz * dz;

    // Suma ambos radios para definir la distancia límite de contacto
    const sumaRadios = radio1 + radio2;

    // Evalúa si la magnitud al cuadrado es menor a la suma al cuadrado
    return magnitudCuadrada < sumaRadios * sumaRadios;
}

// Verifica y retorna verdadero si la coordenada vertical toca o cruza el suelo
export function colisionaConSuelo(posicion: vec3): boolean {
    // Comprueba si la altura en Y es menor o igual a cero
    return posicion[1] <= 0;
}