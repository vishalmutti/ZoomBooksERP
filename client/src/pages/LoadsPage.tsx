import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { LuTruck, LuPackage2, LuStore, LuBox, LuCalendar, LuMap, LuUser, LuShip, LuBookmark, LuClipboard } from "react-icons/lu";
import type { Load } from "@shared/schema";
import { LoadForm } from "@/components/loads/LoadForm";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const loadTypeIcons = {
  Incoming: <LuShip className="h-5 w-5" />,
  Wholesale: <LuStore className="h-5 w-5" />,
  Miscellaneous: <LuPackage2 className="h-5 w-5" />
};

const statusColors = {
  Pending: "bg-yellow-500/10 text-yellow-500",
  "In Transit": "bg-blue-500/10 text-blue-500",
  Delivered: "bg-green-500/10 text-green-500",
  "Freight Invoice Attached": "bg-purple-500/10 text-purple-500",
  Paid: "bg-emerald-500/10 text-emerald-500",
  Completed: "bg-gray-500/10 text-gray-500",
  "Order Placed": "bg-cyan-500/10 text-cyan-500",
  Scheduled: "bg-indigo-500/10 text-indigo-500",
  Loading: "bg-amber-500/10 text-amber-500",
  Customs: "bg-rose-500/10 text-rose-500",
  "Port Arrival": "bg-teal-500/10 text-teal-500",
  "Final Delivery": "bg-lime-500/10 text-lime-500"
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
            <Card key={load.id} className="p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {loadTypeIcons[load.loadType as keyof typeof loadTypeIcons]}
                      <h3 className="font-semibold text-lg">{load.loadId}</h3>
                      <Badge variant="outline" className={statusColors[load.status as keyof typeof statusColors]}>
                        {load.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Type: {load.loadType}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-primary/10 text-primary">
                      ${Number(load.freightCost).toFixed(2)}
                    </Badge>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Locations */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <LuMap className="h-4 w-4" />
                      <span className="text-sm font-medium">Locations</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm">From: {load.pickupLocation}</p>
                      <p className="text-sm">To: {load.deliveryLocation}</p>
                    </div>
                  </div>

                  {/* Schedule */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <LuCalendar className="h-4 w-4" />
                      <span className="text-sm font-medium">Schedule</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm">
                        Pickup: {format(new Date(load.scheduledPickup), "PPp")}
                      </p>
                      <p className="text-sm">
                        Delivery: {format(new Date(load.scheduledDelivery), "PPp")}
                      </p>
                      {load.actualPickup && (
                        <p className="text-sm">
                          Actual Pickup: {format(new Date(load.actualPickup), "PPp")}
                        </p>
                      )}
                      {load.actualDelivery && (
                        <p className="text-sm">
                          Actual Delivery: {format(new Date(load.actualDelivery), "PPp")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Carrier Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <LuUser className="h-4 w-4" />
                      <span className="text-sm font-medium">Carrier Details</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm">Carrier: {load.carrier}</p>
                      <p className="text-sm">Driver: {load.driverName}</p>
                      {load.driverPhone && (
                        <p className="text-sm">Phone: {load.driverPhone}</p>
                      )}
                      {load.equipment && (
                        <p className="text-sm">Equipment: {load.equipment}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Load Type Specific Information */}
                {load.loadType === "Incoming" && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Incoming Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {load.containerNumber && (
                        <p className="text-sm">Container: {load.containerNumber}</p>
                      )}
                      {load.bookingNumber && (
                        <p className="text-sm">Booking: {load.bookingNumber}</p>
                      )}
                      {load.vesselName && (
                        <p className="text-sm">Vessel: {load.vesselName}</p>
                      )}
                      {load.voyageNumber && (
                        <p className="text-sm">Voyage: {load.voyageNumber}</p>
                      )}
                      {load.estimatedPortArrival && (
                        <p className="text-sm">
                          Est. Port Arrival: {format(new Date(load.estimatedPortArrival), "PPp")}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {load.loadType === "Wholesale" && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Wholesale Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {load.poNumber && (
                        <p className="text-sm">PO: {load.poNumber}</p>
                      )}
                      {load.orderNumber && (
                        <p className="text-sm">Order: {load.orderNumber}</p>
                      )}
                      {load.brokerName && (
                        <p className="text-sm">Broker: {load.brokerName}</p>
                      )}
                      {load.brokerContact && (
                        <p className="text-sm">Broker Contact: {load.brokerContact}</p>
                      )}
                    </div>
                  </div>
                )}

                {load.loadType === "Miscellaneous" && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Miscellaneous Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {load.referenceNumber && (
                        <p className="text-sm">Reference: {load.referenceNumber}</p>
                      )}
                      {load.warehouseLocation && (
                        <p className="text-sm">Warehouse: {load.warehouseLocation}</p>
                      )}
                      {load.handlingInstructions && (
                        <p className="text-sm">Instructions: {load.handlingInstructions}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {load.notes && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Notes</h4>
                    <p className="text-sm text-muted-foreground">{load.notes}</p>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}