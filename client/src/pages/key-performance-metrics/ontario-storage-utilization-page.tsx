import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from 'react';

export default function OntarioStorageUtilizationPage() {
  const [storageUtilization, setStorageUtilization] = useState("");

  useEffect(() => {
    // Function to fetch data from Google Sheet
    const fetchStorageUtilization = async () => {
      try {
        const response = await fetch("https://docs.google.com/spreadsheets/d/1I26GhVusZsMkInB17CwuRZZlEAcBG-3b/gviz/tq?tqx=out:json");
        const text = await response.text();
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}') + 1;
        const jsonString = text.slice(jsonStart, jsonEnd);
        const data = JSON.parse(jsonString);

        // Get value from cell T2
        const cellValue = data.table.rows[1].c[19].v; // T is the 20th column (index 19)
        setStorageUtilization(cellValue);
      } catch (error) {
        console.error("Error fetching storage utilization:", error);
        setStorageUtilization("Error fetching data"); // Set a default value on error
      }
    };

    fetchStorageUtilization();
  }, []);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Ontario Storage Utilization</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total Storage Space</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Coming Soon</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Used Space</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Coming Soon</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Available Space</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Coming Soon</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Storage Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{storageUtilization}%</p>
          </CardContent>
        </Card>
      </div>
      <div className="w-full">
        <iframe 
          src="https://docs.google.com/spreadsheets/d/1I26GhVusZsMkInB17CwuRZZlEAcBG-3b/edit?usp=sharing&embedded=true"
          className="w-full h-[800px] border-0 rounded-lg shadow-lg"
          frameBorder="0"
          allowFullScreen
        />
      </div>
    </div>
  );
}