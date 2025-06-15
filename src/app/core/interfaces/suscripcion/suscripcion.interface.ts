export interface Suscripcion {
  id?: string;
  userId: string;
  planId: string;
  fechaInicio: string;
  fechaVencimiento: string;
  estado: 'activa' | 'cancelada' | 'expirada' | 'pausada';
  renovacionAutomatica: boolean;
}
