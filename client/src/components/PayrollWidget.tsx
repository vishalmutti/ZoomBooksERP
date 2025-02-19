
import React, { useState } from 'react';

export function PayrollWidget() {
  const [selectedSheet, setSelectedSheet] = useState<'BC' | 'ON'>('BC');

  const bcSheetUrl = "https://docs.google.com/spreadsheets/d/10urhqRqF_Opmdj_MeTKxxXNYGjUuiUlnFY9qAowK4eU/edit?usp=sharing&embedded=true";
  const onSheetUrl = "https://docs.google.com/spreadsheets/d/1baasY58BNibdrI45ciXeZehU8IjzBOlKux5xUXFYYX0/edit?usp=sharing&embedded=true";

  return (
    <div className="fixed inset-x-0 bottom-0 top-[180px] flex flex-col bg-background">
      <div className="flex items-center gap-2 p-2 bg-background z-10 border-b">
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

      <div className="flex-1 w-full h-full">
        <iframe
          src={selectedSheet === 'BC' ? bcSheetUrl : onSheetUrl}
          className="w-full h-full border-none"
          title={`Employee Hours - ${selectedSheet}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          loading="eager"
        />
      </div>
    </div>
  );
}
