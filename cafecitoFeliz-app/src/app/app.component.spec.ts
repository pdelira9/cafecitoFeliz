import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';

/**
 * AppComponent es el "shell" de la app.
 * En esta arquitectura solo contiene el <router-outlet /> para renderizar páginas.
 * Por eso el test NO valida texto “Hello…”, valida que el componente cree sin errores.
 */
describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      // Router mínimo para que <router-outlet> no falle en pruebas
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app shell', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
