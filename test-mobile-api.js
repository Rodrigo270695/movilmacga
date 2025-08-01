#!/usr/bin/env node

/**
 * 🧪 Script de Prueba para APIs Móviles - MovilMacga
 *
 * Uso: node test-mobile-api.js [BASE_URL]
 * Ejemplo: node test-mobile-api.js http://localhost:8000
 */

const BASE_URL = process.argv[2] || 'http://localhost:8000';
const API_URL = `${BASE_URL}/api`;

console.log('🚀 Iniciando pruebas de API móvil...');
console.log(`📡 Base URL: ${API_URL}\n`);

let authToken = null;
let sessionId = null;
let visitId = null;

// Función helper para hacer requests
async function apiRequest(method, endpoint, data = null, headers = {}) {
    const url = `${API_URL}${endpoint}`;

    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...headers
        }
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        const result = await response.json();

        console.log(`${method} ${endpoint} - Status: ${response.status}`);
        console.log('Response:', JSON.stringify(result, null, 2));
        console.log('---');

        return { response, result };
    } catch (error) {
        console.error(`❌ Error en ${method} ${endpoint}:`, error.message);
        return null;
    }
}

// Test de login
async function testLogin() {
    console.log('1️⃣ Testing Login...');

    const { response, result } = await apiRequest('POST', '/auth/login', {
        username: 'vendedor01',
        password: '12345679',
        device_name: 'Test Device'
    });

    if (response?.ok && result?.success) {
        authToken = result.data.token;
        console.log('✅ Login exitoso - Token obtenido\n');
        return true;
    } else {
        console.log('❌ Login falló\n');
        return false;
    }
}

// Test de perfil
async function testProfile() {
    console.log('2️⃣ Testing Profile...');

    const { response, result } = await apiRequest('GET', '/auth/profile', null, {
        'Authorization': `Bearer ${authToken}`
    });

    if (response?.ok && result?.success) {
        console.log('✅ Perfil obtenido exitosamente\n');
        return true;
    } else {
        console.log('❌ Obtener perfil falló\n');
        return false;
    }
}

// Test de iniciar jornada
async function testStartSession() {
    console.log('3️⃣ Testing Start Working Session...');

    const { response, result } = await apiRequest('POST', '/working-sessions/start', {
        latitude: -12.046374,
        longitude: -77.042793,
        notes: 'Inicio de jornada de prueba'
    }, {
        'Authorization': `Bearer ${authToken}`
    });

    if (response?.ok && result?.success) {
        sessionId = result.data.session_id;
        console.log('✅ Jornada iniciada exitosamente\n');
        return true;
    } else {
        console.log('❌ Iniciar jornada falló\n');
        return false;
    }
}

// Test de enviar ubicación GPS
async function testSendLocation() {
    console.log('4️⃣ Testing Send GPS Location...');

    const { response, result } = await apiRequest('POST', '/gps/location', {
        latitude: -12.046380,
        longitude: -77.042800,
        accuracy: 5.0,
        speed: 25.5,
        heading: 180.0,
        battery_level: 85,
        is_mock_location: false
    }, {
        'Authorization': `Bearer ${authToken}`
    });

    if (response?.ok && result?.success) {
        console.log('✅ Ubicación GPS enviada exitosamente\n');
        return true;
    } else {
        console.log('❌ Enviar ubicación GPS falló\n');
        return false;
    }
}

// Test de obtener PDVs del día
async function testGetTodayPdvs() {
    console.log('5️⃣ Testing Get Today PDVs...');

    const { response, result } = await apiRequest('GET', '/user/pdvs-today', null, {
        'Authorization': `Bearer ${authToken}`
    });

    if (response?.ok && result?.success) {
        console.log('✅ PDVs del día obtenidos exitosamente\n');
        return true;
    } else {
        console.log('❌ Obtener PDVs del día falló\n');
        return false;
    }
}

// Test de estadísticas
async function testGetStats() {
    console.log('6️⃣ Testing Get User Stats...');

    const { response, result } = await apiRequest('GET', '/user/stats?period=today', null, {
        'Authorization': `Bearer ${authToken}`
    });

    if (response?.ok && result?.success) {
        console.log('✅ Estadísticas obtenidas exitosamente\n');
        return true;
    } else {
        console.log('❌ Obtener estadísticas falló\n');
        return false;
    }
}

// Test de finalizar jornada
async function testEndSession() {
    console.log('7️⃣ Testing End Working Session...');

    const { response, result } = await apiRequest('POST', '/working-sessions/end', {
        latitude: -12.046374,
        longitude: -77.042793,
        notes: 'Fin de jornada de prueba'
    }, {
        'Authorization': `Bearer ${authToken}`
    });

    if (response?.ok && result?.success) {
        console.log('✅ Jornada finalizada exitosamente\n');
        return true;
    } else {
        console.log('❌ Finalizar jornada falló\n');
        return false;
    }
}

// Test de logout
async function testLogout() {
    console.log('8️⃣ Testing Logout...');

    const { response, result } = await apiRequest('POST', '/auth/logout', null, {
        'Authorization': `Bearer ${authToken}`
    });

    if (response?.ok && result?.success) {
        console.log('✅ Logout exitoso\n');
        return true;
    } else {
        console.log('❌ Logout falló\n');
        return false;
    }
}

// Ejecutar todas las pruebas
async function runAllTests() {
    const tests = [
        { name: 'Login', fn: testLogin },
        { name: 'Profile', fn: testProfile },
        { name: 'Start Session', fn: testStartSession },
        { name: 'Send Location', fn: testSendLocation },
        { name: 'Get Today PDVs', fn: testGetTodayPdvs },
        { name: 'Get Stats', fn: testGetStats },
        { name: 'End Session', fn: testEndSession },
        { name: 'Logout', fn: testLogout }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        try {
            const success = await test.fn();
            if (success) {
                passed++;
            } else {
                failed++;
            }
        } catch (error) {
            console.error(`❌ Error en test ${test.name}:`, error.message);
            failed++;
        }

        // Pausa entre tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n📊 RESULTADOS FINALES:');
    console.log(`✅ Pruebas exitosas: ${passed}`);
    console.log(`❌ Pruebas fallidas: ${failed}`);
    console.log(`📈 Porcentaje de éxito: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    if (failed === 0) {
        console.log('\n🎉 ¡Todas las pruebas pasaron exitosamente!');
        console.log('✅ La API móvil está lista para usar');
    } else {
        console.log('\n⚠️  Algunas pruebas fallaron. Revisa la configuración.');
    }
}

// Verificar si fetch está disponible (Node.js 18+)
if (typeof fetch === 'undefined') {
    console.error('❌ Este script requiere Node.js 18+ (que incluye fetch nativo)');
    console.error('💡 Alternativa: npm install node-fetch');
    process.exit(1);
}

// Ejecutar pruebas
runAllTests().catch(error => {
    console.error('❌ Error ejecutando pruebas:', error);
    process.exit(1);
});
