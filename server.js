
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 임시 사용자 데이터베이스 (실제 환경에선 DB 사용)
const users = [];

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'super-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 1000 * 60 * 60
  }
}));

app.get('/', (req, res) => {
  if (req.session.userId) {
    res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
  } else {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
  }
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(password + salt, 10);
  users.push({ username, hashed, salt });
  res.json({ success: true, message: '회원가입 완료' });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user) return res.json({ success: false, message: '사용자 없음' });

  const isMatch = await bcrypt.compare(password + user.salt, user.hashed);
  if (!isMatch) return res.json({ success: false, message: '비밀번호 틀림' });

  req.session.userId = username;
  res.json({ success: true });
});

app.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
