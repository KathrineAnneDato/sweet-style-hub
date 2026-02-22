import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, TrendingUp, X } from 'lucide-react';
import { PriceHistoryRow, Product } from '@/types/product';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PriceHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  fetchHistory: (code: string) => Promise<PriceHistoryRow[]>;
  profilesMap: Map<string, string>;
}

const PriceHistoryDialog = ({ open, onOpenChange, product, fetchHistory, profilesMap }: PriceHistoryDialogProps) => {
  const [history, setHistory] = useState<PriceHistoryRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && product) {
      setLoading(true);
      fetchHistory(product.product_code).then(data => {
        setHistory(data);
        setLoading(false);
      });
    }
  }, [open, product, fetchHistory]);

  const chartData = [...history]
    .filter(h => !h.is_deleted)
    .reverse()
    .map(h => ({
      date: format(new Date(h.stamp_op_date), 'MMM dd'),
      price: Number(h.unit_price),
    }));

  const resolveUser = (id: string | null) => {
    if (!id) return '—';
    return profilesMap.get(id) ?? id.slice(0, 8);
  };

  const exportPDF = () => {
    if (!product) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Price History', 14, 20);
    doc.setFontSize(11);
    doc.text(`${product.product_code} – ${product.description}`, 14, 28);

    autoTable(doc, {
      startY: 35,
      head: [['Effectivity Date', 'Unit Price', 'Modified By', 'Op Date']],
      body: history.map(h => [
        format(new Date(h.effectivity_date), 'MMM dd, yyyy'),
        `$${Number(h.unit_price).toFixed(2)}`,
        resolveUser(h.stamp_op_by),
        format(new Date(h.stamp_op_date), 'MMM dd, HH:mm'),
      ]),
    });

    doc.save(`price-history-${product.product_code}.pdf`);
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl border-primary/20 bg-card/95 backdrop-blur-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-start justify-between">
          <div>
            <DialogTitle className="font-display text-xl">Price History</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {product.product_code} – {product.description}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={exportPDF} className="rounded-xl gap-1.5">
            <Download className="w-4 h-4" /> Export PDF
          </Button>
        </DialogHeader>

        {loading ? (
          <p className="text-center py-8 text-muted-foreground">Loading...</p>
        ) : (
          <>
            {/* Price Trend Chart */}
            {chartData.length > 1 && (
              <div className="border border-border/50 rounded-xl p-4">
                <p className="text-sm font-medium flex items-center gap-1.5 mb-3">
                  <TrendingUp className="w-4 h-4 text-primary" /> Price Trend
                </p>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `$${v}`} />
                    <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, 'Price']} />
                    <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: 'hsl(var(--primary))' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* History Table */}
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">Effectivity Date</TableHead>
                  <TableHead className="font-semibold">Unit Price</TableHead>
                  <TableHead className="font-semibold">Modified By</TableHead>
                  <TableHead className="font-semibold">Op Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No price history found
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map(h => (
                    <TableRow key={h.id}>
                      <TableCell>{format(new Date(h.effectivity_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="font-medium">${Number(h.unit_price).toFixed(2)}</TableCell>
                      <TableCell className="text-muted-foreground">{resolveUser(h.stamp_op_by)}</TableCell>
                      <TableCell className="text-muted-foreground">{format(new Date(h.stamp_op_date), 'MMM dd, HH:mm')}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PriceHistoryDialog;
