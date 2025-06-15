export interface RiegoManual {
  id?: string;
  fecha: Date | string;
  zona: string;
  humedad: number;
  ultimoRiego: Date | string;
  cultivoId?: string;
  estado?: 'pendiente' | 'completado' | 'cancelado';
}
