const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Главная страница
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM products LIMIT 8');
        res.render('home', {
            title: 'Главная',
            products: result.rows || [],
            page: 'home'
        });
    } catch (err) {
        console.error('Database error:', err);
        res.render('home', {
            title: 'Главная',
            products: [],
            page: 'home'
        });
    }
});

// Страница каталога с фильтрами
router.get('/catalog', async (req, res) => {
    const { category, minPrice, maxPrice, sort } = req.query;
    
    let query = `
        SELECT * FROM products 
        WHERE 1=1
    `;
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
        const categoriesResult = await db.query('SELECT DISTINCT category FROM products');

        // Получаем минимальную и максимальную цену
        const priceRangeResult = await db.query('SELECT MIN(price) as min, MAX(price) as max FROM products');

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

module.exports = router; 