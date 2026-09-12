import { useState } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { usePinsStore } from '@/lib/store';
import {
  exportInventory,
  type InventoryExportFormat,
} from '@/lib/inventory-export';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function InventoryExportModal({ open, onClose }: Props) {
  const { data } = usePinsStore();
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [formatType, setFormatType] = useState<InventoryExportFormat>('csv');

  const items = data.inventory.filter((item) => !item.deletedAt);
  const itemCount = items.length;

  const handleExport = async () => {
    if (itemCount === 0 || exporting) return;
    setExporting(true);
    try {
      await exportInventory(formatType, items);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed';
      toast({
        title: 'Export failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Inventory</DialogTitle>
          <DialogDescription>
            Download your current inventory as CSV or a readable text list.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Export type
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormatType('csv')}
                className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm transition-colors ${
                  formatType === 'csv' ? 'border-primary bg-primary/10' : 'border-border bg-card'
                }`}
              >
                <FileSpreadsheet size={18} />
                <span>
                  <span className="font-medium block">CSV (.csv)</span>
                  <span className="text-xs text-muted-foreground">Sheets & Excel</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setFormatType('text')}
                className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm transition-colors ${
                  formatType === 'text' ? 'border-primary bg-primary/10' : 'border-border bg-card'
                }`}
              >
                <FileText size={18} />
                <span>
                  <span className="font-medium block">Text (.txt)</span>
                  <span className="text-xs text-muted-foreground">Readable list</span>
                </span>
              </button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground border border-border rounded-lg p-3 bg-muted/20">
            {itemCount === 0 ? (
              <>Add inventory items before exporting.</>
            ) : formatType === 'csv' ? (
              <>
                Downloads a <strong>.csv</strong> with {itemCount} vial
                {itemCount === 1 ? '' : 's'} including name, concentration, volumes, lot (if
                present), blend, and reconstitution.
              </>
            ) : (
              <>
                Downloads a text list of {itemCount} vial{itemCount === 1 ? '' : 's'} with the same
                fields.
              </>
            )}
          </p>

          <Button
            className="w-full"
            disabled={itemCount === 0 || exporting}
            onClick={() => void handleExport()}
          >
            <Download size={18} className="mr-2" />
            {exporting
              ? 'Exporting…'
              : `Export${itemCount > 0 ? ` (${itemCount})` : ''}`.trim()}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
