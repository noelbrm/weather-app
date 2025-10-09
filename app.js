import { createClient } from 'pexels';
import { CONFIG } from './config.js'
import { COUNTRY_CODES } from './counrty_codes.js';
const inputSearch = document.getElementById('input-search');
const btnSearch = document.getElementById('btn-search');
const textCity = document.getElementById('text-city');
const textCountry = document.getElementById('text-country');
const textTemp = document.getElementById('text-temp');
const textWeatherinfo = document.getElementById('text-weather-info');
const textTime = document.getElementById('text-time');
const textFeel = document.getElementById('text-feel-temp');
const textHumidity = document.getElementById('text-Humidity');
const textWind = document.getElementById('text-wind');
const textPressure = document.getElementById('text-pressure');
const iconWeather = document.getElementById('icon-weather');

const weatherAPI = 'https://api.openweathermap.org/data/2.5/weather?';
const weatherKEY = CONFIG.OPENWEATHER_API_KEY



function buildUrl(country) {
    if(country.value === "") return 0;
    const [city, countryName] = country.value.split(",").map(s => s.trim());
    const countryCode = COUNTRY_CODES[countryName] || 0;
    const query = countryCode ? `q=${city},${countryCode}` : `q=${city}`;
    const unit = '&units=metric';
    const key = '&appid='+weatherKEY

    return weatherAPI+query+unit+key;
}
async function getWeather() {
    console.log(inputSearch);
    const url = buildUrl(inputSearch);
    if (!url) return;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Could not fetch weather resource");
        const data = await response.json();
        console.log(data);
        displayWeather(data);
    } catch (err) {
        console.error(err);
    }
}

function displayWeather(weatherData) {
    textCountry.innerText = weatherData.name;
    textTemp.innerText = Math.trunc(weatherData.main.temp)+'°';
    textWeatherinfo.innerText = weatherData.weather[0].description;

    //translate unix time and display
    const unix_timestamp = new Date(weatherData.dt * 1000);
    const hours = unix_timestamp.getHours();
    const minutes = unix_timestamp.getMinutes();
    const hoursStr = String(hours).padStart(2, "0");
    const minutesStr = String(minutes).padStart(2, "0");
    textTime.innerText = `${hoursStr}:${minutesStr}`;

    textFeel.innerText = Math.trunc(weatherData.main.feels_like)+'°';
    textHumidity.innerText = weatherData.main.humidity+'%';
    textWind.innerText = Math.trunc(weatherData.wind.speed)+' km/h';
    textPressure.innerText = weatherData.main.pressure+' hPa';

    switch (weatherData.weather[0].main) {
        case 'Clouds':
            iconWeather.src = '../icons/bigones/scatterd-clouds.png';
            break;
        case 'Thunderstorm':
            iconWeather.src = '../icons/bigones/lightning.png';
            break;
        case 'Drizzle':
        case 'Rain':
            iconWeather.src = '../icons/bigones/rainpng.png';
            break;
        case 'Snow':
            iconWeather.src = '../icons/bigones/snow.png';
            break;
        case 'Clear':
            iconWeather.src = '../icons/bigones/clear-sky.png';
            break;
        default:
            iconWeather.src = '../icons/bigones/scatterd-clouds.png';
            break;

    }
}

btnSearch.addEventListener("click", getWeather);
