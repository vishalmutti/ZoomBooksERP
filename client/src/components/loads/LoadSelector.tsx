import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { LoadForm } from "./LoadForm";
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
      defaultType: "Incoming" as const,
    },
    {
      id: "wholesale",
      name: "Wholesale Load",
      description: "For wholesale orders and distributions",
      icon: <LuStore className="w-8 h-8" />,
      defaultType: "Wholesale" as const,
    },
    {
      id: "miscellaneous",
      name: "Miscellaneous",
      description: "For other warehouse operations and miscellaneous loads",
      icon: <LuPackage2 className="w-8 h-8" />,
      defaultType: "Miscellaneous" as const,
    },
  ];

  const selectedLoadType = loadTypes.find(type => type.id === selectedType);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <LuPlus className="mr-2 h-4 w-4" /> New Load
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-[600px]"
        aria-describedby="load-type-description"
      >
        <DialogHeader>
          <DialogTitle>Select Load Type</DialogTitle>
          <DialogDescription id="load-type-description">
            Choose the type of load you want to create from the options below.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          {selectedType ? (
            <>
              <LoadForm 
                onClose={() => setOpen(false)} 
                defaultType={selectedLoadType?.defaultType}
                show={true}
              />
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
                aria-label={`Create new ${type.name.toLowerCase()}`}
              >
                <div className="text-primary" aria-hidden="true">{type.icon}</div>
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