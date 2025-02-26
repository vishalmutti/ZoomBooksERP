import { useState } from "react";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Department, 
  Employee, 
  Shift, 
  TimeOffRequest,
  EmployeeAvailability 
} from "@shared/schema";
import {
  ArrowLeftIcon,
  DownloadIcon,
  EyeIcon,
  SaveIcon,
  CalendarDaysIcon,
  RefreshCcwIcon,
  FileTextIcon,
  ClockIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  Building2Icon,
  UsersIcon,
  BookOpenCheckIcon,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { format, eachDayOfInterval, addDays, getDay, parseISO } from "date-fns";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// Validation schema for auto-schedule generation
const generateScheduleSchema = z.object({
  startDate: z.string({
    required_error: "Start date is required",
  }),
  endDate: z.string({
    required_error: "End date is required",
  }),
  departments: z.array(z.number()).min(1, "Select at least one department"),
  includeWeekends: z.boolean().default(false),
  respectTimeOffRequests: z.boolean().default(true),
  maxHoursPerEmployee: z.number().min(1).max(12).default(8.5),
  overwriteExistingShifts: z.boolean().default(false),
  useTemplates: z.boolean().default(false),
  templateName: z.string().optional(),
  saveAsTemplate: z.boolean().default(false),
  newTemplateName: z.string().optional(),
}).refine(data => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end >= start;
}, {
  message: "End date must be after start date",
  path: ["endDate"],
}).refine(data => {
  if (data.saveAsTemplate && (!data.newTemplateName || data.newTemplateName.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Template name is required when saving as template",
  path: ["newTemplateName"],
}).refine(data => {
  if (data.useTemplates && (!data.templateName || data.templateName.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Please select a template to use",
  path: ["templateName"],
});

type GenerateScheduleValues = z.infer<typeof generateScheduleSchema>;

// Mock type for generated schedule
interface GeneratedShift extends Shift {
  employee?: Employee;
  department?: Department;
  conflicts?: string[];
}

export default function GenerateSchedulePage() {
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(addDays(new Date(), 6));
  const [selectedDepartments, setSelectedDepartments] = useState<number[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [generatedSchedule, setGeneratedSchedule] = useState<GeneratedShift[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasConflicts, setHasConflicts] = useState(false);
  const [saveTemplateDialog, setSaveTemplateDialog] = useState(false);

  const { toast } = useToast();

  const dateRange = startDate && endDate 
    ? eachDayOfInterval({ start: startDate, end: endDate })
    : [];

  const { data: departments, isLoading: isLoadingDepartments } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });

  const { data: employees, isLoading: isLoadingEmployees } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
  });

  const { data: timeOffRequests, isLoading: isLoadingTimeOff } = useQuery<TimeOffRequest[]>({
    queryKey: ['/api/time-off-requests'],
  });

  const { data: employeeAvailability, isLoading: isLoadingAvailability } = useQuery<EmployeeAvailability[]>({
    queryKey: ['/api/employee-availability'],
  });

  const { data: scheduleTemplates, isLoading: isLoadingTemplates } = useQuery<any[]>({
    queryKey: ['/api/schedule-templates'],
  });

  const generateScheduleMutation = useMutation({
    mutationFn: async (data: GenerateScheduleValues) => {
      setIsGenerating(true);
      // In a real application, this would be an API call
      // For this demonstration, we'll simulate the schedule generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate generating a schedule
      const generatedShifts = generateMockSchedule(data);
      setGeneratedSchedule(generatedShifts);
      setHasGenerated(true);
      setIsGenerating(false);
      
      // Check for conflicts
      const hasConflicts = generatedShifts.some(shift => shift.conflicts && shift.conflicts.length > 0);
      setHasConflicts(hasConflicts);
      
      return generatedShifts;
    },
    onSuccess: (data) => {
      toast({
        title: "Schedule generated",
        description: hasConflicts 
          ? "Schedule generated with conflicts. Please review before saving."
          : "Schedule generated successfully. You can now review and save it.",
        variant: hasConflicts ? "destructive" : "default",
      });
    },
    onError: (error: Error) => {
      setIsGenerating(false);
      toast({
        title: "Error generating schedule",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveScheduleMutation = useMutation({
    mutationFn: async (shifts: GeneratedShift[]) => {
      // In a real application, this would save the shifts to the database
      await new Promise(resolve => setTimeout(resolve, 1000));
      return shifts;
    },
    onSuccess: () => {
      toast({
        title: "Schedule saved",
        description: "The schedule has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving schedule",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveTemplateMutation = useMutation({
    mutationFn: async ({ name, shifts }: { name: string, shifts: GeneratedShift[] }) => {
      // In a real application, this would save the template to the database
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { name, shifts };
    },
    onSuccess: () => {
      toast({
        title: "Template saved",
        description: "The schedule template has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/schedule-templates'] });
      setSaveTemplateDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mock function to generate a schedule
  const generateMockSchedule = (data: GenerateScheduleValues): GeneratedShift[] => {
    const shifts: GeneratedShift[] = [];
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const dateRange = eachDayOfInterval({ start, end });
    
    // Filter employees by selected departments
    const departmentEmployees = employees?.filter(emp => 
      data.departments.includes(emp.departmentId)
    ) || [];
    
    // For each day and each department
    dateRange.forEach(date => {
      const dayOfWeek = getDay(date);
      // Skip weekends if not included
      if (!data.includeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
        return;
      }
      
      data.departments.forEach(deptId => {
        const department = departments?.find(d => d.id === deptId);
        if (!department) return;
        
        // Get required staff for day shift
        const requiredStaffDay = department.requiredStaffDay || 1;
        
        // Get available employees for this department on this day
        const availableEmployees = departmentEmployees.filter(emp => {
          // Check time off requests
          if (data.respectTimeOffRequests) {
            const hasTimeOff = timeOffRequests?.some(req => {
              if (req.employeeId !== emp.id || req.status !== 'approved') return false;
              const reqStart = parseISO(req.startDate);
              const reqEnd = parseISO(req.endDate);
              return date >= reqStart && date <= reqEnd;
            });
            if (hasTimeOff) return false;
          }
          
          // Check availability for this day of week
          const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];
          const availability = employeeAvailability?.find(a => 
            a.employeeId === emp.id && 
            a.dayOfWeek.toLowerCase() === dayName
          );
          
          return availability?.isAvailable || false;
        });
        
        // Create day shifts
        for (let i = 0; i < requiredStaffDay; i++) {
          if (i < availableEmployees.length) {
            const employee = availableEmployees[i];
            shifts.push({
              id: Math.floor(Math.random() * 10000),
              employeeId: employee.id,
              departmentId: deptId,
              date: date.toISOString().split('T')[0],
              startTime: "09:00",
              endTime: "17:30",
              status: "scheduled",
              notes: "",
              createdAt: new Date().toISOString(),
              employee,
              department,
              conflicts: i >= availableEmployees.length ? ["No available employee"] : [],
            });
          } else {
            // No available employee, create a shift with conflict
            shifts.push({
              id: Math.floor(Math.random() * 10000),
              employeeId: 0, // Placeholder
              departmentId: deptId,
              date: date.toISOString().split('T')[0],
              startTime: "09:00",
              endTime: "17:30",
              status: "scheduled",
              notes: "UNSTAFFED",
              createdAt: new Date().toISOString(),
              department,
              conflicts: ["No available employee"],
            });
          }
        }
        
        // If department has night shift requirements
        if (department.requiredStaffNight && department.requiredStaffNight > 0) {
          const requiredStaffNight = department.requiredStaffNight;
          
          // Create night shifts (use employees not already assigned to day shift)
          const nightShiftEmployees = availableEmployees.filter(emp => 
            !shifts.some(s => 
              s.date === date.toISOString().split('T')[0] && 
              s.employeeId === emp.id
            )
          );
          
          for (let i = 0; i < requiredStaffNight; i++) {
            if (i < nightShiftEmployees.length) {
              const employee = nightShiftEmployees[i];
              shifts.push({
                id: Math.floor(Math.random() * 10000),
                employeeId: employee.id,
                departmentId: deptId,
                date: date.toISOString().split('T')[0],
                startTime: "18:00",
                endTime: "02:30",
                status: "scheduled",
                notes: "",
                createdAt: new Date().toISOString(),
                employee,
                department,
                conflicts: [],
              });
            } else {
              // No available employee, create a shift with conflict
              shifts.push({
                id: Math.floor(Math.random() * 10000),
                employeeId: 0, // Placeholder
                departmentId: deptId,
                date: date.toISOString().split('T')[0],
                startTime: "18:00",
                endTime: "02:30",
                status: "scheduled",
                notes: "UNSTAFFED",
                createdAt: new Date().toISOString(),
                department,
                conflicts: ["No available employee for night shift"],
              });
            }
          }
        }
      });
    });
    
    return shifts;
  };

  // Function to group shifts by date for display
  const groupShiftsByDate = (shifts: GeneratedShift[]) => {
    const grouped: Record<string, GeneratedShift[]> = {};
    shifts.forEach(shift => {
      if (!grouped[shift.date]) {
        grouped[shift.date] = [];
      }
      grouped[shift.date].push(shift);
    });
    return grouped;
  };

  // Group the generated schedule by date
  const groupedSchedule = groupShiftsByDate(generatedSchedule);

  const form = useForm<GenerateScheduleValues>({
    resolver: zodResolver(generateScheduleSchema),
    defaultValues: {
      startDate: startDate?.toISOString().split('T')[0],
      endDate: endDate?.toISOString().split('T')[0],
      departments: [],
      includeWeekends: false,
      respectTimeOffRequests: true,
      maxHoursPerEmployee: 8.5,
      overwriteExistingShifts: false,
      useTemplates: false,
      saveAsTemplate: false,
    },
  });

  // Handle department selection changes
  const handleDepartmentChange = (departmentId: number, checked: boolean) => {
    setSelectedDepartments(prevSelected => {
      if (checked) {
        return [...prevSelected, departmentId];
      } else {
        return prevSelected.filter(id => id !== departmentId);
      }
    });
  };

  // Handle form submission
  const onSubmit = (data: GenerateScheduleValues) => {
    data.departments = selectedDepartments;
    if (data.useTemplates && data.templateName) {
      // In a real app, we'd load the template data here
      toast({
        title: "Using template",
        description: `Generating schedule using template: ${data.templateName}`,
      });
    }
    generateScheduleMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Generate Schedule</h1>
          <p className="text-muted-foreground">
            Automatically create optimal schedules based on constraints
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
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generation Settings</CardTitle>
              <CardDescription>
                Configure parameters for schedule generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date</FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                {...field} 
                                onChange={(e) => {
                                  field.onChange(e);
                                  setStartDate(e.target.value ? new Date(e.target.value) : undefined);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Date</FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  setEndDate(e.target.value ? new Date(e.target.value) : undefined);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-2">Departments</h3>
                      {isLoadingDepartments ? (
                        <div className="animate-pulse h-24 bg-muted rounded-md"></div>
                      ) : (
                        <div className="space-y-2 border rounded-md p-3">
                          {departments?.map((dept) => (
                            <div key={dept.id} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`dept-${dept.id}`}
                                checked={selectedDepartments.includes(dept.id)}
                                onCheckedChange={(checked) => 
                                  handleDepartmentChange(dept.id, checked as boolean)
                                }
                              />
                              <label 
                                htmlFor={`dept-${dept.id}`}
                                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {dept.name}
                              </label>
                            </div>
                          ))}
                          {departments?.length === 0 && (
                            <p className="text-sm text-muted-foreground py-2">
                              No departments found. Please create departments first.
                            </p>
                          )}
                        </div>
                      )}
                      {form.formState.errors.departments && (
                        <p className="text-sm font-medium text-destructive mt-1">
                          {form.formState.errors.departments.message}
                        </p>
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name="includeWeekends"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Include Weekends</FormLabel>
                            <FormDescription>
                              Generate schedules for Saturday and Sunday
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="respectTimeOffRequests"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Respect Time Off Requests</FormLabel>
                            <FormDescription>
                              Avoid scheduling employees who have approved time off
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxHoursPerEmployee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Hours Per Day</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              step={0.5}
                              min={1}
                              max={12}
                            />
                          </FormControl>
                          <FormDescription>
                            Maximum work hours per employee per day
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="overwriteExistingShifts"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Overwrite Existing Shifts</FormLabel>
                            <FormDescription>
                              Replace any existing shifts in the selected date range
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <Separator />

                    <FormField
                      control={form.control}
                      name="useTemplates"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Use Existing Template</FormLabel>
                            <FormDescription>
                              Generate schedule based on a saved template
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    {form.watch("useTemplates") && (
                      <FormField
                        control={form.control}
                        name="templateName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Template</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select template" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {/* Mock templates */}
                                <SelectItem value="standard_week">Standard Week</SelectItem>
                                <SelectItem value="summer_schedule">Summer Schedule</SelectItem>
                                <SelectItem value="holiday_coverage">Holiday Coverage</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="saveAsTemplate"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Save As Template</FormLabel>
                            <FormDescription>
                              Save the generated schedule as a reusable template
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    {form.watch("saveAsTemplate") && (
                      <FormField
                        control={form.control}
                        name="newTemplateName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Template Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Standard Week" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <Button 
                      type="submit" 
                      disabled={
                        isGenerating || 
                        selectedDepartments.length === 0 || 
                        !startDate || 
                        !endDate
                      }
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCcwIcon className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <CalendarDaysIcon className="mr-2 h-4 w-4" />
                          Generate Schedule
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {hasGenerated && (
            <Card>
              <CardHeader>
                <CardTitle>Schedule Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span>Total Days:</span>
                    <Badge variant="outline">{dateRange.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Departments:</span>
                    <Badge variant="outline">{selectedDepartments.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Total Shifts:</span>
                    <Badge variant="outline">{generatedSchedule.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Conflicts:</span>
                    <Badge variant={hasConflicts ? "destructive" : "success"}>
                      {hasConflicts ? (
                        <span className="flex items-center">
                          <AlertTriangleIcon className="mr-1 h-3 w-3" />
                          Yes
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <CheckCircle2Icon className="mr-1 h-3 w-3" />
                          None
                        </span>
                      )}
                    </Badge>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <h3 className="text-sm font-medium">Staffing Coverage:</h3>
                  <div className="space-y-3">
                    {selectedDepartments.map(deptId => {
                      const department = departments?.find(d => d.id === deptId);
                      if (!department) return null;
                      
                      // Calculate coverage for this department
                      const totalRequired = (department.requiredStaffDay || 0) + (department.requiredStaffNight || 0);
                      const departmentShifts = generatedSchedule.filter(s => s.departmentId === deptId);
                      const unstaffedShifts = departmentShifts.filter(s => s.conflicts && s.conflicts.length > 0);
                      const coveragePercent = totalRequired > 0 
                        ? ((departmentShifts.length - unstaffedShifts.length) / departmentShifts.length) * 100
                        : 0;
                      
                      return (
                        <div key={deptId} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{department.name}</span>
                            <span>{Math.round(coveragePercent)}% staffed</span>
                          </div>
                          <Progress value={coveragePercent} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(true)}
                >
                  <EyeIcon className="mr-2 h-4 w-4" />
                  Preview
                </Button>
                <Button
                  onClick={() => saveScheduleMutation.mutate(generatedSchedule)}
                  disabled={saveScheduleMutation.isPending}
                >
                  {saveScheduleMutation.isPending ? (
                    <>
                      <RefreshCcwIcon className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <SaveIcon className="mr-2 h-4 w-4" />
                      Save Schedule
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          {hasGenerated ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Generated Schedule</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <DownloadIcon className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSaveTemplateDialog(true)}
                    >
                      <FileTextIcon className="mr-2 h-4 w-4" />
                      Save as Template
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  Preview the generated schedule before saving
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="byDate" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="byDate">By Date</TabsTrigger>
                    <TabsTrigger value="byDepartment">By Department</TabsTrigger>
                    <TabsTrigger value="byEmployee">By Employee</TabsTrigger>
                  </TabsList>

                  <TabsContent value="byDate" className="pt-4">
                    <div className="space-y-6">
                      {Object.entries(groupedSchedule).map(([date, shifts]) => (
                        <div key={date} className="space-y-3">
                          <h3 className="font-semibold">
                            {format(new Date(date), "EEEE, MMMM d, yyyy")}
                          </h3>
                          <div className="rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Department</TableHead>
                                  <TableHead>Employee</TableHead>
                                  <TableHead>Time</TableHead>
                                  <TableHead>Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {shifts.map((shift) => (
                                  <TableRow key={shift.id} className={shift.conflicts?.length ? "bg-red-50" : ""}>
                                    <TableCell>{shift.department?.name || "Unknown"}</TableCell>
                                    <TableCell>
                                      {shift.employee ? (
                                        `${shift.employee.firstName} ${shift.employee.lastName}`
                                      ) : (
                                        <span className="text-red-500 font-medium">
                                          UNSTAFFED
                                        </span>
                                      )}
                                    </TableCell>
                                    <TableCell>{shift.startTime} - {shift.endTime}</TableCell>
                                    <TableCell>
                                      {shift.conflicts?.length ? (
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <div>
                                                <Badge variant="destructive" className="cursor-help">
                                                  Conflict
                                                </Badge>
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>{shift.conflicts.join(", ")}</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      ) : (
                                        <Badge variant="outline">
                                          {shift.status}
                                        </Badge>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="byDepartment" className="pt-4">
                    <div className="space-y-6">
                      {selectedDepartments.map(deptId => {
                        const department = departments?.find(d => d.id === deptId);
                        if (!department) return null;
                        
                        const departmentShifts = generatedSchedule.filter(s => s.departmentId === deptId);
                        
                        return (
                          <div key={deptId} className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Building2Icon className="h-5 w-5 text-primary" />
                              <h3 className="font-semibold">{department.name}</h3>
                            </div>
                            
                            {departmentShifts.length > 0 ? (
                              <div className="rounded-md border">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Date</TableHead>
                                      <TableHead>Employee</TableHead>
                                      <TableHead>Time</TableHead>
                                      <TableHead>Status</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {departmentShifts.map((shift) => (
                                      <TableRow key={shift.id} className={shift.conflicts?.length ? "bg-red-50" : ""}>
                                        <TableCell>{format(new Date(shift.date), "MMM d, EEE")}</TableCell>
                                        <TableCell>
                                          {shift.employee ? (
                                            `${shift.employee.firstName} ${shift.employee.lastName}`
                                          ) : (
                                            <span className="text-red-500 font-medium">
                                              UNSTAFFED
                                            </span>
                                          )}
                                        </TableCell>
                                        <TableCell>{shift.startTime} - {shift.endTime}</TableCell>
                                        <TableCell>
                                          {shift.conflicts?.length ? (
                                            <Badge variant="destructive">Conflict</Badge>
                                          ) : (
                                            <Badge variant="outline">{shift.status}</Badge>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            ) : (
                              <div className="text-center py-4 border rounded-md bg-muted/20">
                                No shifts scheduled for this department
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </TabsContent>

                  <TabsContent value="byEmployee" className="pt-4">
                    <div className="space-y-6">
                      {employees?.filter(emp => {
                        return generatedSchedule.some(shift => shift.employeeId === emp.id);
                      }).map(employee => {
                        const employeeShifts = generatedSchedule.filter(s => s.employeeId === employee.id);
                        
                        return (
                          <div key={employee.id} className="space-y-3">
                            <div className="flex items-center gap-2">
                              <UsersIcon className="h-5 w-5 text-primary" />
                              <h3 className="font-semibold">{employee.firstName} {employee.lastName}</h3>
                            </div>
                            
                            {employeeShifts.length > 0 ? (
                              <div className="rounded-md border">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Date</TableHead>
                                      <TableHead>Department</TableHead>
                                      <TableHead>Time</TableHead>
                                      <TableHead>Hours</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {employeeShifts.map((shift) => {
                                      // Calculate shift duration
                                      const startParts = shift.startTime.split(':').map(Number);
                                      const endParts = shift.endTime.split(':').map(Number);
                                      const startMinutes = startParts[0] * 60 + startParts[1];
                                      const endMinutes = endParts[0] * 60 + endParts[1];
                                      let durationMinutes = endMinutes - startMinutes;
                                      if (durationMinutes < 0) durationMinutes += 24 * 60; // Overnight shift
                                      const durationHours = (durationMinutes / 60).toFixed(1);
                                      
                                      return (
                                        <TableRow key={shift.id}>
                                          <TableCell>{format(new Date(shift.date), "MMM d, EEE")}</TableCell>
                                          <TableCell>{shift.department?.name || "Unknown"}</TableCell>
                                          <TableCell>{shift.startTime} - {shift.endTime}</TableCell>
                                          <TableCell>{durationHours} hrs</TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </div>
                            ) : (
                              <div className="text-center py-4 border rounded-md bg-muted/20">
                                No shifts scheduled for this employee
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Schedule Preview</CardTitle>
                <CardDescription>
                  Generate a schedule to see a preview here
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center h-96">
                <BookOpenCheckIcon className="h-16 w-16 text-muted-foreground/60" />
                <h3 className="mt-4 text-xl font-semibold text-muted-foreground/80">
                  No Schedule Generated Yet
                </h3>
                <p className="mt-2 text-center text-muted-foreground max-w-md">
                  Use the settings on the left to configure your schedule parameters, then click "Generate Schedule" to create an optimal employee schedule.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Save Template Dialog */}
      <Dialog open={saveTemplateDialog} onOpenChange={setSaveTemplateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Save this schedule as a reusable template for future use.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input 
                id="template-name" 
                placeholder="e.g., Standard Week Schedule"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="template-description">Description (Optional)</Label>
              <Textarea 
                id="template-description" 
                placeholder="Add details about this template..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveTemplateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                const nameInput = document.getElementById('template-name') as HTMLInputElement;
                const descInput = document.getElementById('template-description') as HTMLTextAreaElement;
                
                if (nameInput?.value) {
                  saveTemplateMutation.mutate({
                    name: nameInput.value,
                    shifts: generatedSchedule
                  });
                }
              }}
              disabled={saveTemplateMutation.isPending}
            >
              {saveTemplateMutation.isPending ? "Saving..." : "Save Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Schedule Preview</DialogTitle>
            <DialogDescription>
              Preview the full generated schedule
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-auto max-h-[70vh] mt-4">
            <Tabs defaultValue="byDate" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="byDate">By Date</TabsTrigger>
                <TabsTrigger value="byDepartment">By Department</TabsTrigger>
                <TabsTrigger value="byEmployee">By Employee</TabsTrigger>
              </TabsList>

              <TabsContent value="byDate" className="pt-4">
                <div className="space-y-6">
                  {Object.entries(groupedSchedule).map(([date, shifts]) => (
                    <div key={date} className="space-y-3">
                      <h3 className="font-semibold">
                        {format(new Date(date), "EEEE, MMMM d, yyyy")}
                      </h3>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Department</TableHead>
                              <TableHead>Employee</TableHead>
                              <TableHead>Time</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {shifts.map((shift) => (
                              <TableRow key={shift.id} className={shift.conflicts?.length ? "bg-red-50" : ""}>
                                <TableCell>{shift.department?.name || "Unknown"}</TableCell>
                                <TableCell>
                                  {shift.employee ? (
                                    `${shift.employee.firstName} ${shift.employee.lastName}`
                                  ) : (
                                    <span className="text-red-500 font-medium">
                                      UNSTAFFED
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>{shift.startTime} - {shift.endTime}</TableCell>
                                <TableCell>
                                  {shift.conflicts?.length ? (
                                    <Badge variant="destructive">Conflict</Badge>
                                  ) : (
                                    <Badge variant="outline">{shift.status}</Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Other tabs content same as above */}
            </Tabs>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
            <Button 
              onClick={() => {
                saveScheduleMutation.mutate(generatedSchedule);
                setShowPreview(false);
              }}
            >
              Save Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}