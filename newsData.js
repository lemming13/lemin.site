const newsData = [
    {
        id: 1,
        title: "Запуск сайта",
        text: "Мы запустили бета-версию lemin.site! И уже в скором времени выйдет новый проект.",
        date: "21.04.2025",
        image: "LeminBeta.png"
    }
];

// Экспортируем массив новостей (для Vercel нам не нужен настоящий export, но оставим для совместимости)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = newsData;
}
