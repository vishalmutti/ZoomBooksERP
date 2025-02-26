
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormEvent } from "react";
import { Department } from "@shared/schema";

interface DepartmentFormProps {
  onSubmit: (data: Partial<Department>) => void;
  initialData?: Department;
}

export function DepartmentForm({ onSubmit, initialData }: DepartmentFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [targetHours, setTargetHours] = useState(initialData?.targetHours?.toString() || "");
  const [description, setDescription] = useState(initialData?.description || "");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      description,
      targetHours: Number(targetHours),
    });
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
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="targetHours">Target Hours</Label>
        <Input
          id="targetHours"
          type="number"
          value={targetHours}
          onChange={(e) => setTargetHours(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full">
        {initialData ? 'Update' : 'Create'} Department
      </Button>
    </form>
  );
}
