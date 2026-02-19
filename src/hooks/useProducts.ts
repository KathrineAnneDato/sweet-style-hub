import { useState, useCallback, useMemo } from 'react';
import { Product, ProductFormData } from '@/types/product';

const generateId = () => Math.random().toString(36).substring(2, 15);

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: generateId(),
    name: 'Silk Rose Blouse',
    description: 'Elegant silk blouse with rose embroidery',
    price: 89.99,
    category: 'Clothing',
    quantity: 25,
    barcode: '1234567890123',
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: 'Cherry Blossom Perfume',
    description: 'Light floral fragrance with cherry blossom notes',
    price: 65.00,
    category: 'Beauty & Health',
    quantity: 50,
    barcode: '1234567890124',
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: 'Rose Gold Earrings',
    description: 'Dainty rose gold hoop earrings',
    price: 45.00,
    category: 'Other',
    quantity: 100,
    barcode: '1234567890125',
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: 'Velvet Journal',
    description: 'Pink velvet covered lined journal',
    price: 24.99,
    category: 'Books & Stationery',
    quantity: 0,
    barcode: '1234567890126',
    isDeleted: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(SAMPLE_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showDeleted, setShowDeleted] = useState(false);

  const addProduct = useCallback((data: ProductFormData) => {
    const newProduct: Product = {
      ...data,
      id: generateId(),
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProducts(prev => [newProduct, ...prev]);
  }, []);

  const updateProduct = useCallback((id: string, data: ProductFormData) => {
    setProducts(prev =>
      prev.map(p =>
        p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
      )
    );
  }, []);

  const softDeleteProduct = useCallback((id: string) => {
    setProducts(prev =>
      prev.map(p =>
        p.id === id ? { ...p, isDeleted: true, updatedAt: new Date().toISOString() } : p
      )
    );
  }, []);

  const restoreProduct = useCallback((id: string) => {
    setProducts(prev =>
      prev.map(p =>
        p.id === id ? { ...p, isDeleted: false, updatedAt: new Date().toISOString() } : p
      )
    );
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (!showDeleted && p.isDeleted) return false;
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.barcode.includes(q) ||
          p.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, searchQuery, categoryFilter, showDeleted]);

  return {
    products: filteredProducts,
    allProducts: products,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    showDeleted,
    setShowDeleted,
    addProduct,
    updateProduct,
    softDeleteProduct,
    restoreProduct,
  };
}
