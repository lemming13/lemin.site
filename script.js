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

// Отображение новостей из newsData.js
function updateNews() {
    const newsGrids = document.querySelectorAll('#news-grid');
    if (!newsGrids.length) {
        console.error('Не найдено элементов с ID news-grid');
        return;
    }

    console.log('Загружено новостей из newsData:', newsData);

    const isIndexPage = document.querySelector('body').classList.contains('index-page');
    console.log('Это главная страница?', isIndexPage);

    newsGrids.forEach(grid => {
        grid.innerHTML = '';
        const newsToShow = isIndexPage ? newsData.slice(0, 3) : newsData;

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
    easterEgg();
});
