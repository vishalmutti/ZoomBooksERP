
import type { Carrier, CarrierTransaction } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { LuPencil } from "react-icons/lu";
import { Skeleton } from "@/components/ui/skeleton";

interface CarrierTableProps {
  carriers: Carrier[];
  transactions: CarrierTransaction[];
  onEdit: (carrier: Carrier) => void;
  isLoading: boolean;
}

export function CarrierTable({ carriers, transactions, onEdit, isLoading }: CarrierTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>MC Number</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {carriers.map((carrier) => (
          <TableRow key={carrier.id}>
            <TableCell>{carrier.name}</TableCell>
            <TableCell>{carrier.mcNumber}</TableCell>
            <TableCell>{carrier.contact}</TableCell>
            <TableCell>{carrier.email}</TableCell>
            <TableCell>{carrier.phone}</TableCell>
            <TableCell>
              <Button variant="ghost" size="icon" onClick={() => onEdit(carrier)}>
                <LuPencil className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
