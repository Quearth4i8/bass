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
import { Router } from '@angular/router';

import { AuthService } from '../services/AuthService';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.auth.getToken();
    const apiBaseUrl = this.auth.getApiBaseUrl();
    const apiRootUrl = this.auth.getServerRootUrl();

    const isApiRequest = req.url.startsWith(apiBaseUrl) || req.url.startsWith(apiRootUrl);
    const isAuthRequest = req.url.startsWith(`${apiBaseUrl}/auth/`);

    const authReq = token && isApiRequest && !isAuthRequest
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next.handle(authReq).pipe(
      catchError((err: unknown) => {
        if (err instanceof HttpErrorResponse) {
          if (err.status === 401) {
            this.auth.logout();
            this.router.navigate(['/'], { replaceUrl: true });
          }
        }
        return throwError(() => err);
      })
    );
  }
}
