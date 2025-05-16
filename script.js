// API Configuration
const API_KEY = '9ca7afbb4e8af7702b98462af279f9b5';
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

// DOM Elements
const searchForm = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const weatherCard = document.getElementById('weather-card');
const loadingIndicator = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');
const backgroundElements = document.getElementById('background-elements');

// Background elements for different weather conditions
const backgroundConfig = {
    'clear': {
        class: 'sunny-bg',
        elements: '<div class="sun"></div>'
    },
    'clouds': {
        class: 'cloudy-bg',
        elements: `
            <div class="cloud cloud1"></div>
            <div class="cloud cloud2"></div>
            <div class="cloud cloud3"></div>
        `
    },
    'rain': {
        class: 'bg-gradient-to-br from-gray-400 to-gray-700',
        elements: ''
    },
    'snow': {
        class: 'snowy-bg',
        elements: ''
    },
    'thunderstorm': {
        class: 'bg-gradient-to-br from-gray-700 to-gray-900',
        elements: ''
    },
    'drizzle': {
        class: 'bg-gradient-to-br from-gray-300 to-gray-500',
        elements: ''
    },
    'mist': {
        class: 'bg-gradient-to-br from-gray-200 to-gray-400',
        elements: ''
    },
    'smoke': {
        class: 'bg-gradient-to-br from-gray-300 to-gray-500',
        elements: ''
    },
    'haze': {
        class: 'bg-gradient-to-br from-gray-300 to-gray-500',
        elements: ''
    },
    'dust': {
        class: 'bg-gradient-to-br from-yellow-200 to-yellow-500',
        elements: ''
    },
    'fog': {
        class: 'bg-gradient-to-br from-gray-200 to-gray-400',
        elements: ''
    },
    'sand': {
        class: 'bg-gradient-to-br from-yellow-200 to-yellow-500',
        elements: ''
    },
    'ash': {
        class: 'bg-gradient-to-br from-gray-400 to-gray-700',
        elements: ''
    },
    'squall': {
        class: 'bg-gradient-to-br from-gray-500 to-gray-800',
        elements: ''
    },
    'tornado': {
        class: 'bg-gradient-to-br from-gray-600 to-gray-900',
        elements: ''
    },
    'default': {
        class: 'bg-gradient-to-br from-blue-400 to-blue-600',
        elements: ''
    }
};

// Event Listeners
searchForm.addEventListener('submit', handleFormSubmit);

// Form submission handler
function handleFormSubmit(e) {
    e.preventDefault();
    const city = cityInput.value.trim();

    if (city) {
        fetchWeatherData(city);
    }
}

// Fetch weather data from API
async function fetchWeatherData(city) {
    // Show loading, hide previous results and errors
    loadingIndicator.classList.remove('hidden');
    weatherCard.classList.add('hidden');
    errorMessage.classList.add('hidden');

    try {
        const response = await fetch(`${BASE_URL}?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`);

        if (!response.ok) {
            throw new Error('City not found');
        }

        const data = await response.json();
        displayWeatherData(data);
    } catch (error) {
        showError(error.message);
    } finally {
        loadingIndicator.classList.add('hidden
