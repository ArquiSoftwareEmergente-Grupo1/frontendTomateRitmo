export interface EventoHistorico {
  id?: string;
  fecha: Date | string;
  evento: string;
  zona: string;
  cultivoId?: string;
  tipo?: 'riego' | 'alerta' | 'anomalia' | 'sistema';
  detalles?: string;
}
