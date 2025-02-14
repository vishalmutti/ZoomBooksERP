
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";

interface CarrierManagementFormData {
  name: string;
  contactName: string;
  email: string;
  phone: string;
}

interface CarrierManagementFormProps {
  initialData?: CarrierManagementFormData;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
}

export function CarrierManagementForm({ initialData, onOpenChange, open }: CarrierManagementFormProps) {
  const form = useForm<CarrierManagementFormData>({
    defaultValues: initialData,
  });

  const onSubmit = (data: CarrierManagementFormData) => {
    console.log("Form submitted:", data);
    // Backend integration will be added later
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!initialData && (
        <DialogTrigger asChild>
          <Button className="mb-4">Add New Carrier</Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Carrier' : 'Add New Carrier'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Carrier Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone #</FormLabel>
                  <FormControl>
                    <Input type="tel" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
