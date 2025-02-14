import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { LoadForm } from "./LoadForm";
import { LuPlus, LuShip } from "react-icons/lu";

export function LoadSelector() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <LuPlus className="mr-2 h-4 w-4" /> New Load
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Load</DialogTitle>
          <DialogDescription>
            Create a new incoming load
          </DialogDescription>
        </DialogHeader>
        <LoadForm 
          onClose={() => setOpen(false)} 
          defaultType="Incoming"
          show={true}
        />
      </DialogContent>
    </Dialog>
  );
}