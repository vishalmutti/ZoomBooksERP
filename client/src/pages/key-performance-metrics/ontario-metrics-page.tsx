import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface MetricsData {
  date: string;
  count: number;
}

export default function OntarioMetricsPage() {
  const [metricsData, setMetricsData] = useState<MetricsData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://list.lkdev.com/report_serve.php?cmreport_id=2&r=54338224&amazonseller_id=196&cmkey=44f343fb207c118c67ac11801d1f745250fba02c&customjson=%7B%0A%20%22days%22%3A7%0A%7D');
        const text = await response.text();
        
        // Split by newlines and filter empty lines
        const rows = text.split('\n').filter(row => row.trim());
        
        // Skip header row and parse data
        const transformedData = rows
          .slice(1)
          .map(row => {
            const [date, , , count] = row.split(',').map(cell => cell.trim());
            return {
              date,
              count: parseInt(count, 10)
            };
          })
          .filter((row): row is { date: string; count: number } => 
            row !== null && !isNaN(row.count)
          );

        console.log('Raw response:', response.data);
        console.log('Parsed data:', transformedData);

        // Sort by date
        transformedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setMetricsData(transformedData);
      } catch (error) {
        console.error('Error fetching metrics data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Ontario Warehouse Metrics</h1>
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Daily Counts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full">
              {metricsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metricsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis domain={[0, 'auto']} />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      formatter={(value) => [value, 'Count']}
                    />
                    <Bar dataKey="count" fill="#4f46e5" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}