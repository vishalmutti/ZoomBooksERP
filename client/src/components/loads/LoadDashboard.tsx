
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadForm } from "./LoadForm";
import { LoadTable } from "./LoadTable";
import { Button } from "@/components/ui/button";
import type { Load } from "@shared/schema";
import { LuPackage2, LuShip, LuStore } from "react-icons/lu";

export function LoadDashboard() {
  const [activeTab, setActiveTab] = useState("incoming");
  const { data: loads, isLoading } = useQuery<Load[]>({
    queryKey: ["loads"],
  });

  const filteredLoads = loads?.filter(load => load.loadType.toLowerCase() === activeTab);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Load Management</h1>
        <p className="text-muted-foreground mt-1">
          Track and manage all your loads in one place
        </p>
      </div>

      <Tabs defaultValue="incoming" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-3">
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
            Miscellaneous
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incoming" className="space-y-4">
          <div className="flex justify-end">
            <LoadForm defaultType="Incoming" />
          </div>
          <LoadTable loads={filteredLoads} isLoading={isLoading} />
        </TabsContent>
        
        <TabsContent value="wholesale" className="space-y-4">
          <div className="flex justify-end">
            <LoadForm defaultType="Wholesale" />
          </div>
          <LoadTable loads={filteredLoads} isLoading={isLoading} />
        </TabsContent>
        
        <TabsContent value="miscellaneous" className="space-y-4">
          <div className="flex justify-end">
            <LoadForm defaultType="Miscellaneous" />
          </div>
          <LoadTable loads={filteredLoads} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
