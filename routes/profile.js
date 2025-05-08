const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Middleware для проверки авторизации
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
};

// Страница профиля с заказами
router.get('/profile', requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.id;

        const orders = await db.query(`
            SELECT o.*, 
                   COUNT(oi.id) as items_count,
                   STRING_AGG(p.name, ', ') as product_names
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE o.user_id = $1
            GROUP BY o.id
            ORDER BY o.created_at DESC
        `, [userId]);

        res.render('profile', {
            title: 'Профиль',
            page: 'profile',
            orders: orders.rows || []
        });
    } catch (error) {
        console.error('Ошибка при получении заказов:', error);
        res.render('profile', {
            title: 'Профиль',
            page: 'profile',
            orders: []
        });
    }
});

// Обновление профиля
router.post('/profile/update', requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { firstName, lastName, phone } = req.body;

        await db.query(`
            UPDATE users 
            SET firstName = $1, lastName = $2, phone = $3
            WHERE id = $4
        `, [firstName, lastName, phone, userId]);

        // Обновляем данные сессии
        req.session.user = {
            ...req.session.user,
            firstName,
            lastName,
            phone
        };

        res.json({
            success: true,
            message: 'Профиль успешно обновлен'
        });
    } catch (error) {
        console.error('Ошибка при обновлении профиля:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при обновлении профиля'
        });
    }
});

module.exports = router; 