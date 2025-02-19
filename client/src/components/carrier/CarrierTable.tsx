import { DataTable } from "@/components/ui/data-table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { LuFileText } from "react-icons/lu";

interface CarrierLoad {
  id: number;
  date: string;
  referenceNumber: string;
  carrier: string;
  freightCost: number;
  freightInvoice?: string;
  pod?: string;
  status: "PAID" | "UNPAID";
}

import { CarrierForm } from "./CarrierForm";

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
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PAID" | "UNPAID">("ALL");

  const { data = [], isLoading } = useQuery({
    queryKey: ['carrier-loads', startDate, endDate, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      // Format dates to match SQL date format
      if (startDate) {
        const formattedStartDate = new Date(startDate).toISOString().split('T')[0];
        params.append('startDate', formattedStartDate);
      }
      if (endDate) {
        const formattedEndDate = new Date(endDate).toISOString().split('T')[0];
        params.append('endDate', formattedEndDate);
      }
      if (statusFilter !== "ALL") params.append('status', statusFilter);
      
      const response = await fetch(`/api/carrier-loads?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch carrier loads');
      }
      return response.json();
    }
  });

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
        const errorText = await response.text();
        throw new Error(`Failed to update status: ${errorText}`);
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
        const currency = row.original.freightCostCurrency;
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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const exportToCSV = () => {
    const csvContent = [
      ["Date", "Reference Number", "Carrier", "Freight Cost", "Status"],
      ...data.map(row => [
        row.date,
        row.referenceNumber,
        row.carrier,
        `${row.freightCost}`,
        row.status
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carrier-loads-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Get unique carriers
  const uniqueCarriers = Array.from(new Set(data.map(row => row.carrier))).sort();
  const [carrierFilter, setCarrierFilter] = useState<string>("ALL");

  const filteredData = data.filter(row => 
    carrierFilter === "ALL" || row.carrier === carrierFilter
  );

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Carrier Loads</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCSV}>
              Export CSV
            </Button>
            <CarrierForm />
          </div>
        </div>
      </div>
      {editingCarrier && (
        <CarrierForm
          initialData={editingCarrier}
          open={!!editingCarrier}
          onOpenChange={(open) => !open && setEditingCarrier(null)}
        />
      )}
      <DataTable
        columns={columns}
        data={filteredData}
        searchKey="referenceNumber"
        carrierFilter={{
          value: carrierFilter,
          onChange: (e) => setCarrierFilter(e.target.value),
          options: [
            { value: "ALL", label: "All Carriers" },
            ...uniqueCarriers.map(carrier => ({
              value: carrier,
              label: carrier
            }))
          ]
        }}
        dateFilter={{
          startDate,
          endDate,
          onStartDateChange: (e) => setStartDate(e.target.value),
          onEndDateChange: (e) => setEndDate(e.target.value)
        }}
        statusFilter={{
          value: statusFilter,
          onChange: (e) => setStatusFilter(e.target.value as "ALL" | "PAID" | "UNPAID"),
          options: [
            { value: "ALL", label: "All Status" },
            { value: "PAID", label: "Paid" },
            { value: "UNPAID", label: "Unpaid" }
          ]
        }}
      />
    </div>
  );
}