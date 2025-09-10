# 🏆 Haxball DreamTeam Bot

Bot Discord para sistema de cartas estilo FIFA Ultimate Team, mas para Haxball!

## ⚽ **Funcionalidades**

- 🎲 **Obter cartas** com cooldown de 20 minutos
- 🎨 **Jogadores customizados** com avatares do Haxball
- 🔄 **Sistema de troca** (3 cartas → 1 carta superior)
- ⚔️ **Desafios entre jogadores** com simulação realista
- 💰 **Purple Coins** como recompensa
- 🏅 **Sistema de times** e formações

## 🎮 **Comandos Principais**

```bash
/obter                           # Obter carta aleatória (20min cooldown) - PÚBLICO
/pacote                          # Obter 3 cartas aleatórias (2h cooldown) - PÚBLICO
/criarjogador Pelé PV #FFD700   # Criar jogador customizado (Admin Only)
/trocarjogadores carta1 carta2 carta3  # Trocar 3 cartas por 1 superior
/elenco                         # Ver suas cartas
/desafiar @user                 # Desafiar outro jogador
/aceitar [id]                   # Aceitar desafio
/recusar [id]                   # Recusar desafio
/registrartime Nome_Time        # Criar time
/vender [carta_id]              # Vender carta por purple coins
```

## 🎁 **Sistema de Pacotes**

- **📦 Pacotes**: 3 cartas aleatórias de uma vez
- **⏰ Cooldown**: 2 horas (mais longo que carta individual)
- **🎯 Exibição**: Carta principal (maior overall) em destaque + 2 cartas menores
- **🌟 Público**: Todos veem quando alguém abre um pacote
- **💰 Recompensa**: 15 Purple Coins (3x mais que carta individual)

## 🏆 **Sistema de Raridades**

- **Bagre** (0-69): 65% de chance - Cinza
- **Médio** (70-79): 25% de chance - Azul  
- **GOAT** (80-89): 8% de chance - Dourado
- **Prime** (90-100): 2% de chance - Roxo

## ⚽ **Posições e Stats**

**🥅 GK (Goleiro):** Posicionamento, Saída de Bola, Defesa, Drible
**🛡️ VL (Volante):** Defesa, Passe, Finalização, Drible  
**⚽ PV (Ponta):** Finalização, Posicionamento, Drible, Passe

## 🎨 **Sistema de Cartas**

Cartas são geradas com bolinha do Haxball personalizada:
- Avatar colorido dentro da bolinha
- Stats baseados na posição
- Raridade determina o overall
- Design único por jogador

## 📢 **Exibição Pública**

- **🎴 /obter**: Todos veem quando alguém obtém uma carta
- **📦 /pacote**: Mostra carta principal + 2 cartas menores
- **🔥 Reações**: Mensagens especiais para raridades altas
- **📊 Detalhes**: Stats, overall e informações completas
- **⏰ Cooldowns**: Exibe tempo restante para próxima carta/pacote

## 🚀 **Tecnologias**

- **Discord.js** - Bot Discord
- **PostgreSQL** - Database (AWS RDS)
- **Canvas** - Geração de imagens
- **Render.com** - Deploy
- **GitHub** - Versionamento

## 📊 **Database**

Estrutura PostgreSQL com 4 tabelas principais:
- `players` - Dados dos jogadores Discord
- `cards` - Cartas obtidas
- `custom_templates` - Templates de jogadores customizados  
- `teams` - Times dos jogadores

## ⚙️ **Setup Local**

```bash
# Instalar dependências
npm install

# Configurar .env
cp .env.example .env
# Editar .env com seus tokens

# Rodar localmente
npm start
```

## 🔧 **Environment Variables**

```env
DISCORD_TOKEN=your_discord_bot_token
DATABASE_URI=postgresql://user:pass@endpoint:5432/database
NODE_ENV=production
PORT=3000
```

---

Desenvolvido para a comunidade Haxball 🏆

## Project Structure

```
haxball-dreamteam-bot
├── src
│   ├── bot.js
│   ├── commands
│   │   ├── obter.js
│   │   ├── registrartime.js
│   │   ├── elenco.js
│   │   ├── vender.js
│   │   └── desafiar.js
│   ├── database
│   │   ├── connection.js
│   │   └── models
│   │       ├── player.js
│   │       ├── card.js
│   │       └── team.js
│   ├── utils
│   │   ├── cardGenerator.js
│   │   ├── rarity.js
│   │   └── stats.js
│   └── config
│       └── settings.js
├── assets
│   └── images
│       └── players
├── package.json
└── README.md
```

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/haxball-dreamteam-bot.git
   ```
2. Navigate to the project directory:
   ```
   cd haxball-dreamteam-bot
   ```
3. Install the dependencies:
   ```
   npm install
   ```

## Usage

To start the bot, run:
```
node src/bot.js
```

## Contributing

Feel free to submit issues or pull requests if you have suggestions or improvements for the bot!

## License

This project is licensed under the MIT License. See the LICENSE file for more details.