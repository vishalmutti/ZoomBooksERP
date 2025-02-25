import React, { createContext, useState, useContext, ReactNode } from 'react';

type TimeFilter = '30' | '90' | 'all';

interface WholesaleContextType {
  selectedSupplier: string | null;
  setSelectedSupplier: (supplier: string | null) => void;
  timeFilter: TimeFilter;
  setTimeFilter: (filter: TimeFilter) => void;
  fromMetrics: boolean;
  setFromMetrics: (fromMetrics: boolean) => void;
}

const WholesaleContext = createContext<WholesaleContextType | undefined>(undefined);

export function WholesaleProvider({ children }: { children: ReactNode }) {
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [fromMetrics, setFromMetrics] = useState(false);

  return (
    <WholesaleContext.Provider 
      value={{ 
        selectedSupplier, 
        setSelectedSupplier, 
        timeFilter, 
        setTimeFilter, 
        fromMetrics, 
        setFromMetrics 
      }}
    >
      {children}
    </WholesaleContext.Provider>
  );
}

export function useWholesaleContext() {
  const context = useContext(WholesaleContext);
  if (context === undefined) {
    throw new Error('useWholesaleContext must be used within a WholesaleProvider');
  }
  return context;
}
