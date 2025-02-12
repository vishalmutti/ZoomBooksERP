import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LuTruck } from "react-icons/lu";
import { Link } from "wouter";

export function LoadManagementWidget() {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Load Management</h2>
          <p className="text-muted-foreground">
            Track and manage your inventory, wholesale, and miscellaneous loads
          </p>
        </div>
        <LuTruck className="w-12 h-12 text-primary" />
      </div>
      <div className="mt-6">
        <Link href="/loads">
          <Button className="w-full">
            Manage Loads
          </Button>
        </Link>
      </div>
    </Card>
  );
}