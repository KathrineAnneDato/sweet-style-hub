import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, RotateCcw, LogOut, ShoppingBag,
  Package, MoreHorizontal, History, Edit2, Trash2, FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import ProductDialog from '@/components/ProductDialog';
import PriceHistoryDialog from '@/components/PriceHistoryDialog';
import UserManagement from '@/components/UserManagement';
import { useProducts } from '@/hooks/useProducts';
import { Product, ProductFormData } from '@/types/product';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DashboardProps {
  user: { id: string; email: string; name: string; role: 'admin' | 'user' };
  onLogout: () => void;
}

const Dashboard = ({ user, onLogout }: DashboardProps) => {
  const {
    products, allProducts, loading, searchQuery, setSearchQuery,
    permissions, userRole,
    addProduct, updateProduct, softDeleteProduct, restoreProduct,
    fetchPriceHistory,
  } = useProducts(user.id);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [priceHistoryProduct, setPriceHistoryProduct] = useState<Product | null>(null);
  const [profilesMap, setProfilesMap] = useState<Map<string, string>>(new Map());

  const isAdmin = userRole === 'admin';
  const canAdd = isAdmin || permissions.can_add;
  const canEdit = isAdmin || permissions.can_edit;
  const canDelete = isAdmin || permissions.can_delete;

  useEffect(() => {
    supabase.from('profiles').select('id, full_name, email').then(({ data }) => {
      const map = new Map<string, string>();
      data?.forEach(p => map.set(p.id, p.full_name || p.email));
      setProfilesMap(map);
    });
  }, []);

  const handleSave = async (data: ProductFormData) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.product_code, data);
        toast.success('Product updated');
      } else {
        await addProduct(data);
        toast.success('Product added');
      }
      setEditingProduct(null);
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      await softDeleteProduct(deleteTarget.product_code);
      toast.success('Product archived');
      setDeleteTarget(null);
    }
  };

  const handleRestore = async (product: Product) => {
    await restoreProduct(product.product_code);
    toast.success('Product restored');
  };

  const exportProductList = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Product List', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 27);

    const active = allProducts.filter(p => !p.is_deleted);
    autoTable(doc, {
      startY: 33,
      head: [['Code', 'Description', 'Unit', 'Price']],
      body: active.map(p => [
        p.product_code,
        p.description,
        p.unit,
        `$${p.current_price.toFixed(2)}`,
      ]),
    });

    doc.save('product-list.pdf');
    toast.success('PDF exported');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-card/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-primary" />
            </div>
            <h1 className="font-display text-xl font-bold text-foreground">Product Manager</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              <span className="text-foreground font-medium">{user.name || user.email}</span>
              <Badge variant="secondary" className="ml-2 text-xs">{userRole}</Badge>
            </span>
            <Button variant="ghost" size="sm" onClick={onLogout} className="rounded-xl text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4 mr-1" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {isAdmin ? (
          <Tabs defaultValue="products">
            <TabsList className="rounded-xl">
              <TabsTrigger value="products" className="rounded-lg gap-1.5">
                <Package className="w-4 h-4" /> Products
              </TabsTrigger>
              <TabsTrigger value="users" className="rounded-lg gap-1.5">
                Users
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="space-y-6 mt-4">
              <ProductsSection
                products={products}
                allProducts={allProducts}
                loading={loading}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                isAdmin={isAdmin}
                canAdd={canAdd}
                canEdit={canEdit}
                canDelete={canDelete}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={setDeleteTarget}
                onRestore={handleRestore}
                onPriceHistory={setPriceHistoryProduct}
                onExport={exportProductList}
              />
            </TabsContent>

            <TabsContent value="users" className="mt-4">
              <UserManagement />
            </TabsContent>
          </Tabs>
        ) : (
          <ProductsSection
            products={products}
            allProducts={allProducts}
            loading={loading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isAdmin={isAdmin}
            canAdd={canAdd}
            canEdit={canEdit}
            canDelete={canDelete}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={setDeleteTarget}
            onRestore={handleRestore}
            onPriceHistory={setPriceHistoryProduct}
            onExport={exportProductList}
          />
        )}
      </main>

      {/* Dialogs */}
      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editingProduct}
        onSave={handleSave}
      />

      <PriceHistoryDialog
        open={!!priceHistoryProduct}
        onOpenChange={open => !open && setPriceHistoryProduct(null)}
        product={priceHistoryProduct}
        fetchHistory={fetchPriceHistory}
        profilesMap={profilesMap}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="border-primary/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Archive this product?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.description}</strong> ({deleteTarget?.product_code}) will be soft-deleted and can be restored by an admin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="rounded-xl bg-destructive hover:bg-destructive/90">
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

/* ---------- Products sub-section ---------- */

interface ProductsSectionProps {
  products: Product[];
  allProducts: Product[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isAdmin: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onAdd: () => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
  onRestore: (p: Product) => void;
  onPriceHistory: (p: Product) => void;
  onExport: () => void;
}

const ProductsSection = ({
  products, loading, searchQuery, setSearchQuery,
  isAdmin, canAdd, canEdit, canDelete,
  onAdd, onEdit, onDelete, onRestore, onPriceHistory, onExport,
}: ProductsSectionProps) => (
  <>
    {/* Page Title & Actions */}
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Product Management</h2>
        <p className="text-sm text-muted-foreground">Control inventory, pricing, and product history</p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={onExport} className="rounded-xl gap-1.5">
          <FileText className="w-4 h-4" /> Export List
        </Button>
        {canAdd && (
          <Button onClick={onAdd} className="rounded-xl shadow-md shadow-primary/20 gap-1.5">
            <Plus className="w-4 h-4" /> Add Product
          </Button>
        )}
      </div>
    </div>

    {/* Search */}
    <Card className="border-primary/10">
      <CardContent className="p-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 rounded-xl border-primary/20 bg-background/60"
          />
        </div>
      </CardContent>
    </Card>

    {/* Product Table */}
    <Card className="border-primary/10 overflow-hidden">
      <CardHeader className="pb-0 px-6 pt-5">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          Products ({products.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 pt-4">
        {loading ? (
          <p className="text-center py-12 text-muted-foreground">Loading products...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="font-semibold">Product</TableHead>
                <TableHead className="font-semibold">Unit</TableHead>
                <TableHead className="font-semibold text-right">Price</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map(product => (
                    <motion.tr
                      key={product.product_code}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`border-b border-border/40 transition-colors hover:bg-muted/30 ${
                        product.is_deleted ? 'opacity-40' : ''
                      }`}
                    >
                      <TableCell>
                        <div>
                          <p className={`font-medium ${product.is_deleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {product.description}
                          </p>
                          <p className="text-xs text-muted-foreground">{product.product_code}</p>
                        </div>
                      </TableCell>
                      <TableCell>{product.unit}</TableCell>
                      <TableCell className="text-right font-medium">
                        ${product.current_price.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {product.is_deleted ? (
                          <Badge variant="outline" className="rounded-lg border-destructive/30 text-destructive">
                            Archived
                          </Badge>
                        ) : (
                          <Badge className="rounded-lg bg-primary/10 text-primary border-0 hover:bg-primary/15">
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {product.is_deleted && isAdmin ? (
                          <Button size="sm" variant="ghost" onClick={() => onRestore(product)}
                            className="rounded-lg text-primary hover:text-primary hover:bg-primary/10">
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        ) : !product.is_deleted ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost" className="rounded-lg">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Product Options</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => onPriceHistory(product)} className="gap-2">
                                <History className="w-4 h-4" /> Price History
                              </DropdownMenuItem>
                              {canEdit && (
                                <DropdownMenuItem onClick={() => onEdit(product)} className="gap-2">
                                  <Edit2 className="w-4 h-4" /> Edit Details
                                </DropdownMenuItem>
                              )}
                              {canDelete && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => onDelete(product)}
                                    className="gap-2 text-destructive focus:text-destructive">
                                    <Trash2 className="w-4 h-4" /> Delete Product
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : null}
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  </>
);

export default Dashboard;
