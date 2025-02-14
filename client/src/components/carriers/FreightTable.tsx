import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { LuFileText, LuPencil, LuTrash } from "react-icons/lu";

interface FreightTableProps {
  entries?: any[];
  isLoading?: boolean;
  onEdit?: (entry: any) => void;
  onDelete?: (id: number) => void;
}

export function FreightTable({ entries = [], isLoading, onEdit, onDelete }: FreightTableProps) {
  const handleViewFile = (filename: string) => {
    window.open(`/uploads/${filename}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-8 w-full animate-pulse bg-gray-200 rounded" />
        <div className="h-8 w-full animate-pulse bg-gray-200 rounded" />
        <div className="h-8 w-full animate-pulse bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reference Number</TableHead>
            <TableHead>Carrier</TableHead>
            <TableHead>Freight Cost</TableHead>
            <TableHead>File</TableHead>
            <TableHead>Freight Invoice</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.isArray(entries) && entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>{entry.referenceNumber}</TableCell>
              <TableCell>{entry.carrier}</TableCell>
              <TableCell>${entry.freightCost}</TableCell>
              <TableCell>
                {entry.file && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewFile(entry.file)}
                  >
                    <LuFileText className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
              <TableCell>
                {entry.freightInvoice && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewFile(entry.freightInvoice)}
                  >
                    <LuFileText className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit?.(entry)}
                  >
                    <LuPencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete?.(entry.id)}
                  >
                    <LuTrash className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}