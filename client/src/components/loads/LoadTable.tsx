import { useState, useMemo } from "react";
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
import { SupplierContactsQuery } from "./SupplierContactsQuery";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  Miscellaneous: <LuPackage2 className="h-5 w-5" />,
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
  "Final Delivery": "bg-green-500/10 text-green-500",
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
  type,
  loadType,
}: {
  loadId: number;
  status: "PAID" | "UNPAID";
  type: "material" | "freight";
  loadType: string;
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: "PAID" | "UNPAID") => {
      const field = type === "material" ? "materialInvoiceStatus" : "freightInvoiceStatus";
      const response = await fetch(`/api/loads/${loadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [field]: newStatus,
          loadType: loadType,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update status');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loads"] });
      queryClient.refetchQueries({ queryKey: ["/api/loads"] }, { force: true });
      toast({
        title: "Success",
        description: `${type === "material" ? "Material" : "Freight"} invoice status updated`,
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
      onChange={(e) => updateStatusMutation.mutate(e.target.value as "PAID" | "UNPAID")}
    >
      <option value="PAID">PAID</option>
      <option value="UNPAID">UNPAID</option>
    </select>
  );
};

const SupplierDetailsRow = ({ supplierId }: { supplierId: string }) => {
  const { data: contacts = [] } = useQuery<SupplierContact[]>({
    queryKey: ["/api/suppliers", supplierId, "contacts"],
    enabled: !!supplierId,
  });

  return { contacts };
};

export function LoadTable({ loads, suppliers = [], isLoading, onEdit, onDelete }: LoadTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    supplier: '',
    referenceNumber: '',
    carrier: '',
    minLoadCost: '',
    maxLoadCost: '',
    deliveryDateStart: '',
    deliveryDateEnd: '',
  });
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedLoads = useMemo(() => {
    let filtered = [...(loads || [])];

    // Apply filters
    filtered = filtered.filter(load => {
      const supplier = suppliers.find(s => s.id.toString() === load.supplierId);
      const matchesSupplier = !filters.supplier || 
        supplier?.name.toLowerCase().includes(filters.supplier.toLowerCase());
      const matchesReference = !filters.referenceNumber || 
        load.referenceNumber.toLowerCase().includes(filters.referenceNumber.toLowerCase());
      const matchesCarrier = !filters.carrier || 
        load.carrier?.toLowerCase().includes(filters.carrier.toLowerCase());
      const matchesLoadCost = (!filters.minLoadCost || Number(load.loadCost) >= Number(filters.minLoadCost)) &&
        (!filters.maxLoadCost || Number(load.loadCost) <= Number(filters.maxLoadCost));
      const matchesDeliveryDate = (!filters.deliveryDateStart || new Date(load.scheduledDelivery) >= new Date(filters.deliveryDateStart)) &&
        (!filters.deliveryDateEnd || new Date(load.scheduledDelivery) <= new Date(filters.deliveryDateEnd));

      return matchesSupplier && matchesReference && matchesCarrier && 
        matchesLoadCost && matchesDeliveryDate;
    });

    // Apply sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key as keyof typeof a];
        let bValue = b[sortConfig.key as keyof typeof b];
        
        if (sortConfig.key === 'scheduledPickup' || sortConfig.key === 'scheduledDelivery') {
          aValue = new Date(aValue as string).getTime();
          bValue = new Date(bValue as string).getTime();
        } else if (['loadCost', 'freightCost', 'profitRoi'].includes(sortConfig.key)) {
          aValue = Number(aValue);
          bValue = Number(bValue);
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [loads, filters, sortConfig, suppliers]);

  const updateLoadMutation = useMutation({
    mutationFn: async (loadData: IncomingLoad) => {
      const response = await fetch(`/api/loads/${loadData.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: loadData.id,
          loadType: loadData.loadType,
          loadCost: loadData.loadCost?.toString(),
          freightCost: loadData.freightCost?.toString(),
          status: loadData.status
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update load');
      }
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/loads"] });
      await queryClient.refetchQueries({ queryKey: ["/api/loads"] }, { force: true });
      toast({
        title: "Success",
        description: "Load updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update load: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ loadId, newStatus }: { loadId: number; newStatus: string }) => {
      const load = loads?.find(l => l.id === loadId);
      const response = await fetch(`/api/loads/${loadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          loadType: load?.loadType,
          supplierId: load?.supplierId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update load status');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loads"] });
      queryClient.refetchQueries({ queryKey: ["/api/loads"] });
      toast({
        title: "Success",
        description: "Load status updated successfully",
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

  const handleStatusUpdate = async (loadId: number, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({ loadId, newStatus });
    } catch (error) {
      console.error("Failed to update load status:", error);
    }
  };

  return (
    <div className="rounded-md border overflow-x-auto">
      <div className="space-y-4 mb-4">
        <div className="grid grid-cols-3 gap-4">
          <Input
            placeholder="Filter by supplier"
            value={filters.supplier}
            onChange={(e) => setFilters(prev => ({ ...prev, supplier: e.target.value }))}
          />
          <Input
            placeholder="Filter by reference number"
            value={filters.referenceNumber}
            onChange={(e) => setFilters(prev => ({ ...prev, referenceNumber: e.target.value }))}
          />
          <Input
            placeholder="Filter by carrier"
            value={filters.carrier}
            onChange={(e) => setFilters(prev => ({ ...prev, carrier: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-4 gap-4">
          <Input
            type="number"
            placeholder="Min load cost"
            value={filters.minLoadCost}
            onChange={(e) => setFilters(prev => ({ ...prev, minLoadCost: e.target.value }))}
          />
          <Input
            type="number"
            placeholder="Max load cost"
            value={filters.maxLoadCost}
            onChange={(e) => setFilters(prev => ({ ...prev, maxLoadCost: e.target.value }))}
          />
          <Input
            type="date"
            placeholder="Delivery date start"
            value={filters.deliveryDateStart}
            onChange={(e) => setFilters(prev => ({ ...prev, deliveryDateStart: e.target.value }))}
          />
          <Input
            type="date"
            placeholder="Delivery date end"
            value={filters.deliveryDateEnd}
            onChange={(e) => setFilters(prev => ({ ...prev, deliveryDateEnd: e.target.value }))}
          />
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Reference Number</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Carrier</TableHead>
            <TableHead onClick={() => handleSort('scheduledPickup')} className="cursor-pointer hover:bg-accent">
              Scheduled Pickup {sortConfig?.key === 'scheduledPickup' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead onClick={() => handleSort('scheduledDelivery')} className="cursor-pointer hover:bg-accent">
              Scheduled Delivery {sortConfig?.key === 'scheduledDelivery' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead onClick={() => handleSort('loadCost')} className="cursor-pointer hover:bg-accent">
              Load Cost {sortConfig?.key === 'loadCost' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead onClick={() => handleSort('freightCost')} className="cursor-pointer hover:bg-accent">
              Freight Cost {sortConfig?.key === 'freightCost' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead onClick={() => handleSort('profitRoi')} className="cursor-pointer hover:bg-accent">
              Profit/ROI {sortConfig?.key === 'profitRoi' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </TableHead>
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
          {filteredAndSortedLoads.map((load) => {
            const supplier = suppliers.find((s) => s.id.toString() === load.supplierId);

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
                    <SupplierContactsQuery supplier={supplier} />
                  ) : (
                    "Unknown Supplier"
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
                        const newStatus = load.status === "Completed" ? "Pending" : "Completed";
                        if (window.confirm(`Are you sure you want to mark this load as ${newStatus.toLowerCase()}?`)) {
                          await handleStatusUpdate(load.id, newStatus);
                        }
                      }}
                      title={load.status === "Completed" ? "Mark as pending" : "Mark as complete"}
                    >
                      <LuCheck className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>{load.referenceNumber}</TableCell>
                <TableCell>{load.location}</TableCell>
                <TableCell>{load.carrier}</TableCell>
                <TableCell>
                  {load.scheduledPickup && format(new Date(load.scheduledPickup), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  {load.scheduledDelivery && format(new Date(load.scheduledDelivery), "MMM d, yyyy")}
                </TableCell>
                <TableCell>${Number(load.loadCost).toFixed(2)}</TableCell>
                <TableCell>${Number(load.freightCost).toFixed(2)}</TableCell>
                <TableCell>{Number(load.profitRoi).toFixed(2)}%</TableCell>
                <TableCell>
                  <FileLink file={load.bolFile} label="BOL Document" />
                </TableCell>
                <TableCell>
                  {load.materialInvoiceFile ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => window.open(`/uploads/${load.materialInvoiceFile}`, "_blank")}
                      title="Material Invoice"
                    >
                      <LuFileText className="h-4 w-4" />
                    </Button>
                  ) : null}
                </TableCell>
                <TableCell>
                  <InvoiceStatus
                    loadId={load.id}
                    status={load.materialInvoiceStatus}
                    type="material"
                    loadType={load.loadType}
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
                        if (window.confirm("Are you sure you want to delete this load?")) {
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