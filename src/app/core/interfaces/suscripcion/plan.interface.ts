export interface Plan {
  id: string;
  nombre: string;
  precio: number;
  periodo: string;
  caracteristicas: string[];
  destacado?: boolean;
  limiteCultivos?: number;
  limiteAlertas?: number;
  soporte?: string;
}
