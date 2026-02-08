const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

let submissions = [];
let nextId = 0; // ensure unique IDs

// --------------------
// EJS Routes
// --------------------
app.get('/', (req, res) => {
    res.render('index');
});

app.post('/submit', (req, res) => {
    const { name, email, age, password } = req.body;

    if (!name || !email || !age || !password) {
        return res.send('All fields are required!');
    }
    if (age < 18) {
        return res.send('You must be at least 18 years old.');
    }
    if (password.length < 6) {
        return res.send('Password must be at least 6 characters long.');
    }

    const submission = { id: nextId++, name, email, age, password };
    submissions.push(submission);

    res.render('result', submission);
});

// --------------------
// RESTful API Routes
// --------------------

// CREATE
app.post('/api/submit', (req, res) => {
    const { name, email, age, password } = req.body;

    if (!name || !email || !age || !password) {
        return res.status(400).json({ error: 'All fields are required!' });
    }
    if (age < 18) {
        return res.status(400).json({ error: 'You must be at least 18 years old.' });
    }
    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{6,}$/;
    if (!strongPassword.test(password)) {
        return res.status(400).json({ error: 'Password must contain uppercase, lowercase, number, and special character.' });
    }

    const submission = { id: nextId++, name, email, age, password };
    submissions.push(submission);

    res.json({ message: 'Submission successful!', submission });
});

// READ all
app.get('/api/submissions', (req, res) => {
    res.json(submissions);
});

// READ one
app.get('/api/submissions/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const submission = submissions.find(s => s.id === id);
    if (submission) {
        res.json(submission);
    } else {
        res.status(404).json({ error: 'Submission not found' });
    }
});

// UPDATE
app.put('/api/submissions/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const submission = submissions.find(s => s.id === id);

    if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
    }

    const { name, email, age, password } = req.body;
    if (name) submission.name = name;
    if (email) submission.email = email;
    if (age) submission.age = age;
    if (password) submission.password = password;

    res.json({ message: 'Submission updated successfully!', submission });
});

// DELETE
app.delete('/api/submissions/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = submissions.findIndex(s => s.id === id);

    if (index === -1) {
        return res.status(404).json({ error: 'Submission not found' });
    }

    const deleted = submissions.splice(index, 1);
    res.json({ message: 'Submission deleted successfully!', deleted });
});

// --------------------
// Server Start
// --------------------
app.listen(8080, () => {
    console.log('Server running on http://localhost:8080');
});
