import { TestBed } from '@angular/core/testing';
import { CustomersComponent } from './customers.component';
import { provideHttpClient } from '@angular/common/http';

/**
 * CustomersComponent (smoke test)
 *
 * Este test es un "smoke test":
 * - Solo valida que el componente se puede crear sin crashear.
 * - No valida lógica de negocio todavía.
 *
 * Nota:
 * - CustomersService usa HttpClient.
 * - Por eso debemos registrar HttpClient en el entorno de pruebas.
 */
describe('CustomersComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomersComponent],
      providers: [
        /**
         * provideHttpClient() registra el provider de HttpClient.
         * Esto evita el error: "No provider for HttpClient!"
         */
        provideHttpClient(),
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(CustomersComponent);
    const component = fixture.componentInstance;

    expect(component).toBeTruthy();
  });
});
