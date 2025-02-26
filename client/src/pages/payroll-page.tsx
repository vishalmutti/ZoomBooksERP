
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PayrollWidget } from "@/components/PayrollWidget";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CalendarIcon, 
  UsersIcon, 
  Calendar as CalendarIconOutline, 
  BuildingIcon,
  ClockIcon,
  CalendarDaysIcon
} from "lucide-react";

export default function PayrollPage() {
  return (
    <div className="space-y-6">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Payroll & Scheduling Management</h1>
        </div>

        <Tabs defaultValue="payroll" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="payroll">Payroll Sheets</TabsTrigger>
            <TabsTrigger value="scheduling">Employee Scheduling</TabsTrigger>
          </TabsList>

          <TabsContent value="payroll" className="mt-6">
            <PayrollWidget />
          </TabsContent>

          <TabsContent value="scheduling" className="mt-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">Employee Scheduling System</h2>
                  <p className="text-muted-foreground">
                    Manage employee schedules, departments, and availability constraints
                  </p>
                </div>
                <Button asChild>
                  <Link href="/scheduling">
                    <CalendarDaysIcon className="mr-2 h-4 w-4" />
                    Go to Scheduling Dashboard
                  </Link>
                </Button>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-lg">
                      <CalendarIconOutline className="h-5 w-5 mr-2 text-primary" />
                      Schedule Calendar
                    </CardTitle>
                    <CardDescription>
                      View and manage shifts in a calendar view
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p>Create, edit, and manage employee shifts for all departments in day and night shifts.</p>
                  </CardContent>
                  <CardFooter>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/scheduling/calendar">
                        Open Calendar
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-lg">
                      <UsersIcon className="h-5 w-5 mr-2 text-primary" />
                      Employees
                    </CardTitle>
                    <CardDescription>
                      Manage employees and availability
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p>Add, edit, and manage employee information, skills, and weekly availability constraints.</p>
                  </CardContent>
                  <CardFooter>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/scheduling/employees">
                        Manage Employees
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-lg">
                      <BuildingIcon className="h-5 w-5 mr-2 text-primary" />
                      Departments
                    </CardTitle>
                    <CardDescription>
                      Configure department requirements
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p>Set up departments with required staffing levels for day and night shifts and other requirements.</p>
                  </CardContent>
                  <CardFooter>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/scheduling/departments">
                        Manage Departments
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-lg">
                      <ClockIcon className="h-5 w-5 mr-2 text-primary" />
                      Time Off Requests
                    </CardTitle>
                    <CardDescription>
                      Manage employee time off requests
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p>Review, approve, or reject employee time off requests and manage leave scheduling.</p>
                  </CardContent>
                  <CardFooter>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/scheduling/time-off">
                        Manage Time Off
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-lg">
                      <CalendarDaysIcon className="h-5 w-5 mr-2 text-primary" />
                      Auto-Generate Schedules
                    </CardTitle>
                    <CardDescription>
                      Create optimized schedules automatically
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p>Generate optimal schedules based on employee availability, department needs, and scheduling constraints.</p>
                  </CardContent>
                  <CardFooter>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/scheduling/generate">
                        Generate Schedules
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
