const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://lhkmsexpbouhpcyvhgok.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxoa21zZXhwYm91aHBjeXZoZ29rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTA4MDg5OSwiZXhwIjoyMDg0NjU2ODk5fQ.8ho2l-qD24GnWefKHCtvUAPQ-7Nq3CPNhumm1fQQUjk';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const LOG_FILE = 'repro_log.txt';

function log(msg) {
    console.log(msg);
    fs.appendFileSync(LOG_FILE, msg + '\n');
}

async function main() {
    fs.writeFileSync(LOG_FILE, '--- Start Diagnosis ---\n');

    // Find the latest change in the entire DB
    const { data: latest, error } = await supabase
        .from('toner_changes')
        .select('changed_at, created_at')
        .order('changed_at', { ascending: false })
        .limit(1);

    if (error) {
        log('Error: ' + error.message);
        return;
    }

    if (!latest || latest.length === 0) {
        log('No data in toner_changes table.');
        return;
    }

    const l = latest[0];
    log(`Latest changed_at: ${l.changed_at}`);
    log(`Latest created_at: ${l.created_at}`);

    const latestDate = new Date(l.changed_at);
    const today = new Date();
    const diffTime = Math.abs(today - latestDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    log(`Days since latest change: ${diffDays}`);
}

main().catch(console.error);
