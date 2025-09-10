const { getRarity, getRandomRarity, RARITY_THRESHOLDS } = require('./rarity');
const { generateStats, getPositionRandomly } = require('./stats');
const { getRandomTemplate } = require('../database/models/playerTemplate');

// Função para gerar uma carta aleatória baseada em template
const generateCard = async () => {
    try {
        // Buscar template aleatório
        const template = await getRandomTemplate();
        if (!template) {
            throw new Error('❌ **NENHUM JOGADOR DISPONÍVEL!**\n\n🔧 **ADM:** Use `/criarjogador` para criar jogadores primeiro!\n⚠️ O sistema não cria jogadores automaticamente.');
        }

        // Determinar raridade aleatória
        const rarity = getRandomRarity();

        // Gerar overall baseado na raridade
        const overall = generateOverallByRarity(rarity);

        // Gerar stats baseados na posição e overall
        const stats = generateStats(template.position, overall);

        // Calcular preço baseado na raridade e overall
        const price = calculateCardPrice(rarity, overall);

        // Garantir que sempre tenha um avatar válido
        const validAvatar = template.avatar || '⚽';

        return {
            template_id: template.id,
            player_name: template.name, // Para compatibilidade
            position: template.position,
            avatar: validAvatar,
            template_avatar: validAvatar, // Fallback para exibição
            rarity: rarity,
            overall: overall,
            price: price,
            stats: stats
        };
    } catch (error) {
        console.error('Erro ao gerar carta:', error);
        throw error;
    }
};

// Função para gerar carta com raridade específica (para upgrades)
const generateUpgradeCard = async (specificRarity) => {
    try {
        // Buscar template aleatório
        const template = await getRandomTemplate();
        if (!template) {
            throw new Error('❌ **NENHUM JOGADOR DISPONÍVEL!**\n\n🔧 **ADM:** Use `/criarjogador` para criar jogadores primeiro!\n⚠️ O sistema não cria jogadores automaticamente.');
        }

        // Usar raridade específica fornecida
        const rarity = specificRarity;

        // Gerar overall baseado na raridade específica
        const overall = generateOverallByRarity(rarity);

        // Gerar stats baseados na posição e overall
        const stats = generateStats(template.position, overall);

        // Calcular preço baseado na raridade e overall
        const price = calculateCardPrice(rarity, overall);

        // Garantir que sempre tenha um avatar válido
        const validAvatar = template.avatar || '⚽';

        return {
            template_id: template.id,
            player_name: template.name, // Para compatibilidade
            position: template.position,
            avatar: validAvatar,
            template_avatar: validAvatar, // Fallback para exibição
            rarity: rarity,
            overall: overall,
            price: price,
            stats: stats
        };
    } catch (error) {
        console.error('Erro ao gerar carta de upgrade:', error);
        throw error;
    }
};

// Gerar overall baseado na raridade
function generateOverallByRarity(rarity) {
    const ranges = {
        'Prime': { min: 90, max: 99 },   // Roxo - melhor
        'GOAT': { min: 82, max: 91 },    // Laranja/Dourado
        'Médio': { min: 74, max: 83 },   // Azul
        'Bagre': { min: 65, max: 75 }    // Verde/Cinza - pior
    };

    const range = ranges[rarity] || ranges['Bagre'];
    return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
}

// Calcular preço da carta
function calculateCardPrice(rarity, overall) {
    const basePrice = {
        'Prime': 200,
        'GOAT': 100,
        'Médio': 50,
        'Bagre': 20
    };

    const base = basePrice[rarity] || 20;
    const overallBonus = Math.floor((overall - 65) * 2); // Bonus por overall

    return base + overallBonus;
}

// Função para gerar carta do jogador
const generatePlayerCard = async (playerData) => {
    try {
        console.log('🎴 Gerando carta para jogador:', playerData.name);

        // Por enquanto retorna null (sem Canvas)
        // TODO: Implementar geração de carta visual
        console.log('⚠️ Geração de carta visual desabilitada - Canvas não instalado');
        return null;
    } catch (error) {
        console.error('Erro ao gerar carta do jogador:', error);
        return null;
    }
};

// Função para gerar logo do time
const generateTeamLogo = async (teamData) => {
    try {
        console.log('🏆 Gerando logo para time:', teamData.name);

        // Por enquanto retorna null (sem Canvas)
        // TODO: Implementar geração de logo visual
        console.log('⚠️ Geração de logo visual desabilitada - Canvas não instalado');
        return null;
    } catch (error) {
        console.error('Erro ao gerar logo do time:', error);
        return null;
    }
};

const generatePlayerName = () => {
    const firstNames = ['João', 'Pedro', 'Carlos', 'Luis', 'André', 'Bruno', 'Diego', 'Rafael', 'Mateus', 'Gabriel'];
    const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Costa', 'Lima', 'Pereira', 'Rodrigues', 'Ferreira', 'Alves'];

    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

    return `${firstName} ${lastName}`;
};

// Função para criar jogador com dados customizados (apenas template)
const createCustomPlayer = (playerData) => {
    const { name, position, avatar } = playerData;

    if (!name || !position || !avatar) {
        throw new Error('Nome, posição e avatar são obrigatórios');
    }

    const validPositions = ['GK', 'VL', 'PV'];
    if (!validPositions.includes(position)) {
        throw new Error('Posição deve ser GK, VL ou PV');
    }

    // Retorna apenas o template do jogador, sem raridade nem stats
    return {
        name: name,
        position: position,
        avatar: avatar, // Avatar customizado do Haxball
        isCustomTemplate: true // Marca como template customizado
    };
};

// Função para gerar carta a partir de template customizado
const generateCardFromTemplate = async (template) => {
    const rarity = getRandomRarity(); // Raridade sempre aleatória
    const overall = getRandomOverallByRarity(rarity);
    const stats = generateStats(template.position, overall);

    const cardId = Date.now() + Math.random();

    const cardData = {
        id: cardId,
        name: template.name,
        position: template.position,
        avatar: template.avatar,
        rarity: rarity,
        overall: overall,
        stats: stats,
        createdAt: new Date(),
        isCustom: true
    };

    // Gerar imagem da carta
    try {
        const imageFilename = `custom_${cardId}.png`;
        const imagePath = await saveCardImage(cardData, imageFilename);
        cardData.imagePath = imagePath;
    } catch (error) {
        console.error('Erro ao gerar imagem:', error);
        cardData.imagePath = null;
    }

    return cardData;
};

const getRandomOverallByRarity = (rarity) => {
    const threshold = RARITY_THRESHOLDS[rarity.toUpperCase()];
    return Math.floor(Math.random() * (threshold.max - threshold.min + 1)) + threshold.min;
};

// Função para gerar avatar aleatório baseado na posição
const getRandomAvatar = (position) => {
    const avatars = {
        'GK': ['🥅', '🧤', '⚡', '#00FF00', '#FFD700'],
        'VL': ['⚽', '🏃', '💨', '#0099FF', '#FF6600'],
        'PV': ['🔥', '⚡', '🎯', '#FF0000', '#9900FF']
    };

    const positionAvatars = avatars[position] || avatars['VL'];
    return positionAvatars[Math.floor(Math.random() * positionAvatars.length)];
};

const generatePack = async (packType = 'normal') => {
    const cards = [];
    const packSize = packType === 'premium' ? 5 : 3;

    for (let i = 0; i < packSize; i++) {
        const card = await generateCard();
        cards.push(card);
    }

    return cards;
};

const upgradeCards = async (cards) => {
    if (cards.length !== 3) {
        throw new Error('Precisa de exatamente 3 cartas para fazer upgrade');
    }

    // Verificar se todas as cartas são da mesma raridade
    const firstCardRarity = cards[0].rarity;
    const allSameRarity = cards.every(card => card.rarity === firstCardRarity);

    if (!allSameRarity) {
        throw new Error('Todas as cartas precisam ser da mesma raridade');
    }

    // Determinar nova raridade
    let newRarity;
    switch (firstCardRarity) {
        case 'Bagre':
            newRarity = 'Médio';
            break;
        case 'Médio':
            newRarity = 'GOAT';
            break;
        case 'GOAT':
            newRarity = 'Prime';
            break;
        default:
            throw new Error('Não é possível fazer upgrade de cartas Prime');
    }

    return await generateCard(newRarity);
};

module.exports = {
    generateCard,
    generateUpgradeCard,
    generatePack,
    upgradeCards,
    createCustomPlayer,
    generateCardFromTemplate,
    generatePlayerCard,
    generateTeamLogo
};