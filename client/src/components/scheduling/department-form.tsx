
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormEvent } from "react";
import { Department } from "@shared/schema";
import { Textarea } from "@/components/ui/textarea";

interface DepartmentFormProps {
  onSubmit: (data: Partial<Department>) => void;
  initialData?: Department;
}

export function DepartmentForm({ onSubmit, initialData }: DepartmentFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [targetHours, setTargetHours] = useState(initialData?.targetHours?.toString() || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [requiredStaffDay, setRequiredStaffDay] = useState(initialData?.requiredStaffDay?.toString() || "0");
  const [requiredStaffNight, setRequiredStaffNight] = useState(initialData?.requiredStaffNight?.toString() || "0");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const data: Partial<Department> = {
      name,
      description,
      targetHours: targetHours as unknown as string, // Handle type conversion for database
      requiredStaffDay: Number(requiredStaffDay),
      requiredStaffNight: Number(requiredStaffNight),
    };
    onSubmit(data);
  };

  // Calculate target hours based on staff requirements
  const calculateTargetHours = () => {
    const dayStaff = Number(requiredStaffDay) || 0;
    const nightStaff = Number(requiredStaffNight) || 0;
    // Calculate total required hours (staff count × 8.5 hours)
    const calculatedHours = ((dayStaff + nightStaff) * 8.5).toFixed(2);
    setTargetHours(calculatedHours);
  };
  
  // Calculate target hours on initial load
  useEffect(() => {
    calculateTargetHours();
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Department Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description || ""}
          onChange={(e) => setDescription(e.target.value)}
          className="h-20"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="requiredStaffDay">Required Staff (Day)</Label>
          <Input
            id="requiredStaffDay"
            type="number"
            min="0"
            value={requiredStaffDay}
            onChange={(e) => {
              setRequiredStaffDay(e.target.value);
              calculateTargetHours();
            }}
            required
          />
        </div>
        <div>
          <Label htmlFor="requiredStaffNight">Required Staff (Night)</Label>
          <Input
            id="requiredStaffNight"
            type="number"
            min="0"
            value={requiredStaffNight}
            onChange={(e) => {
              setRequiredStaffNight(e.target.value);
              calculateTargetHours();
            }}
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="targetHours">Target Hours (Auto-calculated)</Label>
        <Input
          id="targetHours"
          type="number"
          value={targetHours}
          onChange={(e) => setTargetHours(e.target.value)}
          required
          className="bg-muted/50"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Automatically calculated as (Required Staff × 8.5 hours)
        </p>
      </div>
      <Button type="submit" className="w-full">
        {initialData ? 'Update' : 'Create'} Department
      </Button>
    </form>
  );
}
