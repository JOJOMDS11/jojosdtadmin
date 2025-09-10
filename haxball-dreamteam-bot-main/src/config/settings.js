require('dotenv').config();

const config = {
    // Database configuration - construindo a URI a partir das variáveis individuais
    databaseURI: process.env.DATABASE_URI || `mysql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,

    // Discord Bot configuration
    bot: {
        token: process.env.DISCORD_TOKEN,
        prefix: process.env.PREFIX || '!'
    },

    // Card system configuration
    card: {
        rarityProbabilities: {
            bagre: 0.65,   // 65%
            medio: 0.25,   // 25%
            goat: 0.08,    // 8%
            prime: 0.02    // 2%
        },
        maxOverall: 100
    },

    // Player system configuration
    player: {
        positions: ['GK', 'VL', 'PV'],
        statRanges: {
            GK: { min: 0, max: 99 },
            VL: { min: 0, max: 99 },
            PV: { min: 0, max: 99 }
        }
    },

    // Cooldowns and rewards
    rewards: {
        cardCooldownMinutes: parseInt(process.env.COOLDOWN_OBTER_MINUTES) || 20,
        packCooldownHours: parseInt(process.env.COOLDOWN_PACK_HOURS) || 5,
        winnerCoins: { min: 50, max: 80 },
        loserCoins: { min: 20, max: 35 }
    },

    // Server configuration
    server: {
        port: process.env.PORT || 3000,
        nodeEnv: process.env.NODE_ENV || 'development'
    }
};

module.exports = config;
