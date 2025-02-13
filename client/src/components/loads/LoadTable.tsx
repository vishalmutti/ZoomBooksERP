import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { IncomingLoad, Supplier, SupplierContact } from "@shared/schema";
import { format } from "date-fns";
import { LuTruck, LuPackage2, LuStore, LuBox, LuFileText, LuPencil, LuTrash, LuCheck } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { SupplierQuickView } from "./SupplierQuickView";

interface LoadTableProps {
  loads?: IncomingLoad[];
  suppliers?: Supplier[];
  isLoading: boolean;
  onEdit?: (load: IncomingLoad) => void;
  onDelete?: (id: number) => void;
}

const loadTypeIcons = {
  Incoming: <LuBox className="h-5 w-5" />,
  Wholesale: <LuStore className="h-5 w-5" />,
  Miscellaneous: <LuPackage2 className="h-5 w-5" />
};

const statusColors = {
  Pending: "bg-yellow-500/10 text-yellow-500",
  "In Transit": "bg-blue-500/10 text-blue-500",
  Delivered: "bg-green-500/10 text-green-500",
  "Freight Invoice Attached": "bg-purple-500/10 text-purple-500",
  Paid: "bg-emerald-500/10 text-emerald-500",
  Completed: "bg-gray-500/10 text-gray-500",
  "Order Placed": "bg-cyan-500/10 text-cyan-500",
  Scheduled: "bg-indigo-500/10 text-indigo-500",
  Loading: "bg-orange-500/10 text-orange-500",
  Customs: "bg-red-500/10 text-red-500",
  "Port Arrival": "bg-teal-500/10 text-teal-500",
  "Final Delivery": "bg-green-500/10 text-green-500"
};

const FileLink = ({ file, label }: { file: string | null; label: string }) => {
  if (!file) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0"
      onClick={() => window.open(`/uploads/${file}`, "_blank")}
      title={label}
    >
      <LuFileText className="h-4 w-4" />
    </Button>
  );
};

const InvoiceStatus = ({ 
  loadId, 
  status, 
  type 
}: { 
  loadId: number; 
  status: 'PAID' | 'UNPAID'; 
  type: 'material' | 'freight';
}) => {
  const { toast } = useToast();
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: 'PAID' | 'UNPAID') => {
      const field = type === 'material' ? 'materialInvoiceStatus' : 'freightInvoiceStatus';
      await apiRequest("PATCH", `/api/loads/${loadId}`, {
        [field]: newStatus
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loads"] });
      toast({
        title: "Success",
        description: `${type === 'material' ? 'Material' : 'Freight'} invoice status updated`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return (
    <select
      className="w-24 h-8 px-2 py-1 bg-background border border-input rounded-md text-sm"
      value={status}
      onChange={(e) => updateStatusMutation.mutate(e.target.value as 'PAID' | 'UNPAID')}
    >
      <option value="PAID">PAID</option>
      <option value="UNPAID">UNPAID</option>
    </select>
  );
};

export function LoadTable({ loads, suppliers = [], isLoading, onEdit, onDelete }: LoadTableProps) {
  const supplierContactsQueries = suppliers.map(supplier => ({
    supplier,
    contactsQuery: useQuery<SupplierContact[]>({
      queryKey: ["/api/suppliers", supplier.id, "contacts"],
      enabled: !!supplier.id,
    })
  }));

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!loads?.length) {
    return (
      <div className="text-center py-12">
        <LuTruck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No loads found</h3>
        <p className="text-muted-foreground">
          Create a new load to get started
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Reference Number</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Carrier</TableHead>
            <TableHead>Scheduled Pickup</TableHead>
            <TableHead>Scheduled Delivery</TableHead>
            <TableHead>Load Cost</TableHead>
            <TableHead>Freight Cost</TableHead>
            <TableHead>Profit/ROI</TableHead>
            <TableHead>BOL</TableHead>
            <TableHead>Material Invoice</TableHead>
            <TableHead>Material Status</TableHead>
            <TableHead>Freight Invoice</TableHead>
            <TableHead>Freight Status</TableHead>
            <TableHead>Load Performance</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loads.map((load) => {
            const supplier = suppliers.find(s => s.id.toString() === load.supplierId);
            const supplierContacts = supplierContactsQueries
              .find(q => q.supplier.id.toString() === load.supplierId)
              ?.contactsQuery.data || [];

            return (
              <TableRow key={load.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {loadTypeIcons[load.loadType as keyof typeof loadTypeIcons]}
                    <span>{load.loadType}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {supplier ? (
                    <SupplierQuickView 
                      supplierName={supplier.name} 
                      contacts={supplierContacts}
                    />
                  ) : (
                    'Unknown Supplier'
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={statusColors[load.status as keyof typeof statusColors]}
                    >
                      {load.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={async () => {
                        const newStatus = load.status === 'Completed' ? 'Pending' : 'Completed';
                        if (window.confirm(`Are you sure you want to mark this load as ${newStatus.toLowerCase()}?`)) {
                          const response = await fetch(`/api/loads/${load.id}`, {
                            method: 'PATCH',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ status: newStatus }),
                          });
                          if (response.ok) {
                            queryClient.invalidateQueries({ queryKey: ["/api/loads"] });
                          }
                        }
                      }}
                      title={load.status === 'Completed' ? 'Mark as pending' : 'Mark as complete'}
                    >
                      <LuCheck className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>{load.referenceNumber}</TableCell>
                <TableCell>{load.location}</TableCell>
                <TableCell>{load.carrier}</TableCell>
                <TableCell>
                  {load.scheduledPickup &&
                    format(new Date(load.scheduledPickup), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  {load.scheduledDelivery &&
                    format(new Date(load.scheduledDelivery), "MMM d, yyyy")}
                </TableCell>
                <TableCell>${Number(load.loadCost).toFixed(2)}</TableCell>
                <TableCell>${Number(load.freightCost).toFixed(2)}</TableCell>
                <TableCell>{Number(load.profitRoi).toFixed(2)}%</TableCell>
                <TableCell>
                  <FileLink file={load.bolFile} label="BOL Document" />
                </TableCell>
                <TableCell>
                  <FileLink file={load.materialInvoiceFile} label="Material Invoice" />
                </TableCell>
                <TableCell>
                  <InvoiceStatus
                    loadId={load.id}
                    status={load.materialInvoiceStatus}
                    type="material"
                  />
                </TableCell>
                <TableCell>
                  <FileLink file={load.freightInvoiceFile} label="Freight Invoice" />
                </TableCell>
                <TableCell>
                  <InvoiceStatus
                    loadId={load.id}
                    status={load.freightInvoiceStatus}
                    type="freight"
                  />
                </TableCell>
                <TableCell>
                  <FileLink file={load.loadPerformanceFile} label="Load Performance" />
                </TableCell>
                <TableCell>{load.notes}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => onEdit?.(load)}
                    >
                      <LuPencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this load?')) {
                          onDelete?.(load.id);
                        }
                      }}
                    >
                      <LuTrash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}