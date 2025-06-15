export interface DashboardData {
  id?: string;
  humedadActual: number;
  temperaturaActual: number;
  calidadSuelo: {
    ph: number;
    ec: number;
    estado: string;
  };
  luminosidad: {
    intensidad: number;
    estado: string;
  };
  ultimaDeteccionVisual: {
    imagen: string;
    diagnostico: string;
    anomalia: string;
  };
  tipoRiego: 'Manual' | 'Automatico';
  fechaActualizacion?: string;
  userId?: string;
}
