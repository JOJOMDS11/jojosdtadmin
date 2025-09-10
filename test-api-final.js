const https = require('https');

const baseUrl = 'https://jojosdtadmin-cpb96kjre-joao-pedros-projects-4a1cf1cf.vercel.app';

const makeRequest = (path, headers = {}) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'jojosdtadmin-cpb96kjre-joao-pedros-projects-4a1cf1cf.vercel.app',
            port: 443,
            path: path,
            method: 'GET',
            headers: {
                'Authorization': 'Bearer admin123',
                ...headers
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        data: JSON.parse(data)
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: data
                    });
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.end();
    });
};

async function testAPIs() {
    console.log('🔍 Testando APIs do JoJos Dream Team Admin...\n');

    // Test Stats
    try {
        console.log('📊 Testando /api/stats...');
        const stats = await makeRequest('/api/stats');
        console.log(`Status: ${stats.status}`);
        console.log('Dados:', stats.data);
        console.log('');
    } catch (e) {
        console.log('❌ Erro ao testar stats:', e.message);
    }

    // Test Templates
    try {
        console.log('⚙️ Testando /api/templates...');
        const templates = await makeRequest('/api/templates');
        console.log(`Status: ${templates.status}`);
        console.log('Templates encontrados:', templates.data?.length || 0);
        if (templates.data?.length > 0) {
            console.log('Primeiro template:', templates.data[0]);
        }
        console.log('');
    } catch (e) {
        console.log('❌ Erro ao testar templates:', e.message);
    }

    // Test Teams
    try {
        console.log('🏆 Testando /api/teams...');
        const teams = await makeRequest('/api/teams');
        console.log(`Status: ${teams.status}`);
        console.log('Times encontrados:', teams.data?.length || 0);
        if (teams.data?.length > 0) {
            console.log('Primeiro time:', teams.data[0]);
        }
        console.log('');
    } catch (e) {
        console.log('❌ Erro ao testar teams:', e.message);
    }

    // Test Codes
    try {
        console.log('🎫 Testando /api/codes...');
        const codes = await makeRequest('/api/codes');
        console.log(`Status: ${codes.status}`);
        console.log('Códigos encontrados:', codes.data?.codes?.length || 0);
        console.log('');
    } catch (e) {
        console.log('❌ Erro ao testar codes:', e.message);
    }

    console.log('✅ Teste de APIs concluído!');
}

testAPIs();
