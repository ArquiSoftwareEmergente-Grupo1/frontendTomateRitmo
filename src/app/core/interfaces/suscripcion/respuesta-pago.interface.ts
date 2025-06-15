export interface RespuestaPago {
  success: boolean;
  message: string;
  transactionId?: string;
  subscriptionId?: string;
}
