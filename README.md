# Kemp Shop

Интернет-магазин оборудования для фехтования, разработанный на Node.js с использованием Express и PostgreSQL.

## Технологии

- Node.js
- Express.js
- PostgreSQL
- EJS (шаблонизатор)
- Cloudinary (для хранения изображений)
- Bootstrap 5 (для стилей)

## Функционал

- Авторизация и регистрация пользователей
- Каталог товаров с фильтрацией и сортировкой
- Корзина покупок
- Оформление заказов
- Личный кабинет пользователя
- Административная панель
  - Управление товарами
  - Управление заказами
  - Статистика продаж

## Установка и запуск

1. Клонируйте репозиторий:
```bash
git clone https://github.com/ZecaMonky/kempshop.git
cd kempshop
```

2. Установите зависимости:
```bash
npm install
```

3. Создайте файл .env и добавьте необходимые переменные окружения:
```env
DATABASE_URL=your_postgresql_url
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
SESSION_SECRET=your_session_secret
```

4. Запустите приложение:
```bash
npm start
```

## Развертывание

Проект готов к развертыванию на render.com. Используйте файл `render.yaml` для настройки деплоя.

## Структура проекта

```
├── config/             # Конфигурационные файлы
├── public/            # Статические файлы
│   ├── css/          # Стили
│   ├── js/           # Клиентские скрипты
│   └── images/       # Изображения
├── routes/           # Маршруты
├── utils/            # Утилиты
├── views/            # Шаблоны
│   ├── admin/       # Шаблоны админ-панели
│   ├── auth/        # Шаблоны авторизации
│   ├── layouts/     # Общие макеты
│   └── partials/    # Частичные шаблоны
├── app.js           # Основной файл приложения
└── package.json     # Зависимости и скрипты
```

## Лицензия

MIT 