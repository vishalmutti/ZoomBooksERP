import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LuPlus } from "react-icons/lu";
import type { Load } from "@shared/schema";

export function LoadsPage() {
  const { data: loads, isLoading } = useQuery<Load[]>({
    queryKey: ["/api/loads"],
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Load Management</h1>
        <Button>
          <LuPlus className="mr-2 h-4 w-4" /> New Load
        </Button>
      </div>
      
      <div className="grid gap-4">
        {loads?.map((load) => (
          <Card key={load.id} className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{load.loadId}</h3>
                <p className="text-sm text-muted-foreground">Type: {load.loadType}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm px-2 py-1 bg-primary/10 rounded-full">
                  {load.status}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
