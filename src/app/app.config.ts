import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { APP_ROUTES } from './app.routes';
import { MockNetworkInterceptor } from './core/interceptors/mock-network.interceptor';
import { MockBackendInterceptor } from './core/interceptors/mock-backend.interceptor';
import { DATA_API, dataApiFactory } from './core/services/data-api.service';
import { POLLING_ENABLED, RULE_COOLDOWN_MS } from './core/services/data-store.service';
import { mockDataConfig } from './core/mock-data/mock-config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(APP_ROUTES, withEnabledBlockingInitialNavigation()),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations(),
    importProvidersFrom(MatSnackBarModule),
    { provide: DATA_API, useFactory: dataApiFactory },
    { provide: HTTP_INTERCEPTORS, useClass: MockNetworkInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: MockBackendInterceptor, multi: true },
    { provide: POLLING_ENABLED, useValue: true },
    { provide: RULE_COOLDOWN_MS, useValue: mockDataConfig.ruleCooldownMs }
  ]
};
