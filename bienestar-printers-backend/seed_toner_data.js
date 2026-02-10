const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://lhkmsexpbouhpcyvhgok.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxoa21zZXhwYm91aHBjeXZoZ29rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTA4MDg5OSwiZXhwIjoyMDg0NjU2ODk5fQ.8ho2l-qD24GnWefKHCtvUAPQ-7Nq3CPNhumm1fQQUjk';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
    console.log('--- Seeding Start ---');

    // 1. Get Unit
    const { data: units } = await supabase.from('units').select('id, uninom').eq('uninom', 'AlmBienOax').limit(1);
    const unit = units[0];
    const unitId = unit.id;
    console.log(`Unit: ${unit.uninom} (${unitId})`);

    // 2. Get Printers
    const { data: printers } = await supabase.from('printers').select('id').eq('unit_id', unitId);
    const printerIds = printers.map(p => p.id);
    console.log(`Printers (${printerIds.length}): ${printerIds.join(', ')}`);

    // 3. Generate Data
    // Target: Aug 2025 to Feb 2026
    const entries = [];
    const models = ['lexmark', 'kyocera'];

    // Config: average changes per month per printer
    // Let's make it lively.

    // Feb 2026 (Current)
    generateEntries(entries, printerIds, 2026, 1, 5, models); // Feb is month index 1 in JS Date? NO. Date(2026, 1, 1) is Feb. 
    // Wait, ISO string needs correct month.
    // Logic: new Date(year, monthIndex, day)

    // Jan 2026
    generateEntries(entries, printerIds, 2026, 0, 3, models);

    // Dec 2025
    generateEntries(entries, printerIds, 2025, 11, 4, models);

    // Nov 2025
    generateEntries(entries, printerIds, 2025, 10, 2, models);

    // Oct 2025
    generateEntries(entries, printerIds, 2025, 9, 3, models);

    // Sep 2025
    generateEntries(entries, printerIds, 2025, 8, 2, models);

    // Aug 2025
    generateEntries(entries, printerIds, 2025, 7, 1, models);

    console.log(`Generated ${entries.length} entries to insert.`);

    // 4. Insert
    // Batched insert is better
    const { error } = await supabase.from('toner_changes').insert(entries);

    if (error) {
        console.error('Insert Error:', error);
    } else {
        console.log('SUCCESS: Data seeded.');
    }
}

function generateEntries(arr, printerIds, year, monthIndex, countPerPrinter, models) {
    printerIds.forEach(pid => {
        // Randomly decide if this printer had changes this month (80% chance)
        if (Math.random() > 0.2) {
            // Random count 1 to countPerPrinter
            const c = Math.floor(Math.random() * countPerPrinter) + 1;
            for (let i = 0; i < c; i++) {
                const day = Math.floor(Math.random() * 28) + 1;
                const hour = Math.floor(Math.random() * 8) + 9; // 9am - 5pm
                const date = new Date(year, monthIndex, day, hour, 0, 0);

                arr.push({
                    printer_id: pid,
                    toner_model: models[Math.floor(Math.random() * models.length)],
                    changed_at: date.toISOString(),
                    // created_at defaults to now
                });
            }
        }
    });
}

main().catch(console.error);
