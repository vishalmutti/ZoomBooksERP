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
import type { Load } from "@shared/schema";
import { format } from "date-fns";
import { LuTruck, LuPackage2, LuStore, LuBox } from "react-icons/lu";

interface LoadTableProps {
  loads?: Load[];
  isLoading: boolean;
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
  "Order Placed": "bg-indigo-500/10 text-indigo-500",
  Scheduled: "bg-cyan-500/10 text-cyan-500",
  Loading: "bg-orange-500/10 text-orange-500",
  Customs: "bg-red-500/10 text-red-500",
  "Port Arrival": "bg-teal-500/10 text-teal-500",
  "Final Delivery": "bg-green-500/10 text-green-500"
};

export function LoadTable({ loads, isLoading }: LoadTableProps) {
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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Load ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Pickup</TableHead>
            <TableHead>Delivery</TableHead>
            <TableHead>Carrier</TableHead>
            <TableHead>Scheduled Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loads.map((load) => (
            <TableRow key={load.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  {loadTypeIcons[load.loadType as keyof typeof loadTypeIcons]}
                  <span>{load.loadId}</span>
                </div>
              </TableCell>
              <TableCell>{load.loadType}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={statusColors[load.status as keyof typeof statusColors]}
                >
                  {load.status}
                </Badge>
              </TableCell>
              <TableCell>{load.pickupLocation}</TableCell>
              <TableCell>{load.deliveryLocation}</TableCell>
              <TableCell>{load.carrier}</TableCell>
              <TableCell>
                {format(new Date(load.scheduledPickup), "MMM d, yyyy")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
