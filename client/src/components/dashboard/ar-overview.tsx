import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Invoice } from "@shared/schema";
import { ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

interface AROverviewProps {
  invoices: Invoice[];
}

export function AROverview({ invoices }: AROverviewProps) {
  const totalAR = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
  const paidAR = invoices
    .filter((inv) => inv.isPaid)
    .reduce((sum, inv) => sum + Number(inv.amount), 0);
  const unpaidAR = totalAR - paidAR;

  const pieData = [
    { name: "Paid", value: paidAR },
    { name: "Unpaid", value: unpaidAR },
  ];

  const COLORS = ['#43A047', '#FFA000'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>AR Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total AR</p>
            <p className="text-2xl font-bold">${totalAR.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Paid</p>
            <p className="text-2xl font-bold text-[#43A047]">${paidAR.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Unpaid</p>
            <p className="text-2xl font-bold text-[#FFA000]">${unpaidAR.toFixed(2)}</p>
          </div>
        </div>

        <div className="h-[200px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
