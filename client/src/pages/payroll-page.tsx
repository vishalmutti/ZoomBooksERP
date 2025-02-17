
import { PayrollWidget } from "@/components/PayrollWidget";

export default function PayrollPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Payroll Management</h1>
      </div>
      <PayrollWidget />
    </div>
  );
}
