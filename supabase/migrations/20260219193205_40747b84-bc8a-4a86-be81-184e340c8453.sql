
-- Products table
CREATE TABLE public.products (
  product_code TEXT PRIMARY KEY,
  description TEXT NOT NULL DEFAULT '',
  unit TEXT NOT NULL DEFAULT 'pc',
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  stamp_op_type TEXT NOT NULL DEFAULT 'Add',
  stamp_op_by UUID REFERENCES auth.users(id),
  stamp_op_date TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view non-deleted products"
  ON public.products FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert products"
  ON public.products FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND stamp_op_by = auth.uid());

CREATE POLICY "Authenticated users can update products"
  ON public.products FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (stamp_op_by = auth.uid());

-- PriceHistory table
CREATE TABLE public.price_history (
  id SERIAL PRIMARY KEY,
  product_code TEXT NOT NULL REFERENCES public.products(product_code) ON DELETE CASCADE,
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  effectivity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  stamp_op_type TEXT NOT NULL DEFAULT 'Add',
  stamp_op_by UUID REFERENCES auth.users(id),
  stamp_op_date TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view price history"
  ON public.price_history FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert price history"
  ON public.price_history FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND stamp_op_by = auth.uid());

CREATE POLICY "Authenticated users can update price history"
  ON public.price_history FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (stamp_op_by = auth.uid());

-- Index for finding current price efficiently
CREATE INDEX idx_price_history_product_date ON public.price_history(product_code, effectivity_date DESC);
