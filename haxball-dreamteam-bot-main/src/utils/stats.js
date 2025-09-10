const generateStats = (position, overall) => {
    let stats = {};

    // Stats base mais altos para melhor distribuição
    const baseStats = {
        GK: {
            posicionamento: 50,
            saidaDeBola: 45,
            defesa: 55,
            drible: 30
        },
        VL: {
            defesa: 55,
            passe: 50,
            finalizacao: 35,
            drible: 40
        },
        PV: {
            finalizacao: 55,
            posicionamento: 45,
            drible: 50,
            passe: 40
        }
    };

    if (baseStats[position]) {
        for (let stat in baseStats[position]) {
            // Sistema melhorado: stats mais próximos do overall
            const baseStat = baseStats[position][stat];

            // Para overall alto (85+), stats devem ser próximos do overall
            let targetStat;
            if (overall >= 85) {
                // Overall alto: stats entre 80-95% do overall
                targetStat = overall * (0.80 + Math.random() * 0.15);
            } else if (overall >= 70) {
                // Overall médio: stats entre 70-90% do overall  
                targetStat = overall * (0.70 + Math.random() * 0.20);
            } else {
                // Overall baixo: usar sistema antigo melhorado
                const variance = (overall - 40) * 0.8;
                const randomFactor = (Math.random() - 0.5) * 8;
                targetStat = baseStat + variance + randomFactor;
            }

            stats[stat] = Math.floor(targetStat);
            stats[stat] = Math.max(15, Math.min(99, stats[stat])); // Limitar entre 15 e 99
        }
    }

    return stats;
};

const getPositionRandomly = () => {
    const positions = ['GK', 'VL', 'PV'];
    return positions[Math.floor(Math.random() * positions.length)];
};

module.exports = {
    generateStats,
    getPositionRandomly
};
