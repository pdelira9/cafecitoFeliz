import { Injectable } from '@angular/core';
import { Product } from '../products/products.service';
import { Customer } from '../customers/customers.service';
import { CreateSaleRequest } from './sales.service';


export type CartItem = {
  product: Product;
  quantity: number;
  lineTotal: number;
};


export type CartActionResult =
  | { ok: true; cart: CartItem[] }
  | {
      ok: false;
      cart: CartItem[];
      reason: 'OUT_OF_STOCK' | 'EXCEEDS_STOCK';
      message: string;
    };

@Injectable({ providedIn: 'root' })
export class SalesLogicService {

  addToCart(cart: CartItem[], product: Product): CartActionResult {
    if (product.stock < 1) {
      return {
        ok: false,
        cart,
        reason: 'OUT_OF_STOCK',
        message: 'No hay stock disponible.',
      };
    }

    const existing = cart.find((i) => i.product.id === product.id);

    if (existing) {
      const nextQty = existing.quantity + 1;

      if (nextQty > product.stock) {
        return {
          ok: false,
          cart,
          reason: 'EXCEEDS_STOCK',
          message: `No puedes exceder el stock (${product.stock}).`,
        };
      }

      const updated = cart.map((i) => {
        if (i.product.id !== product.id) return i;

        const quantity = nextQty;
        return {
          ...i,
          quantity,
          lineTotal: quantity * i.product.price,
        };
      });

      return { ok: true, cart: updated };
    }

    const created: CartItem = {
      product,
      quantity: 1,
      lineTotal: product.price,
    };

    return { ok: true, cart: [...cart, created] };
  }


  setQuantity(cart: CartItem[], productId: string, rawValue: string): CartItem[] {
    const item = cart.find((i) => i.product.id === productId);
    if (!item) return cart;

    const qty = Number(rawValue);

    let normalizedQty = 1;

    if (Number.isInteger(qty) && qty >= 1) {
      normalizedQty = qty;
    }

    if (normalizedQty > item.product.stock) {
      normalizedQty = item.product.stock;
    }

    return cart.map((i) => {
      if (i.product.id !== productId) return i;

      return {
        ...i,
        quantity: normalizedQty,
        lineTotal: normalizedQty * i.product.price,
      };
    });
  }


  removeFromCart(cart: CartItem[], productId: string): CartItem[] {
    return cart.filter((i) => i.product.id !== productId);
  }


  clearCart(): CartItem[] {
    return [];
  }


  calculateSubtotal(cart: CartItem[]): number {
    return cart.reduce((sum, i) => sum + i.lineTotal, 0);
  }

  /**
   * calculateDiscountPercent
   * Regla de descuento
   *
   * - 0 compras => 0%
   * - 1..3 => 5%
   * - 4..7 => 10%
   * - 8+ => 15%
   */
  calculateDiscountPercent(purchasesCount: number): number {
    if (purchasesCount === 0) return 0;
    if (purchasesCount >= 1 && purchasesCount <= 3) return 5;
    if (purchasesCount >= 4 && purchasesCount <= 7) return 10;
    if (purchasesCount >= 8) return 15;
    return 0;
  }

   //Convierte porcentaje a monto basado en el subtotal
  
  calculateDiscountAmount(subtotal: number, discountPercent: number): number {
    return subtotal * (discountPercent / 100);
  }


  calculateTotal(subtotal: number, discountAmount: number): number {
    return subtotal - discountAmount;
  }


  buildCreateSalePayload(
    cart: CartItem[],
    customer: Customer | null,
    paymentMethod: 'cash' | 'card' | 'transfer' = 'cash'
  ): CreateSaleRequest {
    return {
      customerId: customer ? customer.id : null,
      paymentMethod,
      items: cart.map((i) => ({
        productId: i.product.id,
        quantity: i.quantity,
      })),
    };
  }
}
