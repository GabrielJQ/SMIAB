const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://lhkmsexpbouhpcyvhgok.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxoa21zZXhwYm91aHBjeXZoZ29rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTA4MDg5OSwiZXhwIjoyMDg0NjU2ODk5fQ.8ho2l-qD24GnWefKHCtvUAPQ-7Nq3CPNhumm1fQQUjk';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
    console.log('--- Verification Start ---');
    console.log('Testing logic with months=1 (Current Month)');

    // 1. Find unit
    const { data: units } = await supabase.from('units').select('id').eq('uninom', 'AlmBienOax').limit(1);
    const unitId = units && units.length > 0 ? units[0].id : 2;

    const { data: printers } = await supabase.from('printers').select('id').eq('unit_id', unitId);
    const printerIds = printers.map(p => p.id);

    // 2. Test Logic with months = 1
    const months = 1;
    const today = new Date();
    // Logic from backend for 'current month' or '1 month'
    // const targetDate = new Date(today.getFullYear(), today.getMonth() - months + 1, 1);
    // If months=1, today.getMonth()-0, 1 -> Start of current month
    const targetDate = new Date(today.getFullYear(), today.getMonth() - months + 1, 1);

    console.log(`Filtering from: ${targetDate.toISOString()}`);

    const { data: changes, error } = await supabase
        .from('toner_changes')
        .select('id, changed_at')
        .in('printer_id', printerIds)
        .gte('changed_at', targetDate.toISOString())
        .order('changed_at', { ascending: false });

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Changes found: ${changes.length}`);
    if (changes.length > 0) {
        console.log(`Latest change: ${changes[0].changed_at}`);
        console.log('SUCCESS: Data is returned for current month.');
    } else {
        console.error('FAILURE: No data returned for current month.');
    }
}

main();
