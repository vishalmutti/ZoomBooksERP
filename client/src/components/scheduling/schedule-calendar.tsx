import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Department, Employee, Shift } from "@shared/schema";

export function ScheduleCalendar() {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");

  const { data: departments } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
  });

  const { data: shifts } = useQuery<Shift[]>({
    queryKey: ['/api/shifts', date.toISOString().split('T')[0], selectedDepartment],
  });

  const filterEmployees = (departmentId: number) => {
    return employees?.filter(emp => emp.departmentId === departmentId) || [];
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <Select
          value={selectedDepartment}
          onValueChange={setSelectedDepartment}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Departments</SelectItem>
            {departments?.map((dept) => (
              <SelectItem key={dept.id} value={dept.id.toString()}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(date) => date && setDate(date)}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">
              Shifts for {date.toLocaleDateString()}
            </h3>
            <div className="space-y-2">
              {shifts?.map((shift) => {
                const employee = employees?.find(e => e.id === shift.employeeId);
                const department = departments?.find(d => d.id === shift.departmentId);
                
                return (
                  <div
                    key={shift.id}
                    className="p-2 border rounded-md"
                  >
                    <p className="font-medium">{employee?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {department?.name} • {shift.startTime} - {shift.endTime}
                    </p>
                    {shift.notes && (
                      <p className="text-sm mt-1">{shift.notes}</p>
                    )}
                  </div>
                );
              })}
              {!shifts?.length && (
                <p className="text-muted-foreground">No shifts scheduled</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
