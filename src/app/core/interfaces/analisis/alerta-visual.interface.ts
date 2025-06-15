export interface AlertaVisual {
  id: string;
  zonaAfectada: string;
  tipoAnomalia: string;
  horaDeteccion: string;
  accionTomada: string;
  imagen: string;
  cultivoId?: string;
  fechaDeteccion?: string;
  severidad?: 'baja' | 'media' | 'alta';
  estado?: 'activa' | 'en_proceso' | 'resuelta';
}
