import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5000/api/tasks';

  getTasks(paramsObj: any): Observable<any> {
    let params = new HttpParams();
    if (paramsObj.page) params = params.set('page', paramsObj.page.toString());
    if (paramsObj.limit) params = params.set('limit', paramsObj.limit.toString());
    if (paramsObj.search) params = params.set('search', paramsObj.search);
    if (paramsObj.status) params = params.set('status', paramsObj.status);
    if (paramsObj.sortBy) params = params.set('sortBy', paramsObj.sortBy);
    if (paramsObj.sortOrder) params = params.set('sortOrder', paramsObj.sortOrder);
    if (paramsObj.userType) params = params.set('userType', paramsObj.userType);

    return this.http.get(this.apiUrl, { params });
  }

  getTask(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  createTask(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  updateTask(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  updateStatus(ids: string[], status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/status`, { ids, status });
  }

  deleteTasks(ids: string[]): Observable<any> {
    return this.http.delete(this.apiUrl, { body: { ids } });
  }

  getDashboardStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard/stats`);
  }
}
