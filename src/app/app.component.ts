import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, Product } from './product.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  pagedProducts: Product[] = [];

  categories: string[] = []; colors: string[] = []; sizes: string[] = [];
  filters = { categoria: '', color: '', talle: '', precioMax: null as number | null };

  currentPage = 1;
  pageSize = 30; // 10 filas x 3 fotos
  totalPages = 1;

  selectedProduct: Product | null = null;
  activeGalleryImage: string = '';
  hoveredCardId: string | null = null;

  constructor(public productService: ProductService) {}

  ngOnInit(): void {
    this.productService.products$.subscribe(data => {
      this.products = data;
      this.applyFilters();
    });
    this.productService.getCategories().subscribe(c => this.categories = c);
    this.productService.getColors().subscribe(c => this.colors = c);
    this.productService.getSizes().subscribe(s => this.sizes = s);
  }

  applyFilters(): void {
    this.filteredProducts = this.products.filter(p => {
      const currentPrice = p.precioDescuento || p.precioNormal;
      return (!this.filters.categoria || p.categoria === this.filters.categoria) &&
             (!this.filters.color || p.color === this.filters.color) &&
             (!this.filters.talle || p.talle === this.filters.talle) &&
             (!this.filters.precioMax || currentPrice <= this.filters.precioMax);
    });
    this.currentPage = 1;
    this.updatePagination();
  }

  resetFilters(): void {
    this.filters = { categoria: '', color: '', talle: '', precioMax: null };
    this.applyFilters();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredProducts.length / this.pageSize) || 1;
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedProducts = this.filteredProducts.slice(start, start + this.pageSize);
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  openProductDetail(product: Product): void {
    this.selectedProduct = product;
    this.activeGalleryImage = product.fotoPrincipal;
  }

  closeModal(): void {
    this.selectedProduct = null;
  }
}