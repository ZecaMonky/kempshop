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
    
    try {
        // Проверка существующего пользователя
        const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (existingUser.rows.length > 0) {
            return res.redirect('/register?error=exists');
        }
        
        // Хеширование пароля
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Создание нового пользователя
        const result = await db.query(`
            INSERT INTO users (firstName, lastName, email, phone, password)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        `, [firstName, lastName, email, phone, hashedPassword]);
        
        res.redirect('/login?registered=true');
    } catch (error) {
        console.error('Ошибка при регистрации:', error);
        res.redirect('/register?error=server');
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