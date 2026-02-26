import { SalesLogicService, CartItem } from './sales-logic.service';
import { Product } from '../products/products.service';
import { Customer } from '../customers/customers.service';

/**
 * Este archivo prueba SOLO la lógica del carrito y cálculos.
 *
 * Principio:
 * - Sin TestBed
 * - Sin Angular runtime
 * - Sin DOM
 *
 * ¿Por qué?
 * Porque esto corre más rápido, se rompe menos y prueba reglas de negocio reales.
 */

describe('SalesLogicService (unit)', () => {
  let service: SalesLogicService;

  // Helpers: objetos de prueba para no repetir datos en cada test
  const makeProduct = (overrides?: Partial<Product>): Product => ({
    id: 'p1',
    name: 'Capuchino',
    price: 55,
    stock: 10,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  });

  const makeCustomer = (overrides?: Partial<Customer>): Customer => ({
    id: 'c1',
    name: 'Cliente Prueba',
    phoneOrEmail: 'cliente@demo.com',
    purchasesCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  });

  beforeEach(() => {
    // Creamos la clase directo (sin DI) porque es lógica pura
    service = new SalesLogicService();
  });

  // ============================================================
  // addToCart
  // ============================================================

  it('addToCart: debe rechazar si stock < 1 (OUT_OF_STOCK)', () => {
    const product = makeProduct({ stock: 0 });
    const cart: CartItem[] = [];

    const result = service.addToCart(cart, product);

    expect(result.ok).toBeFalse();
    if (!result.ok) {
      expect(result.reason).toBe('OUT_OF_STOCK');
      expect(result.cart.length).toBe(0);
    }
  });

  it('addToCart: debe agregar un producto nuevo con quantity=1', () => {
    const product = makeProduct({ stock: 10 });
    const cart: CartItem[] = [];

    const result = service.addToCart(cart, product);

    expect(result.ok).toBeTrue();
    if (result.ok) {
      expect(result.cart.length).toBe(1);
      expect(result.cart[0].product.id).toBe(product.id);
      expect(result.cart[0].quantity).toBe(1);
      expect(result.cart[0].lineTotal).toBe(product.price);
    }
  });

  it('addToCart: si el producto ya existe, incrementa quantity en 1', () => {
    const product = makeProduct({ stock: 10, price: 50 });

    const cart: CartItem[] = [
      { product, quantity: 1, lineTotal: 50 },
    ];

    const result = service.addToCart(cart, product);

    expect(result.ok).toBeTrue();
    if (result.ok) {
      expect(result.cart.length).toBe(1);
      expect(result.cart[0].quantity).toBe(2);
      expect(result.cart[0].lineTotal).toBe(100);
    }
  });

  it('addToCart: debe rechazar si excede stock (EXCEEDS_STOCK)', () => {
    const product = makeProduct({ stock: 2, price: 50 });

    const cart: CartItem[] = [
      { product, quantity: 2, lineTotal: 100 },
    ];

    const result = service.addToCart(cart, product);

    expect(result.ok).toBeFalse();
    if (!result.ok) {
      expect(result.reason).toBe('EXCEEDS_STOCK');
      expect(result.cart[0].quantity).toBe(2); // no cambió
    }
  });

  // ============================================================
  // setQuantity
  // ============================================================

  it('setQuantity: si rawValue no es entero válido, fuerza quantity=1', () => {
    const product = makeProduct({ stock: 10, price: 20 });

    const cart: CartItem[] = [
      { product, quantity: 3, lineTotal: 60 },
    ];

    const updated = service.setQuantity(cart, product.id, 'abc');

    expect(updated[0].quantity).toBe(1);
    expect(updated[0].lineTotal).toBe(20);
  });

  it('setQuantity: si rawValue < 1, fuerza quantity=1', () => {
    const product = makeProduct({ stock: 10, price: 20 });

    const cart: CartItem[] = [
      { product, quantity: 3, lineTotal: 60 },
    ];

    const updated = service.setQuantity(cart, product.id, '0');

    expect(updated[0].quantity).toBe(1);
    expect(updated[0].lineTotal).toBe(20);
  });

  it('setQuantity: si rawValue excede stock, topa quantity=stock', () => {
    const product = makeProduct({ stock: 5, price: 20 });

    const cart: CartItem[] = [
      { product, quantity: 1, lineTotal: 20 },
    ];

    const updated = service.setQuantity(cart, product.id, '99');

    expect(updated[0].quantity).toBe(5);
    expect(updated[0].lineTotal).toBe(100);
  });

  it('setQuantity: si rawValue es válido, actualiza quantity y lineTotal', () => {
    const product = makeProduct({ stock: 10, price: 20 });

    const cart: CartItem[] = [
      { product, quantity: 1, lineTotal: 20 },
    ];

    const updated = service.setQuantity(cart, product.id, '4');

    expect(updated[0].quantity).toBe(4);
    expect(updated[0].lineTotal).toBe(80);
  });

  // ============================================================
  // removeFromCart / clearCart
  // ============================================================

  it('removeFromCart: elimina el item por productId', () => {
    const p1 = makeProduct({ id: 'p1' });
    const p2 = makeProduct({ id: 'p2', name: 'Latte' });

    const cart: CartItem[] = [
      { product: p1, quantity: 1, lineTotal: p1.price },
      { product: p2, quantity: 2, lineTotal: p2.price * 2 },
    ];

    const updated = service.removeFromCart(cart, 'p1');

    expect(updated.length).toBe(1);
    expect(updated[0].product.id).toBe('p2');
  });

  it('clearCart: regresa carrito vacío', () => {
    const product = makeProduct();
    const cart: CartItem[] = [{ product, quantity: 1, lineTotal: product.price }];

    const cleared = service.clearCart();

    expect(cleared.length).toBe(0);
  });

  // ============================================================
  // Totales y descuentos
  // ============================================================

  it('calculateSubtotal: suma lineTotal de todo el carrito', () => {
    const p1 = makeProduct({ id: 'p1', price: 10 });
    const p2 = makeProduct({ id: 'p2', price: 20 });

    const cart: CartItem[] = [
      { product: p1, quantity: 2, lineTotal: 20 },
      { product: p2, quantity: 1, lineTotal: 20 },
    ];

    const subtotal = service.calculateSubtotal(cart);

    expect(subtotal).toBe(40);
  });

  it('calculateDiscountPercent: aplica reglas del MVP', () => {
    expect(service.calculateDiscountPercent(0)).toBe(0);
    expect(service.calculateDiscountPercent(1)).toBe(5);
    expect(service.calculateDiscountPercent(3)).toBe(5);
    expect(service.calculateDiscountPercent(4)).toBe(10);
    expect(service.calculateDiscountPercent(7)).toBe(10);
    expect(service.calculateDiscountPercent(8)).toBe(15);
    expect(service.calculateDiscountPercent(99)).toBe(15);
  });

  it('calculateDiscountAmount y calculateTotal: calculan monto y total', () => {
    const subtotal = 200;
    const percent = 10;

    const discountAmount = service.calculateDiscountAmount(subtotal, percent);
    const total = service.calculateTotal(subtotal, discountAmount);

    expect(discountAmount).toBe(20);
    expect(total).toBe(180);
  });

  // ============================================================
  // buildCreateSalePayload
  // ============================================================

  it('buildCreateSalePayload: arma payload con customerId null cuando no hay cliente', () => {
    const product = makeProduct({ id: 'p1' });
    const cart: CartItem[] = [{ product, quantity: 2, lineTotal: 110 }];

    const payload = service.buildCreateSalePayload(cart, null, 'cash');

    expect(payload.customerId).toBeNull();
    expect(payload.paymentMethod).toBe('cash');
    expect(payload.items.length).toBe(1);
    expect(payload.items[0].productId).toBe('p1');
    expect(payload.items[0].quantity).toBe(2);
  });

  it('buildCreateSalePayload: arma payload con customerId cuando hay cliente', () => {
    const product = makeProduct({ id: 'p1' });
    const customer = makeCustomer({ id: 'c99' });
    const cart: CartItem[] = [{ product, quantity: 1, lineTotal: 55 }];

    const payload = service.buildCreateSalePayload(cart, customer, 'card');

    expect(payload.customerId).toBe('c99');
    expect(payload.paymentMethod).toBe('card');
    expect(payload.items[0].productId).toBe('p1');
    expect(payload.items[0].quantity).toBe(1);
  });
});
