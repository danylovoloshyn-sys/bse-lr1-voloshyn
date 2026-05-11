# Лабораторна робота №3: Модульне тестування програмного коду (Unit Testing)

**Виконав:** Волошин Данило, ПЗПІ-25-6  
**Предметна область:** Система авторизації та управління налаштуваннями (API-ключами)

---

## 1. Тема та мета лабораторної роботи
**Мета:** Набуття практичних навичок із написання модульних тестів із використанням промислових фреймворків тестування (Jest). Оволодіння формальними техніками проєктування тестів — еквівалентне розбиття (EP) та аналіз граничних значень (BVA). Отримання досвіду інтерпретації метрик покриття коду та досягнення порогу покриття рядків не менше 80%.

---

## 2. Вихідний код реалізованого модуля

Модуль `authService.js` містить бізнес-логіку системи авторизації, розробленої в рамках ЛР 02. Реалізовано 3 методи з нетривіальною логікою (умови, валідація, генерація помилок).

```javascript
// authService.js
class AuthService {
    constructor() {
        this.users = [];
    }

    // Метод 1: Реєстрація користувача з перевіркою GDPR та віку
    registerUser(email, age, gdprAccepted) {
        if (!gdprAccepted) {
            throw new Error("Згода з GDPR є обов'язковою");
        }
        if (typeof age !== 'number' || age < 0) {
            throw new Error("Некоректний вік");
        }
        if (age < 13) {
            throw new Error("Користувач має бути старше 13 років");
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error("Некоректний формат email");
        }

        const existingUser = this.users.find(u => u.email === email);
        if (existingUser) {
            throw new Error("Користувач вже існує");
        }

        const newUser = { id: Date.now(), email, age, gdprAccepted, apiKeys: [], is2FAEnabled: false };
        this.users.push(newUser);
        return newUser;
    }

    // Метод 2: Додавання API-ключа
    addApiKey(email, provider, key) {
        const user = this.users.find(u => u.email === email);
        if (!user) {
            throw new Error("Користувача не знайдено");
        }
        const validProviders = ['OpenAI', 'Anthropic'];
        if (!validProviders.includes(provider)) {
            throw new Error("Непідтримуваний провайдер");
        }
        if (!key || key.length < 10) {
            throw new Error("Довжина API-ключа має бути не менше 10 символів");
        }

        const newKey = { provider, key, addedAt: new Date() };
        user.apiKeys.push(newKey);
        return newKey;
    }

    // Метод 3: Увімкнення двофакторної автентифікації
    enable2FA(email, phoneNumber) {
        const user = this.users.find(u => u.email === email);
        if (!user) {
            throw new Error("Користувача не знайдено");
        }
        if (user.is2FAEnabled) {
            throw new Error("2FA вже увімкнено");
        }
        const phoneRegex = /^\+\d{10,14}$/;
        if (!phoneRegex.test(phoneNumber)) {
            throw new Error("Некоректний формат телефону");
        }

        user.is2FAEnabled = true;
        user.phoneNumber = phoneNumber;
        return true;
    }
}

module.exports = AuthService;
## 3. Таблиця проєктування тестів

| Тест-кейс                    | Вхідні дані                             | Очікуваний результат                    | Техніка (EP/BVA)     | Статус |
| :--------------------------- | :-------------------------------------- | :-------------------------------------- | :------------------- | :----- |
| Реєстрація з віком 12        | `test@mail.com`, `12`, `true`           | Помилка "Користувач має бути старше 13" | **BVA** (межа - 1)   | Pass   |
| Реєстрація з віком 13        | `user13@mail.com`, `13`, `true`         | Успішне створення                       | **BVA** (межа)       | Pass   |
| Реєстрація без GDPR          | `test@mail.com`, `20`, `false`          | Помилка "Згода з GDPR..."               | **EP** (негативний)  | Pass   |
| Некоректний email            | `usermail.com`, `20`, `true`            | Помилка "Некоректний формат email"      | **EP** (негативний)  | Pass   |
| Дублікат email               | `duplicate@mail.com`, `25`, `true`      | Помилка "Користувач вже існує"          | **EP** (негативний)  | Pass   |
| Додавання ключа (провайдер)  | `test@mail.com`, `Google`, `123...0`    | Помилка "Непідтримуваний провайдер"     | **EP** (негативний)  | Pass   |
| Додавання ключа (довжина 9)  | `test@mail.com`, `OpenAI`, `123456789`  | Помилка "Довжина... не менше 10"        | **BVA** (межа - 1)   | Pass   |
| Додавання ключа (довжина 10) | `test@mail.com`, `OpenAI`, `1234567890` | Успішне додавання                       | **BVA** (межа)       | Pass   |
| 2FA: некоректний телефон     | `test@mail.com`, `380501234567`         | Помилка "Некоректний формат телефону"   | **EP** (без `+`)     | Pass   |
| 2FA: телефон (10 цифр)       | `test@mail.com`, `+1234567890`          | Успішне увімкнення 2FA                  | **BVA** (нижня межа) | Pass   |
| 2FA: повторне увімкнення     | `test@mail.com`, `+1234567890`          | Помилка "2FA вже увімкнено"             | **EP** (негативний)  | Pass   |
4. Вихідний код тестового набору
// authService.test.js
const AuthService = require('./authService');

describe('AuthService Unit Tests', () => {
    let authService;

    // Arrange: ініціалізація перед кожним тестом
    beforeEach(() => {
        authService = new AuthService();
    });

    // --- ТЕСТИ ДЛЯ registerUser ---
    test('BVA: Помилка реєстрації, якщо вік 12 років (межа - 1)', () => {
        const email = 'user@mail.com';
        const age = 12;
        const gdpr = true;
        expect(() => { authService.registerUser(email, age, gdpr); })
            .toThrow("Користувач має бути старше 13 років");
    });

    test('BVA: Успішна реєстрація, якщо вік 13 років (межа)', () => {
        const email = 'user13@mail.com';
        const user = authService.registerUser(email, 13, true);
        expect(user.email).toBe(email);
        expect(user.age).toBe(13);
    });

    test('EP (Негативний): Помилка реєстрації без згоди GDPR', () => {
        expect(() => { authService.registerUser('user@mail.com', 20, false); })
            .toThrow("Згода з GDPR є обов'язковою");
    });

    test('EP (Негативний): Помилка при некоректному форматі email', () => {
        expect(() => { authService.registerUser('usermail.com', 20, true); })
            .toThrow("Некоректний формат email");
    });

    test('EP (Негативний): Помилка реєстрації дубліката email', () => {
        const email = 'duplicate@mail.com';
        authService.registerUser(email, 25, true); 
        expect(() => { authService.registerUser(email, 30, true); })
            .toThrow("Користувач вже існує");
    });

    // --- ТЕСТИ ДЛЯ addApiKey ---
    test('EP (Негативний): Помилка при непідтримуваному провайдері', () => {
        authService.registerUser('test@mail.com', 20, true);
        expect(() => { authService.addApiKey('test@mail.com', 'Google', '1234567890'); })
            .toThrow("Непідтримуваний провайдер");
    });

    test('BVA: Помилка, якщо довжина API-ключа 9 символів (межа - 1)', () => {
        authService.registerUser('test@mail.com', 20, true);
        expect(() => { authService.addApiKey('test@mail.com', 'OpenAI', '123456789'); })
            .toThrow("Довжина API-ключа має бути не менше 10 символів");
    });

    test('BVA: Успішне додавання ключа довжиною 10 символів (межа)', () => {
        authService.registerUser('test@mail.com', 20, true);
        const validKey = '1234567890';
        const result = authService.addApiKey('test@mail.com', 'OpenAI', validKey);
        expect(result.key).toBe(validKey);
    });

    // --- ТЕСТИ ДЛЯ enable2FA ---
    test('EP (Негативний): Помилка при некоректному форматі телефону (без +)', () => {
        authService.registerUser('test@mail.com', 20, true);
        expect(() => { authService.enable2FA('test@mail.com', '380501234567'); })
            .toThrow("Некоректний формат телефону");
    });

    test('BVA: Успішне увімкнення 2FA з телефоном 10 цифр (нижня межа)', () => {
        authService.registerUser('test@mail.com', 20, true);
        const result = authService.enable2FA('test@mail.com', '+1234567890');
        expect(result).toBe(true);
    });

    test('EP (Негативний): Помилка повторного увімкнення 2FA', () => {
        authService.registerUser('test@mail.com', 20, true);
        authService.enable2FA('test@mail.com', '+1234567890');
        expect(() => { authService.enable2FA('test@mail.com', '+0987654321'); })
            .toThrow("2FA вже увімкнено");
    });
});
Звіт покриття коду
![Coverage Report](./img/coverage.png)

6. Посилання на Git-репозиторій
[Посилання на репозиторій додається сюди перед відправкою]

7. Висновки
Під час виконання лабораторної роботи було створено програмний модуль системи авторизації та покрито його модульними тестами за допомогою фреймворку Jest.

Аналіз результатів:

Написано 11 тест-кейсів із застосуванням формальних технік: еквівалентного розбиття (EP) для перевірки форматів та бізнес-логіки, та аналізу граничних значень (BVA) для перевірки віку, довжини API-ключа та номеру телефону.

Метрика покриття рядків (Line Coverage) склала 92.85%, що значно перевищує мінімальний поріг у 80%.

Покриття гілок (Branch Coverage) становить 88.46%. Непокриті рядки (13, 37, 56) відповідають перевіркам відсутності користувача в масиві під час виконання методів addApiKey та enable2FA. Оскільки метою було досягнення покриття >80%, поточний набір тестів визнано достатнім та успішним.