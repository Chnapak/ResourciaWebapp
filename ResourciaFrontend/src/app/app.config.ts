/**
 * Application-wide Angular configuration and dependency providers.
 */
import { APP_INITIALIZER, ApplicationConfig, ErrorHandler, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { tokenInterceptor } from './core/interceptors/token.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { AuthService } from './core/auth/auth.service';
import { GlobalErrorHandler } from './core/global-error-handler';

/**
 * Factory that bootstraps authentication during app initialization.
 */
export function initAuthFactory(auth: AuthService) {
  return () => auth.initAuth();
}

/**
 * Root application config with routing, HTTP, and initialization providers.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withInterceptors([tokenInterceptor, errorInterceptor])),
    provideRouter(routes, withComponentInputBinding(), withInMemoryScrolling({ scrollPositionRestoration: 'enabled',
    anchorScrolling: 'enabled' })),
    {
      provide: APP_INITIALIZER,
      useFactory: initAuthFactory,
      deps: [AuthService],
      multi: true
    },
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ]
};
