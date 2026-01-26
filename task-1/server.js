const express = require('express');
const bodyParser = require('body-parser');
console.log('Modules loaded');
const app = express();

console.log('App created');
app.use(bodyParser.urlencoded({extended: true}));

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/submit', (req, res) => {
    const {name, email} = req.body;
    res.render('result', {name, email});
});

app.listen(8080, () => {
    console.log('Server is running on port 8080');
});