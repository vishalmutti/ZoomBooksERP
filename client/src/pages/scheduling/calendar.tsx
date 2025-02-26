import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Department, Employee, Shift, InsertShift } from "@shared/schema";
import { 
  ArrowLeftIcon, 
  PlusCircleIcon, 
  Edit2Icon, 
  TrashIcon,
  Calendar as CalendarIcon
} from "lucide-react";
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

type ShiftWithDetails = Shift & {
  employee?: Employee;
  department?: Department;
};

export default function ScheduleCalendarPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [editingShift, setEditingShift] = useState<ShiftWithDetails | null>(null);
  const [isAddingShift, setIsAddingShift] = useState(false);
  const { toast } = useToast();

  const formattedDate = date.toISOString().split('T')[0];

  const { data: departments, isLoading: isLoadingDepartments } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });

  const { data: employees, isLoading: isLoadingEmployees } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
  });

  const { data: shifts, isLoading: isLoadingShifts } = useQuery<Shift[]>({
    queryKey: ['/api/shifts', formattedDate, selectedDepartment],
  });

  const createShiftMutation = useMutation({
    mutationFn: async (data: InsertShift) => {
      return await apiRequest<Shift>({
        url: '/api/shifts',
        method: 'POST',
        data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Shift created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
      setIsAddingShift(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating shift",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateShiftMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertShift> }) => {
      return await apiRequest<Shift>({
        url: `/api/shifts/${id}`,
        method: 'PATCH',
        data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Shift updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
      setEditingShift(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating shift",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteShiftMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest({
        url: `/api/shifts/${id}`,
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Shift deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting shift",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Prepare shifts with employee and department data
  const shiftsWithDetails: ShiftWithDetails[] = shifts?.map(shift => {
    const employee = employees?.find(e => e.id === shift.employeeId);
    const department = departments?.find(d => d.id === shift.departmentId);
    return { ...shift, employee, department };
  }) || [];

  // Filter shifts by department if needed
  const filteredShifts = selectedDepartment === "all" 
    ? shiftsWithDetails 
    : shiftsWithDetails.filter(shift => shift.departmentId.toString() === selectedDepartment);

  // Group shifts by department for better visualization
  const shiftsByDepartment: Record<string, ShiftWithDetails[]> = {};
  filteredShifts.forEach(shift => {
    const deptName = shift.department?.name || "Unknown";
    if (!shiftsByDepartment[deptName]) {
      shiftsByDepartment[deptName] = [];
    }
    shiftsByDepartment[deptName].push(shift);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule Calendar</h1>
          <p className="text-muted-foreground">
            View and manage employee shifts
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Select Date & Filter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(date) => date && setDate(date)}
              className="rounded-md border w-full"
            />

            <div className="space-y-2 pt-4">
              <Label htmlFor="department-filter">Department Filter</Label>
              <Select
                value={selectedDepartment}
                onValueChange={setSelectedDepartment}
              >
                <SelectTrigger id="department-filter">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => setIsAddingShift(true)}
            >
              <PlusCircleIcon className="mr-2 h-4 w-4" />
              Add New Shift
            </Button>
          </CardFooter>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              Shifts for {date.toLocaleDateString()}
            </CardTitle>
            <CardDescription>
              {filteredShifts.length} shift(s) scheduled
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingShifts || isLoadingDepartments || isLoadingEmployees ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : filteredShifts.length === 0 ? (
              <div className="text-center py-12 border rounded-md bg-muted/20">
                <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No shifts scheduled</h3>
                <p className="text-muted-foreground">
                  Add a shift to get started.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsAddingShift(true)}
                >
                  <PlusCircleIcon className="mr-2 h-4 w-4" />
                  Add Shift
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(shiftsByDepartment).map(([deptName, deptShifts]) => (
                  <div key={deptName} className="space-y-2">
                    <h3 className="font-semibold text-lg">{deptName}</h3>
                    <div className="rounded-md border divide-y">
                      {deptShifts.map(shift => (
                        <div key={shift.id} className="p-4 flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">
                              {shift.employee?.firstName} {shift.employee?.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {shift.startTime} - {shift.endTime}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => setEditingShift(shift)}
                                  >
                                    <Edit2Icon className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit shift</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => {
                                      if (confirm("Are you sure you want to delete this shift?")) {
                                        deleteShiftMutation.mutate(shift.id);
                                      }
                                    }}
                                  >
                                    <TrashIcon className="h-4 w-4 text-red-500" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete shift</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Shift Dialog */}
      <ShiftFormDialog 
        isOpen={isAddingShift} 
        onClose={() => setIsAddingShift(false)}
        departments={departments || []}
        employees={employees || []}
        date={date}
        onSubmit={(data) => createShiftMutation.mutate(data)}
      />

      {/* Edit Shift Dialog */}
      {editingShift && (
        <ShiftFormDialog 
          isOpen={!!editingShift} 
          onClose={() => setEditingShift(null)}
          departments={departments || []}
          employees={employees || []}
          date={new Date(editingShift.date)}
          initialData={editingShift}
          onSubmit={(data) => updateShiftMutation.mutate({ id: editingShift.id, data })}
        />
      )}
    </div>
  );
}

// Validation schema for our form
const shiftFormSchema = z.object({
  employeeId: z.number({
    required_error: "Please select an employee",
  }),
  departmentId: z.number({
    required_error: "Please select a department",
  }),
  date: z.string({
    required_error: "Please select a date",
  }),
  startTime: z.string({
    required_error: "Please enter start time",
  }).regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"),
  endTime: z.string({
    required_error: "Please enter end time",
  }).regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"),
  status: z.enum(["scheduled", "completed", "cancelled"], {
    required_error: "Please select a status",
  }),
  notes: z.string().optional(),
}).refine(data => {
  const start = data.startTime.split(':').map(Number);
  const end = data.endTime.split(':').map(Number);
  
  // Convert to minutes for easy comparison
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];
  
  return endMinutes > startMinutes;
}, {
  message: "End time must be after start time",
  path: ["endTime"],
});

type ShiftFormValues = z.infer<typeof shiftFormSchema>;

interface ShiftFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  employees: Employee[];
  date: Date;
  initialData?: ShiftWithDetails;
  onSubmit: (data: InsertShift) => void;
}

function ShiftFormDialog({
  isOpen,
  onClose,
  departments,
  employees,
  date,
  initialData,
  onSubmit
}: ShiftFormDialogProps) {
  const dateString = date.toISOString().split('T')[0];
  
  const defaultValues: Partial<ShiftFormValues> = {
    date: dateString,
    employeeId: initialData?.employeeId || undefined,
    departmentId: initialData?.departmentId || undefined,
    startTime: initialData?.startTime || "",
    endTime: initialData?.endTime || "",
    status: initialData?.status || "scheduled",
    notes: initialData?.notes || "",
  };

  const form = useForm<ShiftFormValues>({
    resolver: zodResolver(shiftFormSchema),
    defaultValues,
  });

  // Reset form when the dialog opens
  useEffect(() => {
    if (isOpen) {
      form.reset(defaultValues);
    }
  }, [isOpen, form, defaultValues]);

  function onFormSubmit(data: ShiftFormValues) {
    onSubmit(data as InsertShift);
  }

  // Filter employees based on department
  const selectedDepartmentId = form.watch("departmentId");
  const filteredEmployees = selectedDepartmentId
    ? employees.filter(emp => emp.departmentId === selectedDepartmentId)
    : employees;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Shift" : "Add New Shift"}</DialogTitle>
          <DialogDescription>
            {initialData 
              ? "Update the shift details below."
              : "Create a new shift assignment."
            }
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="departmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value?.toString()}
                    disabled={!selectedDepartmentId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={selectedDepartmentId ? "Select employee" : "First select a department"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredEmployees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.firstName} {emp.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time (HH:MM)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="09:00" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time (HH:MM)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="17:30" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value as "scheduled" | "completed" | "cancelled")}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {initialData ? "Update Shift" : "Create Shift"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}