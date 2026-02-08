const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

const app = express();
const WEATHER_API_KEY = '6927db49ceccce78e842a6d031fe360f';

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

let db;
(async () => {
  try {
    db = await mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: 'Cliffard06.#',  //changes as per your mysql password
      database: 'task'
    });
    console.log('Database connected successfully!');
  } catch (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }
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

app.get('/signup', (req, res) => {
  res.render('signup');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/weather', (req, res) => {
  res.render('weather');
});

app.post('/api/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'All fields are required!' });
    const hash = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO users (username, email, passwordHash) VALUES (?, ?, ?)', [username, email, hash]);
    res.json({ message: 'User registered successfully!' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || 'Signup failed' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    const user = rows[0];
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id }, 'secretKey');
    res.json({ message: 'Login successful', token });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || 'Login failed' });
  }
});

app.post('/api/submit', authMiddleware, async (req, res) => {
  try {
    const { name, email, age, password } = req.body;
    if (!name || !email || !age || !password) return res.status(400).json({ error: 'All fields are required!' });
    if (age < 18) return res.status(400).json({ error: 'You must be at least 18 years old.' });
    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{6,}$/;
    if (!strongPassword.test(password)) return res.status(400).json({ error: 'Password must contain uppercase, lowercase, number, and special character.' });
    const [result] = await db.query('INSERT INTO submissions (name, email, age, password) VALUES (?, ?, ?, ?)', [name, email, age, password]);
    res.json({ message: 'Submission successful!', submission: { id: result.insertId, name, email, age } });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || 'Submission failed' });
  }
});

app.get('/api/submissions', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM submissions');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || 'Failed to fetch submissions' });
  }
});

app.get('/api/submissions/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [rows] = await db.query('SELECT * FROM submissions WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Submission not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || 'Failed to fetch submission' });
  }
});

app.put('/api/submissions/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, email, age, password } = req.body;
    const [rows] = await db.query('SELECT * FROM submissions WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Submission not found' });
    await db.query('UPDATE submissions SET name = ?, email = ?, age = ?, password = ? WHERE id = ?', [name || rows[0].name, email || rows[0].email, age || rows[0].age, password || rows[0].password, id]);
    res.json({ message: 'Submission updated successfully!' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || 'Failed to update submission' });
  }
});

app.delete('/api/submissions/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [rows] = await db.query('SELECT * FROM submissions WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Submission not found' });
    await db.query('DELETE FROM submissions WHERE id = ?', [id]);
    res.json({ message: 'Submission deleted successfully!' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || 'Failed to delete submission' });
  }
});

// Weather API endpoints
app.get('/api/weather/city/:city', async (req, res) => {
  try {
    const city = req.params.city;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${WEATHER_API_KEY}&units=metric`;
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({ error: 'City not found' });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Weather API error:', err);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

app.get('/api/weather/coordinates/:lat/:lon', async (req, res) => {
  try {
    const { lat, lon } = req.params;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`;
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Unable to fetch weather' });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Weather API error:', err);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

app.get('/api/weather/forecast/:lat/:lon', async (req, res) => {
  try {
    const { lat, lon } = req.params;
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`;
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Unable to fetch forecast' });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Forecast API error:', err);
    res.status(500).json({ error: 'Failed to fetch forecast data' });
  }
});

app.get('/api/weather/uvi/:lat/:lon', async (req, res) => {
  try {
    const { lat, lon } = req.params;
    const url = `https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Unable to fetch UV index' });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('UV Index API error:', err);
    res.status(500).json({ error: 'Failed to fetch UV index data' });
  }
});

// 404 handler for API routes
app.use('/api/', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(8080, () => {
  console.log('Server running on http://localhost:8080');
});
