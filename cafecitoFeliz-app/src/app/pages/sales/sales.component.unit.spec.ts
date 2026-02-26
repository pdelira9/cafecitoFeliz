import { SalesComponent } from './sales.component';

/**
 * SalesComponent (unit-ish tests sin TestBed)
 *
 * Objetivo:
 * - Probar comportamiento del componente sin renderizar HTML.
 * - Evitar Angular runtime (rápido).
 * - Controlar dependencias con stubs (dobles de prueba).
 *
 * Nota:
 * - No probamos "Angular" (eso ya lo prueba Angular).
 * - Probamos nuestras reglas: validaciones, decisiones y orquestación.
 */
describe('SalesComponent (unit-ish)', () => {
  /**
   * Stub mínimo de ToastService:
   * Guardamos el último mensaje para poder afirmar (expect) qué avisó la UI.
   *
   * En un componente real, ToastService muestra UI (snackbar/toast).
   * En pruebas, solo nos interesa: "¿lo llamó con el mensaje correcto?"
   */
  const toastStub = () => ({
    lastError: '' as string,
    lastSuccess: '' as string,
    lastInfo: '' as string,

    error(msg: string) {
      this.lastError = msg;
    },
    success(msg: string) {
      this.lastSuccess = msg;
    },
    info(msg: string) {
      this.lastInfo = msg;
    },
  });

  /**
   * Stub mínimo de ProductsService:
   * En estos tests no necesitamos realmente cargar productos,
   * solo evitar que el constructor truene y que ngOnInit no explote.
   */
  const productsApiStub = () => ({
    getProducts: () => ({
      subscribe: () => {},
    }),
  });

  /**
   * Stub mínimo de CustomersService:
   * No lo usamos en estas pruebas, pero se inyecta.
   * Lo dejamos definido para que el componente pueda construirse.
   */
  const customersApiStub = () => ({
    searchCustomers: () => ({ subscribe: () => {} }),
    createCustomer: () => ({ subscribe: () => {} }),
  });

  /**
   * Stub de SalesService (backend):
   * Vamos a contar cuántas veces se intentó llamar createSale.
   * En la prueba de carrito vacío, debe ser 0.
   */
  const salesApiStub = () => ({
    called: 0,

    createSale: (_payload: any) => {
      (salesApi as any).called++;
      return { subscribe: () => {} };
    },
  });

  /**
   * Stub de SalesLogicService:
   *
   * Aquí es donde vive la "lógica del carrito".
   * En este spec, NO probamos la lógica real (eso ya lo hace sales-logic.service.spec.ts),
   * aquí probamos que el componente:
   * - delega a la lógica
   * - actualiza su estado con lo que devuelve la lógica
   * - y reacciona (toast / no toast) según ok=true/false
   */
  const salesLogicStub = () => ({
    // Default: no cambia carrito
    addToCart: (cart: any[], _product: any) => ({ ok: true, cart }),

    // Métodos que el componente usa (aquí no los probamos, solo existen)
    setQuantity: (cart: any[], _productId: string, _rawValue: string) => cart,
    removeFromCart: (cart: any[], _productId: string) => cart,
    calculateSubtotal: (cart: any[]) =>
      cart.reduce((sum: number, i: any) => sum + i.lineTotal, 0),
    calculateDiscountPercent: (_purchases: number) => 0,
    calculateDiscountAmount: (subtotal: number, percent: number) =>
      subtotal * (percent / 100),
    calculateTotal: (subtotal: number, discount: number) => subtotal - discount,

    // Este método se usa en pay() para armar el payload
    buildCreateSalePayload: (cart: any[], customer: any, paymentMethod: any) => ({
      customerId: customer ? customer.id : null,
      paymentMethod,
      items: cart.map((i: any) => ({
        productId: i.product.id,
        quantity: i.quantity,
      })),
    }),

    clearCart: () => [],
  });

  let toast: ReturnType<typeof toastStub>;
  let salesApi: ReturnType<typeof salesApiStub>;
  let salesLogic: ReturnType<typeof salesLogicStub>;
  let component: SalesComponent;

  beforeEach(() => {
    toast = toastStub();
    salesApi = salesApiStub();
    salesLogic = salesLogicStub();

    // Creamos el componente manualmente con stubs.
    // Importante: el orden debe coincidir con tu constructor actual.
    component = new SalesComponent(
      productsApiStub() as any,
      customersApiStub() as any,
      salesApi as any,
      salesLogic as any,
      toast as any,
    );
  });

  // ============================================================
  // PAY() — pruebas de orquestación al cobrar
  // ============================================================

  it('pay(): si el carrito está vacío, NO llama al backend y muestra error', () => {
    // Carrito vacío a propósito
    component.cart = [];

    component.pay();

    // 1) No debe intentar cobrar en backend
    expect((salesApi as any).called).toBe(0);

    // 2) Debe avisar al usuario (toast)
    expect(toast.lastError).toContain('Agrega al menos un producto');
  });

  it('pay(): con carrito con items, llama al backend con payload armado por SalesLogicService', () => {
    // 1) Preparamos un carrito mínimo (1 producto con cantidad 2)
    component.cart = [
      {
        product: {
          id: 'p1',
          name: 'Capuchino',
          price: 55,
          stock: 10,
          active: true,
          createdAt: '',
          updatedAt: '',
        },
        quantity: 2,
        lineTotal: 110,
      },
    ];

    // 2) Simulamos cliente seleccionado
    component.selectedCustomer = {
      id: 'c1',
      name: 'Cliente Prueba',
      phoneOrEmail: 'cliente@prueba.com',
      purchasesCount: 3,
      createdAt: '',
      updatedAt: '',
    };

    // 3) Vamos a capturar el payload real que el componente manda a SalesService
    let receivedPayload: any = null;

    // 4) Reemplazamos createSale por una función que capture el payload
    (salesApi as any).createSale = (payload: any) => {
      (salesApi as any).called++;
      receivedPayload = payload;

      // Simulamos respuesta exitosa del backend (mínima)
      return {
        subscribe: ({ next }: any) => {
          next({
            ticket: {
              saleId: 'S-1',
              timestamp: new Date().toISOString(),
              storeName: 'Cafecito Feliz',
              items: [],
              subtotal: 110,
              discount: '0%',
              total: 110,
              paymentMethod: 'cash',
            },
          });
        },
      };
    };

    /**
     * 5) Importante:
     * El componente NO arma el payload a mano; se lo pide a SalesLogicService.
     * Entonces aquí hacemos override del método para asegurarnos que:
     * - el componente está usando ESTA función
     * - y que el payload termina llegando igual al backend
     */
    (salesLogic as any).buildCreateSalePayload = (
      cart: any[],
      customer: any,
      paymentMethod: 'cash' | 'card' | 'transfer',
    ) => ({
      customerId: customer ? customer.id : null,
      paymentMethod,
      items: cart.map((i: any) => ({
        productId: i.product.id,
        quantity: i.quantity,
      })),
    });

    // 6) Ejecutamos acción
    component.pay();

    // 7) Assert: sí se llamó al backend
    expect((salesApi as any).called).toBe(1);

    // 8) Assert: payload bien formado
    expect(receivedPayload).toEqual({
      customerId: 'c1',
      paymentMethod: 'cash',
      items: [{ productId: 'p1', quantity: 2 }],
    });

    // 9) Assert extra: al éxito, deja ticket cargado (flujo completo)
    expect(component.lastTicket).not.toBeNull();
  });

  // ============================================================
  // ADDTOCART() — pruebas de interacción UI + lógica
  // ============================================================

  it('addToCart(): si SalesLogicService rechaza (ok=false), muestra toast.error con el mensaje', () => {
    // Producto de prueba (stock 0 para simular rechazo)
    const product = {
      id: 'p1',
      name: 'Capuchino',
      price: 55,
      stock: 0,
      active: true,
      createdAt: '',
      updatedAt: '',
    };

    /**
     * Simulamos que SalesLogicService rechaza el addToCart.
     * Esto nos permite probar que el componente:
     * - NO modifica el carrito
     * - SÍ muestra error (toast)
     */
    (salesLogic as any).addToCart = (cart: any[], _p: any) => ({
      ok: false,
      cart,
      reason: 'OUT_OF_STOCK',
      message: 'No hay stock disponible.',
    });

    // Carrito inicial vacío
    component.cart = [];

    // Acción
    component.addToCart(product as any);

    // Assert: carrito sigue igual
    expect(component.cart.length).toBe(0);

    // Assert: se avisó al usuario
    expect(toast.lastError).toContain('No hay stock disponible.');
  });

  it('addToCart(): si SalesLogicService acepta (ok=true), actualiza carrito y NO lanza toast.error', () => {
    const product = {
      id: 'p1',
      name: 'Capuchino',
      price: 55,
      stock: 10,
      active: true,
      createdAt: '',
      updatedAt: '',
    };

    /**
     * Simulamos que la lógica sí agrega el item y devuelve un carrito nuevo.
     * Con eso verificamos que el componente realmente usa result.cart.
     */
    (salesLogic as any).addToCart = (cart: any[], p: any) => ({
      ok: true,
      cart: [
        ...cart,
        {
          product: p,
          quantity: 1,
          lineTotal: p.price,
        },
      ],
    });

    component.cart = [];

    component.addToCart(product as any);

    // Assert: ahora hay 1 item
    expect(component.cart.length).toBe(1);
    expect(component.cart[0].product.id).toBe('p1');
    expect(component.cart[0].quantity).toBe(1);

    // Assert: no hubo error
    expect(toast.lastError).toBe('');
  });
});
