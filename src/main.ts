import { enableProdMode, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, RouteReuseStrategy } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { IonicStorageModule } from '@ionic/storage-angular';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';
import { addIcons } from 'ionicons';
import { logOutOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';

addIcons({
  'log-out-outline': logOutOutline,
  'eye-outline': eyeOutline,
  'eye-off-outline': eyeOffOutline,
});


if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideIonicAngular(),
    provideRouter(routes),
    provideHttpClient(),

    // ✅ Storage correcto en standalone
    importProvidersFrom(IonicStorageModule.forRoot()),

    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
  ],
});
