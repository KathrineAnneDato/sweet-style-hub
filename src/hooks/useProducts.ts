import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product, ProductFormData, PriceHistoryRow, UserPermissions } from '@/types/product';

export function useProducts(userId?: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [permissions, setPermissions] = useState<UserPermissions>({
    can_add: false, can_edit: false, can_delete: false, is_blocked: false,
  });
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user');

  // Fetch user permissions & role
  useEffect(() => {
    if (!userId) return;
    const fetchPerms = async () => {
      const [{ data: perms }, { data: role }] = await Promise.all([
        supabase.from('user_permissions').select('*').eq('user_id', userId).single(),
        supabase.from('user_roles').select('role').eq('user_id', userId).single(),
      ]);
      if (perms) setPermissions(perms as UserPermissions);
      if (role) setUserRole(role.role as 'admin' | 'user');
    };
    fetchPerms();
  }, [userId]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    // Fetch all products with their latest price
    const { data: prods } = await supabase
      .from('products')
      .select('*')
      .order('product_code');

    if (!prods) { setLoading(false); return; }

    // Fetch latest price for each product
    const { data: prices } = await supabase
      .from('price_history')
      .select('*')
      .eq('is_deleted', false)
      .order('effectivity_date', { ascending: false })
      .order('stamp_op_date', { ascending: false });

    const priceMap = new Map<string, number>();
    prices?.forEach(p => {
      if (!priceMap.has(p.product_code)) {
        priceMap.set(p.product_code, Number(p.unit_price));
      }
    });

    const mapped: Product[] = prods.map(p => ({
      product_code: p.product_code,
      description: p.description,
      unit: p.unit,
      is_deleted: p.is_deleted,
      stamp_op_type: p.stamp_op_type,
      stamp_op_by: p.stamp_op_by,
      stamp_op_date: p.stamp_op_date,
      current_price: priceMap.get(p.product_code) ?? 0,
    }));

    setProducts(mapped);
    setLoading(false);
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const addProduct = useCallback(async (data: ProductFormData) => {
    if (!userId) return;
    const { error } = await supabase.from('products').insert({
      product_code: data.product_code,
      description: data.description,
      unit: data.unit,
      stamp_op_type: 'ADD',
      stamp_op_by: userId,
    });
    if (error) throw error;

    // Insert initial price
    await supabase.from('price_history').insert({
      product_code: data.product_code,
      unit_price: data.unit_price,
      stamp_op_type: 'ADD',
      stamp_op_by: userId,
    });

    await fetchProducts();
  }, [userId, fetchProducts]);

  const updateProduct = useCallback(async (productCode: string, data: Partial<ProductFormData>) => {
    if (!userId) return;
    const updates: Record<string, unknown> = {
      stamp_op_type: 'EDIT',
      stamp_op_by: userId,
      stamp_op_date: new Date().toISOString(),
    };
    if (data.description !== undefined) updates.description = data.description;
    if (data.unit !== undefined) updates.unit = data.unit;

    await supabase.from('products').update(updates).eq('product_code', productCode);

    // If price changed, add price history row
    if (data.unit_price !== undefined) {
      await supabase.from('price_history').insert({
        product_code: productCode,
        unit_price: data.unit_price,
        stamp_op_type: 'EDIT',
        stamp_op_by: userId,
      });
    }

    await fetchProducts();
  }, [userId, fetchProducts]);

  const softDeleteProduct = useCallback(async (productCode: string) => {
    if (!userId) return;
    await supabase.from('products').update({
      is_deleted: true,
      stamp_op_type: 'DELETE',
      stamp_op_by: userId,
      stamp_op_date: new Date().toISOString(),
    }).eq('product_code', productCode);
    await fetchProducts();
  }, [userId, fetchProducts]);

  const restoreProduct = useCallback(async (productCode: string) => {
    if (!userId) return;
    await supabase.from('products').update({
      is_deleted: false,
      stamp_op_type: 'RECOVER',
      stamp_op_by: userId,
      stamp_op_date: new Date().toISOString(),
    }).eq('product_code', productCode);
    await fetchProducts();
  }, [userId, fetchProducts]);

  const fetchPriceHistory = useCallback(async (productCode: string): Promise<PriceHistoryRow[]> => {
    const { data } = await supabase
      .from('price_history')
      .select('*')
      .eq('product_code', productCode)
      .order('effectivity_date', { ascending: false })
      .order('stamp_op_date', { ascending: false });
    return (data ?? []) as PriceHistoryRow[];
  }, []);

  // Filtered products
  const filteredProducts = products.filter(p => {
    if (!showDeleted && p.is_deleted) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.product_code.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q);
    }
    return true;
  });

  return {
    products: filteredProducts,
    allProducts: products,
    loading,
    searchQuery, setSearchQuery,
    showDeleted, setShowDeleted,
    permissions, userRole,
    addProduct, updateProduct, softDeleteProduct, restoreProduct,
    fetchPriceHistory, refetch: fetchProducts,
  };
}
