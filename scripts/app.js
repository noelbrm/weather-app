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
const currentWeather = document.getElementById('current-weather');
const forecastWeather = document.getElementById('5day-weather');
const buttonRight = document.getElementById('button-right');
const buttonLeft = document.getElementById('button-left');
const btnCities = document.querySelectorAll('.btn-city');
const forecastContainer = document.querySelector('.forecast-days');
const suggestionsContainer = document.createElement("ul");
suggestionsContainer.classList.add("absolute", "bg-white", "rounded-md", "shadow-md", "mt-1", "w-full", "z-50");
inputSearch.parentElement.appendChild(suggestionsContainer);

let cities = null;
let COUNTRY_CODES = null;
let debounceTimer;

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const weatherAPI = '/.netlify/functions/fetch-weather?';
const pictureAPI = '/.netlify/functions/fetch-pexels?';

//Event Listener
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

btnSearch.addEventListener("click", () => getWeather(inputSearch));
btnCities.forEach(btn => {
    btn.addEventListener("click", e => {
        const city = e.target.innerText + ", " + e.currentTarget.querySelector("span").innerText;
        getWeather(city);
    });
});

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

inputSearch.addEventListener("keyup", event => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    getWeather(inputSearch);
})

//Switch between today or 5 day forecast weather
function showElement(el) {
    if (el) {
        el.classList.remove('hidden');
        el.setAttribute('aria-hidden', 'false');
    }
}

function hideElement(el) {
    el.classList.add('hidden');
    el.setAttribute('aria-hidden', 'true');
}

function switchView(mode) {
    if (mode === 'current') {
        showElement(currentWeather);
        hideElement(forecastWeather);
    }
    if (mode === 'forecast') {
        showElement(forecastWeather);
        hideElement(currentWeather);
    }
}

//Weather API functions and helper functions
async function loadCountryCodes() {
    if (!COUNTRY_CODES) {
        const res = await fetch("../data/counrty-codes.json");
        COUNTRY_CODES = await res.json();
    }
}

async function buildUrl(country) {
    const val = (typeof country === 'string') ? country : country?.value;
    if (!val || val.trim() === "") return null;

    const [city, countryName] = val.split(",").map(s => s.trim());
    const countryCode = COUNTRY_CODES[countryName] || null;
    const query = countryCode ? `${city},${countryCode}` : city;
    return `${weatherAPI}q=${query}`;
}

function getCountryNameByCode(code) {
    return Object.keys(COUNTRY_CODES).find(
        country => COUNTRY_CODES[country] === code) || null;
}

async function getWeather(inputName1) {
    const url = await buildUrl(inputName1);
    if (!url) return;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("Error fetching weather data");
        }
        const data = await response.json();
        displayWeather(data);
    } catch (err) {
        inputSearch.classList.add('bg-red-100');
        setTimeout(() => inputSearch.classList.remove('bg-red-100'), 3000);
        console.error(err);
    }
}

function displayWeather(weatherData) {
    const {list, city} = weatherData;
    document.title = `Weather ${city.name}`
    cityImage(weatherData.city.name);
    const forecastAll = getForecast(list);
    showForecast(forecastAll);
    textCountry.innerText = city.name;
    textCity.innerText = getCountryNameByCode(city.country);
    textTemp.innerText = Math.trunc(list[0].main.temp) + '°';
    textWeatherinfo.innerText = list[0].weather[0].description;
    const todayDate = new Date((list[0].dt) * 1000);
    textTime.innerText = todayDate.toLocaleTimeString()
    textFeel.innerText = Math.trunc(list[0].main.feels_like) + '°';
    textHumidity.innerText = list[0].main.humidity + '%';
    textWind.innerText = Math.trunc(list[0].wind.speed) + ' km/h';
    textPressure.innerText = list[0].main.pressure + ' hPa';
    iconWeather.src = getIcon(list[0].weather[0].main);
}

//City background API functions and helper functions
async function cityImage(cityName) {
    const query = encodeURIComponent(cityName + " Skyline City");
    const orientation = "landscape"
    try {
        const response = await fetch(`${pictureAPI}query=${query}`, {
            headers: {
                Authorization: CONFIG.PEXELS_API_KEY
            }
        });

        if (!response.ok) throw new Error("Pexels request failed");
        const pictureData = await response.json();
        const newImage = pictureData.photos[0].src.landscape;
        document.body.style.setProperty('--bg-url', `url("${newImage}")`);
        document.getElementById('photographer-link').innerText = `${pictureData.photos[0].photographer}`;
        document.getElementById('photographer-link').href = pictureData.photos[0].photographer_url;
    } catch (err) {
        console.error(err);
    }
}

async function loadCities() {
    const res = await fetch("../data/all-countries-and-cities.json");
    const data = await res.json();
    cities = Object.keys(data).flatMap(country =>
        data[country].map(city => ({city, country}))
    );
}

//Show city suggestions to user
function showSuggestions(query) {
    const matches = cities.filter(({city}) =>
        city.toLowerCase().startsWith(query)
    ).slice(0, 4);

    renderSuggestions(matches);
}

function renderSuggestions(matches) {
    suggestionsContainer.innerHTML = "";

    if (matches.length === 0) {
        suggestionsContainer.innerHTML = `<li class="p-2 text-gray-500">Nothing Found</li>`;
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

//Helper Functions
function getForecast(forecast) {
    const dateToday = new Date();
    let weatherData = [];

    for (let i = 0; i < forecast.length; i++) {
        const date = new Date(forecast[i].dt * 1000);
        if (date.getHours() === 14 || i === 0) {
            weatherData.push({
                day: date.getDay() === dateToday.getDay() ? "Today" : weekdays[date.getDay()],
                date: months[date.getMonth()].slice(0, 3) + " " + date.getDate(),
                temp: Math.trunc(forecast[i].main.temp),
                wind: Math.trunc(forecast[i].wind.speed),
                desc: forecast[i].weather[0].main,
                icon: getIcon(forecast[i].weather[0].main)
            });
        } else {
            continue;
        }
        if (weatherData.length === 5) {
            break;
        }
    }
    return weatherData;
}

function showForecast(foreCastData) {
    forecastContainer.innerHTML = foreCastData.map(item => `
    <div class="flex flex-row justify-between px-2 py-3 bg-[#E9EBED] rounded-xl shadow-md">
      <div class="text-left w-1/3">
        <p>${item.day}</p>
        <p class="text-sm text-gray-500 font-light">${item.date}</p>
      </div>
      <div class="flex flex-row items-center gap-2 w-1/3 justify-center flex-wrap">
        <img src="${item.icon}" class="w-9 h-9" alt="Icon">
        <p class="text-sm text-gray-500 font-light">${item.desc}</p>
      </div>
      <div class="w-1/3 text-right">
        <p>${item.temp}°</p>
        <p class="text-sm text-gray-500 font-light">${item.wind} km/h</p>
      </div>
    </div>
  `).join("");
}

function getIcon(weatherDescription) {
    let pictureSrc;
    switch (weatherDescription) {
        case 'Clouds':
            pictureSrc = '../icons/bigones/scatterd-clouds.png';
            break;
        case 'Thunderstorm':
            pictureSrc = '../icons/bigones/lightning.png';
            break;
        case 'Drizzle':
        case 'Rain':
            pictureSrc = '../icons/bigones/rainpng.png';
            break;
        case 'Snow':
            pictureSrc = '../icons/bigones/snow.png';
            break;
        case 'Clear':
            pictureSrc = '../icons/bigones/clear-sky.png';
            break;
        default:
            pictureSrc = '../icons/bigones/scatterd-clouds.png';
            break;
    }
    return pictureSrc;
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadCountryCodes();
    await getWeather("Tokyo, Japan")
    await loadCities();
    switchView('current');
    loadingWeather.classList.add('hidden')
});