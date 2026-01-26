const express = require('express');
const bodyParser = require('body-parser');
console.log('Modules loaded');
const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
let submissions = [];



app.get('/', (req, res) => {
    res.render('index');
});

app.post('/submit', (req, res) => {
    const {name, email, age, password} = req.body;

    if(!name || !email || !age || !password){
        return res.send('All fields are required!');
    }

    if(age < 18){
        return res.send('You must be at least 18 years old to submit the form.');
    }

    if(password.length < 6){
        return res.send('Password must be at least 6 characters long.');
    }
    submissions.push({name, email, age, password});

    res.render('result', {name, email, age, password});
    
});

app.listen(8080, () => {
    console.log('Server is running on port 8080');
});