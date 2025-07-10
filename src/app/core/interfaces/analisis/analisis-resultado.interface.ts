export interface AnalisisResultado {
  id: string;
  imagen: string;
  diagnostico: string;
  anomalia: string;
  confianza: number;
  recomendaciones: string[];
  cultivoId?: string;
  fechaAnalisis?: string;
  confirmado?: boolean;
  imagenPath?: string; // Ruta donde se guardó la imagen en el servidor
}
