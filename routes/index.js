const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Главная страница
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM products WHERE is_archived = false LIMIT 8');
        const reviewsResult = await db.query('SELECT * FROM reviews WHERE approved = true ORDER BY created_at DESC LIMIT 6');
        res.render('home', {
            title: 'Главная',
            products: result.rows || [],
            page: 'home',
            reviews: reviewsResult.rows || []
        });
    } catch (err) {
        console.error('Database error:', err);
        res.render('home', {
            title: 'Главная',
            products: [],
            page: 'home',
            reviews: []
        });
    }
});

// Страница каталога с фильтрами
router.get('/catalog', async (req, res) => {
    const { category, minPrice, maxPrice, sort } = req.query;
    
    let query = `SELECT * FROM products WHERE is_archived = false`;
    let params = [];
    let paramCount = 1;

    // Фильтр по категории
    if (category && category !== 'all') {
        query += ` AND category = $${paramCount}`;
        params.push(category);
        paramCount++;
    }

    // Фильтр по цене
    if (minPrice) {
        query += ` AND price >= $${paramCount}`;
        params.push(minPrice);
        paramCount++;
    }
    if (maxPrice) {
        query += ` AND price <= $${paramCount}`;
        params.push(maxPrice);
        paramCount++;
    }

    // Сортировка
    if (sort) {
        switch (sort) {
            case 'price_asc':
                query += ` ORDER BY price ASC`;
                break;
            case 'price_desc':
                query += ` ORDER BY price DESC`;
                break;
            case 'name_asc':
                query += ` ORDER BY name ASC`;
                break;
            case 'name_desc':
                query += ` ORDER BY name DESC`;
                break;
            default:
                query += ` ORDER BY id ASC`;
        }
    } else {
        query += ` ORDER BY id ASC`;
    }

    try {
        // Получаем все категории для фильтра
        const categoriesResult = await db.query('SELECT DISTINCT category FROM products WHERE is_archived = false');

        // Получаем минимальную и максимальную цену
        const priceRangeResult = await db.query('SELECT MIN(price) as min, MAX(price) as max FROM products WHERE is_archived = false');

        // Получаем отфильтрованные товары
        const productsResult = await db.query(query, params);

        res.render('catalog', {
            title: 'Каталог',
            products: productsResult.rows,
            categories: categoriesResult.rows,
            priceRange: priceRangeResult.rows[0],
            filters: {
                category: category || 'all',
                minPrice: minPrice || '',
                maxPrice: maxPrice || '',
                sort: sort || 'id_asc'
            }
        });
    } catch (error) {
        console.error('Ошибка:', error);
        res.status(500).render('error', { error: 'Произошла ошибка при загрузке каталога' });
    }
});

// Страница отдельного товара
router.get('/product/:id', async (req, res) => {
    const productId = req.params.id;
    try {
        const result = await db.query('SELECT * FROM products WHERE id = $1', [productId]);
        if (!result.rows[0]) {
            return res.redirect('/404');
        }
        res.render('product', {
            title: result.rows[0].name,
            product: result.rows[0],
            page: 'product'
        });
    } catch (err) {
        res.redirect('/404');
    }
});

// Корзина
router.get('/cart', (req, res) => {
    res.render('cart', { 
        title: 'Корзина',
        user: req.session.user 
    });
});

// Авторизация
router.get('/login', (req, res) => {
    res.render('auth/login', { 
        title: 'Вход',
        user: req.session.user 
    });
});

// Регистрация
router.get('/register', (req, res) => {
    res.render('auth/register', { 
        title: 'Регистрация',
        user: req.session.user 
    });
});

// О нас
router.get('/about', (req, res) => {
    res.render('about', {
        title: 'О нас',
        page: 'about',
        user: req.session.user
    });
});

// Контакты
router.get('/contacts', (req, res) => {
    res.render('contacts', {
        title: 'Контакты',
        page: 'contacts',
        user: req.session.user
    });
});

// Оставить отзыв
router.post('/reviews', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, error: 'Требуется авторизация' });
    }
    const { text, rating } = req.body;
    if (!text || !rating) {
        return res.json({ success: false, error: 'Заполните все поля' });
    }
    const name = req.session.user.firstName || req.session.user.email || 'Пользователь';
    try {
        await db.query(
            'INSERT INTO reviews (user_id, name, text, rating) VALUES ($1, $2, $3, $4)',
            [req.session.user.id, name, text, rating]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Ошибка при добавлении отзыва:', error);
        res.json({ success: false, error: 'Ошибка сервера' });
    }
});

// Обработка формы контактов
router.post('/contacts', async (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
        return res.json({ success: false, error: 'Заполните все поля' });
    }
    try {
        await db.query('INSERT INTO contacts (name, email, message) VALUES ($1, $2, $3)', [name, email, message]);
        res.json({ success: true });
    } catch (error) {
        console.error('Ошибка при сохранении обращения:', error);
        res.json({ success: false, error: 'Ошибка сервера' });
    }
});

module.exports = router; 