// Conversão de códigos de emoji para emojis reais
const avatarMap = {
    // Emojis de pessoa/cara
    '1F600': '😀', // grinning face
    '1F601': '😁', // beaming face with smiling eyes
    '1F602': '😂', // face with tears of joy
    '1F603': '😃', // grinning face with big eyes
    '1F604': '😄', // grinning face with smiling eyes
    '1F605': '😅', // grinning face with sweat
    '1F606': '😆', // grinning squinting face
    '1F607': '😇', // smiling face with halo
    '1F608': '😈', // smiling face with horns
    '1F609': '😉', // winking face
    '1F60A': '😊', // smiling face with smiling eyes
    '1F60B': '😋', // face savoring food
    '1F60C': '😌', // relieved face
    '1F60D': '😍', // smiling face with heart-eyes
    '1F60E': '😎', // smiling face with sunglasses
    '1F60F': '😏', // smirking face
    '1F610': '😐', // neutral face
    '1F611': '😑', // expressionless face
    '1F612': '😒', // unamused face
    '1F613': '😓', // downcast face with sweat
    '1F614': '😔', // pensive face
    '1F615': '😕', // confused face
    '1F616': '😖', // confounded face
    '1F617': '😗', // kissing face
    '1F618': '😘', // face blowing a kiss
    '1F619': '😙', // kissing face with smiling eyes
    '1F61A': '😚', // kissing face with closed eyes
    '1F61B': '😛', // face with tongue
    '1F61C': '😜', // winking face with tongue
    '1F61D': '😝', // squinting face with tongue
    '1F61E': '😞', // disappointed face
    '1F61F': '😟', // worried face
    '1F620': '😠', // angry face
    '1F621': '😡', // pouting face
    '1F622': '😢', // crying face
    '1F623': '😣', // persevering face
    '1F624': '😤', // face with steam from nose
    '1F625': '😥', // sad but relieved face
    '1F626': '😦', // frowning face with open mouth
    '1F627': '😧', // anguished face
    '1F628': '😨', // fearful face
    '1F629': '😩', // weary face
    '1F62A': '😪', // sleepy face
    '1F62B': '😫', // tired face
    '1F62C': '😬', // grimacing face
    '1F62D': '😭', // loudly crying face
    '1F62E': '😮', // face with open mouth
    '1F62F': '😯', // hushed face
    '1F630': '😰', // anxious face with sweat
    '1F631': '😱', // face screaming in fear
    '1F632': '😲', // astonished face
    '1F633': '😳', // flushed face
    '1F634': '😴', // sleeping face
    '1F635': '😵', // dizzy face
    '1F636': '😶', // face without mouth
    '1F637': '😷', // face with medical mask
    '1F638': '😸', // grinning cat with smiling eyes
    '1F639': '😹', // cat with tears of joy
    '1F63A': '😺', // grinning cat
    '1F63B': '😻', // smiling cat with heart-eyes
    '1F63C': '😼', // cat with wry smile
    '1F63D': '😽', // kissing cat
    '1F63E': '😾', // pouting cat
    '1F63F': '😿', // crying cat
    '1F640': '🙀', // weary cat

    // Símbolos de futebol e esportes
    '26BD': '⚽', // soccer ball
    '1F3C6': '🏆', // trophy
    '1F945': '🥅', // goal net
    '1F451': '👑', // crown
    '2B50': '⭐', // star
    '1F525': '🔥', // fire
    '1F4A5': '💥', // collision
    '26A1': '⚡', // high voltage
    '1F4AF': '💯', // hundred points

    // Números e letras especiais 
    '1F17F': '🅿️', // P button (parking)
    '01F17F': '🅿️', // P button (parking - com zero à esquerda)
    '1F170': '🅰️', // A button (blood type)
    '1F171': '🅱️', // B button (blood type)
    '1F17E': '🅾️', // O button (blood type)
    '1F18E': '🆎', // AB button (blood type)

    // Animais
    '1F981': '🦁', // lion
    '1F42F': '🐯', // tiger
    '1F43A': '🐺', // wolf
    '1F98A': '🦊', // fox
    '1F436': '🐶', // dog
    '1F431': '🐱', // cat
    '1F98C': '🦌', // deer
    '1F985': '🦅', // eagle
    '1F54A': '🕊️', // dove

    // Objetos
    '1F4B0': '💰', // money bag
    '1F48E': '💎', // gem stone
    '1F3C5': '🏅', // sports medal
    '1F396': '🎖️', // military medal
    '1F3C0': '🏀', // basketball
    '1F3C8': '🏈', // american football
    '1F3BE': '🎾', // tennis
    '1F3D0': '🏐', // volleyball
    '1F3D1': '🏑', // field hockey
    '1F3D2': '🏒', // ice hockey
    '1F3D3': '🏓', // ping pong
    '1F3CF': '🏏', // cricket
    '1F3F8': '🏸', // badminton
    '1F94A': '🥊', // boxing glove
    '1F94B': '🥋', // martial arts uniform

    // Símbolos especiais
    '1F680': '🚀', // rocket
    '1F389': '🎉', // party popper
    '1F388': '🎈', // balloon
    '1F387': '🎇', // sparkler
    '1F386': '🎆', // fireworks
    '1F31F': '🌟', // glowing star
    '2728': '✨', // sparkles
    '1F4AB': '💫', // dizzy
    '1F4A8': '💨', // dashing away
    '1F4A6': '💦', // sweat droplets
    '1F4A7': '💧', // droplet
    '1F90F': '🤏', // pinching hand
    '01F90F': '🤏', // pinching hand (com zero à esquerda)

    // Fallback padrão
    'DEFAULT': '⚽'
};

/**
 * Converte código de emoji para emoji real
 * @param {string} avatarCode - Código do emoji (ex: "1F17F", "01F17F") ou texto
 * @returns {string} - Emoji real ou texto original
 */
function convertAvatarCode(avatarCode) {
    if (!avatarCode) return avatarMap.DEFAULT;

    // Avatars são sempre 1-2 caracteres (emojis ou letras simples)
    // Se for muito longo, é código hex
    if (avatarCode.length <= 2) {
        // É emoji direto ou letra(s) simples - mas transformar em maiúscula
        return avatarCode.toUpperCase();
    }

    // Se contém letras não-hex, é provavelmente texto que deve ser encurtado
    const hexPattern = /^[0-9A-Fa-f]+$/;
    if (!hexPattern.test(avatarCode)) {
        // Para "Esquece" vira "E", "GK_MASTER" vira "G", etc.
        return avatarCode.charAt(0).toUpperCase();
    }

    // Limpar o código (remover zeros à esquerda se houver)
    const cleanCode = avatarCode.toString().replace(/^0+/, '').toUpperCase();

    // Tentar encontrar o emoji correspondente
    const emoji = avatarMap[cleanCode];

    if (emoji) {
        return emoji;
    }

    // Se não encontrar, tentar converter como código Unicode
    try {
        const codePoint = parseInt(cleanCode, 16);
        if (codePoint && codePoint > 0) {
            return String.fromCodePoint(codePoint);
        }
    } catch (error) {
        console.warn(`Não foi possível converter avatar code: ${avatarCode}`);
    }

    // Se não conseguir converter, retornar primeira letra ou padrão
    return avatarCode ? avatarCode.charAt(0).toUpperCase() : avatarMap.DEFAULT;
}

/**
 * Converte emoji para código
 * @param {string} emoji - Emoji para converter
 * @returns {string} - Código hexadecimal
 */
function convertEmojiToCode(emoji) {
    if (!emoji) return '26BD'; // soccer ball code

    try {
        const codePoint = emoji.codePointAt(0);
        if (codePoint) {
            return codePoint.toString(16).toUpperCase();
        }
    } catch (error) {
        console.warn(`Não foi possível converter emoji para código: ${emoji}`);
    }

    return '26BD'; // soccer ball code as fallback
}

/**
 * Valida se um código de avatar é válido
 * @param {string} avatarCode - Código para validar
 * @returns {boolean} - Se é válido
 */
function isValidAvatarCode(avatarCode) {
    if (!avatarCode) return false;

    const cleanCode = avatarCode.toString().replace(/^0+/, '').toUpperCase();
    return avatarMap.hasOwnProperty(cleanCode);
}

/**
 * Lista todos os avatares disponíveis
 * @returns {Array} - Array com {code, emoji, description}
 */
function getAllAvailableAvatars() {
    return Object.entries(avatarMap)
        .filter(([code]) => code !== 'DEFAULT')
        .map(([code, emoji]) => ({
            code,
            emoji,
            description: getEmojiDescription(emoji)
        }));
}

/**
 * Obtém descrição do emoji (para referência)
 * @param {string} emoji - Emoji para descrever
 * @returns {string} - Descrição
 */
function getEmojiDescription(emoji) {
    const descriptions = {
        '😀': 'Cara Sorrindo',
        '😎': 'Cara de Óculos',
        '😈': 'Cara Diabólico',
        '👑': 'Coroa',
        '🔥': 'Fogo',
        '⚡': 'Raio',
        '⭐': 'Estrela',
        '💯': 'Cem por Cento',
        '🅿️': 'Letra P',
        '🦁': 'Leão',
        '🐯': 'Tigre',
        '🐺': 'Lobo',
        '⚽': 'Bola de Futebol',
        '🏆': 'Troféu',
        '🚀': 'Foguete',
        '💎': 'Diamante',
        '💰': 'Saco de Dinheiro'
    };

    return descriptions[emoji] || 'Emoji';
}

module.exports = {
    convertAvatarCode,
    convertEmojiToCode,
    isValidAvatarCode,
    getAllAvailableAvatars,
    getEmojiDescription,
    avatarMap
};
