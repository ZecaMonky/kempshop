const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
});

pool.on('connect', () => {
    console.log('База данных успешно подключена');
});

pool.on('error', (err) => {
    console.error('Ошибка подключения к базе данных:', err);
    console.error('Детали ошибки:', {
        code: err.code,
        detail: err.detail,
        where: err.where
    });
});

// Проверка подключения при старте
const testConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('Тест подключения к базе данных успешен');
        client.release();
    } catch (err) {
        console.error('Ошибка при тестовом подключении к базе данных:', err);
    }
};

testConnection();

module.exports = {
    query: (text, params) => pool.query(text, params)
}; 