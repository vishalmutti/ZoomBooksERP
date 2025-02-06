import { Invoice } from "@shared/schema";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { differenceInDays } from "date-fns";

const COLORS = ["#4CAF50", "#2196F3", "#FFC107", "#F44336"];

export default function ARChart({ invoices }: { invoices: Invoice[] }) {
  const unpaidInvoices = invoices.filter(invoice => !invoice.isPaid);
  
  const agingBuckets = {
    "0-30 days": 0,
    "31-60 days": 0,
    "61-90 days": 0,
    "90+ days": 0
  };

  unpaidInvoices.forEach(invoice => {
    const daysOverdue = differenceInDays(new Date(), new Date(invoice.dueDate));
    const amount = Number(invoice.amount);

    if (daysOverdue <= 30) {
      agingBuckets["0-30 days"] += amount;
    } else if (daysOverdue <= 60) {
      agingBuckets["31-60 days"] += amount;
    } else if (daysOverdue <= 90) {
      agingBuckets["61-90 days"] += amount;
    } else {
      agingBuckets["90+ days"] += amount;
    }
  });

  const data = Object.entries(agingBuckets).map(([name, value]) => ({
    name,
    value
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
