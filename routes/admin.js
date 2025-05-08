const express = require('express');
const router = express.Router();
const db = require('../config/database');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Конфигурация Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Настройка хранилища для загрузки файлов
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'kemp-shop',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
        transformation: [{ width: 800, height: 800, crop: 'limit' }]
    }
});

const upload = multer({ storage: storage });

// Middleware для проверки авторизации и прав администратора
const requireAdmin = async (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    try {
        const result = await db.query('SELECT role FROM users WHERE id = $1', [req.session.user.id]);
        if (!result.rows[0] || result.rows[0].role !== 'admin') {
            return res.redirect('/');
        }
        next();
    } catch (error) {
        console.error('Ошибка проверки прав администратора:', error);
        res.redirect('/');
    }
};

// Главная страница админ-панели
router.get('/admin', requireAdmin, async (req, res) => {
    try {
        const recentOrders = await db.query(`
            SELECT 
                o.id,
                o.total_price,
                o.created_at,
                o.status,
                u.firstName,
                u.lastName
            FROM orders o
            JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
            LIMIT 5
        `);

        res.render('admin/dashboard', {
            title: 'Админ-панель',
            recentOrders: recentOrders.rows
        });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).render('error', { error: 'Database error' });
    }
});

// Страница управления товарами
router.get('/admin/products', requireAdmin, async (req, res) => {
    try {
        const products = await db.query('SELECT * FROM products ORDER BY created_at DESC');
        res.render('admin/products', {
            title: 'Управление товарами',
            products: products.rows,
            page: 'products'
        });
    } catch (error) {
        console.error('Ошибка при получении товаров:', error);
        res.status(500).render('error', { error: 'Ошибка при получении товаров' });
    }
});

// Добавление нового товара
router.post('/admin/products', requireAdmin, upload.single('image'), async (req, res) => {
    try {
        const { name, description, price, category, sku, stock } = req.body;
        const image_url = req.file ? req.file.path : null;

        const result = await db.query(`
            INSERT INTO products (name, description, price, category, image_url, sku, stock)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
        `, [name, description, price, category, image_url, sku, stock]);

        res.json({
            success: true,
            productId: result.rows[0].id,
            message: 'Товар успешно добавлен'
        });
    } catch (error) {
        console.error('Ошибка при добавлении товара:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при добавлении товара'
        });
    }
});

// Обновление товара
router.put('/admin/products/:id', requireAdmin, upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, category, sku, stock } = req.body;
        
        // Получаем текущую информацию о товаре
        const currentProduct = await db.query('SELECT image_url FROM products WHERE id = $1', [id]);
        
        let image_url = currentProduct.rows[0]?.image_url;
        
        // Если загружено новое изображение
        if (req.file) {
            // Удаляем старое изображение из Cloudinary
            if (image_url) {
                const publicId = image_url.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(publicId);
            }
            image_url = req.file.path;
        }

        await db.query(`
            UPDATE products 
            SET name = $1, description = $2, price = $3, category = $4, sku = $5, stock = $6, image_url = $7
            WHERE id = $8
        `, [name, description, price, category, sku, stock, image_url, id]);

        res.json({
            success: true,
            message: 'Товар успешно обновлен'
        });
    } catch (error) {
        console.error('Ошибка при обновлении товара:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при обновлении товара'
        });
    }
});

// Удаление товара
router.delete('/admin/products/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Получаем информацию о товаре для удаления изображения из Cloudinary
        const product = await db.query('SELECT image_url FROM products WHERE id = $1', [id]);
        
        if (product.rows[0] && product.rows[0].image_url) {
            const publicId = product.rows[0].image_url.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
        }

        await db.query('DELETE FROM products WHERE id = $1', [id]);

        res.json({
            success: true,
            message: 'Товар успешно удален'
        });
    } catch (error) {
        console.error('Ошибка при удалении товара:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при удалении товара'
        });
    }
});

// Страница со списком всех заказов
router.get('/admin/orders', requireAdmin, async (req, res) => {
    try {
        const orders = await db.query(`
            SELECT o.*, 
                   u.firstName, 
                   u.lastName
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
        `);
        
        res.render('admin/orders', {
            title: 'Управление заказами',
            orders: orders.rows,
            page: 'orders'
        });
    } catch (error) {
        console.error('Ошибка при получении заказов:', error);
        res.render('admin/orders', {
            title: 'Управление заказами',
            orders: [],
            page: 'orders'
        });
    }
});

// Изменение статуса заказа
router.post('/admin/orders/:id/status', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        await db.query('UPDATE orders SET status = $1 WHERE id = $2', [status, id]);

        res.json({
            success: true,
            message: 'Статус заказа обновлен'
        });
    } catch (error) {
        console.error('Ошибка при обновлении статуса заказа:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при обновлении статуса заказа'
        });
    }
});

// Страница деталей заказа
router.get('/admin/orders/:id', requireAdmin, async (req, res) => {
    try {
        const orderId = req.params.id;

        const order = await db.query(`
            SELECT o.*, 
                   u.firstName, u.lastName, u.email, u.phone
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            WHERE o.id = $1
        `, [orderId]);

        if (!order.rows[0]) {
            return res.redirect('/admin/orders');
        }

        const orderItems = await db.query(`
            SELECT oi.*, p.name
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = $1
        `, [orderId]);

        res.render('admin/order-details', {
            title: `Заказ #${orderId}`,
            order: order.rows[0],
            orderItems: orderItems.rows
        });
    } catch (error) {
        console.error('Ошибка при получении деталей заказа:', error);
        res.redirect('/admin/orders');
    }
});

// Получение статистики продаж
router.get('/admin/stats', requireAdmin, async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const stats = await db.query(`
            SELECT 
                COUNT(DISTINCT o.id) as total_orders,
                COALESCE(SUM(o.total_price), 0) as total_sales,
                COUNT(DISTINCT o.user_id) as unique_customers
            FROM orders o
            WHERE o.created_at >= $1
            AND o.status != 'cancelled'
        `, [thirtyDaysAgo.toISOString()]);

        res.json({
            total_orders: parseInt(stats.rows[0]?.total_orders || 0),
            total_sales: parseFloat(stats.rows[0]?.total_sales || 0),
            unique_customers: parseInt(stats.rows[0]?.unique_customers || 0)
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Получение всех заказов для отладки
router.get('/admin/debug/orders', requireAdmin, async (req, res) => {
    try {
        const orders = await db.query(`
            SELECT 
                o.id,
                o.total_price,
                o.created_at,
                o.status
            FROM orders o
            WHERE o.status != 'cancelled'
            ORDER BY o.created_at DESC
        `);

        res.json(orders.rows);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Удаление заказа
router.post('/admin/orders/:id/delete', requireAdmin, (req, res) => {
    const orderId = req.params.id;

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // Сначала удаляем связанные записи из order_items
        db.run('DELETE FROM order_items WHERE order_id = ?', [orderId], (err) => {
            if (err) {
                console.error('Ошибка при удалении элементов заказа:', err);
                db.run('ROLLBACK');
                return res.status(500).json({ 
                    success: false, 
                    error: 'Ошибка при удалении заказа' 
                });
            }

            // Затем удаляем сам заказ
            db.run('DELETE FROM orders WHERE id = ?', [orderId], (err) => {
                if (err) {
                    console.error('Ошибка при удалении заказа:', err);
                    db.run('ROLLBACK');
                    return res.status(500).json({ 
                        success: false, 
                        error: 'Ошибка при удалении заказа' 
                    });
                }

                db.run('COMMIT', (err) => {
                    if (err) {
                        console.error('Ошибка при завершении транзакции:', err);
                        db.run('ROLLBACK');
                        return res.status(500).json({ 
                            success: false, 
                            error: 'Ошибка при удалении заказа' 
                        });
                    }

                    res.json({ 
                        success: true, 
                        message: 'Заказ успешно удален' 
                    });
                });
            });
        });
    });
});

// Страница управления отзывами
router.get('/admin/reviews', requireAdmin, async (req, res) => {
    try {
        const reviews = await db.query('SELECT * FROM reviews ORDER BY created_at DESC');
        res.render('admin/reviews', {
            title: 'Управление отзывами',
            reviews: reviews.rows
        });
    } catch (error) {
        console.error('Ошибка при получении отзывов:', error);
        res.status(500).render('error', { error: 'Ошибка при получении отзывов' });
    }
});

// Одобрить отзыв
router.post('/admin/reviews/:id/approve', requireAdmin, async (req, res) => {
    try {
        await db.query('UPDATE reviews SET approved = true WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, error: 'Ошибка при одобрении' });
    }
});

// Удалить отзыв
router.post('/admin/reviews/:id/delete', requireAdmin, async (req, res) => {
    try {
        await db.query('DELETE FROM reviews WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, error: 'Ошибка при удалении' });
    }
});

module.exports = router; 