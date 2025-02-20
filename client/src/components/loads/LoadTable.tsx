import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { LoadForm } from "./LoadForm";
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

interface FilterState {
  supplier: string;
  referenceNumber: string;
  carrier: string;
  minLoadCost: string;
  maxLoadCost: string;
  deliveryDateStart: string;
  deliveryDateEnd: string;
  searchTerm?: string;
  status?: string;
  invoiceStatus?: string;
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
      onClick={() => window.open(`${window.location.origin}/uploads/${encodeURIComponent(file)}`, "_blank")}
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
  const [filters, setFilters] = useState<FilterState>({
    supplier: '',
    referenceNumber: '',
    carrier: '',
    minLoadCost: '',
    maxLoadCost: '',
    deliveryDateStart: '',
    deliveryDateEnd: '',
    searchTerm: '',
    status: '',
    invoiceStatus: '',
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
    if (!loads) return [];

    let filtered = [...loads];

    // Apply filters
    filtered = filtered.filter(load => {
      const supplier = suppliers.find(s => s.id.toString() === load.supplierId);
      const searchTerm = filters.searchTerm?.toLowerCase() || '';
      const matchesSearch = !searchTerm ||
        supplier?.name.toLowerCase().includes(searchTerm) ||
        load.referenceNumber.toLowerCase().includes(searchTerm) ||
        load.carrier?.toLowerCase().includes(searchTerm);

      const matchesStatus = !filters.status || load.status === filters.status;

      const matchesInvoiceStatus = !filters.invoiceStatus || (
        (filters.invoiceStatus === 'material_paid' && load.materialInvoiceStatus === 'PAID') ||
        (filters.invoiceStatus === 'material_unpaid' && load.materialInvoiceStatus === 'UNPAID') ||
        (filters.invoiceStatus === 'freight_paid' && load.freightInvoiceStatus === 'PAID') ||
        (filters.invoiceStatus === 'freight_unpaid' && load.freightInvoiceStatus === 'UNPAID')
      );

      const startDate = filters.deliveryDateStart ? new Date(filters.deliveryDateStart) : null;
      const endDate = filters.deliveryDateEnd ? new Date(filters.deliveryDateEnd) : null;

      const matchesDeliveryDate = (!filters.deliveryDateStart || !load.scheduledDelivery || new Date(load.scheduledDelivery) >= new Date(filters.deliveryDateStart)) &&
        (!filters.deliveryDateEnd || !load.scheduledDelivery || new Date(load.scheduledDelivery) <= new Date(filters.deliveryDateEnd));

      return matchesSearch && matchesStatus && matchesInvoiceStatus && matchesDeliveryDate;
    });

    // Apply sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof typeof a];
        let bValue: any = b[sortConfig.key as keyof typeof b];

        if (sortConfig.key === 'scheduledPickup' || sortConfig.key === 'scheduledDelivery') {
          const dateA = a[sortConfig.key as keyof typeof a];
          const dateB = b[sortConfig.key as keyof typeof b];
          aValue = dateA ? new Date(dateA).getTime() : 0;
          bValue = dateB ? new Date(dateB).getTime() : 0;
        } else if (['loadCost', 'freightCost', 'profitRoi'].includes(sortConfig.key)) {
          aValue = Number(aValue) || 0;
          bValue = Number(bValue) || 0;
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loads"] });
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

  const exportToCSV = () => {
    if (!loads?.length) return;

    const headers = [
      'Type', 'Supplier', 'Status', 'Reference Number', 'Location', 
      'Carrier', 'Scheduled Pickup', 'Scheduled Delivery', 'Load Cost', 
      'Freight Cost', 'Profit/ROI', 'Notes'
    ];

    const csvData = loads.map(load => {
      const supplier = suppliers.find(s => s.id.toString() === load.supplierId);
      return [
        load.loadType,
        supplier?.name || 'Unknown Supplier',
        load.status,
        load.referenceNumber,
        load.location,
        load.carrier,
        load.scheduledPickup ? format(new Date(load.scheduledPickup), "MMM d, yyyy") : '',
        load.scheduledDelivery ? format(new Date(load.scheduledDelivery), "MMM d, yyyy") : '',
        `$${Number(load.loadCost).toFixed(2)}`,
        `$${Number(load.freightCost).toFixed(2)} ${load.freightCostCurrency}`,
        `${Number(load.profitRoi).toFixed(2)}%`,
        load.notes
      ].join(',');
    });

    const csv = [headers.join(','), ...csvData].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loads-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

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
      <div className="flex justify-between mb-4">
        <div className="flex gap-2">
          <LoadForm />
          <Button variant="outline" onClick={exportToCSV}>
            <LuDownload className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          <Input
            placeholder="Search supplier, reference number, or carrier..."
            value={filters.searchTerm}
            onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
            className="col-span-2"
          />
          <select
            className="w-full px-3 py-2 bg-background border border-input rounded-md"
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
          </select>
          <select
            className="w-full px-3 py-2 bg-background border border-input rounded-md"
            value={filters.invoiceStatus}
            onChange={(e) => setFilters(prev => ({ ...prev, invoiceStatus: e.target.value }))}
          >
            <option value="">All Invoice Statuses</option>
            <option value="material_paid">Material - Paid</option>
            <option value="material_unpaid">Material - Unpaid</option>
            <option value="freight_paid">Freight - Paid</option>
            <option value="freight_unpaid">Freight - Unpaid</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
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
                    <SupplierQuickView
                      supplierName={supplier?.name || ''}
                      supplierId={supplier?.id || 0}
                    />
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
                <TableCell>
                  ${Number(load.freightCost).toFixed(2)} {load.freightCostCurrency}
                </TableCell>
                <TableCell>{Number(load.profitRoi).toFixed(2)}%</TableCell>
                <TableCell>
                  <FileLink file={typeof load.bolFile === 'string' ? load.bolFile : ''} label="BOL Document" />
                </TableCell>
                <TableCell>
                  <FileLink file={typeof load.materialInvoiceFile === 'string' ? load.materialInvoiceFile : ''} label="Material Invoice" />
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
                  <FileLink 
                    file={typeof load.freightInvoiceFile === 'string' ? load.freightInvoiceFile : ''} 
                    label="Freight Invoice" 
                  />
                </TableCell>
                <TableCell>
                  <FileLink file={typeof load.loadPerformanceFile === 'string' ? load.loadPerformanceFile : ''} label="Load Performance" />
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