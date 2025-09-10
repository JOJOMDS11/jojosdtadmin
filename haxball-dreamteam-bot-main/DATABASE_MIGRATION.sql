-- Script para migrar do sistema antigo para o sistema de templates
-- Execute este script no seu banco MySQL

-- 1. Criar tabela de templates de jogadores
CREATE TABLE IF NOT EXISTS player_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    position ENUM('GK', 'VL', 'PV') NOT NULL,
    avatar VARCHAR(10) DEFAULT '⚽',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Alterar tabela user_cards para usar templates
ALTER TABLE user_cards 
ADD COLUMN template_id INT,
ADD COLUMN rarity ENUM('Prime', 'GOAT', 'Médio', 'Bagre') NOT NULL DEFAULT 'Bagre',
ADD COLUMN overall INT NOT NULL DEFAULT 50,
ADD COLUMN price DECIMAL(10,2) DEFAULT 0,
ADD FOREIGN KEY (template_id) REFERENCES player_templates(id);

-- 3. Remover colunas antigas da tabela user_cards (opcional - execute apenas se tiver certeza)
-- ALTER TABLE user_cards 
-- DROP COLUMN player_name,
-- DROP COLUMN position,
-- DROP COLUMN image_url;

-- 4. Inserir templates iniciais do HaxBall (VAZIO - ADM deve criar)
-- Os ADMs devem usar /criarjogador para criar templates do seu servidor
-- Exemplo: /criarjogador nome:João posicao:GK avatar:🥅
-- INSERT INTO player_templates (name, position, avatar) VALUES
-- ('Exemplo', 'GK', '�');

-- Tabela player_templates estará vazia inicialmente
-- ADMs devem popular usando o comando /criarjogador

-- 5. Atualizar tabela user_cards existentes (se houver dados)
-- ATENÇÃO: Este comando irá limpar as cartas existentes e adicionar algumas de exemplo
-- Remova o comentário apenas se quiser fazer isso
-- DELETE FROM user_cards;

-- 6. Criar índices para performance
CREATE INDEX idx_user_cards_discord_id ON user_cards(discord_id);
CREATE INDEX idx_user_cards_rarity ON user_cards(rarity);
CREATE INDEX idx_user_cards_template_id ON user_cards(template_id);
CREATE INDEX idx_player_templates_position ON player_templates(position);

-- 7. Verificar se as tabelas foram criadas corretamente
SELECT 'Templates criados:' as status, COUNT(*) as total FROM player_templates;
SELECT 'Estrutura user_cards atualizada' as status;

-- Script finalizado com sucesso!
-- Agora o sistema está pronto para usar templates de jogadores do HaxBall!
