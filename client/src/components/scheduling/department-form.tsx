import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { InsertDepartment } from "@shared/schema";

// Extend the schema to add client-side validation
const formSchema = z.object({
  name: z.string().min(1, "Department name is required"),
  description: z.string().optional(),
  requiredStaffDay: z.coerce.number().int().min(0).optional(),
  requiredStaffNight: z.coerce.number().int().min(0).optional(),
  targetHours: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface DepartmentFormProps {
  onSubmit: (data: InsertDepartment) => void;
  initialData?: Partial<InsertDepartment>;
}

export function DepartmentForm({ onSubmit, initialData }: DepartmentFormProps) {
  const defaultValues: Partial<FormValues> = {
    name: initialData?.name || "",
    description: initialData?.description || "",
    requiredStaffDay: initialData?.requiredStaffDay || 0,
    requiredStaffNight: initialData?.requiredStaffNight || 0,
    targetHours: initialData?.targetHours || "",
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  function handleSubmit(data: FormValues) {
    onSubmit(data as InsertDepartment);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Logistics" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Brief description of the department's function"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                A short description of the department's responsibilities
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="requiredStaffDay"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Required Staff (Day)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    value={field.value || 0}
                  />
                </FormControl>
                <FormDescription>
                  Minimum staff needed for day shift
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="requiredStaffNight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Required Staff (Night)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    value={field.value || 0}
                  />
                </FormControl>
                <FormDescription>
                  Minimum staff needed for night shift
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="targetHours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Hours</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 40 per week" {...field} />
              </FormControl>
              <FormDescription>
                Target work hours for this department
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button type="submit">
            {initialData ? "Update Department" : "Create Department"}
          </Button>
        </div>
      </form>
    </Form>
  );
}