
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LuCheck } from "react-icons/lu";

const statusColors = {
  Pending: "bg-yellow-500/10 text-yellow-500",
  "In Transit": "bg-blue-500/10 text-blue-500",
  Delivered: "bg-green-500/10 text-green-500",
  "Freight Invoice Attached": "bg-purple-500/10 text-purple-500",
  Paid: "bg-emerald-500/10 text-emerald-500",
  Completed: "bg-gray-500/10 text-gray-500",
  "Order Placed": "bg-cyan-500/10 text-cyan-500",
  Scheduled: "bg-indigo-500/10 text-indigo-500",
  Loading: "bg-orange-500/10 text-orange-500",
  Customs: "bg-red-500/10 text-red-500",
  "Port Arrival": "bg-teal-500/10 text-teal-500",
  "Final Delivery": "bg-green-500/10 text-green-500",
};

export function StatusCell({ status, onStatusUpdate }: { status: string; onStatusUpdate: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <Badge
        variant="outline"
        className={statusColors[status as keyof typeof statusColors]}
      >
        {status}
      </Badge>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={onStatusUpdate}
        title={status === "Completed" ? "Mark as pending" : "Mark as complete"}
      >
        <LuCheck className="h-4 w-4" />
      </Button>
    </div>
  );
}
