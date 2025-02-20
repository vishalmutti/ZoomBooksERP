
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Invoice, Supplier } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WholesaleMetrics() {
  const [timeFilter, setTimeFilter] = useState<'30' | '90' | 'all'>('all');
  
  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const filteredInvoices = invoices.filter(invoice => {
    if (timeFilter === 'all') return true;
    
    const dueDate = new Date(invoice.dueDate);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= parseInt(timeFilter);
  });

  const revenueBySupplier = suppliers.map(supplier => {
    const supplierInvoices = filteredInvoices.filter(invoice => invoice.supplierId === supplier.id);
    const totalRevenue = supplierInvoices.reduce((sum, invoice) => sum + Number(invoice.totalAmount), 0);
    return {
      supplier,
      revenue: totalRevenue
    };
  }).sort((a, b) => b.revenue - a.revenue);

  const totalRevenue = revenueBySupplier.reduce((sum, { revenue }) => sum + revenue, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Select value={timeFilter} onValueChange={(value: '30' | '90' | 'all') => setTimeFilter(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="90">Last 90 Days</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Total Revenue (Excluding Freight)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {revenueBySupplier.map(({ supplier, revenue }, index) => {
          const supplierInvoices = filteredInvoices.filter(invoice => invoice.supplierId === supplier.id);
          const expandedKey = `supplier-${supplier.id}-expanded`;
          const [isExpanded, setIsExpanded] = useState(false);
          
          return (
            <Card key={supplier.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg">{supplier.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-xl font-bold">
                    ${revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
                <div className={`border rounded-lg overflow-hidden ${isExpanded ? '' : 'hidden'}`}>
                  <div className="max-h-[200px] overflow-auto">
                    <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="px-3 py-2 text-left">Invoice #</th>
                        <th className="px-3 py-2 text-left">Due Date</th>
                        <th className="px-3 py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {supplierInvoices.map((invoice) => (
                        <tr key={invoice.id}>
                          <td className="px-3 py-2">
                            {invoice.invoiceNumber}
                          </td>
                          <td className="px-3 py-2">
                            {new Date(invoice.dueDate).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-2 text-right">
                            ${Number(invoice.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
