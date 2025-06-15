export interface ConfiguracionRiego {
  id?: string;
  humedadMinima: number;
  humedadMaxima: number;
  tipoRiego: 'Manual' | 'Automatico';
  userId?: string;
  horariosRiego?: string[];
  fechaActualizacion?: string;
  activo?: boolean;
}
