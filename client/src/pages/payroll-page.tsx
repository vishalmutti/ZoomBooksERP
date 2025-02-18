import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PayrollWidget } from "@/components/PayrollWidget";
import { Card } from "@/components/ui/card";
import { SchedulingPage } from "@/pages/scheduling-page";

export default function PayrollPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Payroll & Scheduling Management</h1>
      </div>

      <Tabs defaultValue="payroll" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="payroll">Payroll Sheets</TabsTrigger>
          <TabsTrigger value="scheduling">Employee Scheduling</TabsTrigger>
        </TabsList>

        <TabsContent value="payroll">
          <Card className="pt-6">
            <PayrollWidget />
          </Card>
        </TabsContent>

        <TabsContent value="scheduling">
          <SchedulingPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}