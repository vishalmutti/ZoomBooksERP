import React, { useState } from "react";
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
import { queryClient } from "@/lib/queryClient";
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

/**
 * IMPORTANT:
 * We parse "YYYY-MM-DD" strings as local dates so the user
 * sees the exact day they picked, even in negative timezones.
 */
function parseYMDToLocalDate(ymd: string): Date {
  const [year, month, day] = ymd.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * The form schema is unchanged, but note we just parse date strings
 * as local below, *not* new Date("YYYY-MM-DD").
 */
const generateScheduleSchema = z
  .object({
    startDate: z.string({
      required_error: "Start date is required",
    }),
    endDate: z.string({
      required_error: "End date is required",
    }),
    departments: z.array(z.number()).min(1, "Select at least one department"),
    includeWeekends: z.boolean().default(false),
    respectTimeOffRequests: z.boolean().default(true),
    maxHoursPerWeek: z.number().min(1).max(50).default(42.5),
    overwriteExistingShifts: z.boolean().default(false),
    useTemplates: z.boolean().default(false),
    templateName: z.string().optional(),
    saveAsTemplate: z.boolean().default(false),
    newTemplateName: z.string().optional(),
  })
  .refine(
    (data) => {
      const start = parseYMDToLocalDate(data.startDate);
      const end = parseYMDToLocalDate(data.endDate);
      return end >= start;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  )
  .refine(
    (data) => {
      if (data.saveAsTemplate && (!data.newTemplateName || data.newTemplateName.trim() === "")) {
        return false;
      }
      return true;
    },
    {
      message: "Template name is required when saving as template",
      path: ["newTemplateName"],
    }
  )
  .refine(
    (data) => {
      if (data.useTemplates && (!data.templateName || data.templateName.trim() === "")) {
        return false;
      }
      return true;
    },
    {
      message: "Please select a template to use",
      path: ["templateName"],
    }
  );

type GenerateScheduleValues = z.infer<typeof generateScheduleSchema>;

// Mock type for generated schedule
interface GeneratedShift extends Shift {
  employee?: Employee;
  department?: Department;
  conflicts?: string[];
}

export default function GenerateSchedulePage() {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 6));
  const [selectedDepartments, setSelectedDepartments] = useState<number[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [generatedSchedule, setGeneratedSchedule] = useState<GeneratedShift[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasConflicts, setHasConflicts] = useState(false);
  const [saveTemplateDialog, setSaveTemplateDialog] = useState(false);

  const { toast } = useToast();

  // Compute dateRange in local time
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

  // Queries
  const { data: departments, isLoading: isLoadingDepartments } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });
  const { data: employees, isLoading: isLoadingEmployees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });
  const { data: timeOffRequests, isLoading: isLoadingTimeOff } = useQuery<TimeOffRequest[]>({
    queryKey: ["/api/time-off-requests"],
  });
  const { data: employeeAvailability, isLoading: isLoadingAvailability } =
    useQuery<EmployeeAvailability[]>({
      queryKey: ["/api/employee-availability"],
    });
  const { data: scheduleTemplates, isLoading: isLoadingTemplates } = useQuery<any[]>({
    queryKey: ["/api/schedule-templates"],
  });

  // Mutations
  const generateScheduleMutation = useMutation({
    mutationFn: async (data: GenerateScheduleValues) => {
      setIsGenerating(true);

      // Simulate an API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newSchedule = generateMockSchedule(data);
      setGeneratedSchedule(newSchedule);
      setHasGenerated(true);
      setIsGenerating(false);

      // Check for conflicts
      const conflictExists = newSchedule.some((shift) => shift.conflicts && shift.conflicts.length);
      setHasConflicts(conflictExists);

      return newSchedule;
    },
    onSuccess: () => {
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
      // Simulate saving
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return shifts;
    },
    onSuccess: () => {
      toast({
        title: "Schedule saved",
        description: "The schedule has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
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
    mutationFn: async ({ name, shifts }: { name: string; shifts: GeneratedShift[] }) => {
      // Simulate saving a template
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { name, shifts };
    },
    onSuccess: () => {
      toast({
        title: "Template saved",
        description: "The schedule template has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/schedule-templates"] });
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

  /** Calculate shift duration in hours */
  function calculateShiftHours(startTime: string, endTime: string): number {
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const startTotal = startH * 60 + startM;
    let endTotal = endH * 60 + endM;
    if (endTotal < startTotal) {
      // overnight shift
      endTotal += 24 * 60;
    }
    return (endTotal - startTotal) / 60;
  }

  /**
   * Generate the schedule. 
   * Note that we parse the start/end as local dates.
   */
  function generateMockSchedule(data: GenerateScheduleValues): GeneratedShift[] {
    const result: GeneratedShift[] = [];

    const localStart = parseYMDToLocalDate(data.startDate); // local midnight
    const localEnd = parseYMDToLocalDate(data.endDate);

    // Build a date array from localStart -> localEnd
    const realRange = eachDayOfInterval({ start: localStart, end: localEnd });

    // Filter employees by selected departments
    const departmentEmps =
      employees?.filter((emp) => data.departments.includes(emp.departmentId)) || [];

    // Track weekly hours
    const weeklyHours: Record<number, Record<string, number>> = {};
    departmentEmps.forEach((emp) => {
      weeklyHours[emp.id] = {};
      realRange.forEach((day) => {
        const startOfWeek = new Date(day);
        startOfWeek.setDate(day.getDate() - day.getDay()); // Sunday
        const key = format(startOfWeek, "yyyy-MM-dd");
        weeklyHours[emp.id][key] = 0;
      });
    });

    // Helper to see if a shift exceeds weekly hours
    function wouldExceedWeekly(empId: number, day: Date, s: string, e: string): boolean {
      if (!empId) return false;
      const hrs = calculateShiftHours(s, e);
      const startOfWeek = new Date(day);
      startOfWeek.setDate(day.getDate() - day.getDay());
      const key = format(startOfWeek, "yyyy-MM-dd");
      return weeklyHours[empId][key] + hrs > data.maxHoursPerWeek;
    }

    // Add hours to an employee
    function addWeeklyHours(empId: number, day: Date, s: string, e: string) {
      const hrs = calculateShiftHours(s, e);
      const startOfWeek = new Date(day);
      startOfWeek.setDate(day.getDate() - day.getDay());
      const key = format(startOfWeek, "yyyy-MM-dd");
      weeklyHours[empId][key] += hrs;
    }

    // Build shifts for each day in range
    for (const day of realRange) {
      const weekday = getDay(day); // 0 = Sunday, 6 = Saturday
      if (!data.includeWeekends && (weekday === 0 || weekday === 6)) continue;

      for (const deptId of data.departments) {
        const dept = departments?.find((d) => d.id === deptId);
        if (!dept) continue;

        const requiredDay = dept.requiredStaffDay || 1;
        const requiredNight = dept.requiredStaffNight || 0;

        // Filter available employees
        const availableEmps = departmentEmps.filter((emp) => {
          // Respect time off?
          if (data.respectTimeOffRequests) {
            const isOff = timeOffRequests?.some((req) => {
              if (req.employeeId !== emp.id || req.status !== "approved") return false;
              const reqStart = parseISO(req.startDate);
              const reqEnd = parseISO(req.endDate);
              // If "day" is within their time off range
              return day >= reqStart && day <= reqEnd;
            });
            if (isOff) return false;
          }

          // Check employeeAvailability?
          if (!employeeAvailability?.length) {
            return true; // no availability data => always available
          }
          const hasRecord = employeeAvailability.some((a) => a.employeeId === emp.id);
          if (!hasRecord) return true; // no record => assume available

          // Must match dayOfWeek
          return employeeAvailability.some(
            (a) => a.employeeId === emp.id && a.dayOfWeek === weekday
          );
        });

        // Create day shifts
        for (let i = 0; i < requiredDay; i++) {
          const dateStr = format(day, "yyyy-MM-dd"); // store as "YYYY-MM-DD"
          const shiftStart = "07:30";
          const shiftEnd = "16:00";

          const chosenEmp = availableEmps.find(
            (emp) =>
              !result.some((s) => s.date === dateStr && s.employeeId === emp.id) &&
              !wouldExceedWeekly(emp.id, day, shiftStart, shiftEnd)
          );

          if (chosenEmp) {
            addWeeklyHours(chosenEmp.id, day, shiftStart, shiftEnd);
            result.push({
              id: Math.floor(Math.random() * 1e6),
              employeeId: chosenEmp.id,
              departmentId: deptId,
              date: dateStr,
              startTime: shiftStart,
              endTime: shiftEnd,
              status: "scheduled",
              notes: "",
              createdAt: new Date(),
              employee: chosenEmp,
              department: dept,
              conflicts: [],
            });
          } else {
            result.push({
              id: Math.floor(Math.random() * 1e6),
              employeeId: 0,
              departmentId: deptId,
              date: dateStr,
              startTime: shiftStart,
              endTime: shiftEnd,
              status: "scheduled",
              notes: "UNSTAFFED",
              createdAt: new Date(),
              department: dept,
              conflicts: ["No available employee"],
            });
          }
        }

        // Create night shifts
        for (let i = 0; i < requiredNight; i++) {
          const dateStr = format(day, "yyyy-MM-dd");
          const nightStart = "16:00";
          const nightEnd = "00:30";

          const chosenEmp = availableEmps.find(
            (emp) =>
              !result.some((s) => s.date === dateStr && s.employeeId === emp.id) &&
              !wouldExceedWeekly(emp.id, day, nightStart, nightEnd)
          );

          if (chosenEmp) {
            addWeeklyHours(chosenEmp.id, day, nightStart, nightEnd);
            result.push({
              id: Math.floor(Math.random() * 1e6),
              employeeId: chosenEmp.id,
              departmentId: deptId,
              date: dateStr,
              startTime: nightStart,
              endTime: nightEnd,
              status: "scheduled",
              notes: "",
              createdAt: new Date(),
              employee: chosenEmp,
              department: dept,
              conflicts: [],
            });
          } else {
            result.push({
              id: Math.floor(Math.random() * 1e6),
              employeeId: 0,
              departmentId: deptId,
              date: dateStr,
              startTime: nightStart,
              endTime: nightEnd,
              status: "scheduled",
              notes: "UNSTAFFED",
              createdAt: new Date(),
              department: dept,
              conflicts: ["No available employee for night shift"],
            });
          }
        }
      }
    }

    return result;
  }

  /** Group shifts by date for display. */
  function groupShiftsByDate(shifts: GeneratedShift[]) {
    const grouped: Record<string, GeneratedShift[]> = {};
    for (const s of shifts) {
      if (!grouped[s.date]) grouped[s.date] = [];
      grouped[s.date].push(s);
    }
    return grouped;
  }

  const groupedSchedule = groupShiftsByDate(generatedSchedule);

  /** Format a local date to yyyy-MM-dd for inputs */
  function formatDateForInput(date: Date): string {
    return format(date, "yyyy-MM-dd");
  }

  // React Hook Form
  const form = useForm<GenerateScheduleValues>({
    resolver: zodResolver(generateScheduleSchema),
    defaultValues: {
      startDate: formatDateForInput(startDate),
      endDate: formatDateForInput(endDate),
      departments: [],
      includeWeekends: false,
      respectTimeOffRequests: true,
      maxHoursPerWeek: 42.5,
      overwriteExistingShifts: false,
      useTemplates: false,
      saveAsTemplate: false,
    },
  });

  // Keep form in sync with local "selectedDepartments"
  function handleDepartmentChange(id: number, checked: boolean) {
    setSelectedDepartments((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );
  }
  React.useEffect(() => {
    form.setValue("departments", selectedDepartments);
  }, [selectedDepartments, form]);

  // On form submit => generate schedule
  function onSubmit(data: GenerateScheduleValues) {
    if (data.useTemplates && data.templateName) {
      toast({
        title: "Using template",
        description: `Generating schedule using template: ${data.templateName}`,
      });
    }
    generateScheduleMutation.mutate(data);
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form */}
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
                    {/* Start/End Dates */}
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
                                  if (e.target.value) {
                                    const [y, m, d] = e.target.value.split("-").map(Number);
                                    setStartDate(new Date(y, m - 1, d));
                                  }
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
                                  if (e.target.value) {
                                    const [y, m, d] = e.target.value.split("-").map(Number);
                                    setEndDate(new Date(y, m - 1, d));
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Departments */}
                    <div>
                      <h3 className="text-sm font-medium mb-2">Departments</h3>
                      {isLoadingDepartments ? (
                        <div className="animate-pulse h-24 bg-muted rounded-md" />
                      ) : (
                        <div className="space-y-2 border rounded-md p-3">
                          {departments?.map((dept) => (
                            <div key={dept.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`dept-${dept.id}`}
                                checked={selectedDepartments.includes(dept.id)}
                                onCheckedChange={(checked) =>
                                  handleDepartmentChange(dept.id, !!checked)
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
                          {departments && departments.length === 0 && (
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

                    {/* Checkboxes */}
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
                      name="maxHoursPerWeek"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Hours Per Week</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              step={0.5}
                              min={1}
                              max={50}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                field.onChange(isNaN(val) ? 1 : val);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Maximum work hours per employee per week (legal limit: 42.5)
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
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select template" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
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

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-2 pt-2">
                    <Button
                      type="submit"
                      disabled={
                        isGenerating || selectedDepartments.length === 0
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

          {/* If a schedule has been generated, show summary */}
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
                    <Badge variant={hasConflicts ? "destructive" : "default"}>
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

                {/* Coverage by Department */}
                <div className="pt-2 space-y-2">
                  <h3 className="text-sm font-medium">Staffing Coverage:</h3>
                  <div className="space-y-3">
                    {selectedDepartments.map((deptId) => {
                      const department = departments?.find((d) => d.id === deptId);
                      if (!department) return null;

                      const totalRequired =
                        (department.requiredStaffDay || 0) +
                        (department.requiredStaffNight || 0);
                      const deptShifts = generatedSchedule.filter(
                        (s) => s.departmentId === deptId
                      );
                      const unstaffed = deptShifts.filter(
                        (s) => s.conflicts && s.conflicts.length
                      );
                      const coverage = deptShifts.length
                        ? ((deptShifts.length - unstaffed.length) / deptShifts.length) * 100
                        : 0;

                      return (
                        <div key={deptId} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{department.name}</span>
                            <span>{Math.round(coverage)}% staffed</span>
                          </div>
                          <Progress value={coverage} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowPreview(true)}>
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

        {/* Right Column: Generated Schedule Preview */}
        <div className="lg:col-span-2">
          {hasGenerated ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Generated Schedule</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        let csvContent = "Date,Department,Employee,Start Time,End Time,Status\n";
                        for (const shift of generatedSchedule) {
                          // Parse the shift date as local
                          const local = parseYMDToLocalDate(shift.date);
                          const dateStr = format(local, "yyyy-MM-dd");
                          const dept = shift.department?.name || "Unknown";
                          const emp = shift.employee ? shift.employee.name : "UNSTAFFED";
                          const stat = shift.conflicts?.length ? "Conflict" : shift.status;
                          csvContent += [
                            dateStr,
                            dept,
                            emp,
                            shift.startTime,
                            shift.endTime,
                            stat,
                          ].join(",") + "\n";
                        }
                        // Create CSV
                        const blob = new Blob([csvContent], {
                          type: "text/csv;charset=utf-8;",
                        });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = url;
                        link.setAttribute(
                          "download",
                          `schedule_${format(new Date(), "yyyy-MM-dd")}.csv`
                        );
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                    >
                      <DownloadIcon className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSaveTemplateDialog(true)}>
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

                  {/* By Date */}
                  <TabsContent value="byDate" className="pt-4">
                    <div className="space-y-6">
                      {Object.entries(groupedSchedule).map(([dateStr, shifts]) => {
                        const localDate = parseYMDToLocalDate(dateStr);
                        return (
                          <div key={dateStr} className="space-y-3">
                            <h3 className="font-semibold">
                              {format(localDate, "EEEE, MMMM d, yyyy")}
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
                                    <TableRow
                                      key={shift.id}
                                      className={shift.conflicts?.length ? "bg-red-50" : ""}
                                    >
                                      <TableCell>{shift.department?.name || "Unknown"}</TableCell>
                                      <TableCell>
                                        {shift.employee ? (
                                          shift.employee.name
                                        ) : (
                                          <span className="text-red-500 font-medium">
                                            UNSTAFFED
                                          </span>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {shift.startTime} - {shift.endTime}
                                      </TableCell>
                                      <TableCell>
                                        {shift.conflicts?.length ? (
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <div>
                                                  <Badge
                                                    variant="destructive"
                                                    className="cursor-help"
                                                  >
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
                                          <Badge variant="outline">{shift.status}</Badge>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </TabsContent>

                  {/* By Department */}
                  <TabsContent value="byDepartment" className="pt-4">
                    <div className="space-y-6">
                      {selectedDepartments.map((deptId) => {
                        const department = departments?.find((d) => d.id === deptId);
                        if (!department) return null;

                        const deptShifts = generatedSchedule.filter((s) => s.departmentId === deptId);

                        return (
                          <div key={deptId} className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Building2Icon className="h-5 w-5 text-primary" />
                              <h3 className="font-semibold">{department.name}</h3>
                            </div>

                            {deptShifts.length > 0 ? (
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
                                    {deptShifts.map((shift) => {
                                      const localDate = parseYMDToLocalDate(shift.date);
                                      return (
                                        <TableRow
                                          key={shift.id}
                                          className={
                                            shift.conflicts?.length ? "bg-red-50" : ""
                                          }
                                        >
                                          <TableCell>
                                            {format(localDate, "MMM d, EEE")}
                                          </TableCell>
                                          <TableCell>
                                            {shift.employee ? (
                                              shift.employee.name
                                            ) : (
                                              <span className="text-red-500 font-medium">
                                                UNSTAFFED
                                              </span>
                                            )}
                                          </TableCell>
                                          <TableCell>
                                            {shift.startTime} - {shift.endTime}
                                          </TableCell>
                                          <TableCell>
                                            {shift.conflicts?.length ? (
                                              <Badge variant="destructive">Conflict</Badge>
                                            ) : (
                                              <Badge variant="outline">{shift.status}</Badge>
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
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

                  {/* By Employee */}
                  <TabsContent value="byEmployee" className="pt-4">
                    <div className="space-y-6">
                      {employees
                        ?.filter((emp) =>
                          generatedSchedule.some((shift) => shift.employeeId === emp.id)
                        )
                        .map((employee) => {
                          const empShifts = generatedSchedule.filter(
                            (s) => s.employeeId === employee.id
                          );

                          // Group by week
                          const shiftsByWeek: Record<string, GeneratedShift[]> = {};
                          for (const s of empShifts) {
                            // parse date as local
                            const localDate = parseYMDToLocalDate(s.date);
                            const startOfWeek = new Date(localDate);
                            startOfWeek.setDate(localDate.getDate() - localDate.getDay());
                            const key = format(startOfWeek, "yyyy-MM-dd");
                            if (!shiftsByWeek[key]) shiftsByWeek[key] = [];
                            shiftsByWeek[key].push(s);
                          }

                          // Sum hours
                          const weeklyHours: Record<string, number> = {};
                          for (const [weekStart, sList] of Object.entries(shiftsByWeek)) {
                            weeklyHours[weekStart] = 0;
                            for (const shift of sList) {
                              weeklyHours[weekStart] += calculateShiftHours(
                                shift.startTime,
                                shift.endTime
                              );
                            }
                          }

                          // total hours
                          const totalHours = Object.values(weeklyHours).reduce(
                            (a, b) => a + b,
                            0
                          );

                          return (
                            <div key={employee.id} className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <UsersIcon className="h-5 w-5 text-primary" />
                                  <h3 className="font-semibold">{employee.name}</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">
                                    Total Hours: {totalHours.toFixed(1)} hrs
                                  </span>
                                </div>
                              </div>

                              {empShifts.length > 0 ? (
                                <div className="space-y-4">
                                  {/* Weekly summary */}
                                  <div className="rounded-md border p-3 bg-muted/10">
                                    <h4 className="text-sm font-medium mb-2">Weekly Hours</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                      {Object.entries(weeklyHours).map(([weekStartStr, hrs]) => {
                                        const wsDate = parseYMDToLocalDate(weekStartStr);
                                        const weDate = new Date(wsDate);
                                        weDate.setDate(weDate.getDate() + 6);
                                        return (
                                          <div
                                            key={weekStartStr}
                                            className="flex justify-between items-center"
                                          >
                                            <span className="text-sm">
                                              {format(wsDate, "MMM d")} -{" "}
                                              {format(weDate, "MMM d")}:
                                            </span>
                                            <Badge
                                              variant={
                                                hrs > form.getValues().maxHoursPerWeek
                                                  ? "destructive"
                                                  : "outline"
                                              }
                                            >
                                              {hrs.toFixed(1)} hrs
                                            </Badge>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Shifts table */}
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
                                        {empShifts.map((shift) => {
                                          const localDate = parseYMDToLocalDate(shift.date);
                                          const duration = calculateShiftHours(
                                            shift.startTime,
                                            shift.endTime
                                          ).toFixed(1);

                                          return (
                                            <TableRow key={shift.id}>
                                              <TableCell>
                                                {format(localDate, "MMM d, EEE")}
                                              </TableCell>
                                              <TableCell>
                                                {shift.department?.name || "Unknown"}
                                              </TableCell>
                                              <TableCell>
                                                {shift.startTime} - {shift.endTime}
                                              </TableCell>
                                              <TableCell>{duration} hrs</TableCell>
                                            </TableRow>
                                          );
                                        })}
                                      </TableBody>
                                    </Table>
                                  </div>
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
                  Use the settings on the left to configure your schedule parameters,
                  then click &quot;Generate Schedule&quot; to create an optimal employee schedule.
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
              <Input id="template-name" placeholder="e.g., Standard Week Schedule" />
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
                const nameInput = document.getElementById("template-name") as HTMLInputElement;
                const descInput = document.getElementById("template-description") as HTMLTextAreaElement;
                if (nameInput?.value) {
                  saveTemplateMutation.mutate({
                    name: nameInput.value,
                    shifts: generatedSchedule,
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

              {/* By Date */}
              <TabsContent value="byDate" className="pt-4">
                <div className="space-y-6">
                  {Object.entries(groupedSchedule).map(([dateStr, shifts]) => {
                    const localDate = parseYMDToLocalDate(dateStr);
                    return (
                      <div key={dateStr} className="space-y-3">
                        <h3 className="font-semibold">
                          {format(localDate, "EEEE, MMMM d, yyyy")}
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
                                <TableRow
                                  key={shift.id}
                                  className={shift.conflicts?.length ? "bg-red-50" : ""}
                                >
                                  <TableCell>{shift.department?.name || "Unknown"}</TableCell>
                                  <TableCell>
                                    {shift.employee ? (
                                      shift.employee.name
                                    ) : (
                                      <span className="text-red-500 font-medium">
                                        UNSTAFFED
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {shift.startTime} - {shift.endTime}
                                  </TableCell>
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
                    );
                  })}
                </div>
              </TabsContent>

              {/* By Department */}
              <TabsContent value="byDepartment" className="pt-4">
                <div className="space-y-6">
                  {selectedDepartments.map((deptId) => {
                    const department = departments?.find((d) => d.id === deptId);
                    if (!department) return null;

                    const deptShifts = generatedSchedule.filter(
                      (s) => s.departmentId === deptId
                    );

                    return (
                      <div key={deptId} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Building2Icon className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold">{department.name}</h3>
                        </div>
                        {deptShifts.length > 0 ? (
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
                                {deptShifts.map((shift) => {
                                  const localDate = parseYMDToLocalDate(shift.date);
                                  return (
                                    <TableRow
                                      key={shift.id}
                                      className={shift.conflicts?.length ? "bg-red-50" : ""}
                                    >
                                      <TableCell>
                                        {format(localDate, "MMM d, EEE")}
                                      </TableCell>
                                      <TableCell>
                                        {shift.employee ? (
                                          shift.employee.name
                                        ) : (
                                          <span className="text-red-500 font-medium">
                                            UNSTAFFED
                                          </span>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {shift.startTime} - {shift.endTime}
                                      </TableCell>
                                      <TableCell>
                                        {shift.conflicts?.length ? (
                                          <Badge variant="destructive">Conflict</Badge>
                                        ) : (
                                          <Badge variant="outline">{shift.status}</Badge>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
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

              {/* By Employee */}
              <TabsContent value="byEmployee" className="pt-4">
                <div className="space-y-6">
                  {employees
                    ?.filter((emp) =>
                      generatedSchedule.some((shift) => shift.employeeId === emp.id)
                    )
                    .map((employee) => {
                      const empShifts = generatedSchedule.filter(
                        (s) => s.employeeId === employee.id
                      );

                      // Group by week
                      const shiftsByWeek: Record<string, GeneratedShift[]> = {};
                      for (const s of empShifts) {
                        const localDate = parseYMDToLocalDate(s.date);
                        const startOfWeek = new Date(localDate);
                        startOfWeek.setDate(localDate.getDate() - localDate.getDay());
                        const key = format(startOfWeek, "yyyy-MM-dd");
                        if (!shiftsByWeek[key]) shiftsByWeek[key] = [];
                        shiftsByWeek[key].push(s);
                      }

                      // Calculate weekly hours
                      const weeklyHours: Record<string, number> = {};
                      for (const [weekStartStr, shiftList] of Object.entries(shiftsByWeek)) {
                        weeklyHours[weekStartStr] = 0;
                        for (const shift of shiftList) {
                          weeklyHours[weekStartStr] += calculateShiftHours(
                            shift.startTime,
                            shift.endTime
                          );
                        }
                      }
                      const totalHrs = Object.values(weeklyHours).reduce((a, b) => a + b, 0);

                      return (
                        <div key={employee.id} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <UsersIcon className="h-5 w-5 text-primary" />
                              <h3 className="font-semibold">{employee.name}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                Total Hours: {totalHrs.toFixed(1)} hrs
                              </span>
                            </div>
                          </div>

                          {empShifts.length > 0 ? (
                            <div className="space-y-4">
                              {/* Weekly summary */}
                              <div className="rounded-md border p-3 bg-muted/10">
                                <h4 className="text-sm font-medium mb-2">Weekly Hours</h4>
                                <div className="grid grid-cols-2 gap-2">
                                  {Object.entries(weeklyHours).map(([weekStr, hrs]) => {
                                    const ws = parseYMDToLocalDate(weekStr);
                                    const we = new Date(ws);
                                    we.setDate(we.getDate() + 6);
                                    return (
                                      <div
                                        key={weekStr}
                                        className="flex justify-between items-center"
                                      >
                                        <span className="text-sm">
                                          {format(ws, "MMM d")} - {format(we, "MMM d")}:
                                        </span>
                                        <Badge
                                          variant={
                                            hrs > form.getValues().maxHoursPerWeek
                                              ? "destructive"
                                              : "outline"
                                          }
                                        >
                                          {hrs.toFixed(1)} hrs
                                        </Badge>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Shifts table */}
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
                                    {empShifts.map((shift) => {
                                      const localDate = parseYMDToLocalDate(shift.date);
                                      const dur = calculateShiftHours(
                                        shift.startTime,
                                        shift.endTime
                                      ).toFixed(1);
                                      return (
                                        <TableRow key={shift.id}>
                                          <TableCell>
                                            {format(localDate, "MMM d, EEE")}
                                          </TableCell>
                                          <TableCell>
                                            {shift.department?.name || "Unknown"}
                                          </TableCell>
                                          <TableCell>
                                            {shift.startTime} - {shift.endTime}
                                          </TableCell>
                                          <TableCell>{dur} hrs</TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </div>
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
