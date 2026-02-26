import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { CustomersService } from './customers.service';
import { environment } from '../../../../environments/environment';

/**
 * CustomersService (HTTP Unit Tests)
 *
 * OBJETIVO:
 * Verificar que el servicio:
 * - Construye correctamente la URL base.
 * - Envía correctamente query params.
 * - Envía correctamente el body en POST.
 * - Maneja correctamente respuestas exitosas.
 * - Maneja correctamente errores HTTP.
 *
 * IMPORTANTE:
 * - No llama al backend real.
 * - HttpTestingController intercepta la request.
 * - Nosotros simulamos la respuesta con req.flush().
 *
 * Esto hace que las pruebas sean:
 * ✔ Rápidas
 * ✔ Deterministas
 * ✔ 100% repetibles
 */
describe('CustomersService', () => {
  let service: CustomersService;
  let httpMock: HttpTestingController;

  // Endpoint construido igual que en el service real.
  const baseUrl = `${environment.apiUrl}/customers`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      /**
       * HttpClientTestingModule reemplaza HttpClient real
       * por una versión controlable en pruebas.
       */
      imports: [HttpClientTestingModule],
      providers: [CustomersService],
    });

    service = TestBed.inject(CustomersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    /**
     * Verifica que no queden requests sin responder.
     * Si olvidas hacer req.flush(), esta línea hará fallar la prueba.
     */
    httpMock.verify();
  });

  // ============================================================
  // TEST 1: searchCustomers (GET con query params)
  // ============================================================

  it('searchCustomers: debe hacer GET /customers con params q/page/limit', () => {
    const q = 'cliente';
    const page = 1;
    const limit = 10;

    service.searchCustomers(q, page, limit).subscribe((res) => {
      // Validamos que la respuesta llegue correctamente al subscriber
      expect(res.total).toBe(1);
      expect(res.data.length).toBe(1);
      expect(res.data[0].name).toBe('Cliente Prueba');
    });

    /**
     * Capturamos la request saliente.
     * Validamos:
     * - Método HTTP
     * - URL exacta
     */
    const req = httpMock.expectOne({
      method: 'GET',
      url: baseUrl,
    });

    // Validamos query params enviados
    expect(req.request.params.get('q')).toBe(q);
    expect(req.request.params.get('page')).toBe(String(page));
    expect(req.request.params.get('limit')).toBe(String(limit));

    // Simulamos respuesta del backend
    req.flush({
      data: [
        {
          id: 'c1',
          name: 'Cliente Prueba',
          phoneOrEmail: 'cliente@demo.com',
          purchasesCount: 3,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      total: 1,
      page,
      limit,
    });
  });

  // ============================================================
  // TEST 2: createCustomer (POST con body correcto)
  // ============================================================

  it('createCustomer: debe hacer POST /customers con body correcto', () => {
    const payload = {
      name: 'Juan',
      phoneOrEmail: 'juan@demo.com',
    };

    service.createCustomer(payload).subscribe((created) => {
      // Validamos que la respuesta se interprete correctamente
      expect(created.name).toBe('Juan');
      expect(created.phoneOrEmail).toBe('juan@demo.com');
      expect(created.purchasesCount).toBe(0);
    });

    const req = httpMock.expectOne({
      method: 'POST',
      url: baseUrl,
    });

    // Validamos que el body enviado sea el esperado
    expect(req.request.body).toEqual(payload);

    // Simulamos respuesta exitosa del backend
    req.flush({
      id: 'c2',
      name: 'Juan',
      phoneOrEmail: 'juan@demo.com',
      purchasesCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  // ============================================================
  // TEST 3: Manejo de error (caso negativo)
  // ============================================================

  it('createCustomer: debe manejar error 400 del backend', () => {
    const payload = {
      name: '',
      phoneOrEmail: '',
    };

    service.createCustomer(payload).subscribe({
      next: () => fail('Debe fallar si backend responde 400'),
      error: (err) => {
        // Validamos que el error llegue correctamente
        expect(err.status).toBe(400);
        expect(err.error.error).toBe('Validation failed');
      },
    });

    const req = httpMock.expectOne({
      method: 'POST',
      url: baseUrl,
    });

    /**
     * Simulamos error 400 del backend.
     * Segundo parámetro define status y statusText.
     */
    req.flush(
      { error: 'Validation failed' },
      { status: 400, statusText: 'Bad Request' }
    );
  });
});
