
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { LuFileText } from "react-icons/lu";

interface CarrierLoad {
  id: number;
  date: string;
  referenceNumber: string;
  carrier: string;
  freightCost: number;
  freightInvoice?: string;
  pod?: string;
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
  // Sample data - will be replaced with real data later
  const data: CarrierLoad[] = [
    {
      id: 1,
      date: "2024-02-14",
      referenceNumber: "REF001",
      carrier: "ABC Trucking",
      freightCost: 1500.00,
      freightInvoice: "invoice1.pdf",
      pod: "pod1.pdf"
    },
    {
      id: 2,
      date: "2024-02-13",
      referenceNumber: "REF002",
      carrier: "XYZ Transport",
      freightCost: 2000.00,
    }
  ];

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
        return `$${row.getValue<number>("freightCost").toFixed(2)}`;
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
  ];

  return (
    <div className="container mx-auto py-8">
      <h2 className="text-2xl font-bold mb-6">Carrier Loads</h2>
      <DataTable
        columns={columns}
        data={data}
        searchKey="referenceNumber"
      />
    </div>
  );
}
