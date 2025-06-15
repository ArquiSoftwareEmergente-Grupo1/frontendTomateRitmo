export interface Transaccion {
  id?: string;
  planId: string;
  userId: string;
  monto: number;
  estado: 'pendiente' | 'completada' | 'fallida' | 'reembolsada';
  fechaTransaccion: string;
  metodoPago: string;
  subscriptionId?: string;
}
