import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import {Cultivo} from '../../interfaces/cultivo/cultivo.interface';
import {CultivoRequest} from '../../interfaces/cultivo/cultivo-request.interface';

@Injectable({
  providedIn: 'root'
})
export class CultivosService {
  private baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getCultivos(): Observable<Cultivo[]> {
    const currentUser = this.authService.getCurrentUser();
    const userId = currentUser?.id;

    let url = `${this.baseUrl}/cultivos`;
    if (userId) {
      url += `?userId=${userId}`;
    }

    return this.http.get<Cultivo[]>(url)
      .pipe(
        map(cultivos => cultivos.map(cultivo => ({
          ...cultivo,
          fechaPlantacion: new Date(cultivo.fechaPlantacion),
          fechaEstimadaCosecha: new Date(cultivo.fechaEstimadaCosecha)
        }))),
        catchError(this.handleError)
      );
  }

  getCultivoById(id: string): Observable<Cultivo> {
    return this.http.get<Cultivo>(`${this.baseUrl}/cultivos/${id}`)
      .pipe(
        map(cultivo => ({
          ...cultivo,
          fechaPlantacion: new Date(cultivo.fechaPlantacion),
          fechaEstimadaCosecha: new Date(cultivo.fechaEstimadaCosecha)
        })),
        catchError(this.handleError)
      );
  }

  createCultivo(cultivo: CultivoRequest): Observable<Cultivo> {
    const currentUser = this.authService.getCurrentUser();
    const fechaPlantacion = new Date();
    const fechaEstimadaCosecha = new Date();
    fechaEstimadaCosecha.setMonth(fechaEstimadaCosecha.getMonth() + 7);

    const newCultivo = {
      nombre: cultivo.nombre,
      fechaPlantacion: fechaPlantacion.toISOString(),
      fechaEstimadaCosecha: fechaEstimadaCosecha.toISOString(),
      faseFenologica: 'Sprouting',
      sector: cultivo.sector,
      userId: currentUser?.id
    };

    return this.http.post<Cultivo>(`${this.baseUrl}/cultivos`, newCultivo)
      .pipe(
        map(cultivo => ({
          ...cultivo,
          fechaPlantacion: new Date(cultivo.fechaPlantacion),
          fechaEstimadaCosecha: new Date(cultivo.fechaEstimadaCosecha)
        })),
        catchError(this.handleError)
      );
  }

  updateCultivo(id: string, cultivo: Partial<Cultivo>): Observable<Cultivo> {
    const updateData = { ...cultivo };
    if (updateData.fechaPlantacion) {
      updateData.fechaPlantacion = new Date(updateData.fechaPlantacion).toISOString() as any;
    }
    if (updateData.fechaEstimadaCosecha) {
      updateData.fechaEstimadaCosecha = new Date(updateData.fechaEstimadaCosecha).toISOString() as any;
    }

    return this.http.put<Cultivo>(`${this.baseUrl}/cultivos/${id}`, updateData)
      .pipe(
        map(cultivo => ({
          ...cultivo,
          fechaPlantacion: new Date(cultivo.fechaPlantacion),
          fechaEstimadaCosecha: new Date(cultivo.fechaEstimadaCosecha)
        })),
        catchError(this.handleError)
      );
  }

  deleteCultivo(id: string): Observable<boolean> {
    return this.http.delete(`${this.baseUrl}/cultivos/${id}`)
      .pipe(
        map(() => true),
        catchError(this.handleError)
      );
  }

  getCultivosBySector(sector: string): Observable<Cultivo[]> {
    const currentUser = this.authService.getCurrentUser();
    const userId = currentUser?.id;

    let url = `${this.baseUrl}/cultivos?sector=${sector}`;
    if (userId) {
      url += `&userId=${userId}`;
    }

    return this.http.get<Cultivo[]>(url)
      .pipe(
        map(cultivos => cultivos.map(cultivo => ({
          ...cultivo,
          fechaPlantacion: new Date(cultivo.fechaPlantacion),
          fechaEstimadaCosecha: new Date(cultivo.fechaEstimadaCosecha)
        }))),
        catchError(this.handleError)
      );
  }

  getCultivosByFase(fase: string): Observable<Cultivo[]> {
    const currentUser = this.authService.getCurrentUser();
    const userId = currentUser?.id;

    let url = `${this.baseUrl}/cultivos?faseFenologica=${fase}`;
    if (userId) {
      url += `&userId=${userId}`;
    }

    return this.http.get<Cultivo[]>(url)
      .pipe(
        map(cultivos => cultivos.map(cultivo => ({
          ...cultivo,
          fechaPlantacion: new Date(cultivo.fechaPlantacion),
          fechaEstimadaCosecha: new Date(cultivo.fechaEstimadaCosecha)
        }))),
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ha ocurrido un error';

    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = `Error ${error.status}: ${error.message}`;
    }

    console.error('CultivosService Error:', errorMessage);
    return throwError(errorMessage);
  }
}
