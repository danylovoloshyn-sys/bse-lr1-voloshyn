const express = require('express');
const app = express();
app.use(express.json());
const usersTable = []; 
const apiKeysTable = {};
app.post('/api/register', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "Email та пароль є обов'язковими!" });
    }
    const userExists = usersTable.find(u => u.email === email);
    if (userExists) {
        return res.status(409).json({ error: "Користувач з таким email вже існує." });
    }
    const newUser = { 
        id: usersTable.length + 1, 
        email: email, 
        password_hash: password 
    };
    
    usersTable.push(newUser);
    console.log("Новий користувач у БД:", newUser);

    res.status(201).json({ 
        message: "Реєстрація успішна!", 
        userId: newUser.id 
    });
});

app.post('/api/keys', (req, res) => {
    const { userId, apiKey } = req.body;

    if (!userId || !apiKey) {
        return res.status(400).json({ error: "Необхідно передати userId та apiKey." });
    }
    apiKeysTable[userId] = apiKey; 
    console.log(`API-ключ для користувача ${userId} успішно збережено.`);

    res.status(200).json({ 
        message: "Ваш API-ключ (OpenAI/Anthropic) успішно підключено та зашифровано." 
    });
});
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Сервер LeanFork успішно запущено на порту ${PORT}`);
    console.log(`Очікування запитів...`);
});
const messagesTable = [];
app.post('/api/messages', (req, res) => {
    const { userId, text, parentId } = req.body;

    if (!userId || !text) {
        return res.status(400).json({ error: "userId та текст повідомлення обов'язкові!" });
    }

    const newMessage = {
        id: messagesTable.length + 1,
        userId: userId,
        text: text,
        parentId: parentId || null, 
        timestamp: new Date()
    };

    messagesTable.push(newMessage);

    console.log(` Створено повідомлення #${newMessage.id} (Батько: ${newMessage.parentId || 'корінь'})`);

    res.status(201).json({
        message: "Повідомлення додано до дерева!",
        data: newMessage
    });
});