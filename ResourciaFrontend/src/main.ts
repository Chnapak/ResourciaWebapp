/**
 * Application bootstrap entry point.
 */
/// <reference types="@angular/localize" />

import '@angular/localize/init';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';


/** Boots the standalone Angular application using the root component and config. */
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
