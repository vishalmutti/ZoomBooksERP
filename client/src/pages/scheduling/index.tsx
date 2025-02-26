import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  CalendarIcon, 
  UsersIcon, 
  BuildingIcon, 
  ClockIcon,
  CalendarDaysIcon,
  ArrowLeftIcon
} from "lucide-react";

export default function SchedulingDashboard() {
  const [location] = useLocation();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employee Scheduling</h1>
          <p className="text-muted-foreground">
            Manage employee schedules, shifts, departments, and availability
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/payroll">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Payroll
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-xl">
              <CalendarDaysIcon className="h-5 w-5 mr-2 text-primary" />
              Schedule Calendar
            </CardTitle>
            <CardDescription>
              View and manage all employee shifts in calendar view
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full mt-2">
              <Link href="/scheduling/calendar">View Calendar</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-xl">
              <UsersIcon className="h-5 w-5 mr-2 text-primary" />
              Employees
            </CardTitle>
            <CardDescription>
              Manage employee details, skills, and availability
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full mt-2">
              <Link href="/scheduling/employees">Manage Employees</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-xl">
              <BuildingIcon className="h-5 w-5 mr-2 text-primary" />
              Departments
            </CardTitle>
            <CardDescription>
              Configure department settings and requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full mt-2">
              <Link href="/scheduling/departments">Manage Departments</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-xl">
              <ClockIcon className="h-5 w-5 mr-2 text-primary" />
              Time Off Requests
            </CardTitle>
            <CardDescription>
              Review and manage employee time off requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full mt-2">
              <Link href="/scheduling/time-off">Manage Time Off</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-xl">
              <CalendarIcon className="h-5 w-5 mr-2 text-primary" />
              Generate Schedule
            </CardTitle>
            <CardDescription>
              Automatically generate optimal schedules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full mt-2">
              <Link href="/scheduling/generate">Auto-Generate</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}