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
        const response = await axios.get('https://list.lkdev.com/report_serve.php', {
          params: {
            cmreport_id: 2,
            r: '54338224',
            amazonseller_id: '196',
            cmkey: '44f343fb207c118c67ac11801d1f745250fba02c',
            customjson: JSON.stringify({ days: 7 })
          }
        });

        // Parse space-separated records
        const rows = response.data.trim().split(/\s+/);
        const headerRow = rows[0]; // "date,shift,line,count"
        const transformedData = rows
          .slice(1) // Skip header row
          .map(row => {
            const values = row.split(',');
            return {
              date: values[0],
              count: parseInt(values[3], 10) || 0
            };
          })
          .filter(row => !isNaN(row.count));

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
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metricsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4f46e5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}