const fetch = require('node-fetch');

const API_KEY = '6927db49ceccce78e842a6d031fe360f';
const city = 'London';

async function testWeather() {
  console.log(`Testing Weather API with key: ${API_KEY}`);
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Error: ${response.status} - ${response.statusText}`);
      const text = await response.text();
      console.error(`Response body: ${text}`);
    } else {
        const data = await response.json();
        console.log('Success! Weather data received:');
        console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

testWeather();
