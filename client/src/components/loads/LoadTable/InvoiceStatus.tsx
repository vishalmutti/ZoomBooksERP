
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function InvoiceStatus({
  loadId,
  status,
  type,
  loadType,
}: {
  loadId: number;
  status: "PAID" | "UNPAID";
  type: "material" | "freight";
  loadType: string;
}) {
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
}
