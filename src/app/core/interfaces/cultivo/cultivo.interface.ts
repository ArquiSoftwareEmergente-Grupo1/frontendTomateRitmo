export interface Cultivo {
  id: string;
  nombre: string;
  fechaPlantacion: Date;
  fechaEstimadaCosecha: Date;
  faseFenologica: string;
  sector: string;
  userId?: string;
}
