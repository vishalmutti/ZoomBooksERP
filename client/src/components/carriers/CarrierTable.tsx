import type { Carrier } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { LuPencil, LuTrash2 } from "react-icons/lu";
import { Skeleton } from "@/components/ui/skeleton";

interface CarrierTableProps {
  carriers: Carrier[];
  onEdit: (carrier: Carrier) => void;
  onDelete: (carrier: Carrier) => void;
  isLoading: boolean;
}

export function CarrierTable({ carriers, onEdit, onDelete, isLoading }: CarrierTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Contact Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3].map((i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                <TableCell><Skeleton className="h-4 w-[180px]" /></TableCell>
                <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company Name</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Contact Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
            <TableHead className="w-[100px]">
              <Button variant="ghost" size="sm" onClick={() => refetch()}>
                Refresh
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {carriers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No carriers found
              </TableCell>
            </TableRow>
          ) : (
            carriers.map((carrier) => (
              <TableRow key={carrier.id}>
                <TableCell>{carrier.name}</TableCell>
                <TableCell>{carrier.address || "-"}</TableCell>
                <TableCell>{carrier.contact_name || "-"}</TableCell>
                <TableCell>{carrier.contact_email || "-"}</TableCell>
                <TableCell>{carrier.contact_phone || "-"}</TableCell>
                <TableCell className="space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(carrier)}
                  >
                    <LuPencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(carrier)}
                  >
                    <LuTrash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}