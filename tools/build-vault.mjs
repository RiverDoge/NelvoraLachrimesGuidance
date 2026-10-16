import fs from 'fs';
import path from 'path';
import { readVault, VaultError } from './vault.mjs';

const OUTPUT = 'data/xeryos.json';

function report(level, message) {
    console.log(process.env.GITHUB_ACTIONS ? `::${level}::${message}` : `${level}: ${message}`);
}

function count(champions, key) {
    return champions.reduce((total, champion) => total + champion[key].length, 0);
}

try {
    const { champions, warnings } = readVault();

    fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
    fs.writeFileSync(OUTPUT, JSON.stringify({ champions }, null, 2));

    warnings.forEach(message => report('warning', message));
    console.log(`Built ${champions.length} champions, ${count(champions, 'subFactions')} sub-factions, ${count(champions, 'objectives')} objectives, ${count(champions, 'individuals')} individuals into ${OUTPUT}`);
} catch (error) {
    if (!(error instanceof VaultError)) throw error;
    report('error', error.message);
    process.exit(1);
}
