const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Middleware для проверки авторизации
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login?redirect=/checkout');
    }
    next();
};

// Страница оформления заказа
router.get('/checkout', requireAuth, (req, res) => {
    if (!req.session.cart || !req.session.cart.items || req.session.cart.items.length === 0) {
        return res.redirect('/cart');
    }

    const cart = req.session.cart;
    // Вычисляем стоимость доставки и общую сумму
    const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = 300; // Стоимость доставки
    const total = subtotal + shipping;

    res.render('checkout', {
        title: 'Оформление заказа',
        page: 'checkout',
        cart: {
            ...cart,
            subtotal,
            shipping,
            total
        }
    });
});

// Обработка оформления заказа
router.post('/checkout', requireAuth, async (req, res) => {
    try {
        const { 
            firstName, 
            lastName, 
            email, 
            phone,
            city,
            address,
            delivery,
            payment,
            comment 
        } = req.body;

        if (!req.session.cart || !req.session.cart.items || req.session.cart.items.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Корзина пуста' 
            });
        }

        const cart = req.session.cart;
        const userId = req.session.user.id;
        const deliveryAddress = `${city}, ${address}`;
        const totalPrice = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 300;

        // Создаем заказ
        const orderResult = await db.query(`
            INSERT INTO orders (user_id, total_price, status, delivery_address, payment_method, comment)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `, [userId, totalPrice, 'pending', deliveryAddress, payment, comment]);

        const orderId = orderResult.rows[0].id;

        // Добавляем товары заказа
        for (const item of cart.items) {
            await db.query(`
                INSERT INTO order_items (order_id, product_id, quantity, price)
                VALUES ($1, $2, $3, $4)
            `, [orderId, item.id, item.quantity, item.price]);
        }

        // Очищаем корзину
        await db.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
        req.session.cart = { items: [], total: 0 };

        res.json({ 
            success: true,
            message: 'Заказ успешно оформлен',
            orderId: orderId
        });
    } catch (error) {
        console.error('Ошибка при оформлении заказа:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Произошла ошибка при оформлении заказа' 
        });
    }
});

// Страница успешного оформления заказа
router.get('/order/success/:orderId', requireAuth, async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const userId = req.session.user.id;

        const orderResult = await db.query(`
            SELECT o.*, 
                   json_agg(json_build_object(
                       'id', p.id,
                       'name', p.name,
                       'price', oi.price,
                       'quantity', oi.quantity
                   )) as items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE o.id = $1 AND o.user_id = $2
            GROUP BY o.id
        `, [orderId, userId]);

        if (!orderResult.rows[0]) {
            return res.redirect('/profile');
        }

        res.render('order-success', {
            title: 'Заказ оформлен',
            user: req.session.user,
            order: orderResult.rows[0]
        });
    } catch (error) {
        console.error('Ошибка при загрузке информации о заказе:', error);
        res.status(500).send('Ошибка при загрузке информации о заказе');
    }
});

module.exports = router; 