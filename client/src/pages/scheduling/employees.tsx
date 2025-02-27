import { useState, useEffect } from "react";
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
    enabled: !!selectedEmployee && isManagingAvailability,
    // Only fetch when the availability dialog is open
    refetchOnMount: true,
    refetchOnWindowFocus: true,
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
      // Add a small delay to ensure the server has time to process the request
      await new Promise(resolve => setTimeout(resolve, 300));

      const response = await fetch(`/api/employee-availability/${selectedEmployee?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("API error:", response.status, errorData);
        throw new Error(`Failed to update availability: ${errorData}`);
      }

      const result = await response.json();
      console.log("Server response:", result);
      return result;
    },
    onSuccess: () => {
      // Invalidate both query formats to ensure data refreshes
      queryClient.invalidateQueries({ 
        queryKey: ['/api/employee-availability', selectedEmployee?.id]
      });
      queryClient.invalidateQueries({
        queryKey: ['availability', selectedEmployee?.id]
      });

      // Give time for UI to update before closing
      setTimeout(() => {
        setIsManagingAvailability(false);
      }, 500);
    },
    onError: (error: Error) => {
      console.error("Mutation error:", error);
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
                        <Badge variant="default">
                          Active
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
                                if (confirm(`Are you sure you want to delete ${employee.name}?`)) {
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
          <SheetContent className="sm:max-w-md overflow-y-auto max-h-screen">
            <SheetHeader>
              <SheetTitle>Manage Availability</SheetTitle>
              <SheetDescription>
                Configure when {selectedEmployee.name} is available to work.
              </SheetDescription>
            </SheetHeader>
            <div className="py-6">
              <AvailabilityForm 
                employee={selectedEmployee}
                onSubmit={async (data) => {
                  toast({
                    title: "Saving...",
                    description: "Updating employee availability",
                  });

                  try {
                    await updateAvailabilityMutation.mutateAsync(data);
                    toast({
                      title: "Success",
                      description: "Availability updated successfully",
                      variant: "default",
                    });
                    return true;
                  } catch (error) {
                    console.error("Failed to update availability:", error);
                    toast({
                      title: "Error",
                      description: "Failed to update availability. Please try again.",
                      variant: "destructive",
                    });
                    return false;
                  }
                }}
                isLoading={updateAvailabilityMutation.isPending || isLoadingAvailability}
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

// Define the day availability schema once and reuse
const dayAvailabilitySchema = z.object({
  isAvailable: z.boolean().default(false),
  startTime: z.string().optional().default("09:00"),
  endTime: z.string().optional().default("17:00"),
  isPreferred: z.boolean().default(false), // Added isPreferred field
});

// Create the full availability schema
const availabilitySchema = z.object({
  monday: dayAvailabilitySchema,
  tuesday: dayAvailabilitySchema,
  wednesday: dayAvailabilitySchema,
  thursday: dayAvailabilitySchema,
  friday: dayAvailabilitySchema,
  saturday: dayAvailabilitySchema,
  sunday: dayAvailabilitySchema,
  employeeId: z.number(),
});

type AvailabilityValues = z.infer<typeof availabilitySchema>;

interface AvailabilityFormProps {
  employee: Employee;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

// Map day names to database dayOfWeek values
const dayToDayOfWeek: Record<string, number> = {
  'monday': 1,    // Monday is 1 in database
  'tuesday': 2,   
  'wednesday': 3, 
  'thursday': 4,  
  'friday': 5,    
  'saturday': 6,  
  'sunday': 0     // Sunday is 0 in database
};

function AvailabilityForm({ employee, onSubmit, isLoading }: AvailabilityFormProps) {
  // Helper function to create a day availability object
  const createDayAvailability = (
    isAvailable: boolean = false, 
    startTime: string = "09:00", 
    endTime: string = "17:00", 
    isPreferred: boolean = false
  ) => ({
    isAvailable,
    startTime,
    endTime,
    isPreferred
  });

  // Create the initial default values
  const initialValues: AvailabilityValues = {
    employeeId: employee.id,
    monday: createDayAvailability(),
    tuesday: createDayAvailability(),
    wednesday: createDayAvailability(),
    thursday: createDayAvailability(),
    friday: createDayAvailability(),
    saturday: createDayAvailability(),
    sunday: createDayAvailability()
  };

  const form = useForm<AvailabilityValues>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: initialValues
  });

  const { data: availability, isLoading: isLoadingEmployeeAvailability } = useQuery({
    queryKey: ['availability', employee.id],
    queryFn: () => fetch(`/api/employee-availability/${employee.id}`).then(res => res.json()),
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    if (availability) {
      const defaultValues = days.reduce((acc, day) => {
        const dayData = availability.find(a => a.dayOfWeek === dayToDayOfWeek[day.key.toLowerCase()]);
        if (dayData) {
          acc[day.key.toLowerCase()] = {
            isAvailable: true,
            startTime: dayData.startTime,
            endTime: dayData.endTime,
            isPreferred: dayData.isPreferred
          };
        }
        return acc;
      }, {});

      form.reset(defaultValues);
    }
  }, [availability]);

  // Helper function to create a day availability object


  // Map database numeric dayOfWeek values (0-6) to form field names
  // In DB: 0 = Sunday, 1 = Monday, etc.
  const dayMap = [
    "sunday",    // 0
    "monday",    // 1
    "tuesday",   // 2
    "wednesday", // 3
    "thursday",  // 4
    "friday",    // 5
    "saturday"   // 6
  ] as const;

  // Check if an availability day is enabled - this is a helper to avoid type errors
  const isDayEnabled = (dayKey: string): boolean => {
    try {
      const fieldValue = form.getValues(`${dayKey}.isAvailable` as any);
      return Boolean(fieldValue);
    } catch (err) {
      return false;
    }
  };

  const onFormSubmit = async (data: AvailabilityValues) => {
    // Transform the form data to the API format for saving to database
    const dayToDayOfWeek: Record<string, number> = {
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6,
      'sunday': 0
    };

    // Create availability entries for days marked as available
    const availabilityData = Object.entries(data)
      .filter(([key, value]) => 
        key !== 'employeeId' && 
        value && 
        typeof value === 'object' && 
        value.isAvailable === true
      )
      .map(([dayKey, value]) => ({
        employeeId: employee.id,
        dayOfWeek: dayToDayOfWeek[dayKey],
        startTime: value.startTime || "09:00",
        endTime: value.endTime || "17:00",
        isPreferred: value.isPreferred || false
      }));

    console.log("Submitting availability data:", availabilityData);
    return await onSubmit(availabilityData);;
  };

  const AvailabilityForm: React.FC<AvailabilityFormProps> = ({ employee, availability, onSubmit, isLoading }) => {
    const availabilityData = Object.entries(data)
      .filter(([key, value]) => 
        // Filter out the employeeId field and only include days marked as available
        key !== 'employeeId' && 
        value && 
        typeof value === 'object' && 
        'isAvailable' in value && 
        value.isAvailable === true
      )
      .map(([dayKey, dayData]) => {
        // Cast to make TypeScript happy
        const data = dayData as { 
          isAvailable: boolean; 
          startTime: string; 
          endTime: string; 
          isPreferred: boolean; // Changed to boolean
        };

        // Get the numeric day of week value from our mapping
        const dayOfWeek = dayToDayOfWeek[dayKey];

        return {
          employeeId: employee.id,
          dayOfWeek,  // This is the numeric value (0-6) for database
          startTime: data.startTime || "09:00",
          endTime: data.endTime || "17:00",
          isPreferred: data.isPreferred
        };
      });

    console.log("Submitting availability data:", availabilityData);
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
              <div key={day.key} className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <FormField
                      control={form.control}
                      name={`${day.key}.isAvailable`}
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={!!field.value}
                              onCheckedChange={(value) => field.onChange(!!value)}
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
                    <>
                      <div className="flex items-center gap-2 flex-1">
                        <FormField
                          control={form.control}
                          name={`${day.key}.startTime`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  type="time"
                                  {...field}
                                  disabled={!isDayEnabled(day.key)}
                                  className="w-full"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <span className="text-sm text-muted-foreground">to</span>
                        <FormField
                          control={form.control}
                          name={`${day.key}.endTime`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  type="time"
                                  {...field}
                                  disabled={!isDayEnabled(day.key)}
                                  className="w-full"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <FormField
                          control={form.control}
                          name={`${day.key}.isPreferred`}
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={!!field.value}
                                  onCheckedChange={(value) => field.onChange(!!value)}
                                />
                              </FormControl>
                              <FormLabel className="font-medium">
                                Preferred
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                    </>
                  )}
                </div>
                <Separator className="mt-2" />
              </div>
            ))}
          </div>
        )}

        <SheetFooter>
          <div className="mt-6 flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => form.reset()} 
              disabled={isLoading}
            >
              Reset
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              onClick={() => {
                // Log form state before submission
                console.log("Current form values:", form.getValues());
              }}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  <span>Saving...</span>
                </div>
              ) : "Save Changes"}
            </Button>
          </div>
        </SheetFooter>
      </form>
    </Form>
  );
}