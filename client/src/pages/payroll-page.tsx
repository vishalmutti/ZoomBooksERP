
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PayrollWidget } from "@/components/PayrollWidget";
import { Card } from "@/components/ui/card";
import { SchedulingPage } from "@/pages/scheduling-page";

export default function PayrollPage() {
  return (
    <div className="space-y-6">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Payroll & Scheduling Management</h1>
        </div>

        <Tabs defaultValue="payroll" className="w-full mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="payroll">Payroll Sheets</TabsTrigger>
            <TabsTrigger value="scheduling">Employee Scheduling</TabsTrigger>
          </TabsList>

          <TabsContent value="payroll" className="mt-0">
            <PayrollWidget />
          </TabsContent>

          <TabsContent value="scheduling">
            <SchedulingPage />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
