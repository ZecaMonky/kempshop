const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.on('connect', () => {
    console.log('База данных успешно подключена');
});

pool.on('error', (err) => {
    console.error('Ошибка подключения к базе данных:', err);
});

module.exports = {
    query: (text, params) => pool.query(text, params)
}; 