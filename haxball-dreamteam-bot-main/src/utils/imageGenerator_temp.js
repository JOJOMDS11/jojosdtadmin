// Temporariamente desabilitado - Canvas removido para facilitar instalação
// Arquivo simplificado para não usar Canvas por enquanto

// Função mock para gerar carta (retorna null por enquanto)
const generateCardImage = async (cardData) => {
    console.log('⚠️  Geração de imagem desabilitada - Canvas não instalado');
    console.log('📄 Dados da carta:', cardData);
    return null;
};

// Função mock para salvar carta
const saveCardImage = async (cardData, outputPath) => {
    console.log('⚠️  Salvamento de imagem desabilitado - Canvas não instalado');
    return null;
};

module.exports = {
    generateCardImage,
    saveCardImage
};
