export interface EventoHistorico {
  id?: string;
  fecha: Date | string;
  evento: string;
  cultivoName?: string;
  detalles?: string;
}
