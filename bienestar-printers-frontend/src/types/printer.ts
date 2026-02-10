export interface PrinterSummary {
    id: string;
    name: string;
    area: string | null;
    isOnline: boolean;
    tonerLevel: number | null;
    kitMaintenance: number | null;
    unitImage: number | null;
    createdAt: string;
}



export interface PrinterComparison {
    year: number;
    month: number;
    print_only: number;
    copies: number;
    print_total: number;
}


export interface UnitStats {
    totalPrinters: number;
    onlineCount: number;
    offlineCount: number;
    totalPrints: number; // Aggregate
    totalScans: number;  // Aggregate
}
