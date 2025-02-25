import { createContext, useContext, useState, ReactNode } from "react";

type TimeRangeOption = '14' | '30' | '90' | 'all';

interface CarrierContextType {
  selectedCarrier: string | null;
  setSelectedCarrier: (carrier: string | null) => void;
  timeRange: TimeRangeOption;
  setTimeRange: (range: TimeRangeOption) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  fromMetrics: boolean;
  setFromMetrics: (value: boolean) => void;
}

const CarrierContext = createContext<CarrierContextType | undefined>(undefined);

export function CarrierProvider({ children }: { children: ReactNode }) {
  const [selectedCarrier, setSelectedCarrier] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRangeOption>('30');
  const [activeTab, setActiveTab] = useState<string>("loads");
  const [fromMetrics, setFromMetrics] = useState<boolean>(false);

  return (
    <CarrierContext.Provider
      value={{
        selectedCarrier,
        setSelectedCarrier,
        timeRange,
        setTimeRange,
        activeTab,
        setActiveTab,
        fromMetrics,
        setFromMetrics
      }}
    >
      {children}
    </CarrierContext.Provider>
  );
}

export function useCarrierContext() {
  const context = useContext(CarrierContext);
  if (context === undefined) {
    throw new Error("useCarrierContext must be used within a CarrierProvider");
  }
  return context;
}
