export interface EjecutarRiegoRequest {
  zona: string;
  cultivoId?: string;
  duracion?: number;
  tipo?: 'manual' | 'automatico';
}
