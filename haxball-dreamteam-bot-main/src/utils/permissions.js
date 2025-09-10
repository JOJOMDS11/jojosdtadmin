require('dotenv').config();

// Lista de IDs de admins e moderadores
const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',') : [];
const MOD_IDS = process.env.MOD_IDS ? process.env.MOD_IDS.split(',') : [];

// Verificar se usuário é admin
const isAdmin = (userId) => {
    return ADMIN_IDS.includes(userId);
};

// Verificar se usuário é moderador
const isModerator = (userId) => {
    return MOD_IDS.includes(userId);
};

// Verificar se usuário tem permissão (admin ou mod)
const hasPermission = (userId) => {
    return isAdmin(userId) || isModerator(userId);
};

// Verificar se usuário tem permissão baseada no cargo do Discord
const hasDiscordRole = (member, requiredRoles = ['Admin', 'Moderator', 'Mod']) => {
    if (!member || !member.roles) return false;
    
    return member.roles.cache.some(role => 
        requiredRoles.some(reqRole => 
            role.name.toLowerCase().includes(reqRole.toLowerCase())
        )
    );
};

// Função principal de verificação de permissão
const checkPermission = (interaction) => {
    const userId = interaction.user.id;
    const member = interaction.member;
    
    // Verificar por ID específico
    if (hasPermission(userId)) {
        return { allowed: true, reason: 'Admin/Moderator ID' };
    }
    
    // Verificar por cargo no Discord
    if (hasDiscordRole(member)) {
        return { allowed: true, reason: 'Discord Role' };
    }
    
    // Verificar se é dono do servidor
    if (member && member.guild.ownerId === userId) {
        return { allowed: true, reason: 'Server Owner' };
    }
    
    return { 
        allowed: false, 
        reason: 'Você precisa ser Admin/Moderador para usar este comando.' 
    };
};

// Middleware para comandos que requerem permissão
const requirePermission = (commandFunction) => {
    return async (interaction) => {
        const permission = checkPermission(interaction);
        
        if (!permission.allowed) {
            return interaction.reply({
                content: `❌ **Acesso Negado**\n${permission.reason}`,
                ephemeral: true
            });
        }
        
        // Log da ação
        console.log(`🔐 Admin action by ${interaction.user.tag} (${interaction.user.id}): ${interaction.commandName}`);
        
        return commandFunction(interaction);
    };
};

// Lista de comandos que requerem permissão
const ADMIN_COMMANDS = [
    'criarjogador',
    'addjogador',
    'removerjogador',
    'editarjogador',
    'resetplayer',
    'givecards',
    'givecoins'
];

// Verificar se comando requer permissão
const isAdminCommand = (commandName) => {
    return ADMIN_COMMANDS.includes(commandName.toLowerCase());
};

module.exports = {
    isAdmin,
    isModerator,
    hasPermission,
    hasDiscordRole,
    checkPermission,
    requirePermission,
    isAdminCommand,
    ADMIN_COMMANDS
};
