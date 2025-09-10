const GOAL_TYPES = [
    "cortada",
    "chute de fora da área",
    "finalização na pequena área",
    "chute colocado",
    "rebote",
    "contra"
];

const GOAL_PHRASES = {
    cortada: ["fez um gol de cortada!", "FEZ UM GOL DE MIGUEEEEL!"],
    "chute de fora da área": ["mandou uma bomba de fora da área!", "QUE GOLAÇO!"],
    "finalização na pequena área": ["finalizou na pequena área!", "FEZ UM GOL DE MIGUEEEEL!"],
    "chute colocado": ["colocou no cantinho!", "QUE CATEGORIA!"],
    rebote: ["aproveitou o rebote e marcou!", "OPORTUNISTA!"],
    contra: ["fez gol contra!", "KIMIKAAADA!, HETERIO É VOCE???????!, PARECEU O BOOM!"]
};

const ASSIST_PHRASES = [
    "deu uma assistência perfeita!",
    "fez um passe açucarado!",
    "cruzou na medida!",
    "deixou de bandeja!",
    "deu um passe genial!",
    "fez a jogada da partida!",
    "tocou com categoria!",
    "deu um passe de letra!"
];

const MISS_PHRASES = [
    "MEU DEUS! Perdeu um gol sem goleiro!",
    "QUE PERDIDA INCRÍVEL!",
    "Chutou para fora com o gol vazio!",
    "Desperdiçou uma chance de ouro!",
    "Isolou a bola! Que desperdício!",
    "Mandou por cima do gol!",
    "Perdeu na cara do goleiro!",
    "Chutou nas mãos do goleiro!"
];

const SAVE_PHRASES = [
    "GRANDE DEFESA DO GOLEIRO!",
    "QUE PEGADA SENSACIONAL!",
    "Goleiro salvou o time!",
    "Defesa milagrosa!",
    "O goleiro disse NÃO!",
    "Pegada de gato!",
    "Salvou com a ponta dos dedos!",
    "Voou para fazer a defesa!"
];

const calculateTeamOverall = (cards) => {
    if (!cards || Object.keys(cards).length === 0) {
        return 50; // Overall padrão se não houver cartas
    }
    
    const totalOverall = Object.values(cards).reduce((sum, card) => sum + card.overall_rating, 0);
    return Math.floor(totalOverall / Object.keys(cards).length);
};

const getRandomPlayer = (cards) => {
    if (!cards || Object.keys(cards).length === 0) {
        return { player_name: "Jogador Genérico", position: "PV", avatar: "⚽" };
    }
    const cardArray = Object.values(cards);
    return cardArray[Math.floor(Math.random() * cardArray.length)];
};

const calculateGoalProbability = (attackingCards, defendingCards, minute) => {
    const attackOverall = calculateTeamOverall(attackingCards);
    const defenseOverall = calculateTeamOverall(defendingCards);
    
    // Probabilidade base de gol por minuto (ajustada para 6 minutos)
    let baseProbability = 0.06; // 6% por minuto para 6 minutos
    
    // Ajuste baseado na diferença de overall
    const overallDifference = attackOverall - defenseOverall;
    baseProbability += overallDifference * 0.001; // 0.1% por ponto de diferença
    
    // Aumentar probabilidade nos últimos 60 segundos
    if (minute > 5) {
        baseProbability *= 1.5;
    }
    
    return Math.max(0.02, Math.min(0.18, baseProbability));
};

const simulateMatch = (team1Cards, team2Cards, team1Name, team2Name) => {
    const matchEvents = [];
    let score1 = 0;
    let score2 = 0;
    let overtime = false;
    
    // Simular 6 minutos (360 segundos) em intervalos de 10 segundos
    // Máximo 6 minutos + prorrogação se empate
    let maxTime = 360; // 6 minutos
    
    for (let second = 0; second < maxTime; second += 10) {
        const minute = Math.floor(second / 60);
        const displayTime = Math.floor(second);
        
        // Se chegou aos 6 minutos e está empatado, adicionar prorrogação
        if (second >= 360 && score1 === score2 && !overtime) {
            overtime = true;
            maxTime = 480; // 8 minutos total (2 minutos de prorrogação)
            matchEvents.push(`⏰ Prorrogação! Partida empatada em ${score1}x${score2}`);
        }
        
        // Parar se alguém já fez muitos gols (máximo realista)
        if (score1 >= 10 || score2 >= 10) {
            break;
        }
        
        // Verificar se algum time marca gol
        const team1Probability = calculateGoalProbability(team1Cards, team2Cards, minute);
        const team2Probability = calculateGoalProbability(team2Cards, team1Cards, minute);
        
        // Chance de eventos extras (defesas, gols perdidos)
        const extraEventChance = 0.08; // 8% por intervalo
        
        if (Math.random() < team1Probability) {
            const scorer = getRandomPlayer(team1Cards);
            const goalType = GOAL_TYPES[Math.floor(Math.random() * GOAL_TYPES.length)];
            const isOwnGoal = goalType === "contra";
            
            // 50% de chance de ter assistência (exceto gol contra e rebote)
            const hasAssist = !["contra", "rebote"].includes(goalType) && Math.random() < 0.5;
            let eventText = "";
            
            const goalPhrases = GOAL_PHRASES[goalType];
            const action = goalPhrases[0];
            const celebration = goalPhrases[1];
            
            if (isOwnGoal) {
                score2++;
                eventText = `⚽ ${scorer.player_name} ${scorer.avatar || 'P'} (${team1Name}) ${action}: ${celebration}`;
                matchEvents.push(`${displayTime}" ${eventText}`);
            } else {
                score1++;
                if (hasAssist) {
                    const assister = getRandomPlayer(team1Cards);
                    const assistPhrase = ASSIST_PHRASES[Math.floor(Math.random() * ASSIST_PHRASES.length)];
                    eventText = `⚽ ${scorer.player_name} ${scorer.avatar || 'P'} (${team1Name}) ${action}: ${celebration}`;
                    matchEvents.push(`${displayTime}" ${eventText}`);
                    matchEvents.push(`🅰️ ${assister.player_name} ${assister.avatar || 'P'} ${assistPhrase}`);
                } else {
                    eventText = `⚽ ${scorer.player_name} ${scorer.avatar || 'P'} (${team1Name}) ${action}: ${celebration}`;
                    matchEvents.push(`${displayTime}" ${eventText}`);
                }
            }
        } else if (Math.random() < extraEventChance) {
            // Eventos extras: defesas ou gols perdidos
            const eventType = Math.random();
            const player = getRandomPlayer(team1Cards);
            const goalkeeper = getRandomPlayer(team2Cards); // pode ser qualquer jogador, não necessariamente GK
            
            if (eventType < 0.4) { // 40% chance de defesa
                const savePhrase = SAVE_PHRASES[Math.floor(Math.random() * SAVE_PHRASES.length)];
                matchEvents.push(`${displayTime}" 🧤 ${savePhrase} ${goalkeeper.player_name} ${goalkeeper.avatar || 'P'} (${team2Name}) defendeu chute de ${player.player_name}!`);
            } else if (eventType < 0.7) { // 30% chance de gol perdido
                const missPhrase = MISS_PHRASES[Math.floor(Math.random() * MISS_PHRASES.length)];
                matchEvents.push(`${displayTime}" 😱 ${missPhrase} ${player.player_name} ${player.avatar || 'P'} (${team1Name}) desperdiçou uma chance incrível!`);
            }
        }
        
        if (Math.random() < team2Probability) {
            const scorer = getRandomPlayer(team2Cards);
            const goalType = GOAL_TYPES[Math.floor(Math.random() * GOAL_TYPES.length)];
            const isOwnGoal = goalType === "contra";
            
            // 50% de chance de ter assistência (exceto gol contra e rebote)
            const hasAssist = !["contra", "rebote"].includes(goalType) && Math.random() < 0.5;
            let eventText = "";
            
            const goalPhrases = GOAL_PHRASES[goalType];
            const action = goalPhrases[0];
            const celebration = goalPhrases[1];
            
            if (isOwnGoal) {
                score1++;
                eventText = `⚽ ${scorer.player_name} ${scorer.avatar || 'P'} (${team2Name}) ${action}: ${celebration}`;
                matchEvents.push(`${displayTime}" ${eventText}`);
            } else {
                score2++;
                if (hasAssist) {
                    const assister = getRandomPlayer(team2Cards);
                    const assistPhrase = ASSIST_PHRASES[Math.floor(Math.random() * ASSIST_PHRASES.length)];
                    eventText = `⚽ ${scorer.player_name} ${scorer.avatar || 'P'} (${team2Name}) ${action}: ${celebration}`;
                    matchEvents.push(`${displayTime}" ${eventText}`);
                    matchEvents.push(`🅰️ ${assister.player_name} ${assister.avatar || 'P'} ${assistPhrase}`);
                } else {
                    eventText = `⚽ ${scorer.player_name} ${scorer.avatar || 'P'} (${team2Name}) ${action}: ${celebration}`;
                    matchEvents.push(`${displayTime}" ${eventText}`);
                }
            }
        } else if (Math.random() < extraEventChance) {
            // Eventos extras para o time 2
            const eventType = Math.random();
            const player = getRandomPlayer(team2Cards);
            const goalkeeper = getRandomPlayer(team1Cards);
            
            if (eventType < 0.4) { // 40% chance de defesa
                const savePhrase = SAVE_PHRASES[Math.floor(Math.random() * SAVE_PHRASES.length)];
                matchEvents.push(`${Math.floor(minute * 60)}" 🧤 ${savePhrase} ${goalkeeper.player_name} ${goalkeeper.avatar || 'P'} (${team1Name}) defendeu chute de ${player.player_name}!`);
            } else if (eventType < 0.7) { // 30% chance de gol perdido
                const missPhrase = MISS_PHRASES[Math.floor(Math.random() * MISS_PHRASES.length)];
                matchEvents.push(`${Math.floor(minute * 60)}" 😱 ${missPhrase} ${player.player_name} ${player.avatar || 'P'} (${team2Name}) desperdiçou uma chance incrível!`);
            }
        }
    }
    
    // Se empate, vai para OVERTIME até ter gol de ouro
    if (score1 === score2) {
        overtime = true;
        matchEvents.push("360\" ⏱️ PARTIDA EMPATADA! VAI PARA OVERTIME - GOL DE OURO!");
        
        // Overtime: primeiro a marcar ganha (sem limite de tempo, mas máximo 10 minutos extras para evitar loop infinito)
        let extraSecond = 0;
        while (score1 === score2 && extraSecond < 600) { // Máximo 10 minutos extras
            const extraMinute = 6 + (extraSecond / 60);
            
            const team1ExtraProbability = calculateGoalProbability(team1Cards, team2Cards, extraMinute) * 2.0; // Mais chance no overtime
            const team2ExtraProbability = calculateGoalProbability(team2Cards, team1Cards, extraMinute) * 2.0;
            
            if (Math.random() < team1ExtraProbability) {
                score1++;
                const scorer = getRandomPlayer(team1Cards);
                const goalType = GOAL_TYPES[Math.floor(Math.random() * (GOAL_TYPES.length - 1))]; // Não pode ser gol contra no overtime
                matchEvents.push(`${360 + extraSecond}" ⚡ GOL DE OURO! ${scorer.player_name} ${scorer.avatar || 'P'} (${team1Name}) ${GOAL_PHRASES[goalType]} VITÓRIA!`);
                break;
            }
            
            if (Math.random() < team2ExtraProbability) {
                score2++;
                const scorer = getRandomPlayer(team2Cards);
                const goalType = GOAL_TYPES[Math.floor(Math.random() * (GOAL_TYPES.length - 1))]; // Não pode ser gol contra no overtime
                matchEvents.push(`${360 + extraSecond}" ⚡ GOL DE OURO! ${scorer.player_name} ${scorer.avatar || 'P'} (${team2Name}) ${GOAL_PHRASES[goalType]} VITÓRIA!`);
                break;
            }
            
            extraSecond += 5;
        }
        
        // Se ainda estiver empatado após 10 minutos de overtime (muito raro), forçar um gol
        if (score1 === score2) {
            const winningTeam = Math.random() < 0.5 ? 1 : 2;
            const scorer = getRandomPlayer(winningTeam === 1 ? team1Cards : team2Cards);
            const goalType = GOAL_TYPES[Math.floor(Math.random() * (GOAL_TYPES.length - 1))];
            
            if (winningTeam === 1) {
                score1++;
                matchEvents.push(`${360 + extraSecond}" 🔥 MILAGRE! ${scorer.player_name} ${scorer.avatar || 'P'} (${team1Name}) ${GOAL_PHRASES[goalType]} NO ÚLTIMO SEGUNDO!`);
            } else {
                score2++;
                matchEvents.push(`${360 + extraSecond}" 🔥 MILAGRE! ${scorer.player_name} ${scorer.avatar || 'P'} (${team2Name}) ${GOAL_PHRASES[goalType]} NO ÚLTIMO SEGUNDO!`);
            }
        }
    }
    
    // Determinar vencedor
    let winner = 'draw';
    if (score1 > score2) {
        winner = 'team1';
    } else if (score2 > score1) {
        winner = 'team2';
    }
    
    return {
        score: {
            team1: score1,
            team2: score2
        },
        winner: winner,
        events: matchEvents,
        overtime: overtime,
        duration: overtime ? "6:00 + Overtime" : "6:00"
    };
};

module.exports = {
    simulateMatch,
    calculateTeamOverall
};
