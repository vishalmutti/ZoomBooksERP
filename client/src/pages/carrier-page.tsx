
import { CarrierTable } from "@/components/carrier/CarrierTable";
import { CarrierList } from "@/components/carrier/CarrierList";

export default function CarrierPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Carrier Portal</h1>
      <div className="space-y-8">
        <CarrierTable />
        <CarrierList />
      </div>
    </div>
  );
}
