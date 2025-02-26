
import { useState, FormEvent, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Department } from "@shared/schema";

interface DepartmentFormProps {
  onSubmit: (data: Partial<Department>) => void;
  initialData?: Department;
}

export function DepartmentForm({ onSubmit, initialData }: DepartmentFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [targetHours, setTargetHours] = useState(initialData?.targetHours?.toString() || "0");
  const [description, setDescription] = useState(initialData?.description || "");
  const [requiredStaffDay, setRequiredStaffDay] = useState(initialData?.requiredStaffDay?.toString() || "0");
  const [requiredStaffNight, setRequiredStaffNight] = useState(initialData?.requiredStaffNight?.toString() || "0");

  const calculateTargetHours = () => {
    const dayStaff = parseInt(requiredStaffDay) || 0;
    const nightStaff = parseInt(requiredStaffNight) || 0;
    const totalStaff = dayStaff + nightStaff;
    const hoursPerPerson = 8.5;
    const total = (totalStaff * hoursPerPerson).toFixed(1);
    setTargetHours(total);
  };

  useEffect(() => {
    calculateTargetHours();
  }, [requiredStaffDay, requiredStaffNight]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    const data: Partial<Department> = {
      name,
      description: description || null,
      targetHours: parseFloat(targetHours),
      requiredStaffDay: parseInt(requiredStaffDay) || 0,
      requiredStaffNight: parseInt(requiredStaffNight) || 0,
    };
    
    onSubmit(data);
  };

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
            onChange={(e) => setRequiredStaffDay(e.target.value)}
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
            onChange={(e) => setRequiredStaffNight(e.target.value)}
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
          readOnly
          className="bg-muted/50"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Automatically calculated as (Total Staff × 8.5 hours)
        </p>
      </div>
      <Button type="submit" className="w-full">
        {initialData ? 'Update' : 'Create'} Department
      </Button>
    </form>
  );
}
