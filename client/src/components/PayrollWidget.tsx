
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";

export function PayrollWidget() {
  const [selectedSheet, setSelectedSheet] = useState<'BC' | 'ON'>('BC');

  // Replace these URLs with your actual published Google Sheet URLs
  const bcSheetUrl = "https://docs.google.com/spreadsheets/d/YOUR_BC_SHEET_ID/pubhtml?widget=true&amp;headers=false";
  const onSheetUrl = "https://docs.google.com/spreadsheets/d/YOUR_ON_SHEET_ID/pubhtml?widget=true&amp;headers=false";

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedSheet('BC')}
            className={`px-4 py-2 rounded-md transition-colors ${
              selectedSheet === 'BC' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            Employee Hours - BC
          </button>
          <button
            onClick={() => setSelectedSheet('ON')}
            className={`px-4 py-2 rounded-md transition-colors ${
              selectedSheet === 'ON' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            Employee Hours - ON
          </button>
        </div>

        <div className="border rounded-md overflow-hidden bg-white">
          <iframe
            src={selectedSheet === 'BC' ? bcSheetUrl : onSheetUrl}
            className="w-full h-[500px] border-none"
            title={`Employee Hours - ${selectedSheet}`}
          />
        </div>
      </div>
    </Card>
  );
}
