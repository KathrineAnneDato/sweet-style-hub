// Maps to the Supabase `products` table + joined price
export interface Product {
  product_code: string;
  description: string;
  unit: string;
  is_deleted: boolean;
  stamp_op_type: string;
  stamp_op_by: string | null;
  stamp_op_date: string;
  // Derived from latest price_history row
  current_price: number;
}

export interface PriceHistoryRow {
  id: number;
  product_code: string;
  unit_price: number;
  effectivity_date: string;
  stamp_op_type: string;
  stamp_op_by: string | null;
  stamp_op_date: string;
  is_deleted: boolean;
}

export interface ProductFormData {
  product_code: string;
  description: string;
  unit: string;
  unit_price: number;
}

export interface UserPermissions {
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
  is_blocked: boolean;
}
