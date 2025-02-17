
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Invoice } from "@shared/schema";
import { ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AROverviewProps {
  invoices: Invoice[];
}

export function AROverview({ invoices }: AROverviewProps) {
  const [dateFilter, setDateFilter] = useState<'30' | '90' | 'all'>('all');

  const filteredInvoices = invoices.filter(invoice => {
    if (dateFilter === 'all') return true;
    
    const dueDate = new Date(invoice.dueDate);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= parseInt(dateFilter);
  });

  const groupedInvoices = {
    USD: filteredInvoices.filter(inv => inv.amountCurrency === 'USD'),
    CAD: filteredInvoices.filter(inv => inv.amountCurrency === 'CAD')
  };

  const totals = {
    USD: {
      total: groupedInvoices.USD.reduce((sum, inv) => sum + Number(inv.totalAmount), 0),
      paid: groupedInvoices.USD.filter(inv => inv.isPaid).reduce((sum, inv) => sum + Number(inv.totalAmount), 0)
    },
    CAD: {
      total: groupedInvoices.CAD.reduce((sum, inv) => sum + Number(inv.totalAmount), 0),
      paid: groupedInvoices.CAD.filter(inv => inv.isPaid).reduce((sum, inv) => sum + Number(inv.totalAmount), 0)
    }
  };

  const pieData = {
    USD: [
      { name: "Paid", value: totals.USD.paid },
      { name: "Unpaid", value: totals.USD.total - totals.USD.paid }
    ],
    CAD: [
      { name: "Paid", value: totals.CAD.paid },
      { name: "Unpaid", value: totals.CAD.total - totals.CAD.paid }
    ]
  };

  const COLORS = ['#43A047', '#FFA000'];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>AR Overview</CardTitle>
        <Select
          value={dateFilter}
          onValueChange={(value: '30' | '90' | 'all') => setDateFilter(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="90">Last 90 Days</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* USD Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">USD Receivables</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Total AR</p>
                <p className="text-2xl font-bold">${totals.USD.total.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="text-2xl font-bold text-[#43A047]">${totals.USD.paid.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unpaid</p>
                <p className="text-2xl font-bold text-[#FFA000]">${(totals.USD.total - totals.USD.paid).toFixed(2)}</p>
              </div>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData.USD}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.USD.map((entry, index) => (
                      <Cell key={`cell-usd-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CAD Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">CAD Receivables</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Total AR</p>
                <p className="text-2xl font-bold">${totals.CAD.total.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="text-2xl font-bold text-[#43A047]">${totals.CAD.paid.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unpaid</p>
                <p className="text-2xl font-bold text-[#FFA000]">${(totals.CAD.total - totals.CAD.paid).toFixed(2)}</p>
              </div>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData.CAD}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.CAD.map((entry, index) => (
                      <Cell key={`cell-cad-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
