import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Edit2, Trash2, RotateCcw, LogOut, ShoppingBag,
  Package, AlertTriangle, Heart, Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import ProductDialog from '@/components/ProductDialog';
import { useProducts } from '@/hooks/useProducts';
import { Product, ProductFormData, CATEGORIES } from '@/types/product';

interface DashboardProps {
  userName: string;
  onLogout: () => void;
}

const Dashboard = ({ userName, onLogout }: DashboardProps) => {
  const {
    products, allProducts, searchQuery, setSearchQuery,
    categoryFilter, setCategoryFilter, showDeleted, setShowDeleted,
    addProduct, updateProduct, softDeleteProduct, restoreProduct,
  } = useProducts();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const activeCount = allProducts.filter(p => !p.isDeleted).length;
  const deletedCount = allProducts.filter(p => p.isDeleted).length;
  const lowStockCount = allProducts.filter(p => !p.isDeleted && p.quantity <= 5).length;

  const handleSave = (data: ProductFormData) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, data);
    } else {
      addProduct(data);
    }
    setEditingProduct(null);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      softDeleteProduct(deleteTarget.id);
      setDeleteTarget(null);
    }
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
              Hey, <span className="text-foreground font-medium">{userName}</span> 💖
            </span>
            <Button variant="ghost" size="sm" onClick={onLogout} className="rounded-xl text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4 mr-1" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Active Products', value: activeCount, icon: Package, color: 'text-primary' },
            { label: 'Low Stock', value: lowStockCount, icon: AlertTriangle, color: 'text-gold' },
            { label: 'Archived', value: deletedCount, icon: Trash2, color: 'text-muted-foreground' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="border-primary/10 hover:border-primary/25 transition-colors">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="w-11 h-11 rounded-xl bg-primary/8 flex items-center justify-center">
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Toolbar */}
        <Card className="border-primary/10">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, barcode, or description..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 rounded-xl border-primary/20 bg-background/60"
                />
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-44 rounded-xl border-primary/20 bg-background/60">
                    <Filter className="w-4 h-4 mr-1 text-muted-foreground" />
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Switch id="show-deleted" checked={showDeleted} onCheckedChange={setShowDeleted} />
                  <Label htmlFor="show-deleted" className="text-sm text-muted-foreground whitespace-nowrap">
                    Show archived
                  </Label>
                </div>
                <Button onClick={handleAdd} className="rounded-xl shadow-md shadow-primary/20">
                  <Plus className="w-4 h-4 mr-1" /> Add Product
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Table */}
        <Card className="border-primary/10 overflow-hidden">
          <CardHeader className="pb-0 px-6 pt-5">
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" />
              Products ({products.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-4">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="font-semibold">Product</TableHead>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold text-right">Price</TableHead>
                  <TableHead className="font-semibold text-right">Qty</TableHead>
                  <TableHead className="font-semibold">Barcode</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        No products found
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product) => (
                      <motion.tr
                        key={product.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`border-b border-border/40 transition-colors hover:bg-muted/30 ${
                          product.isDeleted ? 'opacity-50' : ''
                        }`}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">{product.name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="rounded-lg font-normal">
                            {product.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${product.price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={product.quantity <= 5 && !product.isDeleted ? 'text-destructive font-semibold' : ''}>
                            {product.quantity}
                          </span>
                          {product.quantity <= 5 && !product.isDeleted && (
                            <Badge variant="outline" className="ml-2 text-xs border-destructive/30 text-destructive rounded-lg">
                              Low
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {product.barcode}
                        </TableCell>
                        <TableCell>
                          {product.isDeleted ? (
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
                          <div className="flex items-center justify-end gap-1">
                            {product.isDeleted ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => restoreProduct(product.id)}
                                className="rounded-lg text-primary hover:text-primary hover:bg-primary/10"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEdit(product)}
                                  className="rounded-lg text-muted-foreground hover:text-foreground"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setDeleteTarget(product)}
                                  className="rounded-lg text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* Dialogs */}
      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editingProduct}
        onSave={handleSave}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="border-primary/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Archive this product?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.name}</strong> will be soft-deleted and can be restored later.
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

export default Dashboard;
