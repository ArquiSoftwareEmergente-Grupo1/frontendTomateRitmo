export interface RiegoHistorial {
  id: string;
  nombre: string;
  cultivoId: string;
  fechaPlantacion: Date | string;
  humedad: number;
  ultimoRiego: Date | string;
  tipoRiego: 'Automatico' | 'Manual';
  sector?: string;
}
