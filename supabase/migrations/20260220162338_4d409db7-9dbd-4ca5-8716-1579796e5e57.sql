
-- 1. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Role enum & user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. User permissions table
CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  can_add BOOLEAN NOT NULL DEFAULT false,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  is_blocked BOOLEAN NOT NULL DEFAULT false
);
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- 4. Security definer functions (avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE _permission
    WHEN 'can_add' THEN COALESCE((SELECT can_add FROM public.user_permissions WHERE user_id = _user_id), false)
    WHEN 'can_edit' THEN COALESCE((SELECT can_edit FROM public.user_permissions WHERE user_id = _user_id), false)
    WHEN 'can_delete' THEN COALESCE((SELECT can_delete FROM public.user_permissions WHERE user_id = _user_id), false)
    ELSE false
  END
$$;

CREATE OR REPLACE FUNCTION public.is_blocked(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_blocked FROM public.user_permissions WHERE user_id = _user_id), false)
$$;

-- 5. RLS policies for profiles
CREATE POLICY "Authenticated can view profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "System can insert profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 6. RLS policies for user_roles
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- 7. RLS policies for user_permissions
CREATE POLICY "Admins can manage all permissions"
  ON public.user_permissions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own permissions"
  ON public.user_permissions FOR SELECT
  USING (auth.uid() = user_id);

-- 8. Update products RLS with permission-based access
DROP POLICY IF EXISTS "Authenticated users can view non-deleted products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;

CREATE POLICY "Non-blocked users can view products"
  ON public.products FOR SELECT
  USING (auth.uid() IS NOT NULL AND NOT public.is_blocked(auth.uid()));

CREATE POLICY "Users with add perm or admin can insert"
  ON public.products FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND NOT public.is_blocked(auth.uid())
    AND (public.has_role(auth.uid(), 'admin') OR public.has_permission(auth.uid(), 'can_add'))
  );

CREATE POLICY "Users with edit/delete perm or admin can update"
  ON public.products FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND NOT public.is_blocked(auth.uid())
    AND (public.has_role(auth.uid(), 'admin') OR public.has_permission(auth.uid(), 'can_edit') OR public.has_permission(auth.uid(), 'can_delete'))
  );

-- 9. Update price_history RLS
DROP POLICY IF EXISTS "Authenticated users can view price history" ON public.price_history;
DROP POLICY IF EXISTS "Authenticated users can insert price history" ON public.price_history;
DROP POLICY IF EXISTS "Authenticated users can update price history" ON public.price_history;

CREATE POLICY "Non-blocked users can view price history"
  ON public.price_history FOR SELECT
  USING (auth.uid() IS NOT NULL AND NOT public.is_blocked(auth.uid()));

CREATE POLICY "Users with add/edit perm or admin can insert price history"
  ON public.price_history FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND NOT public.is_blocked(auth.uid())
    AND (public.has_role(auth.uid(), 'admin') OR public.has_permission(auth.uid(), 'can_add') OR public.has_permission(auth.uid(), 'can_edit'))
  );

CREATE POLICY "Users with edit perm or admin can update price history"
  ON public.price_history FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND NOT public.is_blocked(auth.uid())
    AND (public.has_role(auth.uid(), 'admin') OR public.has_permission(auth.uid(), 'can_edit'))
  );

-- 10. Auto-create profile + permissions on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  INSERT INTO public.user_permissions (user_id)
  VALUES (NEW.id);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 11. Seed sample products (bypass RLS in migration)
INSERT INTO public.products (product_code, description, unit, is_deleted, stamp_op_type, stamp_op_date) VALUES
  ('PROD-001', 'Elegant silk blouse with rose embroidery', 'pc', false, 'Add', now()),
  ('PROD-002', 'Light floral fragrance with cherry blossom notes', 'pc', false, 'Add', now()),
  ('PROD-003', 'Dainty rose gold hoop earrings', 'pc', false, 'Add', now()),
  ('PROD-004', 'Pink velvet covered lined journal', 'pc', true, 'Delete', now());

INSERT INTO public.price_history (product_code, unit_price, effectivity_date, is_deleted, stamp_op_type, stamp_op_date) VALUES
  ('PROD-001', 89.99, CURRENT_DATE, false, 'Add', now()),
  ('PROD-002', 65.00, CURRENT_DATE, false, 'Add', now()),
  ('PROD-003', 45.00, CURRENT_DATE, false, 'Add', now()),
  ('PROD-004', 24.99, CURRENT_DATE, false, 'Add', now());
