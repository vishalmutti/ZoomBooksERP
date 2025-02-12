import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { LuUser, LuMail, LuPhone } from "react-icons/lu";
import type { SupplierContact } from "@shared/schema";

interface SupplierQuickViewProps {
  supplierName: string;
  contacts?: SupplierContact[];
}

export function SupplierQuickView({ supplierName, contacts = [] }: SupplierQuickViewProps) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link" className="p-0 h-auto font-normal">
          {supplierName}
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">{supplierName} Contacts</h4>
          {contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No contacts available</p>
          ) : (
            <div className="space-y-3">
              {contacts.map((contact, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <LuUser className="h-4 w-4" />
                    <span className="text-sm font-medium">{contact.name}</span>
                    {contact.isPrimary && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                        Primary
                      </span>
                    )}
                  </div>
                  {contact.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <LuMail className="h-4 w-4" />
                      <a href={`mailto:${contact.email}`} className="hover:underline">
                        {contact.email}
                      </a>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <LuPhone className="h-4 w-4" />
                      <a href={`tel:${contact.phone}`} className="hover:underline">
                        {contact.phone}
                      </a>
                    </div>
                  )}
                  {contact.notes && (
                    <p className="text-sm text-muted-foreground mt-1 pl-6">
                      {contact.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
