const db = require('./database');
const bcrypt = require('bcrypt');

async function initDatabase() {
    return new Promise((resolve, reject) => {
        console.log('Начало инициализации базы данных...');
        
        db.serialize(async () => {
            try {
                console.log('Создание таблиц...');
                
                // Создаем таблицы
                db.run(`CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    firstName TEXT NOT NULL,
                    lastName TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    phone TEXT,
                    password TEXT NOT NULL,
                    role TEXT DEFAULT 'user',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`, (err) => {
                    if (err) {
                        console.error('Ошибка при создании таблицы users:', err);
                    } else {
                        console.log('Таблица users создана успешно');
                    }
                });

                db.run(`CREATE TABLE IF NOT EXISTS products (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    price DECIMAL(10,2) NOT NULL,
                    image_url TEXT,
                    category TEXT,
                    stock INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);

                db.run(`CREATE TABLE IF NOT EXISTS orders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    total_price DECIMAL(10,2) NOT NULL,
                    status TEXT DEFAULT 'pending',
                    delivery_address TEXT NOT NULL,
                    payment_method TEXT NOT NULL,
                    comment TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )`);

                db.run(`CREATE TABLE IF NOT EXISTS order_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    order_id INTEGER NOT NULL,
                    product_id INTEGER NOT NULL,
                    quantity INTEGER NOT NULL,
                    price DECIMAL(10,2) NOT NULL,
                    FOREIGN KEY (order_id) REFERENCES orders(id),
                    FOREIGN KEY (product_id) REFERENCES products(id)
                )`);

                db.run(`CREATE TABLE IF NOT EXISTS cart_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    product_id INTEGER NOT NULL,
                    quantity INTEGER NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (product_id) REFERENCES products(id)
                )`);

                // Проверяем наличие тестовых данных
                db.get("SELECT COUNT(*) as count FROM products", [], async (err, row) => {
                    if (err) {
                        console.error('Ошибка при проверке товаров:', err);
                        reject(err);
                        return;
                    }

                    console.log(`Найдено товаров: ${row.count}`);

                    if (row.count === 0) {
                        console.log('Добавление тестовых товаров...');
                        // Добавляем тестовые товары
                        const products = [
                            {
                                name: 'Рапира спортивная',
                                description: 'Электрическая рапира для соревнований',
                                price: 15000,
                                image_url: '/images/rapier.jpg',
                                category: 'rapier',
                                stock: 10
                            },
                            {
                                name: 'Шпага спортивная',
                                description: 'Электрическая шпага для соревнований',
                                price: 16000,
                                image_url: '/images/epee.jpg',
                                category: 'epee',
                                stock: 10
                            },
                            {
                                name: 'Сабля спортивная',
                                description: 'Электрическая сабля для соревнований',
                                price: 17000,
                                image_url: '/images/saber.jpg',
                                category: 'saber',
                                stock: 10
                            },
                            {
                                name: 'Маска фехтовальная',
                                description: 'Защитная маска для фехтования',
                                price: 8000,
                                image_url: '/images/mask.jpg',
                                category: 'protection',
                                stock: 15
                            },
                            {
                                name: 'Куртка фехтовальная',
                                description: 'Защитная куртка для фехтования',
                                price: 12000,
                                image_url: '/images/jacket.jpg',
                                category: 'protection',
                                stock: 20
                            }
                        ];

                        const stmt = db.prepare(`
                            INSERT INTO products (name, description, price, image_url, category, stock)
                            VALUES (?, ?, ?, ?, ?, ?)
                        `);

                        products.forEach(product => {
                            stmt.run([
                                product.name,
                                product.description,
                                product.price,
                                product.image_url,
                                product.category,
                                product.stock
                            ]);
                        });

                        stmt.finalize();
                        console.log('Тестовые товары добавлены');
                    }

                    // Проверяем наличие админа
                    db.get("SELECT COUNT(*) as count FROM users WHERE role = 'admin'", [], async (err, row) => {
                        if (err) {
                            console.error('Ошибка при проверке админа:', err);
                            reject(err);
                            return;
                        }

                        console.log(`Найдено админов: ${row.count}`);

                        if (row.count === 0) {
                            console.log('Создание админа...');
                            const hashedPassword = await bcrypt.hash('admin', 10);
                            db.run(`
                                INSERT INTO users (firstName, lastName, email, phone, password, role)
                                VALUES (?, ?, ?, ?, ?, ?)
                            `, ['Admin', 'User', 'admin@example.com', '+7(999)999-99-99', hashedPassword, 'admin'], 
                            (err) => {
                                if (err) {
                                    console.error('Ошибка при создании админа:', err);
                                } else {
                                    console.log('Админ успешно создан');
                                }
                                resolve();
                            });
                        } else {
                            console.log('Админ уже существует');
                            resolve();
                        }
                    });

                    // Обновляем изображения товаров
                    db.run(`UPDATE products SET image_url = '/images/rapier.jpg' WHERE id = 1`);
                    db.run(`UPDATE products SET image_url = '/images/epee.jpg' WHERE id = 2`);
                    db.run(`UPDATE products SET image_url = '/images/saber.jpg' WHERE id = 3`);
                    db.run(`UPDATE products SET image_url = '/images/mask.jpg' WHERE id = 4`);
                    db.run(`UPDATE products SET image_url = '/images/jacket.jpg' WHERE id = 5`);
                });
            } catch (error) {
                console.error('Ошибка при инициализации базы данных:', error);
                reject(error);
            }
        });
    });
}

module.exports = initDatabase; 