import { SalesComponent } from './sales.component';


describe('SalesComponent (unit-ish)', () => {

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

  const productsApiStub = () => ({
    getProducts: () => ({
      subscribe: () => {},
    }),
  });


  const customersApiStub = () => ({
    searchCustomers: () => ({ subscribe: () => {} }),
    createCustomer: () => ({ subscribe: () => {} }),
  });


  const salesApiStub = () => ({
    called: 0,

    createSale: (_payload: any) => {
      (salesApi as any).called++;
      return { subscribe: () => {} };
    },
  });


  const salesLogicStub = () => ({
    addToCart: (cart: any[], _product: any) => ({ ok: true, cart }),

    setQuantity: (cart: any[], _productId: string, _rawValue: string) => cart,
    removeFromCart: (cart: any[], _productId: string) => cart,
    calculateSubtotal: (cart: any[]) =>
      cart.reduce((sum: number, i: any) => sum + i.lineTotal, 0),
    calculateDiscountPercent: (_purchases: number) => 0,
    calculateDiscountAmount: (subtotal: number, percent: number) =>
      subtotal * (percent / 100),
    calculateTotal: (subtotal: number, discount: number) => subtotal - discount,

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


    component = new SalesComponent(
      productsApiStub() as any,
      customersApiStub() as any,
      salesApi as any,
      salesLogic as any,
      toast as any,
    );
  });


  it('pay(): si el carrito está vacío, NO llama al backend y muestra error', () => {
    component.cart = [];

    component.pay();

    expect((salesApi as any).called).toBe(0);

    expect(toast.lastError).toContain('Agrega al menos un producto');
  });

  it('pay(): con carrito con items, llama al backend con payload armado por SalesLogicService', () => {
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

  /*   component.selectedCustomer = {
      id: 'c1',
      name: 'Cliente Prueba',
      phoneOrEmail: 'cliente@prueba.com',
      purchasesCount: 3,
      createdAt: '',
      updatedAt: '',
    }; */

    let receivedPayload: any = null;

    (salesApi as any).createSale = (payload: any) => {
      (salesApi as any).called++;
      receivedPayload = payload;

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

    component.pay();

    expect((salesApi as any).called).toBe(1);

    expect(receivedPayload).toEqual({
      customerId: 'c1',
      paymentMethod: 'cash',
      items: [{ productId: 'p1', quantity: 2 }],
    });

    expect(component.lastTicket).not.toBeNull();
  });


  it('addToCart(): si SalesLogicService rechaza (ok=false), muestra toast.error con el mensaje', () => {
    const product = {
      id: 'p1',
      name: 'Capuchino',
      price: 55,
      stock: 0,
      active: true,
      createdAt: '',
      updatedAt: '',
    };


    (salesLogic as any).addToCart = (cart: any[], _p: any) => ({
      ok: false,
      cart,
      reason: 'OUT_OF_STOCK',
      message: 'No hay stock disponible.',
    });

    component.cart = [];

    component.addToCart(product as any);

    expect(component.cart.length).toBe(0);

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

    expect(component.cart.length).toBe(1);
    expect(component.cart[0].product.id).toBe('p1');
    expect(component.cart[0].quantity).toBe(1);

    expect(toast.lastError).toBe('');
  });
});
