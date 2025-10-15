import {CONFIG} from './config.js'
import {COUNTRY_CODES} from './counrty_codes.js';

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
const loadingWeather = document.getElementById('loading-weather');
const currenWeather = document.getElementById('current-weather');
const forecastWeather = document.getElementById('5day-weather');
const buttonRight = document.getElementById('button-right');
const buttonLeft = document.getElementById('button-left');
const btnCities = document.querySelectorAll('.btn-city')
const forecastContainer = document.querySelector('.forecast-days')

const suggestionsContainer = document.createElement("ul");
suggestionsContainer.classList.add("absolute", "bg-white", "rounded-md", "shadow-md", "mt-1", "w-full", "z-50");
inputSearch.parentElement.appendChild(suggestionsContainer);
let cities = [];
let debounceTimer;

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const weatherAPI = 'https://api.openweathermap.org/data/2.5/weather?';
const weatherAPI5 = 'https://api.openweathermap.org/data/2.5/forecast?';
const weatherKEY = CONFIG.OPENWEATHER_API_KEY

async function initApp() {
    await getWeather("Tokyo, Japan")
    switchView('current');
    loadingWeather.classList.add('hidden')
    await loadCities();
}

initApp()

//Switch between today or 5 day forecast weather
function showEl(el) {
    if (el) {
        el.classList.remove('hidden');
        el.setAttribute('aria-hidden', 'false');
    }
}

function hideEL(el) {
    el.classList.add('hidden');
    el.setAttribute('aria-hidden', 'true');
}

function switchView(mode) {
    if (mode === 'current') {
        showEl(currenWeather);
        hideEL(forecastWeather);
    }
    if (mode === 'forecast') {
        showEl(forecastWeather);
        hideEL(currenWeather);
    }
}

buttonLeft.addEventListener('click', e => {
    const mode = e.currentTarget.dataset.mode;
    document.getElementById('view-text').innerText = 'Today';
    switchView(mode);
});
buttonRight.addEventListener("click", (e) => {
    const mode = e.currentTarget.dataset.mode;
    document.getElementById('view-text').innerText = '5-Day forecast';
    switchView(mode);
});


//Build Weather functionality
function buildUrl(country) {
    const val = (typeof country === 'string') ? country : country?.value;
    if (!val || val.trim() === "") return 0;

    const [city, countryName] = val.split(",").map(s => s.trim());
    const countryCode = COUNTRY_CODES[countryName] || 0;
    const query = countryCode ? `q=${city},${countryCode}` : `q=${city}`;
    const unit = '&units=metric';
    const key = '&appid=' + weatherKEY;

    return weatherAPI5 + query + unit + key;
}


function getCountryNameByCode(code) {
    return Object.keys(COUNTRY_CODES).find(
        country => COUNTRY_CODES[country] === code) || null;
}

async function getWeather(inputName1) {
    const url = buildUrl(inputName1);
    if (!url) return;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Could not fetch weather resource");
        const data = await response.json();
        console.log(data)
        displayWeather(data);
    } catch (err) {
        console.error(err);
    }
}

function displayWeather(weatherData) {
    cityImage(weatherData.city.name);
    const forecastAll = getForecast(weatherData.list);
    showForecast(forecastAll);
    textCountry.innerText = weatherData.city.name;
    textCity.innerText = getCountryNameByCode(weatherData.city.country);
    textTemp.innerText = Math.trunc(weatherData.list[0].main.temp) + '°';
    textWeatherinfo.innerText = weatherData.list[0].weather[0].description;
    const todayDate = new Date((weatherData.list[0].dt) * 1000);
    textTime.innerText = todayDate.toLocaleTimeString()
    const getWeekday = date => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    console.log(weatherData.list[0].dt_txt.get)

    textFeel.innerText = Math.trunc(weatherData.list[0].main.feels_like) + '°';
    textHumidity.innerText = weatherData.list[0].main.humidity + '%';
    textWind.innerText = Math.trunc(weatherData.list[0].wind.speed) + ' km/h';
    textPressure.innerText = weatherData.list[0].main.pressure + ' hPa';

    //document.getElementById("loading-weather").classList.add("hidden");
    //document.getElementById("current-weather").classList.remove("hidden");

    iconWeather.src = getIcon(weatherData.list[0].weather[0].main)

}

//Fetch city background picture and return URL
async function cityImage(cityName) {
    const query = encodeURIComponent(cityName + " Skyline City");
    const orientation = "landscape"
    const url = `https://api.pexels.com/v1/search?query=${query}&orientation=${orientation}&per_page=1`;

    try {
        const response = await fetch(url, {
            headers: {
                Authorization: CONFIG.PEXELS_API_KEY
            }
        });

        if (!response.ok) throw new Error("Pexels request failed");
        const pictureData = await response.json();
        const newImage = pictureData.photos[0].src.landscape;
        document.body.style.setProperty('--bg-url', `url("${newImage}")`);
    } catch (err) {
        console.error(err);
    }
}

//Input field city search auto complete
async function loadCities() {
    const res = await fetch("../all-countries-and-cities.json");
    const data = await res.json();
    cities = Object.entries(data).flatMap(([country, cityList]) =>
        cityList.map(city => ({city, country}))
    );
    console.log("Loaded", cities.length, "cities");
}

inputSearch.addEventListener("input", (e) => {
    clearTimeout(debounceTimer);
    const query = e.target.value.trim().toLowerCase();

    if (query.length < 3) {
        suggestionsContainer.innerHTML = "";
        return;
    }

    debounceTimer = setTimeout(() => {
        showSuggestions(query);
    }, 250);
});

function showSuggestions(query) {
    const matches = cities.filter(({city}) =>
        city.toLowerCase().startsWith(query)
    ).slice(0, 4);

    renderSuggestions(matches);
}

function renderSuggestions(matches) {
    suggestionsContainer.innerHTML = "";

    if (matches.length === 0) {
        suggestionsContainer.innerHTML = `<li class="p-2 text-gray-500">Keine Treffer</li>`;
        return;
    }
    matches.forEach(({city, country}) => {
        const li = document.createElement("li");
        li.textContent = `${city}, ${country}`;
        li.classList.add("p-2", "hover:bg-gray-100", "cursor-pointer");
        li.addEventListener("click", () => {
            inputSearch.value = `${city}, ${country}`;
            suggestionsContainer.innerHTML = "";
        });
        suggestionsContainer.appendChild(li);
    });
}

btnSearch.addEventListener("click", () => getWeather(inputSearch));
btnCities.forEach(btn => {
    btn.addEventListener("click", e => {
        const city = e.target.innerText + ", " + e.currentTarget.querySelector("span").innerText;
        getWeather(city);
    });
});
inputSearch.addEventListener("keyup", event => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    getWeather(inputSearch);
})
//Initial weather

//Weather forecast 5 days
//1. Wir bekommen die Daten
//2. den ersten eintrag als ersten Tag nehmen!
//3. den nachsten Tag herausfinden und davon den 1400 eintrag nehmen
//4. Das ganze 5 mal insgesamt wiederholen!
function getForecast(forecast) {
    const dateToday = new Date()
    let weatherData = []

    for (let i = 0; i < forecast.length; i++) {
        const datex = new Date(forecast[i].dt * 1000)
        if (datex.getHours() === 14 || i === 0) {
            weatherData.push({
                day: datex.getDay() === dateToday.getDay() ? "Today" : weekdays[datex.getDay()],
                date: months[datex.getMonth()].slice(0, 3) + " " + datex.getDate(),
                temp: Math.trunc(forecast[i].main.temp),
                wind: Math.trunc(forecast[i].wind.speed),
                desc: forecast[i].weather[0].main,
                icon: getIcon(forecast[i].weather[0].main)
            });
        } else {
            continue
        }
        if (weatherData.length === 5) {
            break;
        }
    }
    console.log(weatherData)
    return weatherData;
}

function showForecast(foreCastData) {
    forecastContainer.innerHTML = foreCastData.map(item => `
    <div class="flex flex-row justify-between px-2 py-3 bg-[#E9EBED] rounded-xl">
      <div class="text-left w-1/3">
        <p>${item.day}</p>
        <p class="text-sm text-gray-500 font-light">${item.date}</p>
      </div>
      <div class="flex flex-row items-center gap-2 w-1/3 justify-center">
        <img src="${item.icon}" class="w-9 h-9">
        <p class="text-sm text-gray-500 font-light">${item.desc}</p>
      </div>
      <div class="w-1/3 text-right">
        <p>${item.temp}°</p>
        <p class="text-sm text-gray-500 font-light">${item.wind} km/h</p>
      </div>
    </div>
  `).join("");
}

function getIcon(weatherDiscription) {
    let srcpicture = ''
    switch (weatherDiscription) {
        case 'Clouds':
            srcpicture = '../icons/bigones/scatterd-clouds.png';
            break;
        case 'Thunderstorm':
            srcpicture = '../icons/bigones/lightning.png';
            break;
        case 'Drizzle':
        case 'Rain':
            srcpicture = '../icons/bigones/rainpng.png';
            break;
        case 'Snow':
            srcpicture = '../icons/bigones/snow.png';
            break;
        case 'Clear':
            srcpicture = '../icons/bigones/clear-sky.png';
            break;
        default:
            srcpicture = '../icons/bigones/scatterd-clouds.png';
            break;
    }
    return srcpicture;
}


