import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  ProductsService,
  Product,
  UpdateProductRequest,
  CreateProductRequest,
} from '../../core/services/products/products.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products.component.html',
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  loading = true;
  errorMsg = '';

  //PAGINACION Y BUSQUEDA
  page = 1;
  limit = 20;
  total = 0;
  query = '';
  filterActive: 'true' | 'false' | 'all' = 'all';

  //CREACION DE PRODUCTO
  newName = '';
  newPrice = '';
  newStock = '';
  creating = false;
  createMsg = '';

  // EDICION
  editingId: string | null = null;
  editPrice = '';
  editStock = '';
  saving = false;
  saveMsg = '';

  constructor(private productsService: ProductsService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  //CARGAR PRODUCTOS
  loadProducts() {
    this.loading = true;
    this.errorMsg = '';

    this.productsService
      .getProducts(this.page, this.limit, this.query, this.filterActive)
      .subscribe({
        next: (res) => {
          this.products = res.data;
          this.total = res.total;
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.errorMsg = 'No se pudieron cargar los productos.';
          this.loading = false;
        },
      });
  }

  //BUSCAR
  search() {
    this.page = 1;
    this.loadProducts();
  }

  //CREAR PRODUCTO
  createProduct() {
    this.createMsg = '';

    const priceNum = Number(this.newPrice);
    const stockNum = Number(this.newStock);

    if (this.newName.trim().length < 2) {
      this.createMsg = 'Nombre inválido.';
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      this.createMsg = 'Precio inválido.';
      return;
    }
    if (!Number.isInteger(stockNum) || stockNum < 0) {
      this.createMsg = 'Stock inválido.';
      return;
    }

    const payload: CreateProductRequest = {
      name: this.newName.trim(),
      price: priceNum,
      stock: stockNum,
    };

    this.creating = true;

    this.productsService.createProduct(payload).subscribe({
      next: (created) => {
        this.createMsg = 'Producto creado correctamente.';
        this.newName = '';
        this.newPrice = '';
        this.newStock = '';
        this.creating = false;
        this.loadProducts();
      },
      error: (err) => {
        console.error(err);
        this.createMsg = 'Error al crear producto.';
        this.creating = false;
      },
    });
  }

  //EDITAR
  startEdit(product: Product) {
    this.editingId = product.id;
    this.editPrice = String(product.price);
    this.editStock = String(product.stock);
    this.saveMsg = '';
  }

  cancelEdit() {
    this.editingId = null;
    this.editPrice = '';
    this.editStock = '';
    this.saveMsg = '';
  }

  //GUARDAR CAMBIOS
  saveEdit(product: Product) {
    const priceNum = Number(this.editPrice);
    const stockNum = Number(this.editStock);

    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      this.saveMsg = 'Precio inválido.';
      return;
    }

    if (!Number.isInteger(stockNum) || stockNum < 0) {
      this.saveMsg = 'Stock inválido.';
      return;
    }

    const payload: UpdateProductRequest = {
      price: priceNum,
      stock: stockNum,
    };

    this.saving = true;

    this.productsService.updateProduct(product.id, payload).subscribe({
      next: () => {
        this.saveMsg = 'Cambios guardados.';
        this.saving = false;
        this.cancelEdit();
        this.loadProducts();
      },
      error: (err) => {
        console.error(err);
        this.saveMsg = 'Error al guardar.';
        this.saving = false;
      },
    });
  }

  //ACTIVAR O DESACTIVAR PRODUCTOS
  deactivate(product: Product) {
    this.productsService.deactivateProduct(product.id).subscribe(() => {
      this.loadProducts();
    });
  }

  activate(product: Product) {
    this.productsService.activateProduct(product.id).subscribe(() => {
      this.loadProducts();
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.limit));
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadProducts();
    }
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.loadProducts();
    }
  }
}
