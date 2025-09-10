# Sistema de Cartas Haxball DreamTeam

## 🏆 Novo Sistema de Jogadores Customizados

Agora você pode criar seus próprios jogadores com **3 opções**:

### 📝 **Criação de Jogador**
```javascript
// Exemplo de uso:
{
    name: "Pelé",           // Nome do jogador
    position: "PV",         // GK, VL ou PV  
    avatar: "#FFD700",      // Cor do avatar (hex) ou emoji
    rarity: "Prime"         // Opcional: Bagre, Médio, GOAT, Prime
}
```

### ⚽ **Design das Cartas**
- **Bolinha do Haxball** no centro da carta
- **Avatar colorido** dentro da bolinha
- **Nome, posição e stats** sobrepostos na carta
- **Cores por raridade** no background

## 🎨 **Opções de Avatar**
- **Cores Hex**: `#FF0000` (vermelho), `#00FF00` (verde), etc.
- **Emojis**: `🔥`, `⚡`, `🌟`, etc.
- **Cores nomeadas**: `red`, `blue`, `gold`, etc.

## 🚫 **Mudanças Recentes**
- ❌ **Removido**: Pênaltis das partidas
- ✅ **Adicionado**: Sistema de jogadores customizados
- ✅ **Adicionado**: Bolinha do Haxball como imagem base
- ✅ **Melhorado**: Assistências em mais tipos de gols

## 📊 **Exemplo de Carta Customizada**
```
┌─────────────────────┐
│ PV          OVR: 89 │
│                     │
│      ⚪ Bolinha     │
│     🔥 Avatar       │
│      do Haxball     │
│                     │
│       Pelé         │
│       PRIME         │
│                     │
│ Finalização: 94     │
│ Posicionamento: 87  │
│ Drible: 91          │
│ Passe: 83           │
└─────────────────────┘
```

## � **Comandos Disponíveis**
- `/criarjogador` - Criar jogador customizado
- `/obter` - Obter carta aleatória (cooldown 20min)
- `/desafiar @user` - Desafiar outro jogador
- `/aceitar [id]` - Aceitar desafio
- `/recusar [id]` - Recusar desafio

## 📁 **Estrutura de Pastas**
```
assets/
└── images/
    └── players/
        ├── card_[id].png (cartas aleatórias)
        └── custom_[id].png (cartas customizadas)
```

## 🚀 **Próximos Passos**
1. ✅ Sistema de cartas com bolinhas do Haxball
2. ✅ Jogadores customizados implementados
3. ✅ Assistências nas partidas  
4. 🛠️ Instalar dependências: `npm install`
5. 🗄️ Configurar MongoDB
6. 🤖 Configurar bot Discord
