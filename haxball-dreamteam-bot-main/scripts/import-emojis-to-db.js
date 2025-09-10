// Script para importar emojis salvos do emoji-converter.html para o banco de dados
// Uso: node scripts/import-emojis-to-db.js emojis.json

const fs = require('fs');
const path = require('path');
const { query } = require('../src/database/connection');

async function main() {
    const file = process.argv[2];
    if (!file) {
        console.error('Uso: node import-emojis-to-db.js <arquivo.json>');
        process.exit(1);
    }
    const jsonPath = path.resolve(file);
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    for (const { emoji, code } of data) {
        // Ajuste para não duplicar
        const exists = await query('SELECT id FROM avatars WHERE code = ?', [code]);
        if (exists.length > 0) continue;
        await query('INSERT INTO avatars (emoji, code) VALUES (?, ?)', [emoji, code]);
        console.log(`Adicionado: ${emoji} (${code})`);
    }
    console.log('Importação concluída!');
    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
