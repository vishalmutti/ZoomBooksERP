import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { LuTruck, LuPackage2, LuStore, LuBox, LuCalendar, LuMap, LuUser, LuShip, LuBookmark, LuClipboard } from "react-icons/lu";
import type { Load } from "@shared/schema";
import { LoadForm } from "@/components/loads/LoadForm";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { LoadDashboard } from "@/components/loads/LoadDashboard";

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
  return <LoadDashboard />;
}