export interface CultivoRequest {
  nombre: string;
  sector: string;
  fechaPlantacion?: Date | string;
  fechaEstimadaCosecha?: Date | string;
  faseFenologica?: string;
}
