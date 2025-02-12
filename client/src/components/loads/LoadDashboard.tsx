import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadSelector } from "./LoadSelector";
import { LoadTable } from "./LoadTable";
import type { Load } from "@shared/schema";
import { LuPackage2, LuShip, LuStore } from "react-icons/lu";

export function LoadDashboard() {
  const [activeTab, setActiveTab] = useState("all");
  const { data: loads, isLoading } = useQuery<Load[]>({
    queryKey: ["/api/loads"],
  });

  const filteredLoads = loads?.filter(load => {
    if (activeTab === "all") return true;
    return load.loadType.toLowerCase() === activeTab;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Load Management</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage all your loads in one place
          </p>
        </div>
        <LoadSelector />
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <LuPackage2 className="h-4 w-4" />
            All Loads
          </TabsTrigger>
          <TabsTrigger value="incoming" className="flex items-center gap-2">
            <LuShip className="h-4 w-4" />
            Incoming
          </TabsTrigger>
          <TabsTrigger value="wholesale" className="flex items-center gap-2">
            <LuStore className="h-4 w-4" />
            Wholesale
          </TabsTrigger>
          <TabsTrigger value="miscellaneous" className="flex items-center gap-2">
            <LuPackage2 className="h-4 w-4" />
            Misc
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <LoadTable loads={filteredLoads} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="incoming">
          <LoadTable loads={filteredLoads} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="wholesale">
          <LoadTable loads={filteredLoads} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="miscellaneous">
          <LoadTable loads={filteredLoads} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
