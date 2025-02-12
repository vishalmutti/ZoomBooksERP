import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { LuTruck, LuPackage2, LuStore, LuBox } from "react-icons/lu";
import type { Load } from "@shared/schema";
import { LoadForm } from "@/components/loads/LoadForm";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const loadTypeIcons = {
  Inventory: <LuBox className="h-5 w-5" />,
  Wholesale: <LuStore className="h-5 w-5" />,
  Miscellaneous: <LuPackage2 className="h-5 w-5" />
};

const statusColors = {
  Pending: "bg-yellow-500/10 text-yellow-500",
  "In Transit": "bg-blue-500/10 text-blue-500",
  Delivered: "bg-green-500/10 text-green-500",
  "Freight Invoice Attached": "bg-purple-500/10 text-purple-500",
  Paid: "bg-emerald-500/10 text-emerald-500",
  Completed: "bg-gray-500/10 text-gray-500"
};

export function LoadsPage() {
  const { data: loads, isLoading, error } = useQuery<Load[]>({
    queryKey: ["/api/loads"],
  });

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive">Error loading data</h2>
          <p className="text-muted-foreground">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Load Management</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage your loads efficiently
          </p>
        </div>
        <LoadForm />
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2 w-full">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            </Card>
          ))
        ) : loads?.length === 0 ? (
          <Card className="p-8 text-center">
            <LuTruck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No loads found</h3>
            <p className="text-muted-foreground">
              Create your first load to get started
            </p>
          </Card>
        ) : (
          loads?.map((load) => (
            <Card key={load.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {loadTypeIcons[load.loadType as keyof typeof loadTypeIcons]}
                    <h3 className="font-semibold text-lg">{load.loadId}</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      Type: {load.loadType}
                    </span>
                    <Badge variant="outline" className={statusColors[load.status as keyof typeof statusColors]}>
                      {load.status}
                    </Badge>
                  </div>
                  {load.notes && (
                    <p className="text-sm text-muted-foreground mt-2">{load.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <LuTruck className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}