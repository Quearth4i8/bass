import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AuthService } from '../services/AuthService';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const apiBaseUrl = this.auth.getApiBaseUrl();
    const apiRootUrl = this.auth.getServerRootUrl();

    const isApiRequest = req.url.startsWith(apiBaseUrl) || req.url.startsWith(apiRootUrl);
    const isAuthRequest = req.url.startsWith(`${apiBaseUrl}/auth/`);

    // Drop a token that has already expired instead of sending it: the backend
    // would only reject it, and public endpoints work fine anonymously.
    if (this.auth.isTokenExpired() && this.auth.getToken()) {
      this.auth.logout();
    }

    const token = this.auth.getToken();
    const authReq = token && isApiRequest && !isAuthRequest
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next.handle(authReq).pipe(
      catchError((err) => {
        if (err instanceof HttpErrorResponse && isApiRequest && !isAuthRequest
            && (err.status === 401 || err.status === 403) && this.auth.getToken()) {
          this.auth.logout();
        }
        return throwError(() => err);
      })
    );
  }
}
