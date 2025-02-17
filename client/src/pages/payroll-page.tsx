
import { PayrollWidget } from "@/components/PayrollWidget";

export default function PayrollPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Payroll Management</h1>
      <PayrollWidget />
    </div>
  );
}
