const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function createRarityImages() {
    const rarities = [
        { name: 'prime', color: '#8B5CF6' },    // Roxo
        { name: 'goat', color: '#DC2626' },     // Vermelho  
        { name: 'médio', color: '#EAB308' },    // Amarelo
        { name: 'bagre', color: '#6B7280' }     // Cinza
    ];

    const size = 100;

    rarities.forEach(rarity => {
        const canvas = createCanvas(size, size);
        const ctx = canvas.getContext('2d');

        // Criar círculo com cor da raridade
        ctx.fillStyle = rarity.color;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 5, 0, 2 * Math.PI);
        ctx.fill();

        // Borda preta
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Salvar arquivo
        const buffer = canvas.toBuffer('image/png');
        const filePath = path.join(__dirname, '../assets/images/rarities', `${rarity.name}.png`);
        fs.writeFileSync(filePath, buffer);
        console.log(`✅ Criada imagem: ${rarity.name}.png`);
    });
}

if (require.main === module) {
    createRarityImages();
}

module.exports = { createRarityImages };
