import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map } from 'rxjs';

export interface Product {
  codigoInterno: string;
  descripcion: string;
  categoria: string;
  color: string;
  talle: string;
  precioNormal: number;
  precioDescuento?: number;
  fotoPrincipal: string;
  fotoHover: string;
  galeria: string[];
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private productsSubject = new BehaviorSubject<Product[]>([]);
  public products$ = this.productsSubject.asObservable();
  
  private dataUrl = 'assets/data/products.json';
  public whatsappPhone = '5493884323381';

  constructor(private http: HttpClient) {
    this.loadProducts();
  }

  public loadProductsOld(): void {
    this.http.get<Product[]>(this.dataUrl).subscribe({
      next: (data) => this.productsSubject.next(data),
      error: (err) => console.error('Error cargando JSON:', err)
    });
  }

    // Reemplazá esta URL por el link de tu Google Sheet publicado como CSV
  private csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQnsRvtT9Zqf0VHAImij-6w_qkvuUqeFhiJL8bS-PJFA3c1A031vsNCEG0kSkjXdGfpzBP04CAmK7lx/pub?gid=0&single=true&output=csv&t=' + new Date().getTime();

  public loadProducts(): void {
    this.http.get(this.csvUrl, { responseType: 'text' }).subscribe({
      next: (csvData) => {
        const parsedProducts = this.parseCsv(csvData);
        this.productsSubject.next(parsedProducts);
      },
      error: (err) => console.error('Error al cargar datos desde Google Sheets:', err)
    });
  }

  private parseCsv(csvText: string): Product[] {
  const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length <= 1) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const products: Product[] = [];

  // Función helper para limpiar URLs y texto de comillas dobles extras
  const cleanStr = (val: string) => {
    if (!val) return '';
    return val.replace(/^["']+|["']+$|["']/g, '').trim();
  };

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    if (values.length < headers.length) continue;

    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    const fotoPrin = cleanStr(row.fotoPrincipal);
    const fotoHov = cleanStr(row.fotoHover);

    products.push({
      codigoInterno: cleanStr(row.codigoInterno),
      descripcion: cleanStr(row.descripcion),
      categoria: cleanStr(row.categoria),
      color: cleanStr(row.color),
      talle: cleanStr(row.talle),
      precioNormal: Number(cleanStr(row.precioNormal)) || 0,
      precioDescuento: cleanStr(row.precioDescuento) ? Number(cleanStr(row.precioDescuento)) : undefined,
      fotoPrincipal: fotoPrin,
      fotoHover: fotoHov || fotoPrin,
      galeria: row.galeria ? row.galeria.split(',').map((img: string) => cleanStr(img)).filter((x: string) => x) : []
    });
  }

  return products;
}


  public getCategories(): Observable<string[]> {
    return this.products$.pipe(map(p => [...new Set(p.map(x => x.categoria))]));
  }
  public getColors(): Observable<string[]> {
    return this.products$.pipe(map(p => [...new Set(p.map(x => x.color))]));
  }
  public getSizes(): Observable<string[]> {
    return this.products$.pipe(map(p => [...new Set(p.map(x => x.talle))]));
  }

  public buildWhatsAppLink(product: Product): string {
    const precio = product.precioDescuento || product.precioNormal;
    const msg = `Hola Mainumby! 👋 Me interesa comprar:\n\n` +
                `📌 *${product.descripcion}*\n` +
                `🏷️ Cód: ${product.codigoInterno}\n` +
                `🎨 Color: ${product.color} | Talle: ${product.talle}\n` +
                `💰 Precio: $${precio}\n\n` +
                `¿Tienen stock?`;
    return `https://wa.me/${this.whatsappPhone}?text=${encodeURIComponent(msg)}`;
  }
}