import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Start the app with the root providers; log anything that stops it booting.
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
