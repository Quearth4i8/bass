import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable } from 'rxjs';

import { AuthService } from '../services/AuthService';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.auth.getToken();
    const apiBaseUrl = this.auth.getApiBaseUrl();
    const apiRootUrl = this.auth.getServerRootUrl();

    const isApiRequest = req.url.startsWith(apiBaseUrl) || req.url.startsWith(apiRootUrl);
    const isAuthRequest = req.url.startsWith(`${apiBaseUrl}/auth/`);

    const authReq = token && isApiRequest && !isAuthRequest
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next.handle(authReq);
  }
}
