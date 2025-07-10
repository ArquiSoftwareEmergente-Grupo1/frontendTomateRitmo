export interface AnalisisResultado {
  id: number;
  imagen: string;
  diagnostico: string;
  anomalia: string;
  confianza: number;
  recomendaciones: string[];
  cultivoId: string;
  fechaAnalisis: string;
  confirmado: boolean;
  imagenPath: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}
