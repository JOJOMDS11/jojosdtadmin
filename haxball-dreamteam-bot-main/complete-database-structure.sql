-- SCRIPT PARA COMPLETAR A ESTRUTURA DO JOJODREAMTEAM DATABASE
-- Este script adiciona todas as tabelas necessárias que estão faltando

USE jojodreamteam;

-- 1. TABELA DE TORNEIOS
CREATE TABLE IF NOT EXISTS tournaments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    max_teams INT DEFAULT 16,
    entry_fee INT DEFAULT 0,
    prize_pool INT DEFAULT 0,
    status ENUM('open', 'ongoing', 'finished', 'cancelled') DEFAULT 'open',
    start_date DATETIME,
    end_date DATETIME,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. TABELA DE PARTICIPAÇÃO EM TORNEIOS
CREATE TABLE IF NOT EXISTS tournament_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tournament_id INT,
    team_id INT,
    discord_id VARCHAR(255),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- 3. TABELA DE PARTIDAS
CREATE TABLE IF NOT EXISTS matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tournament_id INT,
    team1_id INT,
    team2_id INT,
    team1_score INT DEFAULT 0,
    team2_score INT DEFAULT 0,
    winner_id INT,
    status ENUM('scheduled', 'ongoing', 'finished', 'cancelled') DEFAULT 'scheduled',
    round_number INT DEFAULT 1,
    match_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (team1_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (team2_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (winner_id) REFERENCES teams(id) ON DELETE SET NULL
);

-- 4. TABELA DE HISTÓRICO DE PACOTES
CREATE TABLE IF NOT EXISTS pack_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    discord_id VARCHAR(255) NOT NULL,
    pack_type VARCHAR(50) NOT NULL,
    cost INT NOT NULL,
    cards_obtained JSON,
    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABELA DE ESTATÍSTICAS DE USUÁRIOS
CREATE TABLE IF NOT EXISTS user_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    discord_id VARCHAR(255) UNIQUE NOT NULL,
    total_cards INT DEFAULT 0,
    total_packs_opened INT DEFAULT 0,
    total_purple_coins_spent INT DEFAULT 0,
    total_purple_coins_earned INT DEFAULT 0,
    favorite_position VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 6. TABELA DE LOGS DE ATIVIDADES
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    discord_id VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. TABELA DE CONFIGURAÇÕES DO SISTEMA
CREATE TABLE IF NOT EXISTS system_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 8. INSERIR CONFIGURAÇÕES PADRÃO
INSERT IGNORE INTO system_config (config_key, config_value, description) VALUES
('pack_cooldown_minutes', '60', 'Tempo de cooldown entre pacotes em minutos'),
('daily_bonus_coins', '50', 'Moedas roxas de bônus diário'),
('pack_base_cost', '100', 'Custo base de um pacote'),
('max_cards_per_pack', '3', 'Máximo de cartas por pacote'),
('tournament_entry_fee', '200', 'Taxa de entrada padrão para torneios'),
('card_sell_multiplier', '0.5', 'Multiplicador para venda de cartas');

-- 9. VERIFICAR SE EXISTEM COLUNAS NECESSÁRIAS
-- Adicionar coluna de avatar em player_templates se não existir
ALTER TABLE player_templates 
ADD COLUMN IF NOT EXISTS avatar VARCHAR(10) DEFAULT '⚽';

-- Adicionar coluna de template_avatar em user_cards se não existir  
ALTER TABLE user_cards 
ADD COLUMN IF NOT EXISTS template_avatar VARCHAR(10);

-- Adicionar colunas de stats individuais se não existirem
ALTER TABLE user_cards 
ADD COLUMN IF NOT EXISTS posicionamento INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS saidaDeBola INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS defesa INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS drible INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS passe INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS finalizacao INT DEFAULT 0;

-- 10. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_user_cards_discord_id ON user_cards(discord_id);
CREATE INDEX IF NOT EXISTS idx_user_cards_rarity ON user_cards(rarity);
CREATE INDEX IF NOT EXISTS idx_user_cards_position ON user_cards(position);
CREATE INDEX IF NOT EXISTS idx_teams_discord_id ON teams(discord_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);

-- 11. CRIAR TRIGGERS PARA MANTER ESTATÍSTICAS ATUALIZADAS
DELIMITER //

CREATE TRIGGER IF NOT EXISTS update_user_stats_on_card_insert
AFTER INSERT ON user_cards
FOR EACH ROW
BEGIN
    INSERT INTO user_stats (discord_id, total_cards) 
    VALUES (NEW.discord_id, 1)
    ON DUPLICATE KEY UPDATE 
    total_cards = total_cards + 1;
END//

CREATE TRIGGER IF NOT EXISTS update_user_stats_on_card_delete
AFTER DELETE ON user_cards
FOR EACH ROW
BEGIN
    UPDATE user_stats 
    SET total_cards = total_cards - 1
    WHERE discord_id = OLD.discord_id;
END//

DELIMITER ;

-- 12. VERIFICAÇÃO FINAL
SELECT 'Estrutura da database jojodreamteam completada!' as status;
SHOW TABLES;
