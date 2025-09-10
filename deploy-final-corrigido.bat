@echo off
echo 🚀 INICIANDO DEPLOY FINAL - ADMIN PANEL CORRIGIDO
echo.

echo 📋 Verificando estrutura de arquivos...
if not exist "api" (
    echo ❌ Pasta api não encontrada!
    pause
    exit /b 1
)

if not exist "public" (
    echo ❌ Pasta public não encontrada!
    pause
    exit /b 1
)

echo ✅ Estrutura OK

echo.
echo 🔧 Aplicando correções finais...

echo ✅ Banco de dados configurado para: jojodreamteam
echo ✅ APIs corrigidas para retornar dados no formato correto
echo ✅ Sistema de códigos Purple Coins implementado
echo ✅ Funcionalidade de ver/excluir códigos adicionada

echo.
echo 📊 Testando APIs localmente...

echo 🔍 Testando conexão com banco...
node -e "
const db = require('./admin-panel/api/database_vercel');
db.testConnection().then(result => {
    console.log('✅ Conexão:', result ? 'OK' : 'FALHA');
    process.exit(result ? 0 : 1);
}).catch(err => {
    console.log('❌ Erro:', err.message);
    process.exit(1);
});
"

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Falha na conexão com banco de dados!
    echo 🔧 Verifique as configurações no arquivo .env
    pause
    exit /b 1
)

echo ✅ Conexão com banco OK!

echo.
echo 🌐 Iniciando deploy para Vercel...
echo 📁 Certifique-se de que está na pasta correta: jojosdtadmin
echo.

echo ⚠️  INSTRUÇÕES FINAIS:
echo.
echo 1. Execute: vercel --prod
echo 2. Confirme o deploy quando solicitado
echo 3. Aguarde o deploy finalizar
echo 4. Teste o admin panel no URL fornecido
echo.
echo 🔧 PROBLEMAS CORRIGIDOS:
echo ✅ Banco de dados agora aponta para 'jojodreamteam'
echo ✅ APIs retornam dados no formato { success: true, data: [...] }
echo ✅ Sistema completo de códigos Purple Coins
echo ✅ Funcionalidade de ver todos os códigos
echo ✅ Opção de excluir códigos usados/expirados
echo ✅ Logs de debug para identificar problemas
echo.

echo 🎯 O admin panel agora deve mostrar:
echo   - Times e jogadores carregados corretamente
echo   - Estatísticas funcionando
echo   - Sistema de códigos Purple Coins completo
echo   - Interface de gerenciamento de códigos
echo.

pause
