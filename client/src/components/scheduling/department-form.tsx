import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormEvent } from "react";

interface DepartmentFormProps {
  onSubmit: (data: { name: string; targetHours: number }) => void;
}

export function DepartmentForm({ onSubmit }: DepartmentFormProps) {
  const [name, setName] = useState("");
  const [targetHours, setTargetHours] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
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
        Create Department
      </Button>
    </form>
  );
}