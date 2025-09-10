// Configuração para ambiente de produção
const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';

// Sistema de logs otimizado para Render
const Logger = {
    // Logs críticos sempre aparecem
    error: (message, ...args) => {
        console.error(`❌ [ERROR]`, message, ...args);
    },

    // Logs importantes apenas em desenvolvimento
    warn: (message, ...args) => {
        if (!isProduction) {
            console.warn(`⚠️ [WARN]`, message, ...args);
        }
    },

    // Logs informativos apenas em desenvolvimento
    info: (message, ...args) => {
        if (!isProduction) {
            console.log(`ℹ️ [INFO]`, message, ...args);
        }
    },

    // Logs de debug apenas em desenvolvimento
    debug: (message, ...args) => {
        if (!isProduction && process.env.DEBUG === 'true') {
            console.log(`🐛 [DEBUG]`, message, ...args);
        }
    },

    // Logs de sucesso otimizados
    success: (message, ...args) => {
        if (!isProduction) {
            console.log(`✅ [SUCCESS]`, message, ...args);
        }
    },

    // Logs de transações importantes (sempre aparecem mas resumidos)
    transaction: (message, ...args) => {
        if (isProduction) {
            // Em produção: log resumido
            console.log(`💰 ${message}`);
        } else {
            // Em desenvolvimento: log completo
            console.log(`💰 [TRANSACTION]`, message, ...args);
        }
    },

    // Logs de comandos (otimizados para produção)
    command: (user, command, result = 'success') => {
        if (isProduction) {
            // Em produção: apenas erros de comando
            if (result === 'error') {
                console.error(`🚫 ${user} - /${command} failed`);
            }
        } else {
            // Em desenvolvimento: todos os comandos
            console.log(`🎮 [COMMAND] ${user} used /${command} - ${result}`);
        }
    }
};

module.exports = Logger;
