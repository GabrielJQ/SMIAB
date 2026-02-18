export interface PrinterMonthlyStats {
    id: string;
    asset_id: string;
    year: number;
    month: number;
    print_only_delta: number;
    copy_delta: number;
    print_total_delta: number;

    created_at: string;
}
