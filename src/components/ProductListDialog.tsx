import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText } from 'lucide-react';
import { Product } from '@/types/product';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

interface ProductListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allProducts: Product[];
  isAdmin: boolean;
  profilesMap: Map<string, string>;
}

const ProductListDialog = ({ open, onOpenChange, allProducts, isAdmin, profilesMap }: ProductListDialogProps) => {
  const displayProducts = isAdmin ? allProducts : allProducts.filter(p => !p.is_deleted);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Product List', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 27);

    if (isAdmin) {
      autoTable(doc, {
        startY: 33,
        head: [['Code', 'Description', 'Unit', 'Price', 'Status', 'Op Type', 'Op By', 'Op Date']],
        body: displayProducts.map(p => [
          p.product_code,
          p.description,
          p.unit,
          `$${p.current_price.toFixed(2)}`,
          p.is_deleted ? 'Archived' : 'Active',
          p.stamp_op_type,
          p.stamp_op_by ? (profilesMap.get(p.stamp_op_by) || p.stamp_op_by.slice(0, 8)) : '—',
          new Date(p.stamp_op_date).toLocaleString(),
        ]),
      });
    } else {
      autoTable(doc, {
        startY: 33,
        head: [['Code', 'Description', 'Unit', 'Price']],
        body: displayProducts.map(p => [
          p.product_code,
          p.description,
          p.unit,
          `$${p.current_price.toFixed(2)}`,
        ]),
      });
    }

    doc.save('product-list.pdf');
    toast.success('PDF exported');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between gap-4">
          <DialogTitle className="font-display text-xl">Product List</DialogTitle>
          <Button onClick={exportPDF} className="rounded-xl gap-1.5" size="sm">
            <FileText className="w-4 h-4" /> Export PDF
          </Button>
        </DialogHeader>

        <Table>
          <TableHeader>
            <TableRow className="border-border/50">
              <TableHead className="font-semibold">Code</TableHead>
              <TableHead className="font-semibold">Description</TableHead>
              <TableHead className="font-semibold">Unit</TableHead>
              <TableHead className="font-semibold text-right">Price</TableHead>
              {isAdmin && <TableHead className="font-semibold">Status</TableHead>}
              {isAdmin && <TableHead className="font-semibold">Op Type</TableHead>}
              {isAdmin && <TableHead className="font-semibold">Op By</TableHead>}
              {isAdmin && <TableHead className="font-semibold">Op Date</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 8 : 4} className="text-center py-8 text-muted-foreground">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              displayProducts.map(p => (
                <TableRow key={p.product_code} className={p.is_deleted ? 'opacity-40' : ''}>
                  <TableCell className="text-xs">{p.product_code}</TableCell>
                  <TableCell className={p.is_deleted ? 'line-through text-muted-foreground' : ''}>
                    {p.description}
                  </TableCell>
                  <TableCell>{p.unit}</TableCell>
                  <TableCell className="text-right font-medium">${p.current_price.toFixed(2)}</TableCell>
                  {isAdmin && (
                    <TableCell>
                      <Badge variant={p.is_deleted ? 'outline' : 'default'}
                        className={p.is_deleted ? 'border-destructive/30 text-destructive' : 'bg-primary/10 text-primary border-0'}>
                        {p.is_deleted ? 'Archived' : 'Active'}
                      </Badge>
                    </TableCell>
                  )}
                  {isAdmin && (
                    <TableCell className="text-xs">
                      <Badge variant="outline" className="rounded-lg text-xs">{p.stamp_op_type}</Badge>
                    </TableCell>
                  )}
                  {isAdmin && (
                    <TableCell className="text-xs text-muted-foreground">
                      {p.stamp_op_by ? (profilesMap.get(p.stamp_op_by) || p.stamp_op_by.slice(0, 8)) : '—'}
                    </TableCell>
                  )}
                  {isAdmin && (
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(p.stamp_op_date).toLocaleString()}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
};

export default ProductListDialog;
