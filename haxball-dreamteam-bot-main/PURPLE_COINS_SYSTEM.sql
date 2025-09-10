-- Tabela para códigos de Purple Coins
CREATE TABLE IF NOT EXISTS purple_coin_codes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    purple_coins_value INT NOT NULL DEFAULT 100,
    used_by_discord_id VARCHAR(50) NULL,
    used_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NULL,
    created_by VARCHAR(50) DEFAULT 'ADMIN',
    description TEXT NULL,
    
    INDEX idx_code (code),
    INDEX idx_used (used_by_discord_id),
    INDEX idx_created (created_at),
    INDEX idx_expires (expires_at)
);

-- Tabela para histórico de transações Purple Coins
CREATE TABLE IF NOT EXISTS purple_coin_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    player_discord_id VARCHAR(50) NOT NULL,
    amount INT NOT NULL,
    transaction_type ENUM('CODIGO_RESGATADO', 'COMPRA_PACOTE', 'VENDA_CARTA', 'ADMIN_ADD', 'ADMIN_REMOVE') NOT NULL,
    description TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_player (player_discord_id),
    INDEX idx_type (transaction_type),
    INDEX idx_created (created_at),
    
    FOREIGN KEY (player_discord_id) REFERENCES players(discord_id) ON DELETE CASCADE
);

-- Tabela para histórico de conversões de emoji
CREATE TABLE IF NOT EXISTS emoji_codes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    emoji VARCHAR(10) NOT NULL,
    hex_code VARCHAR(50) NOT NULL,
    description VARCHAR(255) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_emoji (emoji),
    INDEX idx_hex (hex_code),
    INDEX idx_created (created_at)
);
