import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LoadForm } from "./LoadForm";
import { IncomingLoadForm } from "./IncomingLoadForm";
import { WholesaleLoadForm } from "./WholesaleLoadForm";
import { LuPlus, LuShip, LuStore, LuPackage2 } from "react-icons/lu";

export function LoadSelector() {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const loadTypes = [
    {
      id: "incoming",
      name: "Incoming Load",
      description: "For incoming container shipments and imports",
      icon: <LuShip className="w-8 h-8" />,
      component: IncomingLoadForm,
    },
    {
      id: "wholesale",
      name: "Wholesale Load",
      description: "For wholesale orders and distributions",
      icon: <LuStore className="w-8 h-8" />,
      component: WholesaleLoadForm,
    },
    {
      id: "miscellaneous",
      name: "Miscellaneous",
      description: "For other warehouse operations and miscellaneous loads",
      icon: <LuPackage2 className="w-8 h-8" />,
      component: LoadForm,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <LuPlus className="mr-2 h-4 w-4" /> New Load
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Select Load Type</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          {selectedType ? (
            <>
              {selectedType === "incoming" && (
                <IncomingLoadForm onClose={() => setOpen(false)} />
              )}
              {selectedType === "wholesale" && (
                <WholesaleLoadForm onClose={() => setOpen(false)} />
              )}
              {selectedType === "miscellaneous" && (
                <LoadForm onClose={() => setOpen(false)} />
              )}
              <Button
                variant="outline"
                onClick={() => setSelectedType(null)}
                className="mt-2"
              >
                Back to Selection
              </Button>
            </>
          ) : (
            loadTypes.map((type) => (
              <Button
                key={type.id}
                variant="outline"
                className="flex items-center justify-start gap-4 h-auto p-4"
                onClick={() => setSelectedType(type.id)}
              >
                <div className="text-primary">{type.icon}</div>
                <div className="text-left">
                  <h3 className="font-semibold">{type.name}</h3>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </div>
              </Button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
