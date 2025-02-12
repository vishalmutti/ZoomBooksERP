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
import type { IncomingLoad } from "@shared/schema";
import { format } from "date-fns";
import { LuTruck, LuPackage2, LuStore, LuBox, LuFileText, LuPencil, LuTrash } from "react-icons/lu";
import { Button } from "@/components/ui/button";

interface LoadTableProps {
  loads?: IncomingLoad[];
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

export function LoadTable({ loads, isLoading, onEdit, onDelete }: LoadTableProps) {
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
            <TableHead>Freight Invoice</TableHead>
            <TableHead>Load Performance</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loads.map((load) => (
            <TableRow key={load.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  {loadTypeIcons[load.loadType as keyof typeof loadTypeIcons]}
                  <span>{load.loadType}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={statusColors[load.status as keyof typeof statusColors]}
                >
                  {load.status}
                </Badge>
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
                <FileLink file={load.freightInvoiceFile} label="Freight Invoice" />
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}