import { CarrierDashboard } from "@/components/carriers/CarrierDashboard";

export default function CarriersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Carrier Portal</h1>
      <CarrierDashboard />
    </div>
  );
}
