// Sistema de cooldowns em memória
const cooldowns = new Map();

/**
 * Verifica se o usuário pode usar um comando
 * @param {string} userId - ID do usuário
 * @param {string} commandType - Tipo do comando ('card', 'pack', 'challenge')
 * @param {number} cooldownTime - Tempo de cooldown em millisegundos
 * @returns {Object} { canUse: boolean, timeLeft: number }
 */
function checkCooldown(userId, commandType, cooldownTime) {
    const key = `${userId}_${commandType}`;
    const lastUsed = cooldowns.get(key);
    
    if (!lastUsed) {
        return { canUse: true, timeLeft: 0 };
    }
    
    const timeElapsed = Date.now() - lastUsed;
    const timeLeft = cooldownTime - timeElapsed;
    
    if (timeLeft <= 0) {
        return { canUse: true, timeLeft: 0 };
    }
    
    return { canUse: false, timeLeft };
}

/**
 * Define o cooldown para um usuário
 * @param {string} userId - ID do usuário
 * @param {string} commandType - Tipo do comando
 */
function setCooldown(userId, commandType) {
    const key = `${userId}_${commandType}`;
    cooldowns.set(key, Date.now());
}

/**
 * Remove o cooldown de um usuário (para testes ou admin)
 * @param {string} userId - ID do usuário
 * @param {string} commandType - Tipo do comando
 */
function removeCooldown(userId, commandType) {
    const key = `${userId}_${commandType}`;
    cooldowns.delete(key);
}

/**
 * Formata o tempo restante de cooldown
 * @param {number} timeLeft - Tempo em millisegundos
 * @returns {string} Tempo formatado
 */
function formatCooldownTime(timeLeft) {
    const totalMinutes = Math.ceil(timeLeft / (60 * 1000));
    
    if (totalMinutes < 60) {
        return `${totalMinutes} minuto${totalMinutes !== 1 ? 's' : ''}`;
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (minutes === 0) {
        return `${hours} hora${hours !== 1 ? 's' : ''}`;
    }
    
    return `${hours}h ${minutes}min`;
}

/**
 * Limpa cooldowns antigos (executar periodicamente)
 */
function cleanupOldCooldowns() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 horas
    
    for (const [key, timestamp] of cooldowns.entries()) {
        if (now - timestamp > maxAge) {
            cooldowns.delete(key);
        }
    }
}

// Limpar cooldowns antigos a cada hora
setInterval(cleanupOldCooldowns, 60 * 60 * 1000);

module.exports = {
    checkCooldown,
    setCooldown,
    removeCooldown,
    formatCooldownTime
};
