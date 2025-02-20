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

        // Parse the JSON response directly
        const responseData = response.data;
        const transformedData = Array.isArray(responseData) ? responseData.map(row => ({
          date: row.date?.split(' ')[0] || '', // Extract just the date part
          count: parseInt(row.count, 10) || 0
        })) : [];

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