const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/database');
const { getUserCart } = require('../utils/cartUtils');

// Страница входа
router.get('/login', (req, res) => {
    // Инициализируем пустые значения по умолчанию
    const data = {
        title: 'Вход',
        user: req.session.user,
        page: 'login',
        error: null,
        success: null,
        message: null
    };

    // Добавляем сообщения об ошибках или успехе, если они есть
    if (req.query.error) {
        data.error = req.query.error;
    }
    if (req.query.registered) {
        data.success = true;
        data.message = 'Регистрация успешна! Войдите в свой аккаунт';
    }

    res.render('auth/login', data);
});

// Страница регистрации
router.get('/register', (req, res) => {
    res.render('auth/register', {
        title: 'Регистрация',
        user: req.session.user,
        page: 'register',
        error: req.query.error || null,
        message: null
    });
});

// Маршрут входа
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.json({ success: false, error: 'Пользователь не найден' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (isValidPassword) {
            req.session.user = user;
            console.log('Пользователь записан в сессию:', req.session);
            req.session.save((err) => {
                if (err) {
                    console.error('Ошибка при сохранении сессии:', err);
                } else {
                    console.log('Сессия успешно сохранена после логина');
                }
            });
            try {
                const cart = await getUserCart(user.id);
                req.session.cart = cart;
                // Добавляем URL для перенаправления в ответ
                res.json({ 
                    success: true,
                    redirect: req.query.redirect || '/' 
                });
            } catch (error) {
                console.error('Ошибка при загрузке корзины:', error);
                res.json({ 
                    success: true,
                    redirect: req.query.redirect || '/' 
                });
            }
        } else {
            res.json({ success: false, error: 'Неверный пароль' });
        }
    } catch (error) {
        console.error('Ошибка при входе:', error);
        res.json({ success: false, error: 'Ошибка сервера' });
    }
});

// Обработка регистрации
router.post('/register', async (req, res) => {
    const { firstName, lastName, email, phone, password } = req.body;
    console.log('[REGISTER] Попытка регистрации:', { firstName, lastName, email, phone });
    
    // Проверка сложности пароля
    const passwordStrong = password &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[^A-Za-z0-9]/.test(password) &&
        password.length >= 8;
    if (!passwordStrong) {
        console.log('[REGISTER] Слабый пароль:', password);
        return res.json({
            success: false,
            error: 'Пароль слишком простой. Минимум 8 символов, заглавная, строчная, цифра и спецсимвол.'
        });
    }

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // Проверка существующего email с блокировкой
        const existingUser = await client.query(
            'SELECT * FROM users WHERE email = $1 FOR UPDATE',
            [email]
        );
        console.log('[REGISTER] Проверка email:', email, 'Результат:', existingUser.rows.length);
        if (existingUser.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.json({
                success: false,
                error: 'Пользователь с таким email уже существует'
            });
        }

        // Проверка существующего телефона с блокировкой
        const existingPhone = await client.query(
            'SELECT * FROM users WHERE phone = $1 FOR UPDATE',
            [phone]
        );
        console.log('[REGISTER] Проверка телефона:', phone, 'Результат:', existingPhone.rows.length);
        if (existingPhone.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.json({
                success: false,
                error: 'Пользователь с таким номером телефона уже существует'
            });
        }

        // Хеширование пароля
        const hashedPassword = await bcrypt.hash(password, 10);

        // Создание нового пользователя
        let result;
        try {
            result = await client.query(`
                INSERT INTO users (firstName, lastName, email, phone, password)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
            `, [firstName, lastName, email, phone, hashedPassword]);
            console.log('[REGISTER] Вставка пользователя успешна:', result.rows[0]);
        } catch (insertError) {
            console.error('[REGISTER] Ошибка при вставке пользователя:', insertError);
            console.error('[REGISTER] Данные для вставки:', { firstName, lastName, email, phone });
            await client.query('ROLLBACK');
            return res.json({ success: false, error: 'Ошибка при создании пользователя: ' + insertError.message });
        }

        await client.query('COMMIT');
        return res.json({ success: true });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[REGISTER] Ошибка при регистрации (глобальная catch):', error, { email, phone });
        return res.json({ success: false, error: 'Произошла ошибка при регистрации: ' + error.message });
    } finally {
        client.release();
    }
});

// Выход
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Ошибка при выходе:', err);
        }
        res.redirect('/login');
    });
});

module.exports = router; 