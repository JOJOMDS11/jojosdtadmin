const RARITY_THRESHOLDS = {
    BAGRE: { min: 22, max: 75 },
    MEDIO: { min: 74, max: 83 },
    GOAT: { min: 82, max: 91 },
    PRIME: { min: 90, max: 99 }
};

// Cores das raridades (Prime = Roxo - cor primária do servidor)
const RARITY_COLORS = {
    Prime: 0x8B5CF6,    // Roxo - cor primária
    GOAT: 0xF59E0B,     // Dourado/Laranja
    Médio: 0x3B82F6,    // Azul
    Bagre: 0x6B7280     // Cinza
};

const getRarity = (overall) => {
    if (overall >= RARITY_THRESHOLDS.PRIME.min) {
        return 'Prime';
    } else if (overall >= RARITY_THRESHOLDS.GOAT.min) {
        return 'GOAT';
    } else if (overall >= RARITY_THRESHOLDS.MEDIO.min) {
        return 'Médio';
    } else {
        return 'Bagre';
    }
};

const getRandomRarity = () => {
    const randomValue = Math.random() * 100;
    if (randomValue < 2) {
        return 'Prime';     // 2% chance
    } else if (randomValue < 10) {
        return 'GOAT';      // 8% chance
    } else if (randomValue < 35) {
        return 'Médio';     // 25% chance
    } else {
        return 'Bagre';     // 65% chance
    }
};

module.exports = {
    RARITY_THRESHOLDS,
    RARITY_COLORS,
    getRarity,
    getRandomRarity
};
