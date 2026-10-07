import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { PreloadAllModules, provideRouter, withPreloading, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withXhr } from '@angular/common/http';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // Report uncaught errors and unhandled promise rejections through Angular's ErrorHandler.
    provideBrowserGlobalErrorListeners(),
    // Routing: preload every lazy page in the background after first load, and restore scroll on back/forward.
    provideRouter(
      routes,
      withPreloading(PreloadAllModules),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
    ),
    // HttpClient for ApiService, using the browser's XMLHttpRequest backend.
    provideHttpClient(withXhr()),
  ],
};
