
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LuTruck } from "react-icons/lu";
import { Link } from "wouter";

export function LoadManagementWidget() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Load Management</CardTitle>
        <LuTruck className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-4">
          Track and manage your inventory, wholesale, and miscellaneous loads
        </CardDescription>
        <Link href="/loads">
          <Button className="w-full" variant="outline">
            Manage Loads
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
