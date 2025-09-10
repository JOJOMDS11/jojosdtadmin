const { createCanvas, loadImage } = require('canvas');

async function generateCardImage(cardData) {
    try {
        // Dimensões da carta (ajustado para incluir stats)
        const width = 200;
        const height = 350;

        // Criar canvas
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Cores por raridade (cores corretas)
        const rarityColors = {
            'Prime': '#8B5CF6',    // Roxo
            'GOAT': '#DC2626',     // Vermelho
            'Médio': '#EAB308',    // Amarelo
            'Bagre': '#6B7280'     // Cinza
        };

        const color = rarityColors[cardData.rarity] || rarityColors['Bagre'];

        // Background com cor da raridade
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);

        // Borda mais escura
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeRect(0, 0, width, height);

        // Área do avatar (círculo no topo)
        const avatarSize = 80;
        const avatarX = width / 2;
        const avatarY = 60;

        // Círculo de fundo para o avatar
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, avatarSize / 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Desenhar emoji/avatar de 2 caracteres
        if (cardData.avatar && cardData.avatar.length <= 2) {
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(cardData.avatar, avatarX, avatarY);
        } else {
            // Fallback para iniciais se não for emoji
            const initials = (cardData.player_name || 'UK').substring(0, 2).toUpperCase();
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(initials, avatarX, avatarY);
        }

        // Nome do jogador
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(cardData.player_name || 'Unknown', width / 2, 130);

        // Posição
        ctx.font = 'bold 14px Arial';
        ctx.fillText(cardData.position || 'POS', width / 2, 150);

        // Overall (grande no centro)
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 48px Arial';
        ctx.fillText(cardData.overall || '70', width / 2, 210);

        // Raridade
        ctx.font = 'bold 12px Arial';
        ctx.fillText(cardData.rarity || 'BAGRE', width / 2, 230);

        // Estatísticas embaixo
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'left';
        const statsY = 260;
        const leftX = 15;
        const rightX = width / 2 + 5;

        // Stats da esquerda
        ctx.fillText(`DEF: ${cardData.defense || 60}`, leftX, statsY);
        ctx.fillText(`DRI: ${cardData.dribble || 60}`, leftX, statsY + 15);
        ctx.fillText(`PAS: ${cardData.pass || 60}`, leftX, statsY + 30);
        ctx.fillText(`FIN: ${cardData.finishing || 60}`, leftX, statsY + 45);

        // Stats da direita
        ctx.fillText(`POS: ${cardData.positioning || 60}`, rightX, statsY);
        ctx.fillText(`SPD: ${cardData.speed || 60}`, rightX, statsY + 15);
        ctx.fillText(`SHO: ${cardData.shooting || 60}`, rightX, statsY + 30);
        ctx.fillText(`PHY: ${cardData.physical || 60}`, rightX, statsY + 45);

        return canvas.toBuffer('image/png');

    } catch (error) {
        console.error('Erro ao gerar imagem da carta:', error);
        return null;
    }
}

module.exports = {
    generateCardImage
};
