// src/tiempo.ts: controlador del paso del tiempo para el ciclo principal
// Usado por main.ts para desacoplar las físicas de la tasa de fotogramas

// La clase Tiempo gestiona el reloj del ciclo mediante marcas temporales y deltas
export class Tiempo {
    // Almacena el instante exacto en que inició el ciclo en segundos
    inicial: number;
    // Guarda la marca de tiempo del fotograma previo en segundos
    anterior: number;
    // Registra la marca de tiempo del fotograma actual en segundos
    nuevo: number;
    // Representa el tiempo transcurrido entre el cuadro anterior y el actual
    delta: number;
    // Acumula el tiempo total transcurrido desde el inicio del programa
    total: number;

    // Inicializa las propiedades temporales convirtiendo los milisegundos iniciales a segundos
    constructor(ahoraMs: number) {
        // Convierte el tiempo inicial de milisegundos a segundos
        const ahora = ahoraMs / 1000;
        this.inicial = ahora;
        this.anterior = ahora;
        this.nuevo = ahora;
        this.delta = 0;
        this.total = 0;
    }

    // Actualiza los contadores de tiempo delta y total recibiendo el tiempo actual
    actualizar(ahoraMs: number, maxDt: number): void {
        // Convierte la marca de tiempo actual a segundos
        this.nuevo = ahoraMs / 1000;
        // Calcula la diferencia entre cuadros limitándola para evitar saltos bruscos
        this.delta = Math.min(this.nuevo - this.anterior, maxDt);
        // Actualiza la referencia del cuadro anterior para la siguiente iteración
        this.anterior = this.nuevo;
        // Calcula el tiempo total transcurrido desde el arranque del reloj
        this.total = this.nuevo - this.inicial;
    }
}