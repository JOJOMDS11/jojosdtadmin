-- Adicionar tabelas para sistema de torneios

-- Tabela de torneios
CREATE TABLE IF NOT EXISTS tournaments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    date DATE NOT NULL,
    time TIME NOT NULL,
    format ENUM('Mata-mata', 'Pontos Corridos', 'Grupos + Mata-mata') NOT NULL DEFAULT 'Mata-mata',
    max_players INT NOT NULL,
    prize_1st VARCHAR(200) NOT NULL,
    prize_2nd VARCHAR(200) NOT NULL,
    prize_3rd VARCHAR(200) NOT NULL,
    status ENUM('open', 'closed', 'running', 'finished') NOT NULL DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de inscrições nos torneios
CREATE TABLE IF NOT EXISTS tournament_registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tournament_id INT NOT NULL,
    team_id INT NOT NULL,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    UNIQUE KEY unique_team_tournament (tournament_id, team_id)
);

-- Tabela de partidas dos torneios (opcional para futuro)
CREATE TABLE IF NOT EXISTS tournament_matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tournament_id INT NOT NULL,
    team1_id INT NOT NULL,
    team2_id INT NOT NULL,
    team1_score INT DEFAULT 0,
    team2_score INT DEFAULT 0,
    status ENUM('pending', 'playing', 'finished') DEFAULT 'pending',
    round_number INT NOT NULL,
    match_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (team1_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (team2_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- Índices para melhor performance
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournament_registrations_tournament ON tournament_registrations(tournament_id);
CREATE INDEX idx_tournament_registrations_team ON tournament_registrations(team_id);
CREATE INDEX idx_tournament_matches_tournament ON tournament_matches(tournament_id);

-- Inserir torneio de exemplo
INSERT INTO tournaments (name, date, time, format, max_players, prize_1st, prize_2nd, prize_3rd, status) 
VALUES ('Torneio de Inauguração', '2025-09-15', '20:00:00', 'Mata-mata', 16, '1000 Purple Coins', '500 Purple Coins', '250 Purple Coins', 'open');

SELECT 'Sistema de torneios criado com sucesso!' as status;
