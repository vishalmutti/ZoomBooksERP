
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";

interface CarrierFormData {
  date: string;
  referenceNumber: string;
  carrier: string;
  freightCost: number;
  freightInvoice?: File;
  pod?: File;
}

export function CarrierForm() {
  const form = useForm<CarrierFormData>();

  const onSubmit = (data: CarrierFormData) => {
    console.log("Form submitted:", data);
    // Backend integration will be added later
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="mb-4">Add New Carrier</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Carrier</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="referenceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference Number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="carrier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Carrier</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="freightCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Freight Cost</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="freightInvoice"
              render={({ field: { value, ...field } }) => (
                <FormItem>
                  <FormLabel>Freight Invoice</FormLabel>
                  <FormControl>
                    <Input 
                      type="file" 
                      {...field} 
                      onChange={(e) => field.onChange(e.target.files?.[0])}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pod"
              render={({ field: { value, ...field } }) => (
                <FormItem>
                  <FormLabel>POD</FormLabel>
                  <FormControl>
                    <Input 
                      type="file" 
                      {...field} 
                      onChange={(e) => field.onChange(e.target.files?.[0])}
                    />
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
