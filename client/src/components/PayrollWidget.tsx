
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type SheetType = 'BC' | 'ON';
type ContentType = 'payroll' | 'schedule';

export function PayrollWidget() {
  const [selectedSheet, setSelectedSheet] = useState<SheetType>('BC');
  const [contentType, setContentType] = useState<ContentType>('payroll');

  // Payroll sheet URLs
  const bcPayrollSheetUrl = "https://docs.google.com/spreadsheets/d/10urhqRqF_Opmdj_MeTKxxXNYGjUuiUlnFY9qAowK4eU/edit?usp=sharing&embedded=true";
  const onPayrollSheetUrl = "https://docs.google.com/spreadsheets/d/1baasY58BNibdrI45ciXeZehU8IjzBOlKux5xUXFYYX0/edit?usp=sharing&embedded=true";
  
  // Schedule sheet URLs - replace these with your actual schedule sheets
  const bcScheduleSheetUrl = "https://docs.google.com/spreadsheets/d/1ZzC7LZ59KwoTF_FPwkCaNDK_JfVLGAfBDNJsABJu1JE/edit?usp=sharing&embedded=true";
  const onScheduleSheetUrl = "https://docs.google.com/spreadsheets/d/1tNcxfdUgpj-wuoIVqLlZScQ1_8UzBEQxPLST-c_Qxqc/edit?usp=sharing&embedded=true";

  // Function to get the appropriate URL based on current selections
  const getActiveSheetUrl = () => {
    if (contentType === 'payroll') {
      return selectedSheet === 'BC' ? bcPayrollSheetUrl : onPayrollSheetUrl;
    } else {
      return selectedSheet === 'BC' ? bcScheduleSheetUrl : onScheduleSheetUrl;
    }
  };

  return (
    <div className="flex flex-col bg-background h-[calc(100vh-180px)]">
      <Tabs defaultValue="payroll" className="w-full" onValueChange={(value) => setContentType(value as ContentType)}>
        <div className="flex justify-between items-center mb-2">
          <TabsList>
            <TabsTrigger value="payroll">Payroll Sheets</TabsTrigger>
            <TabsTrigger value="schedule">Schedule Sheets</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedSheet('BC')}
              className={`px-4 py-2 rounded-md transition-colors ${
                selectedSheet === 'BC' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              British Columbia
            </button>
            <button
              onClick={() => setSelectedSheet('ON')}
              className={`px-4 py-2 rounded-md transition-colors ${
                selectedSheet === 'ON' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              Ontario
            </button>
          </div>
        </div>

        <TabsContent value="payroll" className="mt-0 border-t pt-2">
          <div className="text-sm text-muted-foreground mb-2">
            <p>Employee payroll tracking sheets for {selectedSheet === 'BC' ? 'British Columbia' : 'Ontario'} location.</p>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="mt-0 border-t pt-2">
          <div className="text-sm text-muted-foreground mb-2">
            <p>Employee schedule planning sheets for {selectedSheet === 'BC' ? 'British Columbia' : 'Ontario'} location.</p>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex-1 w-full h-full">
        <iframe
          src={getActiveSheetUrl()}
          className="w-full h-full border-none min-h-[800px]"
          title={`${contentType === 'payroll' ? 'Payroll' : 'Schedule'} - ${selectedSheet}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          loading="eager"
        />
      </div>
    </div>
  );
}
