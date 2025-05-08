const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { getUserCart } = require('../utils/cartUtils');
const debug = require('debug')('app:cart');

// Инициализация корзины
const initCart = (req) => {
    if (!req.session.cart) {
        req.session.cart = {
            items: [],
            total: 0
        };
    }
    return req.session.cart;
};

// Страница корзины
router.get('/cart', (req, res) => {
    const cart = initCart(req);
    res.render('cart', {
        title: 'Корзина',
        user: req.session.user,
        page: 'cart',
        cart: cart
    });
});

// Добавление товара в корзину
router.post('/cart/add', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, error: 'Необходима авторизация' });
    }

    const { productId, quantity } = req.body;
    const userId = req.session.user.id;

    try {
        // Проверяем, есть ли уже такой товар в корзине
        const existingItem = await db.query(
            'SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2',
            [userId, productId]
        );

        if (existingItem.rows.length > 0) {
            // Обновляем количество
            await db.query(
                'UPDATE cart_items SET quantity = quantity + $1 WHERE user_id = $2 AND product_id = $3',
                [quantity, userId, productId]
            );
        } else {
            // Добавляем новый товар
            await db.query(
                'INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3)',
                [userId, productId, quantity]
            );
        }

        // Получаем обновленную корзину
        const cart = await getUserCart(userId);
        req.session.cart = cart;

        res.json({ success: true, cart });
    } catch (error) {
        console.error('Ошибка при добавлении в корзину:', error);
        res.status(500).json({ success: false, error: 'Ошибка при добавлении в корзину' });
    }
});

// Удаление из корзины
router.post('/cart/remove', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, error: 'Необходима авторизация' });
    }

    const { productId } = req.body;
    const userId = req.session.user.id;

    try {
        await db.query(
            'DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2',
            [userId, productId]
        );

        const cart = await getUserCart(userId);
        req.session.cart = cart;

        res.json({
            success: true,
            cart: cart
        });
    } catch (error) {
        console.error('Ошибка при удалении из корзины:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при удалении товара'
        });
    }
});

// Обновление количества
router.post('/cart/update', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, error: 'Необходима авторизация' });
    }

    const { productId, quantity } = req.body;
    const userId = req.session.user.id;

    try {
        await db.query(
            'UPDATE cart_items SET quantity = $1 WHERE user_id = $2 AND product_id = $3',
            [Math.max(1, parseInt(quantity)), userId, productId]
        );

        const cart = await getUserCart(userId);
        req.session.cart = cart;

        res.json({
            success: true,
            cart: cart
        });
    } catch (error) {
        console.error('Ошибка при обновлении количества:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при обновлении количества'
        });
    }
});

module.exports = router; 