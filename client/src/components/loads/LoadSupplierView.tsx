
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Supplier } from "@shared/schema";

interface LoadSupplierViewProps {
  supplier: Supplier;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoadSupplierView({ supplier, open, onOpenChange }: LoadSupplierViewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{supplier.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Contact Person</h3>
            <p>{supplier.contactPerson}</p>
          </div>
          <div>
            <h3 className="font-medium">Email</h3>
            <p>{supplier.email}</p>
          </div>
          <div>
            <h3 className="font-medium">Phone</h3>
            <p>{supplier.phone}</p>
          </div>
          <div>
            <h3 className="font-medium">Address</h3>
            <p>{supplier.address}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
