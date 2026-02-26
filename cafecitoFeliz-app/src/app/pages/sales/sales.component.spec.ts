import { SalesComponent } from './sales.component';
import { SalesLogicService } from '../../core/services/sales/sales-logic.service';

describe('SalesComponent (basic behavior)', () => {
  /**
   * Test básico:
   * Verifica que NO se pueda cobrar si el carrito está vacío.
   *
   * Regla de negocio:
   * - No se puede registrar una venta sin items.
   */
  it('should NOT call createSale when cart is empty', () => {

    // === 1. Creamos mocks mínimos ===

    const productsStub = {} as any;
    const customersStub = {} as any;

    // Espiamos createSale para verificar que NO se llame
    const salesApiStub = {
      createSale: jasmine.createSpy('createSale')
    } as any;

    const salesLogicStub = {
      buildCreateSalePayload: jasmine.createSpy('buildCreateSalePayload')
    } as any;

    const toastStub = {
      error: jasmine.createSpy('error'),
      success: jasmine.createSpy('success'),
      info: jasmine.createSpy('info')
    } as any;

    // === 2. Instanciamos componente manualmente ===
    const component = new SalesComponent(
      productsStub,
      customersStub,
      salesApiStub,
      salesLogicStub,
      toastStub
    );

    // Aseguramos que el carrito esté vacío
    component.cart = [];

    // === 3. Ejecutamos acción ===
    component.pay();

    // === 4. Verificaciones ===

    // No debe intentar llamar backend
    expect(salesApiStub.createSale).not.toHaveBeenCalled();

    // Debe mostrar error al usuario
    expect(toastStub.error).toHaveBeenCalled();
  });
});
