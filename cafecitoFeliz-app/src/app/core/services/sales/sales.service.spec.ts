/**
 * ============================================================
 * ARCHIVO: sales.service.spec.ts
 * ¿QUÉ ES ESTO? Es un archivo de PRUEBAS AUTOMATIZADAS (tests).
 * Su único propósito es verificar que el SalesService funciona
 * correctamente sin necesidad de un servidor real.
 * ============================================================
 */

import { TestBed } from '@angular/core/testing';
// TestBed → Es el "laboratorio" de Angular para pruebas.
// Te permite armar un mini-módulo de Angular solo para testear.

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
// HttpClientTestingModule → Reemplaza el módulo HTTP real por uno
//   falso. Así los tests no hacen peticiones reales a internet.
// HttpTestingController → El "inspector" que nos deja ver qué
//   peticiones HTTP se hicieron y responderlas con datos falsos.

import { SalesService, CreateSaleRequest } from './sales.service';
// Importamos el servicio que vamos a probar y el tipo de dato
// que describe cómo debe verse una petición de venta.

import { environment } from '../../../../environments/environment';
// Importamos las variables de entorno (como la URL base de la API).

// ============================================================
// describe() → Agrupa todas las pruebas relacionadas bajo un
// mismo nombre. Piénsalo como el "título del capítulo".
// ============================================================
describe('SalesService (HTTP unit)', () => {

  let service: SalesService;           // El servicio que vamos a probar
  let httpMock: HttpTestingController; // El inspector de peticiones HTTP
  const baseUrl = `${environment.apiUrl}/sales`;
  // La URL donde se espera que el servicio envíe sus peticiones,
  // por ejemplo: "https://api.miapp.com/sales"


  // ==========================================================
  // beforeEach() → Se ejecuta ANTES de cada prueba individual.
  // Es como preparar la mesa antes de cada experimento.
  // ==========================================================
  beforeEach(() => {

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule], // Usamos HTTP falso
      providers: [SalesService],         // Registramos el servicio
    });

    // Obtenemos una instancia real del servicio para usarla en los tests
    service = TestBed.inject(SalesService);

    // Obtenemos el inspector de HTTP para controlar las peticiones
    httpMock = TestBed.inject(HttpTestingController);
  });


  // ==========================================================
  // afterEach() → Se ejecuta DESPUÉS de cada prueba individual.
  // Es como limpiar la mesa después de cada experimento.
  // ==========================================================
  afterEach(() => {
    httpMock.verify();
    // verify() revisa que no haya quedado ninguna petición HTTP
    // pendiente sin responder. Si quedó alguna, el test falla.
    // Esto evita que una prueba "contamine" a la siguiente.
  });


  // ==========================================================
  // PRUEBA 1: Verifica que createSale() hace la petición correcta
  // y procesa bien la respuesta del servidor.
  // ==========================================================
  it('createSale: debe hacer POST /sales con payload correcto', () => {

    // --- PASO 1: Definimos los datos que vamos a enviar ---
    const payload: CreateSaleRequest = {
      customerId: 'c1',       // ID del cliente
      paymentMethod: 'cash',  // Método de pago: efectivo
      items: [
        {
          productId: 'p1',    // ID del producto
          quantity: 2,        // Cantidad a comprar
        },
      ],
    };

    // --- PASO 2: Llamamos al servicio y verificamos la respuesta ---
    service.createSale(payload).subscribe((res) => {
      // Este bloque solo corre cuando llegue la respuesta (el "flush" de abajo).
      // Aquí verificamos que los datos que nos regresa el servidor
      // son los que esperamos:
      expect(res.subtotal).toBe(100);              // Subtotal = $100
      expect(res.discountPercent).toBe(5);         // Descuento = 5%
      expect(res.total).toBe(95);                  // Total = $95
      expect(res.ticket.storeName).toBe('Cafecito Feliz'); // Nombre de la tienda
    });

    // --- PASO 3: Interceptamos la petición HTTP que hizo el servicio ---
    const req = httpMock.expectOne(baseUrl);
    // expectOne() dice: "Debe haber exactamente UNA petición a esta URL".
    // Si no hubo ninguna, o hubo más de una, el test falla aquí.

    expect(req.request.method).toBe('POST');
    // Verificamos que fue una petición POST (no GET, PUT, etc.)

    expect(req.request.body).toEqual(payload);
    // Verificamos que el cuerpo de la petición contiene exactamente
    // los datos que le pasamos al servicio.

    // --- PASO 4: Simulamos la respuesta del servidor ---
    req.flush({
      // flush() = "enviar la respuesta falsa". Esto es lo que
      // normalmente devolvería el backend real:
      saleId: 's1',
      customerId: 'c1',
      paymentMethod: 'cash',
      items: [
        {
          productId: 'p1',
          productName: 'Capuchino',
          quantity: 2,
          unitPrice: 50,
          lineTotal: 100,
        },
      ],
      subtotal: 100,
      discountPercent: 5,
      discountAmount: 5,
      total: 95,
      ticket: {
        saleId: 's1',
        timestamp: new Date().toISOString(),
        storeName: 'Cafecito Feliz',
        items: [{ name: 'Capuchino', qty: 2, unitPrice: 50, lineTotal: 100 }],
        subtotal: 100,
        discount: '5%',
        total: 95,
        paymentMethod: 'cash',
      },
      createdAt: new Date().toISOString(),
    });
    // Cuando flush() se ejecuta, el subscribe() de arriba recibe estos
    // datos y corre los expect() para verificar que todo esté bien.
  });


  // ==========================================================
  // PRUEBA 2: Verifica que createSale() maneja correctamente
  // un error del servidor (respuesta 400 Bad Request).
  // ==========================================================
  it('createSale: debe propagar error si backend responde 400', () => {

    // --- PASO 1: Definimos un payload inválido (sin customerId) ---
    const payload: CreateSaleRequest = {
      customerId: null,      // ← Esto es inválido, el backend debería rechazarlo
      paymentMethod: 'cash',
      items: [{ productId: 'p1', quantity: 10 }],
    };

    // --- PASO 2: Llamamos al servicio y esperamos que falle ---
    service.createSale(payload).subscribe({
      next: () => fail('No debería entrar en next'),
      // Si por alguna razón la petición "tuvo éxito", el test falla
      // con el mensaje "No debería entrar en next".

      error: (err) => {
        // Aquí SÍ esperamos llegar: verificamos que el error
        // tiene el código HTTP 400 (Bad Request).
        expect(err.status).toBe(400);
      },
    });

    // --- PASO 3: Interceptamos la petición ---
    const req = httpMock.expectOne(baseUrl);

    // --- PASO 4: Simulamos una respuesta de ERROR del servidor ---
    req.flush(
      { error: 'Insufficient stock' },           // Cuerpo del error
      { status: 400, statusText: 'Bad Request' } // Código HTTP de error
    );
    // Esto simula que el backend rechazó la petición porque, por ejemplo,
    // no hay suficiente stock o faltó el customerId.
  });

});