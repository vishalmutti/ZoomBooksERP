
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";

export function PayrollWidget() {
  const [selectedSheet, setSelectedSheet] = useState<'BC' | 'ON'>('BC');

  const bcSheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTPQtCvfHlUj-vu6uf6ylyQhPnAmf7omaTFte32lb2cZg9JucGNlS-yZXgGpPvnyVe_BcpyT2nxDKGu/edit?embedded=true";
  const onSheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTukWeICJPpuJmbpsokmkto2XDs7cp4bj_-MzDeJ6Ko_qSwF_HlK9C9ZPTcOEdcs5vHYOw1ScfvVhBi/edit?embedded=true";

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
