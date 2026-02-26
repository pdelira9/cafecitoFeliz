import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ProductsService } from './products.service';

/**
 * Este test valida que el servicio se pueda instanciar.
 * Se usa provideHttpClientTesting() para evitar llamadas reales a red.
 */
describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProductsService,
        // HttpClient real + backend simulado para tests
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(ProductsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

