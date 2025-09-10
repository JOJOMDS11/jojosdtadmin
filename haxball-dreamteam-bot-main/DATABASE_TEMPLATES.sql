-- Tabela de templates de jogadores (criados pelos ADMs)
CREATE TABLE IF NOT EXISTS player_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    position ENUM('GK', 'VL', 'PV') NOT NULL,
    avatar VARCHAR(255), -- Avatar do Haxball (emoji ou código)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Atualizar tabela de cartas dos usuários para referenciar templates
-- Remover colunas antigas se existirem
ALTER TABLE user_cards 
DROP COLUMN IF EXISTS player_name,
DROP COLUMN IF EXISTS image_url;

-- Adicionar referência ao template
ALTER TABLE user_cards 
ADD COLUMN template_id INT,
ADD FOREIGN KEY (template_id) REFERENCES player_templates(id);

-- Inserir alguns jogadores exemplo da sala HaxBall
INSERT INTO player_templates (name, position, avatar) VALUES 
('Jojo', 'VL', '👑'),
('Messi', 'PV', '🐐'),
('Ronaldo', 'PV', '🦅'),
('Neuer', 'GK', '🧤'),
('Modric', 'VL', '🎯'),
('Pelé', 'PV', '⚽'),
('Maradona', 'PV', '💫'),
('Buffon', 'GK', '🛡️'),
('Xavi', 'VL', '🧠'),
('Ronaldinho', 'PV', '🪄');
