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

  categories: string[] = []; colors: string[] = []; sizes: string[] = [];destaques: string[] = [];
  filters = { categoria: '', color: '', talle: '', destaque:'', precioMax: null as number | null };

  currentPage = 1;
  pageSize = 30; // 10 filas x 3 fotos
  totalPages = 1;

  selectedProduct: Product | null = null;
  activeGalleryImage: string = '';
  hoveredCardId: string | null = null;

// Variables para el Modal de Zoom
  isZoomOpen: boolean = false;
  zoomImageIndex: number = 0;
  sortOrder: string = '';

  constructor(public productService: ProductService) {}

  ngOnInit(): void {
    this.productService.products$.subscribe(data => {
      this.products = data;
        // Generas la lista de destaques aquí mismo cuando llegan los productos
      const lista = data.map(p => p.destaque).filter(d => d && d.trim() !== '');
      this.destaques = [...new Set(lista)];
      this.applyFilters();
    });
    this.productService.getCategories().subscribe(c => this.categories = c);
    this.productService.getColors().subscribe(c => this.colors = c);
    this.productService.getSizes().subscribe(s => this.sizes = s);
  }

  applyFilters(): void {
    // 1. Filtrar los productos
    let result = this.products.filter(p => {
      const currentPrice = p.precioDescuento || p.precioNormal;
      return (!this.filters.categoria || p.categoria === this.filters.categoria) &&
            (!this.filters.color || p.color === this.filters.color) &&
            (!this.filters.talle || p.talle === this.filters.talle) &&
            (!this.filters.destaque || p.destaque === this.filters.destaque) &&
            (!this.filters.precioMax || currentPrice <= this.filters.precioMax);
    });

    // 2. Ordenar los productos filtrados
    if (this.sortOrder === 'precio-asc') {
      result.sort((a, b) => {
        const priceA = a.precioDescuento || a.precioNormal;
        const priceB = b.precioDescuento || b.precioNormal;
        return priceA - priceB; // Menor a Mayor
      });
    } else if (this.sortOrder === 'precio-desc') {
      result.sort((a, b) => {
        const priceA = a.precioDescuento || a.precioNormal;
        const priceB = b.precioDescuento || b.precioNormal;
        return priceB - priceA; // Mayor a Menor
      });
    }

    // 3. Asignar el resultado ordenado y actualizar paginación
    this.filteredProducts = result;
    this.currentPage = 1;
    this.updatePagination();
  }

  resetFilters(): void {
    this.filters = { categoria: '', color: '', talle: '', destaque:'', precioMax: null };
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

// Abre el zoom en una imagen específica (por defecto la actual)
  openZoom(index: number = 0): void {
    if (!this.selectedProduct) return;
    this.zoomImageIndex = index;
    this.isZoomOpen = true;
  }

  closeZoom(): void {
    this.isZoomOpen = false;
  }

  // Obtiene todas las fotos disponibles del producto seleccionado (Principal + Galería)
  get currentProductGallery(): string[] {
    if (!this.selectedProduct) return [];
    const list = [this.selectedProduct.fotoPrincipal];
    if (this.selectedProduct.galeria && this.selectedProduct.galeria.length > 0) {
      list.push(...this.selectedProduct.galeria);
    }
    // Eliminamos duplicados si los hubiera
    return Array.from(new Set(list));
  }

  // Cambia a la imagen anterior en la galería de zoom
  prevZoomImage(event?: Event): void {
    if (event) event.stopPropagation();
    const gallery = this.currentProductGallery;
    if (gallery.length <= 1) return;
    this.zoomImageIndex = (this.zoomImageIndex - 1 + gallery.length) % gallery.length;
  }

  // Cambia a la siguiente imagen en la galería de zoom
  nextZoomImage(event?: Event): void {
    if (event) event.stopPropagation();
    const gallery = this.currentProductGallery;
    if (gallery.length <= 1) return;
    this.zoomImageIndex = (this.zoomImageIndex + 1) % gallery.length;
  }

}