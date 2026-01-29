import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app'; // Ensure this path matches your file

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));