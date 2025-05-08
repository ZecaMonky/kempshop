const db = require('../config/database');

// Функция для получения корзины пользователя
async function getUserCart(userId) {
    try {
        const query = `
            SELECT 
                ci.quantity, 
                p.id as product_id,
                p.name,
                p.price,
                p.image_url,
                p.sku
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            WHERE ci.user_id = $1
        `;
        
        const result = await db.query(query, [userId]);
        
        const cart = {
            items: result.rows.map(item => ({
                id: item.product_id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image_url: item.image_url,
                sku: item.sku
            })),
            total: result.rows.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0)
        };
        
        return cart;
    } catch (error) {
        console.error('Ошибка при получении корзины:', error);
        return { items: [], total: 0 };
    }
}

module.exports = {
    getUserCart
}; 