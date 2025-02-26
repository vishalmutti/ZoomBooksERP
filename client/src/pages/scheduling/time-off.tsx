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
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Department, Employee, TimeOffRequest, InsertTimeOffRequest } from "@shared/schema";
import { 
  ArrowLeftIcon, 
  PlusCircleIcon,
  CheckCircle2Icon,
  XCircleIcon,
  Clock4Icon,
  CalendarDaysIcon
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Textarea } from "@/components/ui/textarea";
import { format, parseISO, isWithinInterval } from "date-fns";

// Time off request form schema
const timeOffRequestSchema = z.object({
  employeeId: z.number({
    required_error: "Please select an employee",
  }),
  startDate: z.string({
    required_error: "Please select a start date",
  }),
  endDate: z.string({
    required_error: "Please select an end date",
  }),
  type: z.enum(["vacation", "sick", "personal"], {
    required_error: "Please select a type",
  }),
  status: z.enum(["pending", "approved", "rejected"], {
    required_error: "Please select a status",
  }),
  notes: z.string().optional(),
}).refine(data => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end >= start;
}, {
  message: "End date must be after start date",
  path: ["endDate"],
});

type TimeOffFormValues = z.infer<typeof timeOffRequestSchema>;

interface TimeOffRequestWithEmployee extends TimeOffRequest {
  employee?: Employee;
}

export default function TimeOffRequestsPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isAddingRequest, setIsAddingRequest] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: timeOffRequests, isLoading: isLoadingRequests } = useQuery<TimeOffRequest[]>({
    queryKey: ['/api/time-off-requests'],
  });

  const { data: employees, isLoading: isLoadingEmployees } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
  });

  const { data: departments, isLoading: isLoadingDepartments } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });

  const createTimeOffRequestMutation = useMutation({
    mutationFn: async (data: InsertTimeOffRequest) => {
      return await apiRequest<TimeOffRequest>({
        url: '/api/time-off-requests',
        method: 'POST',
        data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Time off request created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/time-off-requests'] });
      setIsAddingRequest(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTimeOffRequestMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<TimeOffRequest> }) => {
      return await apiRequest<TimeOffRequest>({
        url: `/api/time-off-requests/${id}`,
        method: 'PATCH',
        data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Time off request updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/time-off-requests'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Combine time off requests with employee data
  const requestsWithEmployees: TimeOffRequestWithEmployee[] = timeOffRequests?.map(request => {
    const employee = employees?.find(e => e.id === request.employeeId);
    return {
      ...request,
      employee,
    };
  }) || [];

  // Filter requests based on search, status and date
  const filteredRequests = requestsWithEmployees.filter(request => {
    // Filter by search query
    const employeeName = request.employee ? `${request.employee.firstName} ${request.employee.lastName}` : "";
    const searchMatch = searchQuery.trim() === "" || 
      employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by status
    const statusMatch = selectedStatus === "all" || request.status === selectedStatus;
    
    // Filter by date (if a date is selected)
    let dateMatch = true;
    if (selectedDate) {
      const startDate = parseISO(request.startDate);
      const endDate = parseISO(request.endDate);
      dateMatch = isWithinInterval(selectedDate, { start: startDate, end: endDate });
    }
    
    return searchMatch && statusMatch && dateMatch;
  });

  // For calendar highlighting
  const getDateClassNames = (date: Date) => {
    if (!timeOffRequests) return "";
    
    let classes = "";
    timeOffRequests.forEach(request => {
      const start = parseISO(request.startDate);
      const end = parseISO(request.endDate);
      
      if (isWithinInterval(date, { start, end })) {
        if (request.status === "approved") {
          classes = "bg-green-100 text-green-800 rounded-md";
        } else if (request.status === "pending") {
          classes = "bg-yellow-100 text-yellow-800 rounded-md";
        } else if (request.status === "rejected") {
          classes = "bg-red-100 text-red-800 rounded-md";
        }
      }
    });
    
    return classes;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Time Off Requests</h1>
          <p className="text-muted-foreground">
            Manage employee time off and leave requests
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
            <CardTitle>
              Calendar View
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              modifiersClassNames={{
                today: "bg-primary/10 text-primary",
              }}
              modifiers={{
                timeoff: (date) => getDateClassNames(date) !== "",
              }}
              modifiersStyles={{
                timeoff: { border: "2px solid var(--color-primary)" },
              }}
            />

            <div className="pt-4 space-y-3">
              <h3 className="font-medium">Filter by Status</h3>
              <Select
                value={selectedStatus}
                onValueChange={setSelectedStatus}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative mt-3">
                <Input
                  placeholder="Search requests..."
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
            </div>

            <div className="pt-2">
              <Button 
                className="w-full" 
                onClick={() => setIsAddingRequest(true)}
              >
                <PlusCircleIcon className="mr-2 h-4 w-4" />
                New Time Off Request
              </Button>
            </div>

            <div className="pt-2 space-y-2">
              <div className="text-sm font-medium">Legend:</div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
                <span className="text-sm">Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <span className="text-sm">Approved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                <span className="text-sm">Rejected</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Time Off Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingRequests || isLoadingEmployees || isLoadingDepartments ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-12 border rounded-md bg-muted/20">
                <CalendarDaysIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No time off requests found</h3>
                <p className="text-muted-foreground">
                  {searchQuery.trim() !== "" || selectedStatus !== "all"
                    ? "Try adjusting your filters"
                    : "Create a new time off request to get started"}
                </p>
                {searchQuery.trim() === "" && selectedStatus === "all" && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setIsAddingRequest(true)}
                  >
                    <PlusCircleIcon className="mr-2 h-4 w-4" />
                    New Request
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => {
                    const employee = request.employee;
                    const department = departments?.find(d => d.id === employee?.departmentId);
                    
                    return (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">
                          {employee ? `${employee.firstName} ${employee.lastName}` : "Unknown Employee"}
                        </TableCell>
                        <TableCell>{department?.name || "—"}</TableCell>
                        <TableCell className="capitalize">{request.type}</TableCell>
                        <TableCell>
                          {format(new Date(request.startDate), "MMM d, yyyy")} - 
                          {format(new Date(request.endDate), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              request.status === "approved" ? "success" : 
                              request.status === "rejected" ? "destructive" : 
                              "outline"
                            }
                          >
                            {request.status === "approved" && <CheckCircle2Icon className="mr-1 h-3 w-3" />}
                            {request.status === "rejected" && <XCircleIcon className="mr-1 h-3 w-3" />}
                            {request.status === "pending" && <Clock4Icon className="mr-1 h-3 w-3" />}
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {request.status === "pending" && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="border-green-500 text-green-500 hover:bg-green-50"
                                  onClick={() => updateTimeOffRequestMutation.mutate({
                                    id: request.id,
                                    data: { status: "approved" }
                                  })}
                                >
                                  <CheckCircle2Icon className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="border-red-500 text-red-500 hover:bg-red-50"
                                  onClick={() => updateTimeOffRequestMutation.mutate({
                                    id: request.id,
                                    data: { status: "rejected" }
                                  })}
                                >
                                  <XCircleIcon className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {request.status !== "pending" && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => updateTimeOffRequestMutation.mutate({
                                  id: request.id,
                                  data: { status: "pending" }
                                })}
                              >
                                <Clock4Icon className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Time Off Request Dialog */}
      <Dialog open={isAddingRequest} onOpenChange={setIsAddingRequest}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Time Off Request</DialogTitle>
            <DialogDescription>
              Create a new time off request for an employee.
            </DialogDescription>
          </DialogHeader>

          <TimeOffRequestForm 
            employees={employees || []}
            onSubmit={(data) => createTimeOffRequestMutation.mutate(data)}
            onCancel={() => setIsAddingRequest(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface TimeOffRequestFormProps {
  employees: Employee[];
  initialData?: Partial<TimeOffFormValues>;
  onSubmit: (data: InsertTimeOffRequest) => void;
  onCancel: () => void;
}

function TimeOffRequestForm({ 
  employees,
  initialData,
  onSubmit,
  onCancel
}: TimeOffRequestFormProps) {
  const defaultValues: Partial<TimeOffFormValues> = {
    employeeId: initialData?.employeeId,
    startDate: initialData?.startDate || new Date().toISOString().split('T')[0],
    endDate: initialData?.endDate || new Date().toISOString().split('T')[0],
    type: initialData?.type || "vacation",
    status: initialData?.status || "pending",
    notes: initialData?.notes || "",
  };

  const form = useForm<TimeOffFormValues>({
    resolver: zodResolver(timeOffRequestSchema),
    defaultValues,
  });

  function onFormSubmit(data: TimeOffFormValues) {
    onSubmit(data as InsertTimeOffRequest);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="employeeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employee</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                defaultValue={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {employees.map((emp) => (
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
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
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
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Request Type</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value as "vacation" | "sick" | "personal")}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="vacation">Vacation</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="personal">Personal Leave</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value as "pending" | "approved" | "rejected")}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
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
                <Textarea
                  placeholder="Any additional information..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            Create Request
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}