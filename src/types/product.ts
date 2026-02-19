export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  quantity: number;
  barcode: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProductFormData = Omit<Product, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt'>;

export const CATEGORIES = [
  'Electronics',
  'Clothing',
  'Food & Beverages',
  'Home & Garden',
  'Beauty & Health',
  'Sports & Outdoors',
  'Toys & Games',
  'Books & Stationery',
  'Other',
] as const;
