-- Criação da tabela de avatares para emojis personalizados
CREATE TABLE IF NOT EXISTS avatars (
    id INT AUTO_INCREMENT PRIMARY KEY,
    emoji VARCHAR(16) NOT NULL,
    code VARCHAR(32) NOT NULL UNIQUE,
    description VARCHAR(64) DEFAULT NULL
);
-- Exemplo de uso:
-- INSERT INTO avatars (emoji, code, description) VALUES ('🅿️', '1F17F', 'Letra P');
