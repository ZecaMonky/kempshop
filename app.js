const express = require('express');
const path = require('path');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const cors = require('cors');
const expressLayouts = require('express-ejs-layouts');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.set('trust proxy', 1); // Для корректной работы secure cookie за прокси
const port = process.env.PORT || 3000;

// Создаем пул подключений к базе данных
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    store: new pgSession({
        pool: pool,
        tableName: 'session',
        createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
        httpOnly: true
    },
    name: 'sessionId'
}));

// View engine setup
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('layout', 'layouts/main');

// Middleware для передачи информации о пользователе во все представления
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.cart = req.session.cart || { items: [], total: 0 };
    next();
});

// Глобальное логирование сессии и куки для отладки
app.use((req, res, next) => {
    console.log('--- Новый запрос ---');
    console.log('URL:', req.originalUrl);
    console.log('Cookies:', req.headers.cookie);
    console.log('Session:', req.session);
    next();
});

// Routes
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const cartRoutes = require('./routes/cart');
const checkoutRoutes = require('./routes/checkout');
const profileRoutes = require('./routes/profile');
const adminRoutes = require('./routes/admin');

app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/', cartRoutes);
app.use('/', checkoutRoutes);
app.use('/', profileRoutes);
app.use('/', adminRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).render('404', {
        title: 'Страница не найдена',
        page: '404'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', {
        title: 'Ошибка',
        error: process.env.NODE_ENV === 'development' ? err : {},
        page: 'error'
    });
});

// Start server
app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});

module.exports = app; 