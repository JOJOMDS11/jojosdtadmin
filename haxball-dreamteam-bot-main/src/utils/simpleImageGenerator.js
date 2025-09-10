const { createCanvas } = require('canvas');
const Logger = require('./logger');

/**
 * Gera imagem simples para comandos como obter, mostrarcartas
 * Apenas avatar, overall e raridade - sem stats
 */
async function generateSimpleCardImage(cardData) {
    try {
        // Dimensões menores para imagem simples
        const width = 200;
        const height = 250;

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
        const avatarSize = 100;
        const avatarX = width / 2;
        const avatarY = 80;

        // Círculo de fundo para o avatar
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, avatarSize / 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Desenhar emoji/avatar 
        if (cardData.avatar) {
            // Detectar se é emoji ou texto - regex mais amplo para emojis
            const isEmoji = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]|[\u{FE00}-\u{FE0F}]|[\u{200D}]|[\u{20E3}]/gu.test(cardData.avatar);

            if (isEmoji || cardData.avatar.length <= 2) {
                // Emoji ou texto de 1-2 caracteres
                ctx.fillStyle = '#000000';
                ctx.font = 'bold 40px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                try {
                    ctx.fillText(cardData.avatar, avatarX, avatarY);
                } catch (emojiError) {
                    Logger.debug('Erro ao renderizar emoji, usando fallback:', emojiError.message);
                    // Fallback se emoji não renderizar
                    const fallback = cardData.avatar.length > 2 ? cardData.avatar.substring(0, 2).toUpperCase() : cardData.avatar.toUpperCase();
                    ctx.fillText(fallback, avatarX, avatarY);
                }
            } else {
                // Para avatares maiores (como "jojo"), usar as primeiras 2 letras em maiúsculo
                const displayText = cardData.avatar.substring(0, 2).toUpperCase();
                ctx.fillStyle = '#000000';
                ctx.font = 'bold 32px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(displayText, avatarX, avatarY);
            }
        } else if (cardData.template_avatar) {
            // Usar template_avatar se disponível
            const isEmoji = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]|[\u{FE00}-\u{FE0F}]|[\u{200D}]|[\u{20E3}]/gu.test(cardData.template_avatar);

            if (isEmoji || cardData.template_avatar.length <= 2) {
                ctx.fillStyle = '#000000';
                ctx.font = 'bold 40px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                try {
                    ctx.fillText(cardData.template_avatar, avatarX, avatarY);
                } catch (emojiError) {
                    Logger.debug('Erro ao renderizar emoji template, usando fallback:', emojiError.message);
                    const fallback = cardData.template_avatar.length > 2 ? cardData.template_avatar.substring(0, 2).toUpperCase() : cardData.template_avatar.toUpperCase();
                    ctx.fillText(fallback, avatarX, avatarY);
                }
            } else {
                const displayText = cardData.template_avatar.substring(0, 2).toUpperCase();
                ctx.fillStyle = '#000000';
                ctx.font = 'bold 32px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(displayText, avatarX, avatarY);
            }
        } else {
            // Fallback para iniciais do nome do jogador
            const initials = (cardData.player_name || 'UK').substring(0, 2).toUpperCase();
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(initials, avatarX, avatarY);
        }

        // Overall (grande no centro)
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 52px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(cardData.overall || '70', width / 2, 180);

        // Raridade embaixo do overall
        ctx.font = 'bold 16px Arial';
        ctx.fillText(cardData.rarity || 'BAGRE', width / 2, 210);

        return canvas.toBuffer('image/png');

    } catch (error) {
        console.error('Erro ao gerar imagem simples da carta:', error);
        return null;
    }
}

/**
 * Gera imagem com stats para comandos como escalar, stats
 */
async function generateCardImageWithStats(cardData) {
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
        ctx.fillText(`DEF: ${cardData.defense || cardData.defesa || 60}`, leftX, statsY);
        ctx.fillText(`DRI: ${cardData.dribble || cardData.drible || 60}`, leftX, statsY + 15);
        ctx.fillText(`PAS: ${cardData.pass || cardData.passe || 60}`, leftX, statsY + 30);
        ctx.fillText(`FIN: ${cardData.finishing || cardData.finalizacao || 60}`, leftX, statsY + 45);

        // Stats da direita
        ctx.fillText(`POS: ${cardData.positioning || cardData.posicionamento || 60}`, rightX, statsY);
        ctx.fillText(`SPD: ${cardData.speed || cardData.saidaDeBola || 60}`, rightX, statsY + 15);
        ctx.fillText(`SHO: ${cardData.shooting || cardData.finalizacao || 60}`, rightX, statsY + 30);
        ctx.fillText(`PHY: ${cardData.physical || cardData.defesa || 60}`, rightX, statsY + 45);

        return canvas.toBuffer('image/png');

    } catch (error) {
        console.error('Erro ao gerar imagem da carta com stats:', error);
        return null;
    }
}

module.exports = {
    generateSimpleCardImage,
    generateCardImageWithStats
};
