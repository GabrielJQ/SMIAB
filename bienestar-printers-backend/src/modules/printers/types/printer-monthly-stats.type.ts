export interface PrinterMonthlyStats {
    id: string;
    printer_id: string;
    unit_id: string;
    year: number;
    month: number;
    print_only_delta: number;
    copy_delta: number;
    print_total_delta: number;

    created_at: string;
    updated_at: string;
}
