let lastUpdate = 0;

async function updateStats() {
    // Предотвращаем слишком частые обновления
    const now = Date.now();
    if (now - lastUpdate < 5000) return; // Минимальный интервал 5 секунд
    
    lastUpdate = now;
    
    try {
        const response = await fetch('/admin/stats');
        const stats = await response.json();
        
        document.getElementById('total-orders').textContent = stats.total_orders;
        document.getElementById('total-sales').textContent = `${stats.total_sales} ₽`;
        document.getElementById('unique-customers').textContent = stats.unique_customers;
    } catch (error) {
        console.error('Ошибка при получении статистики:', error);
    }
}

// Обновляем статистику при загрузке страницы
document.addEventListener('DOMContentLoaded', updateStats);

// Обновляем статистику каждые 30 секунд
setInterval(updateStats, 30000); 