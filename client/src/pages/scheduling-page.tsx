import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DepartmentList } from "@/components/scheduling/department-list";
import { EmployeeList } from "@/components/scheduling/employee-list";
import { ScheduleCalendar } from "@/components/scheduling/schedule-calendar";

export function SchedulingPage() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Employee Scheduling</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="schedule" className="space-y-4">
            <TabsList>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="employees">Employees</TabsTrigger>
              <TabsTrigger value="departments">Departments</TabsTrigger>
            </TabsList>

            <TabsContent value="schedule">
              <ScheduleCalendar />
            </TabsContent>

            <TabsContent value="employees">
              <EmployeeList />
            </TabsContent>

            <TabsContent value="departments">
              <DepartmentList />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default SchedulingPage;