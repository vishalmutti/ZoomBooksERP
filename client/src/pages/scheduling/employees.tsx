import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Department, Employee, InsertEmployee, EmployeeAvailability } from "@shared/schema";
import { 
  ArrowLeftIcon, 
  PlusCircleIcon,
  Edit2Icon, 
  TrashIcon,
  UserPlusIcon,
  ClockIcon,
  User2Icon
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { EmployeeForm } from "@/components/scheduling/employee-form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export default function EmployeesPage() {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [isEditingEmployee, setIsEditingEmployee] = useState(false);
  const [isManagingAvailability, setIsManagingAvailability] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: employees, isLoading: isLoadingEmployees } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
  });

  const { data: departments, isLoading: isLoadingDepartments } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });

  const { data: employeeAvailability, isLoading: isLoadingAvailability } = useQuery<EmployeeAvailability[]>({
    queryKey: ['/api/employee-availability', selectedEmployee?.id],
    enabled: !!selectedEmployee,
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: InsertEmployee) => {
      return await apiRequest<Employee>({
        url: '/api/employees',
        method: 'POST',
        data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Employee created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      setIsAddingEmployee(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating employee",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertEmployee> }) => {
      return await apiRequest<Employee>({
        url: `/api/employees/${id}`,
        method: 'PATCH',
        data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Employee updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      setIsEditingEmployee(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating employee",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest({
        url: `/api/employees/${id}`,
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Employee deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      setSelectedEmployee(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting employee",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateAvailabilityMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest({
        url: `/api/employee-availability/${selectedEmployee?.id}`,
        method: 'PUT',
        data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Availability updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/employee-availability'] });
      setIsManagingAvailability(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating availability",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredEmployees = searchQuery.trim() === ""
    ? employees || []
    : (employees || []).filter(emp => 
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">
            Manage employee information and availability
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/scheduling">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Scheduling
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="relative w-72">
          <Input
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
          <span className="absolute left-2.5 top-2.5 text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </svg>
          </span>
        </div>
        <Button onClick={() => setIsAddingEmployee(true)}>
          <UserPlusIcon className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Directory</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingEmployees || isLoadingDepartments ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-12 border rounded-md bg-muted/20">
              <User2Icon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No employees found</h3>
              <p className="text-muted-foreground">
                {searchQuery.trim() !== "" 
                  ? "Try adjusting your search query"
                  : "Add your first employee to get started"}
              </p>
              {searchQuery.trim() === "" && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsAddingEmployee(true)}
                >
                  <UserPlusIcon className="mr-2 h-4 w-4" />
                  Add Employee
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => {
                  const department = departments?.find(d => d.id === employee.departmentId);
                  return (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">
                        {employee.name}
                      </TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>{employee.phone || "—"}</TableCell>
                      <TableCell>{department?.name || "—"}</TableCell>
                      <TableCell>{employee.position || "—"}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={employee.status === "active" ? "default" : "secondary"}
                        >
                          {employee.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="1"></circle>
                                <circle cx="12" cy="5" r="1"></circle>
                                <circle cx="12" cy="19" r="1"></circle>
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedEmployee(employee);
                                setIsEditingEmployee(true);
                              }}
                            >
                              <Edit2Icon className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedEmployee(employee);
                                setIsManagingAvailability(true);
                              }}
                            >
                              <ClockIcon className="mr-2 h-4 w-4" />
                              Manage Availability
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete ${employee.firstName} ${employee.lastName}?`)) {
                                  deleteEmployeeMutation.mutate(employee.id);
                                }
                              }}
                            >
                              <TrashIcon className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Employee Dialog */}
      <Dialog open={isAddingEmployee} onOpenChange={setIsAddingEmployee}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>
              Create a new employee record.
            </DialogDescription>
          </DialogHeader>
          <EmployeeForm 
            onSubmit={(data) => createEmployeeMutation.mutate(data)}
            departments={departments || []}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      {selectedEmployee && (
        <Dialog open={isEditingEmployee} onOpenChange={setIsEditingEmployee}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Employee</DialogTitle>
              <DialogDescription>
                Update employee information.
              </DialogDescription>
            </DialogHeader>
            <EmployeeForm 
              onSubmit={(data) => updateEmployeeMutation.mutate({ id: selectedEmployee.id, data })}
              initialData={selectedEmployee}
              departments={departments || []}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Manage Availability Sheet */}
      {selectedEmployee && (
        <Sheet open={isManagingAvailability} onOpenChange={setIsManagingAvailability}>
          <SheetContent className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Manage Availability</SheetTitle>
              <SheetDescription>
                Configure when {selectedEmployee.firstName} {selectedEmployee.lastName} is available to work.
              </SheetDescription>
            </SheetHeader>
            <div className="py-6">
              <AvailabilityForm 
                employee={selectedEmployee}
                availability={employeeAvailability || []}
                onSubmit={(data) => updateAvailabilityMutation.mutate(data)}
                isLoading={isLoadingAvailability}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

// Weekly availability form
interface Day {
  name: string;
  key: string;
}

const days: Day[] = [
  { name: "Monday", key: "monday" },
  { name: "Tuesday", key: "tuesday" },
  { name: "Wednesday", key: "wednesday" },
  { name: "Thursday", key: "thursday" },
  { name: "Friday", key: "friday" },
  { name: "Saturday", key: "saturday" },
  { name: "Sunday", key: "sunday" }
];

const availabilitySchema = z.object({
  monday: z.object({
    isAvailable: z.boolean().default(false),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    availableShifts: z.array(z.enum(["day", "night"])).optional(),
  }),
  tuesday: z.object({
    isAvailable: z.boolean().default(false),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    availableShifts: z.array(z.enum(["day", "night"])).optional(),
  }),
  wednesday: z.object({
    isAvailable: z.boolean().default(false),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    availableShifts: z.array(z.enum(["day", "night"])).optional(),
  }),
  thursday: z.object({
    isAvailable: z.boolean().default(false),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    availableShifts: z.array(z.enum(["day", "night"])).optional(),
  }),
  friday: z.object({
    isAvailable: z.boolean().default(false),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    availableShifts: z.array(z.enum(["day", "night"])).optional(),
  }),
  saturday: z.object({
    isAvailable: z.boolean().default(false),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    availableShifts: z.array(z.enum(["day", "night"])).optional(),
  }),
  sunday: z.object({
    isAvailable: z.boolean().default(false),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    availableShifts: z.array(z.enum(["day", "night"])).optional(),
  }),
  employeeId: z.number(),
});

type AvailabilityValues = z.infer<typeof availabilitySchema>;

interface AvailabilityFormProps {
  employee: Employee;
  availability: EmployeeAvailability[];
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

function AvailabilityForm({ employee, availability, onSubmit, isLoading }: AvailabilityFormProps) {
  // Map the API availability data to our form structure
  const defaultValues: Partial<AvailabilityValues> = {
    employeeId: employee.id,
    monday: { isAvailable: false },
    tuesday: { isAvailable: false },
    wednesday: { isAvailable: false },
    thursday: { isAvailable: false },
    friday: { isAvailable: false },
    saturday: { isAvailable: false },
    sunday: { isAvailable: false }
  };
  
  // If we have availability data, populate the form
  if (availability && availability.length > 0) {
    availability.forEach(avail => {
      const day = avail.dayOfWeek.toLowerCase();
      if (day in defaultValues) {
        // @ts-ignore - We know these properties exist
        defaultValues[day] = {
          isAvailable: true,
          startTime: avail.startTime,
          endTime: avail.endTime,
          availableShifts: avail.availableShifts?.split(',') as ("day" | "night")[] || [],
        };
      }
    });
  }

  const form = useForm<AvailabilityValues>({
    resolver: zodResolver(availabilitySchema),
    defaultValues,
  });

  const onFormSubmit = (data: AvailabilityValues) => {
    // Transform the form data to the API format
    const availabilityData = days.map(day => {
      const dayData = data[day.key as keyof typeof data];
      if (dayData.isAvailable) {
        return {
          employeeId: employee.id,
          dayOfWeek: day.name,
          isAvailable: true,
          startTime: dayData.startTime || "09:00",
          endTime: dayData.endTime || "17:00",
          availableShifts: dayData.availableShifts?.join(',') || "day",
        };
      }
      return null;
    }).filter(Boolean);
    
    onSubmit(availabilityData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {days.map((day) => (
              <div key={day.key} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <FormField
                    control={form.control}
                    name={`${day.key}.isAvailable`}
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-medium">
                          {day.name}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
                
                {form.watch(`${day.key}.isAvailable`) && (
                  <div className="pl-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`${day.key}.startTime`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Time</FormLabel>
                            <FormControl>
                              <Input
                                type="time"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`${day.key}.endTime`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Time</FormLabel>
                            <FormControl>
                              <Input
                                type="time"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name={`${day.key}.availableShifts`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Available Shifts</FormLabel>
                          <div className="flex space-x-4">
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes("day")}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, "day"]);
                                    } else {
                                      field.onChange(current.filter(val => val !== "day"));
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel>Day Shift</FormLabel>
                            </FormItem>
                            
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes("night")}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, "night"]);
                                    } else {
                                      field.onChange(current.filter(val => val !== "night"));
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel>Night Shift</FormLabel>
                            </FormItem>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
                
                <Separator className="mt-2" />
              </div>
            ))}
          </div>
        )}
        
        <SheetFooter>
          <SheetClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </SheetClose>
          <Button type="submit">Save Changes</Button>
        </SheetFooter>
      </form>
    </Form>
  );
}