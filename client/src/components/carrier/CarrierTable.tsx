import { DataTable } from "@/components/ui/data-table";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { LuFileText } from "react-icons/lu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CarrierForm } from "./CarrierForm";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface CarrierLoad {
  id: number;
  date: string;
  referenceNumber: string;
  carrier: string;
  freightCost: number;
  freightInvoice?: string;
  pod?: string;
  status: "PAID" | "UNPAID";
  // Added for currency display
  freightCostCurrency?: string;
}

const FileLink = ({ file }: { file?: string }) => {
  if (!file) return null;
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0"
      onClick={() => window.open(`/uploads/${file}`, "_blank")}
    >
      <LuFileText className="h-4 w-4" />
    </Button>
  );
};

export function CarrierTable() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingCarrier, setEditingCarrier] = useState<CarrierLoad | null>(null);

  // Filtering state: date range and status
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [filterStatus, setFilterStatus] = useState<"PAID" | "UNPAID" | "ALL">("ALL");

  const { data = [], isLoading } = useQuery({
    queryKey: ['carrier-loads'],
    queryFn: async () => {
      const response = await fetch('/api/carrier-loads');
      if (!response.ok) {
        throw new Error('Failed to fetch carrier loads');
      }
      return response.json();
    }
  });

  // Mutation for editing a carrier load
  const editMutation = useMutation({
    mutationFn: async (data: Partial<CarrierLoad>) => {
      const response = await fetch(`/api/carrier-loads/${data.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update carrier load');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carrier-loads'] });
      toast({
        title: "Success",
        description: "Carrier load updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for updating status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ loadId, newStatus }: { loadId: number; newStatus: "PAID" | "UNPAID" }) => {
      const response = await fetch(`/api/carrier-loads/${loadId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        throw new Error('Failed to update status');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carrier-loads"] });
      toast({
        title: "Success",
        description: "Payment status updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Define columns for the DataTable
  const columns: ColumnDef<CarrierLoad>[] = [
    {
      accessorKey: "date",
      header: "Date",
    },
    {
      accessorKey: "referenceNumber",
      header: "Reference Number",
    },
    {
      accessorKey: "carrier",
      header: "Carrier",
    },
    {
      accessorKey: "freightCost",
      header: "Freight Cost",
      cell: ({ row }) => {
        const value = row.getValue<string | number>("freightCost");
        const currency = row.original.freightCostCurrency || "USD";
        const numericValue = typeof value === 'string' ? parseFloat(value) : value;
        return `$${numericValue.toFixed(2)} ${currency}`;
      },
    },
    {
      accessorKey: "freightInvoice",
      header: "Freight Invoice",
      cell: ({ row }) => <FileLink file={row.getValue("freightInvoice")} />,
    },
    {
      accessorKey: "pod",
      header: "POD",
      cell: ({ row }) => <FileLink file={row.getValue("pod")} />,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as "PAID" | "UNPAID";
        return (
          <select
            className="w-24 h-8 px-2 py-1 bg-background border border-input rounded-md text-sm"
            value={status}
            onChange={(e) => {
              const newStatus = e.target.value as "PAID" | "UNPAID";
              updateStatusMutation.mutate({ loadId: row.original.id, newStatus });
            }}
          >
            <option value="PAID">PAID</option>
            <option value="UNPAID">UNPAID</option>
          </select>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditingCarrier(row.original)}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={async () => {
              if (confirm("Are you sure you want to delete this carrier load?")) {
                try {
                  const response = await fetch(`/api/carrier-loads/${row.original.id}`, {
                    method: 'DELETE',
                  });
                  if (!response.ok) {
                    throw new Error('Failed to delete carrier load');
                  }
                  await queryClient.invalidateQueries({ queryKey: ['carrier-loads'] });
                  toast({
                    title: "Success",
                    description: "Carrier load deleted successfully",
                  });
                } catch (error) {
                  toast({
                    title: "Error",
                    description: "Failed to delete carrier load",
                    variant: "destructive",
                  });
                }
              }
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  // Apply filters: date range and status
  const filteredData = (data as CarrierLoad[]).filter(load => {
    const loadDate = new Date(load.date);
    const dateMatch =
      (!startDate || loadDate >= startDate) &&
      (!endDate || loadDate <= endDate);
    const statusMatch = filterStatus === "ALL" || load.status === filterStatus;
    return dateMatch && statusMatch;
  });

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
        <h2 className="text-2xl font-bold mb-4 md:mb-0">Carrier Loads</h2>
        <div className="flex flex-wrap gap-4">
          <div>
            <Label>Start Date</Label>
            <Input
              type="date"
              onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
            />
          </div>
          <div>
            <Label>End Date</Label>
            <Input
              type="date"
              onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
            />
          </div>
          <div>
            <Label>Status</Label>
            <select
              onChange={(e) => setFilterStatus(e.target.value as "PAID" | "UNPAID" | "ALL")}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              <option value="ALL">All</option>
              <option value="PAID">Paid</option>
              <option value="UNPAID">Unpaid</option>
            </select>
          </div>
        </div>
      </div>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          {editingCarrier && (
            <CarrierForm
              initialData={editingCarrier}
              open={!!editingCarrier}
              onOpenChange={(open) => !open && setEditingCarrier(null)}
            />
          )}
          <DataTable columns={columns} data={filteredData} searchKey="referenceNumber" />
        </>
      )}
    </div>
  );
}

export default CarrierTable;
