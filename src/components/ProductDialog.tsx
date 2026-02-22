import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Product, ProductFormData } from '@/types/product';
import { Sparkles } from 'lucide-react';

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSave: (data: ProductFormData) => void;
}

const emptyForm: ProductFormData = {
  product_code: '',
  description: '',
  unit: 'pc',
  unit_price: 0,
};

const ProductDialog = ({ open, onOpenChange, product, onSave }: ProductDialogProps) => {
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});

  useEffect(() => {
    if (product) {
      setForm({
        product_code: product.product_code,
        description: product.description,
        unit: product.unit,
        unit_price: product.current_price,
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [product, open]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ProductFormData, string>> = {};
    if (!form.product_code.trim()) newErrors.product_code = 'Product code is required';
    if (!form.description.trim()) newErrors.description = 'Description is required';
    if (form.unit_price < 0) newErrors.unit_price = 'Price must be positive';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(form);
      onOpenChange(false);
    }
  };

  const inputClass = "rounded-xl bg-background/60 border-primary/20 focus:border-primary";
  const isEdit = !!product;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border-primary/20 bg-card/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1 space-y-1.5">
              <Label>Product Code *</Label>
              <Input
                value={form.product_code}
                onChange={e => setForm(f => ({ ...f, product_code: e.target.value }))}
                placeholder="e.g. PROD-005"
                className={inputClass}
                disabled={isEdit}
              />
              {errors.product_code && <p className="text-xs text-destructive">{errors.product_code}</p>}
            </div>

            <div className="col-span-2 sm:col-span-1 space-y-1.5">
              <Label>Unit</Label>
              <Input
                value={form.unit}
                onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                placeholder="e.g. pc, kg, box"
                className={inputClass}
              />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label>Description *</Label>
              <Input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Product description"
                className={inputClass}
              />
              {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
            </div>

            <div className="col-span-2 sm:col-span-1 space-y-1.5">
              <Label>Unit Price *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.unit_price}
                onChange={e => setForm(f => ({ ...f, unit_price: parseFloat(e.target.value) || 0 }))}
                className={inputClass}
              />
              {errors.unit_price && <p className="text-xs text-destructive">{errors.unit_price}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" className="rounded-xl shadow-md shadow-primary/20">
              {isEdit ? 'Update Product' : 'Add Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDialog;
