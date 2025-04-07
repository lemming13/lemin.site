// Смена темы
const toggleButton = document.getElementById('theme-toggle');
const body = document.body;

toggleButton.addEventListener('click', () => {
    body.classList.toggle('dark-theme');
    localStorage.setItem('theme', body.classList.contains('dark-theme') ? 'dark' : 'light');
});

if (localStorage.getItem('theme') === 'dark') {
    body.classList.add('dark-theme');
}

// Модальное окно админки
const adminButton = document.getElementById('admin-toggle');
const adminModal = document.getElementById('admin-modal');
const closeAdmin = document.getElementById('close-admin');

adminButton.addEventListener('click', () => {
    adminModal.style.display = 'block';
});

closeAdmin.addEventListener('click', () => {
    adminModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === adminModal) {
        adminModal.style.display = 'none';
    }
});

// Простая авторизация с токеном и защитой от брутфорса
function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString();
}

function generateToken() {
    return Math.random().toString(36).substr(2) + Date.now().toString(36);
}

function checkLoginAttempts() {
    const attempts = JSON.parse(localStorage.getItem('loginAttempts') || '{"count": 0, "lastAttempt": 0}');
    const now = Date.now();
    const timeSinceLastAttempt = now - attempts.lastAttempt;

    // Сбрасываем счётчик попыток, если прошло больше 10 минут
    if (timeSinceLastAttempt > 10 * 60 * 1000) {
        attempts.count = 0;
    }

    if (attempts.count >= 5) {
        alert('Слишком много попыток входа! Подождите 10 минут.');
        return false;
    }

    return true;
}

function recordLoginAttempt(success) {
    const attempts = JSON.parse(localStorage.getItem('loginAttempts') || '{"count": 0, "lastAttempt": 0}');
    const now = Date.now();

    if (success) {
        attempts.count = 0;
    } else {
        attempts.count += 1;
    }
    attempts.lastAttempt = now;
    localStorage.setItem('loginAttempts', JSON.stringify(attempts));
}

function login() {
    if (!checkLoginAttempts()) return;

    const password = document.getElementById('admin-pass').value;
    const hashedPass = hashPassword(password);
    const correctHash = hashPassword(process.env.ADMIN_PASSWORD || 'default_password');

    if (hashedPass === correctHash) {
        const token = generateToken();
        const tokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // Токен действует 24 часа
        localStorage.setItem('adminToken', JSON.stringify({ token, expiry: tokenExpiry }));
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
        recordLoginAttempt(true);
        loadNewsList();
    } else {
        alert('Неверный пароль');
        recordLoginAttempt(false);
    }
}

// Проверка токена
function checkAdmin() {
    const tokenData = JSON.parse(localStorage.getItem('adminToken') || '{}');
    const now = Date.now();

    if (tokenData.token && tokenData.expiry && now < tokenData.expiry) {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
        loadNewsList();
    } else {
        localStorage.removeItem('adminToken'); // Удаляем просроченный токен
    }
}

// Функция для конвертации изображения в base64
function imageToBase64(file, callback) {
    const reader = new FileReader();
    reader.onload = () => callback(reader.result);
    reader.onerror = () => callback(null);
    reader.readAsDataURL(file);
}

// Проверка текста на спам
function isSpam(text) {
    // Простая проверка на HTML-теги
    const htmlTagPattern = /<[^>]+>/;
    if (htmlTagPattern.test(text)) {
        return true;
    }

    // Проверка на подозрительные слова (можно расширить список)
    const spamWords = ['casino', 'viagra', 'buy now', 'click here'];
    const lowerText = text.toLowerCase();
    return spamWords.some(word => lowerText.includes(word));
}

// Проверка частоты добавления новостей
function canAddNews() {
    const lastNewsTime = localStorage.getItem('lastNewsTime') || 0;
    const now = Date.now();
    const timeSinceLastNews = now - lastNewsTime;

    // Ограничение: не чаще 1 новости в минуту
    if (timeSinceLastNews < 60 * 1000) {
        alert('Слишком частое добавление новостей! Подождите минуту.');
        return false;
    }
    return true;
}

// Добавление новости
function addNews() {
    if (!canAddNews()) return;

    const title = document.getElementById('news-title').value.trim();
    const text = document.getElementById('news-text').value.trim();
    const image = document.getElementById('news-image').files[0];

    // Ограничение на длину
    if (title.length < 5 || title.length > 100) {
        alert('Заголовок должен быть от 5 до 100 символов!');
        return;
    }
    if (text.length < 10 || text.length > 1000) {
        alert('Текст новости должен быть от 10 до 1000 символов!');
        return;
    }

    // Проверка на спам
    if (isSpam(title) || isSpam(text)) {
        alert('Обнаружен подозрительный контент! Удалите HTML-теги или спам-слова.');
        return;
    }

    // Обработка изображения
    const addNewsItem = (imageBase64) => {
        const newsItem = {
            id: Date.now(),
            title,
            text,
            date: new Date().toLocaleDateString(),
            image: imageBase64 || 'news1.jpg'
        };

        let news = JSON.parse(localStorage.getItem('news') || '[]');
        news.push(newsItem);
        localStorage.setItem('news', JSON.stringify(news));
        localStorage.setItem('lastNewsTime', Date.now());

        console.log('Новость добавлена:', newsItem);
        console.log('Все новости в localStorage:', news);

        alert('Новость добавлена!');
        adminModal.style.display = 'none';
        updateNews();
        loadNewsList();
    };

    if (image) {
        imageToBase64(image, (base64) => {
            if (base64) {
                addNewsItem(base64);
            } else {
                alert('Ошибка при загрузке изображения!');
            }
        });
    } else {
        addNewsItem(null);
    }
}

// Удаление новости
function deleteNews(id) {
    let news = JSON.parse(localStorage.getItem('news') || '[]');
    news = news.filter(item => item.id !== id);
    localStorage.setItem('news', JSON.stringify(news));
    console.log('Новость удалена, ID:', id);
    console.log('Оставшиеся новости:', news);
    updateNews();
    loadNewsList();
}

// Список новостей в админке
function loadNewsList() {
    const newsList = document.getElementById('news-list');
    const news = JSON.parse(localStorage.getItem('news') || '[]');
    newsList.innerHTML = '';
    news.forEach(item => {
        const div = document.createElement('div');
        div.className = 'news-item';
        div.innerHTML = `
            <span>${item.date} - ${item.title}</span>
            <button onclick="deleteNews(${item.id})" class="btn">Удалить</button>
        `;
        newsList.appendChild(div);
    });
    console.log('Список новостей в админке обновлён:', news);
}

// Отображение новостей
function updateNews() {
    const newsGrids = document.querySelectorAll('#news-grid');
    if (!newsGrids.length) {
        console.error('Не найдено элементов с ID news-grid');
        return;
    }

    const news = JSON.parse(localStorage.getItem('news') || '[]');
    console.log('Загружено новостей из localStorage:', news);

    const isIndexPage = document.querySelector('body').classList.contains('index-page');
    console.log('Это главная страница?', isIndexPage);

    newsGrids.forEach(grid => {
        grid.innerHTML = '';
        const newsToShow = isIndexPage ? news.slice(0, 3) : news;

        if (newsToShow.length === 0) {
            grid.innerHTML = '<p>Новостей пока нет.</p>';
        } else {
            newsToShow.forEach(item => {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <img src="${item.image}" alt="Новость">
                    <h3>${item.date} - ${item.title}</h3>
                    <p>${item.text}</p>
                `;
                grid.appendChild(card);
            });
        }
    });
}

// Погода через IP
function getWeather() {
    fetch('https://ipapi.co/json/')
        .then(response => response.json())
        .then(data => {
            const lat = data.latitude;
            const lon = data.longitude;
            const city = data.city;
            const apiKey = '661758320f4c26bcba19439cd7840b9b'; // Замени на свой ключ
            fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=ru&appid=${apiKey}`)
                .then(response => response.json())
                .then(weatherData => {
                    const temp = Math.round(weatherData.main.temp);
                    const description = weatherData.weather[0].description;
                    const icon = weatherData.weather[0].main.toLowerCase();
                    const weatherIcon = document.getElementById('weather-icon');
                    const weatherInfo = document.getElementById('weather-info');

                    weatherIcon.textContent = getWeatherIcon(icon);
                    weatherInfo.textContent = `${city}: ${temp}°C, ${description}`;
                })
                .catch(() => {
                    document.getElementById('weather-info').textContent = 'Не удалось загрузить погоду';
                });
        })
        .catch(() => {
            document.getElementById('weather-info').textContent = 'Не удалось определить местоположение';
        });
}

function getWeatherIcon(condition) {
    switch (condition) {
        case 'clear': return 'wb_sunny';
        case 'clouds': return 'cloud';
        case 'rain': return 'umbrella';
        case 'snow': return 'ac_unit';
        default: return 'cloud';
    }
}

// Пасхалки
function easterEgg() {
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'q') {
            alert('Пасхалка! Ты нашёл секретный код! 🎉');
            document.body.style.background = 'linear-gradient(135deg, #ff6f61, #ffb347)';
        }
    });

    document.querySelector('.logo').addEventListener('click', () => {
        let clicks = localStorage.getItem('logoClicks') || 0;
        clicks++;
        localStorage.setItem('logoClicks', clicks);
        if (clicks >= 5) {
            alert('Ты кликнул на логотип 5 раз! Вот тебе сюрприз! 🦄');
            document.body.style.backgroundImage = 'url("https://media.giphy.com/media/3o7TKtnuHOd6N90X6w/giphy.gif")';
            localStorage.setItem('logoClicks', 0);
        }
    });

    document.querySelector('.footer').addEventListener('click', () => {
        let footerClicks = localStorage.getItem('footerClicks') || 0;
        footerClicks++;
        localStorage.setItem('footerClicks', footerClicks);
        if (footerClicks >= 3) {
            alert('Мяу! Ты нашёл котика! 🐱');
            document.body.style.backgroundImage = 'url("https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif")';
            localStorage.setItem('footerClicks', 0);
        }
    });

    let typedKeys = '';
    document.addEventListener('keydown', (e) => {
        typedKeys += e.key.toLowerCase();
        if (typedKeys.includes('cat')) {
            alert('Мяу-мяу! Ты вызвал котика! 🐾');
            const catSound = new Audio('https://www.myinstants.com/media/sounds/cat-meow.mp3');
            catSound.play();
            typedKeys = '';
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname === '/' || window.location.pathname.includes('index') || window.location.pathname === '') {
        document.body.classList.add('index-page');
    }
    updateNews();
    getWeather();
    checkAdmin();
    easterEgg();
});
