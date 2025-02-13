
import { useQuery } from "@tanstack/react-query";
import type { Supplier, SupplierContact } from "@shared/schema";
import { SupplierQuickView } from "./SupplierQuickView";

interface Props {
  supplier: Supplier;
}

export function SupplierContactsQuery({ supplier }: Props) {
  const contactsQuery = useQuery<SupplierContact[]>({
    queryKey: ["/api/suppliers", supplier.id, "contacts"],
    enabled: !!supplier.id,
  });

  return (
    <SupplierQuickView
      supplierName={supplier.name}
      contacts={contactsQuery.data || []}
    />
  );
}
