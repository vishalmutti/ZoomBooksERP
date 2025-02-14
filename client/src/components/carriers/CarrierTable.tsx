
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
  carriers: Array<Carrier & { contacts?: Array<{ name: string; email: string; phone: string }> }>;
  onEdit: (carrier: Carrier) => void;
  onDelete: (carrier: Carrier) => void;
  isLoading: boolean;
}

export function CarrierTable({ carriers, onEdit, onDelete, isLoading }: CarrierTableProps) {
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
          <TableHead>Company Name</TableHead>
          <TableHead>Address</TableHead>
          <TableHead>Contact Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {carriers?.flatMap((carrier) => 
          (carrier.contacts || []).map((contact, index) => (
            <TableRow key={`${carrier.id}-${index}`}>
              {index === 0 ? (
                <>
                  <TableCell rowSpan={carrier.contacts?.length || 1}>{carrier.name}</TableCell>
                  <TableCell rowSpan={carrier.contacts?.length || 1}>{carrier.address}</TableCell>
                </>
              ) : null}
              <TableCell>{contact.name}</TableCell>
              <TableCell>{contact.email}</TableCell>
              <TableCell>{contact.phone}</TableCell>
              {index === 0 ? (
                <TableCell rowSpan={carrier.contacts?.length || 1} className="space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(carrier)}>
                    <LuPencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(carrier)}>
                    <LuTrash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              ) : null}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
