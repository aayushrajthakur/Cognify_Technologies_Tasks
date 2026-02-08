const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

let db;
(async () => {
  db = await mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Cliffard06.#',
    database: 'task'
  });
})();

function authMiddleware(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, 'secretKey');
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/api/signup', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'All fields are required!' });
  const hash = await bcrypt.hash(password, 10);
  await db.query('INSERT INTO users (username, email, passwordHash) VALUES (?, ?, ?)', [username, email, hash]);
  res.json({ message: 'User registered successfully!' });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
  const user = rows[0];
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(400).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id }, 'secretKey');
  res.json({ message: 'Login successful', token });
});

app.post('/api/submit', authMiddleware, async (req, res) => {
  const { name, email, age, password } = req.body;
  if (!name || !email || !age || !password) return res.status(400).json({ error: 'All fields are required!' });
  if (age < 18) return res.status(400).json({ error: 'You must be at least 18 years old.' });
  const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{6,}$/;
  if (!strongPassword.test(password)) return res.status(400).json({ error: 'Password must contain uppercase, lowercase, number, and special character.' });
  const [result] = await db.query('INSERT INTO submissions (name, email, age, password) VALUES (?, ?, ?, ?)', [name, email, age, password]);
  res.json({ message: 'Submission successful!', submission: { id: result.insertId, name, email, age } });
});

app.get('/api/submissions', authMiddleware, async (req, res) => {
  const [rows] = await db.query('SELECT * FROM submissions');
  res.json(rows);
});

app.get('/api/submissions/:id', authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  const [rows] = await db.query('SELECT * FROM submissions WHERE id = ?', [id]);
  if (rows.length === 0) return res.status(404).json({ error: 'Submission not found' });
  res.json(rows[0]);
});

app.put('/api/submissions/:id', authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, email, age, password } = req.body;
  const [rows] = await db.query('SELECT * FROM submissions WHERE id = ?', [id]);
  if (rows.length === 0) return res.status(404).json({ error: 'Submission not found' });
  await db.query('UPDATE submissions SET name = ?, email = ?, age = ?, password = ? WHERE id = ?', [name || rows[0].name, email || rows[0].email, age || rows[0].age, password || rows[0].password, id]);
  res.json({ message: 'Submission updated successfully!' });
});

app.delete('/api/submissions/:id', authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  const [rows] = await db.query('SELECT * FROM submissions WHERE id = ?', [id]);
  if (rows.length === 0) return res.status(404).json({ error: 'Submission not found' });
  await db.query('DELETE FROM submissions WHERE id = ?', [id]);
  res.json({ message: 'Submission deleted successfully!' });
});

app.listen(8080, () => {
  console.log('Server running on http://localhost:8080');
});
