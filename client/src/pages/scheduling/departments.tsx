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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Department, Employee, InsertDepartment } from "@shared/schema";
import { 
  ArrowLeftIcon, 
  PlusCircleIcon,
  Edit2Icon, 
  TrashIcon,
  BuildingIcon
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { DepartmentForm } from "@/components/scheduling/department-form";

export default function DepartmentsPage() {
  const [isAddingDepartment, setIsAddingDepartment] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: departments, isLoading: isLoadingDepartments } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });

  const { data: employees, isLoading: isLoadingEmployees } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
  });

  const createDepartmentMutation = useMutation({
    mutationFn: async (data: InsertDepartment) => {
      return await apiRequest<Department>({
        url: '/api/departments',
        method: 'POST',
        data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Department created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
      setIsAddingDepartment(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating department",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateDepartmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertDepartment> }) => {
      return await apiRequest<Department>({
        url: `/api/departments/${id}`,
        method: 'PATCH',
        data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Department updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
      setEditingDepartment(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating department",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteDepartmentMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest({
        url: `/api/departments/${id}`,
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Department deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting department",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter departments based on search query
  const filteredDepartments = searchQuery.trim() === ""
    ? departments || []
    : (departments || []).filter(dept => 
        dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dept.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Count employees per department
  const getEmployeeCount = (departmentId: number) => {
    return employees?.filter(emp => emp.departmentId === departmentId).length || 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
          <p className="text-muted-foreground">
            Manage departments and their requirements
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
            placeholder="Search departments..."
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
        <Button onClick={() => setIsAddingDepartment(true)}>
          <PlusCircleIcon className="mr-2 h-4 w-4" />
          Add Department
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Department Directory</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingDepartments || isLoadingEmployees ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className="text-center py-12 border rounded-md bg-muted/20">
              <BuildingIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No departments found</h3>
              <p className="text-muted-foreground">
                {searchQuery.trim() !== "" 
                  ? "Try adjusting your search query"
                  : "Add your first department to get started"}
              </p>
              {searchQuery.trim() === "" && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsAddingDepartment(true)}
                >
                  <PlusCircleIcon className="mr-2 h-4 w-4" />
                  Add Department
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Required Staff (Day)</TableHead>
                  <TableHead>Required Staff (Night)</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDepartments.map((department) => {
                  const employeeCount = getEmployeeCount(department.id);
                  return (
                    <TableRow key={department.id}>
                      <TableCell className="font-medium">{department.name}</TableCell>
                      <TableCell>{department.description || "—"}</TableCell>
                      <TableCell>{department.requiredStaffDay || "—"}</TableCell>
                      <TableCell>{department.requiredStaffNight || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {employeeCount} employee{employeeCount !== 1 ? 's' : ''}
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
                              onClick={() => setEditingDepartment(department)}
                            >
                              <Edit2Icon className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                // Check if department has employees
                                if (employeeCount > 0) {
                                  toast({
                                    title: "Cannot delete department",
                                    description: `This department has ${employeeCount} employee${employeeCount !== 1 ? 's' : ''}. Reassign them before deleting.`,
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                
                                if (confirm(`Are you sure you want to delete ${department.name}?`)) {
                                  deleteDepartmentMutation.mutate(department.id);
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

      {/* Add Department Dialog */}
      <Dialog open={isAddingDepartment} onOpenChange={setIsAddingDepartment}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Department</DialogTitle>
            <DialogDescription>
              Create a new department and set staffing requirements.
            </DialogDescription>
          </DialogHeader>
          <DepartmentForm 
            onSubmit={(data) => createDepartmentMutation.mutate(data)} 
          />
        </DialogContent>
      </Dialog>

      {/* Edit Department Dialog */}
      {editingDepartment && (
        <Dialog open={!!editingDepartment} onOpenChange={(open) => !open && setEditingDepartment(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Department</DialogTitle>
              <DialogDescription>
                Update department information and requirements.
              </DialogDescription>
            </DialogHeader>
            <DepartmentForm 
              onSubmit={(data) => updateDepartmentMutation.mutate({ id: editingDepartment.id, data })}
              initialData={editingDepartment}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}