import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EmailService {
  constructor(private http: HttpClient) {}

  private getBaseUrl(): string {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      // Local
      return 'http://localhost:8085/bassiana';
    } else {
      // Production
      return 'http://41.229.139.17:8080/imasservice/bassiana';
    }
  }

  submitEmail(email: string): Observable<any> {
    const url = `${this.getBaseUrl()}/emails/submit`;
    return this.http.post(url, null, { params: { email } });
  }

  getUserCount(): Observable<number> {
    const url = `${this.getBaseUrl()}/emails/count`;
    return this.http.get<number>(url);
  }

  checkEmailExists(email: string): Observable<boolean> {
    const url = `${this.getBaseUrl()}/emails/exists`;
    return this.http.get<boolean>(url, { params: { email } });
  }
  
}