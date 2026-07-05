import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/users`;

  getUsers(paramsObj?: any): Observable<any> {
    let params = new HttpParams();
    if (paramsObj) {
      if (paramsObj.page) params = params.set('page', paramsObj.page.toString());
      if (paramsObj.limit) params = params.set('limit', paramsObj.limit.toString());
      if (paramsObj.search) params = params.set('search', paramsObj.search);
      if (paramsObj.userType) params = params.set('userType', paramsObj.userType);
      if (paramsObj.sortBy) params = params.set('sortBy', paramsObj.sortBy);
      if (paramsObj.sortOrder) params = params.set('sortOrder', paramsObj.sortOrder);
    }
    return this.http.get(this.apiUrl, { params });
  }

  getAssignees(): Observable<any> {
    return this.http.get(`${this.apiUrl}/assignees`);
  }

  getUser(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  createUser(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  updateUser(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  deleteUsers(ids: string[]): Observable<any> {
    return this.http.delete(this.apiUrl, { body: { ids } });
  }

  transferReports(id: string, newReportsToId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/transfer-reports`, { newReportsToId });
  }
}
