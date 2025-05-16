document.addEventListener('DOMContentLoaded', () => {
    const apiKey = '9ca7afbb4e8af7702b98462af279f9b5';
    const fixedCities = [
        { name: "Seattle, WA", query: "Seattle,WA,US", id: "seattle" },
        { name: "Tacoma, WA", query: "Tacoma,WA,US", id: "tacoma" },
        { name: "Sana'a, Yemen", query: "Sana'a,YE", id: "sanaa" }
    ];

    const searchInput = document.getElementById('city-search-input');
    const searchButton = document.getElementById('search-button');
    const searchedCityCard = document.getElementById('searched-city-card');
    document.getElementById('current-year').textContent = new Date().getFullYear();

    // Store icon mapping
    const weatherIconMap = {
        '01d': 'assets/icons/day_clear.svg', '01n': 'assets/icons/night_half_moon_clear.svg',
        '02d': 'assets/icons/day_partial_cloud.svg', '02n': 'assets/icons/night_half_moon_partial_cloud.svg',
        '03d': 'assets/icons/cloudy.svg', '03n': 'assets/icons/cloudy.svg', // Often same for scattered/broken
        '04d': 'assets/icons/overcast.svg', '04n': 'assets/icons/overcast.svg', // Broken/Overcast clouds
        '09d': 'assets/icons/rain.svg', '09n': 'assets/icons/rain.svg', // Shower rain
        '10d': 'assets/icons/day_rain.svg', '10n': 'assets/icons/night_half_moon_rain.svg',
        '11d': 'assets/icons/thunderstorm.svg', '11n': 'assets/icons/thunderstorm.svg',
        '13d': 'assets/icons/snow.svg', '13n': 'assets/icons/snow.svg',
        '50d': 'assets/icons/mist.svg', '50n': 'assets/icons/mist.svg',
        'unknown': 'assets/icons/unknown.svg'
    };

    /**
     * Fetches weather data for a given city query.
     */
    async function getWeatherData(cityQuery) {
        const encodedCityQuery = encodeURIComponent(cityQuery);
        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodedCityQuery}&appid=${apiKey}&units=metric`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`City "${cityQuery.split(',')[0]}" not found.`);
                }
                throw new Error(`API error! Status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error fetching weather data for " + cityQuery + ":", error);
            return { error: true, message: error.message }; // Return error object
        }
    }

    /**
     * Updates the UI for a weather card (both searched and favorite).
     * @param {string} cardId - The ID of the HTML element for the city card.
     * @param {Object} weatherData - The weather data object.
     * @param {boolean} isSearchedCard - Flag to distinguish searched card from favorites.
     */
    function updateWeatherUI(cardId, weatherData, isSearchedCard = false) {
        const cardElement = document.getElementById(cardId);
        if (!cardElement) {
            console.error("Could not find card element for ID:", cardId);
            return;
        }

        const cityNameEl = cardElement.querySelector('.city-name');
        const tempEl = cardElement.querySelector('.temperature');
        const descEl = cardElement.querySelector('.weather-description');
        const iconEl = cardElement.querySelector('.weather-icon');
        const errorEl = cardElement.querySelector('.error-message');

        // Elements specific to the main searched card
        const currentTimeEl = isSearchedCard ? cardElement.querySelector('.current-time') : null;
        const feelsLikeEl = isSearchedCard ? cardElement.querySelector('.feels-like-temp') : null;
        const humidityEl = isSearchedCard ? cardElement.querySelector('.humidity-value') : null;
        const windEl = isSearchedCard ? cardElement.querySelector('.wind-speed') : null;


        if (weatherData.error || weatherData.cod !== 200) {
            const message = weatherData.message || "Could not fetch data.";
            if (isSearchedCard) {
                cityNameEl.textContent = "Error";
                tempEl.textContent = '--°C';
                descEl.textContent = message;
                if(feelsLikeEl) feelsLikeEl.textContent = '--°C';
                if(humidityEl) humidityEl.textContent = '--%';
                if(windEl) windEl.textContent = '-- m/s';
                if(currentTimeEl) currentTimeEl.textContent = '';
                cardElement.style.display = 'block'; // Ensure it's visible to show error
            } else { // For favorite cards
                tempEl.textContent = 'N/A';
                descEl.textContent = 'Error';
            }
            iconEl.src = weatherIconMap['unknown'];
            iconEl.alt = 'Error icon';
            errorEl.textContent = message;
            errorEl.style.display = 'block';
            cardElement.className = 'weather-card' + (isSearchedCard ? '' : ' small-card') + ' error-state'; // Reset and add error state
            clearAnimations(cardElement);
            return;
        }

        errorEl.style.display = 'none';
        cardElement.classList.remove('error-state');

        const mainWeather = weatherData.weather[0].main.toLowerCase();
        const iconCode = weatherData.weather[0].icon;

        cityNameEl.textContent = weatherData.name + (weatherData.sys.country ? `, ${weatherData.sys.country}` : '');
        tempEl.textContent = `${Math.round(weatherData.main.temp)}°C`;
        descEl.textContent = weatherData.weather[0].description;
        iconEl.src = weatherIconMap[iconCode] || weatherIconMap['unknown'];
        iconEl.alt = weatherData.weather[0].description;

        if (isSearchedCard) {
            cardElement.style.display = 'block'; // Show the card
            if(feelsLikeEl) feelsLikeEl.textContent = `${Math.round(weatherData.main.feels_like)}°C`;
            if(humidityEl) humidityEl.textContent = `${weatherData.main.humidity}%`;
            if(windEl) windEl.textContent = `${weatherData.wind.speed.toFixed(1)} m/s`;
            if(currentTimeEl) {
                // Calculate local time of the city
                const localTime = new Date((weatherData.dt + weatherData.timezone) * 1000);
                currentTimeEl.textContent = `Local Time: ${localTime.getUTCHours().toString().padStart(2,'0')}:${localTime.getUTCMinutes().toString().padStart(2,'0')}`;
            }
        }

        setWeatherBackgroundAndAnimations(cardElement, mainWeather, weatherData.weather[0].id);
    }

    /**
     * Sets the background class and triggers animations.
     */
    function setWeatherBackgroundAndAnimations(cardElement, weatherMain, weatherId) {
        cardElement.classList.remove('sunny', 'cloudy', 'rainy', 'snowy', 'misty', 'thunderstorm-bg'); // Added more specifics
        clearAnimations(cardElement);

        // More specific conditions based on ID if needed, fallback to main
        if (weatherMain === 'clear') {
            cardElement.classList.add('sunny');
        } else if (weatherMain === 'clouds') {
            cardElement.classList.add('cloudy');
            createClouds(cardElement, weatherId); // weatherId for cloud density
        } else if (weatherMain === 'rain' || weatherMain === 'drizzle') {
            cardElement.classList.add('rainy');
            createRaindrops(cardElement);
        } else if (weatherMain === 'snow') {
            cardElement.classList.add('snowy');
            createSnowflakes(cardElement);
        } else if (weatherMain === 'mist' || weatherMain === 'fog' || weatherMain === 'haze' || weatherMain === 'smoke') {
            cardElement.classList.add('misty'); // Simple gradient, or subtle fog animation
        } else if (weatherMain === 'thunderstorm') {
            cardElement.classList.add('thunderstorm-bg'); // Dark, stormy
            createRaindrops(cardElement); // Thunderstorms often have rain
            // createLightning(cardElement); // Optional: advanced
        } else {
            // Default background if no specific condition matches
        }
    }

    /**
     * Clears dynamically created animation elements.
     */
    function clearAnimations(cardElement) {
        const existingAnimations = cardElement.querySelectorAll('.raindrop, .snowflake, .cloud, .lightning-bolt');
        existingAnimations.forEach(el => el.remove());
    }

    function createClouds(cardElement, weatherId) {
        clearAnimations(cardElement); // Clear old clouds
        let cloudCount = 3; // Default for 'few clouds'
        if (weatherId === 802) cloudCount = 5; // Scattered clouds
        if (weatherId === 803) cloudCount = 7; // Broken clouds
        if (weatherId === 804) cloudCount = 9; // Overcast clouds

        for (let i = 0; i < cloudCount; i++) {
            const cloud = document.createElement('div');
            cloud.classList.add('cloud');

            const size = 50 + Math.random() * 100; // 50px to 150px wide
            cloud.style.width = `${size}px`;
            cloud.style.height = `${size * (0.4 + Math.random() * 0.3)}px`; // Vary aspect ratio
            cloud.style.top = `${Math.random() * 40}%`; // Position in upper 40%
            cloud.style.setProperty('--initial-offset', `${Math.random() * 100 - 50}%`); // For staggering

            // More complex cloud shapes using pseudo-elements
            cloud.style.setProperty('--c1-size', `${size * 0.6}px`);
            cloud.style.setProperty('--c1-top', `-${size * 0.2}px`);
            cloud.style.setProperty('--c1-left', `${size * 0.1}px`);

            cloud.style.setProperty('--c2-size', `${size * 0.8}px`);
            cloud.style.setProperty('--c2-top', `-${size * 0.1}px`);
            cloud.style.setProperty('--c2-right', `${size * 0.15}px`);

            cloud.style.animationDuration = `${15 + Math.random() * 20}s`; // 15s to 35s
            cloud.style.animationDelay = `${Math.random() * 5}s`;
            cloud.style.animationTimingFunction = 'linear';
            cloud.style.animationName = 'moveCloud, fadeInCloud';
            cloud.style.animationFillMode = 'forwards'; // Keep fadeInCloud state

            // Randomly make some clouds move right-to-left
            if (Math.random() > 0.5) {
                cloud.style.animationDirection = 'reverse';
            }

            cardElement.appendChild(cloud);
        }
    }


    function createRaindrops(cardElement) {
        clearAnimations(cardElement);
        const numRaindrops = Math.floor(cardElement.offsetWidth / 10); // Density based on card width
        for (let i = 0; i < numRaindrops; i++) {
            const raindrop = document.createElement('div');
            raindrop.classList.add('raindrop');
            raindrop.style.left = `${Math.random() * 100}%`;
            raindrop.style.animationDuration = `${0.4 + Math.random() * 0.4}s`;
            raindrop.style.animationDelay = `${Math.random() * 1.5}s`;
            if (Math.random() > 0.3) { // Some slanting
                raindrop.style.transform = `skewX(${Math.random() * 10 - 5}deg)`;
            }
            cardElement.appendChild(raindrop);
        }
    }

    function createSnowflakes(cardElement) {
        clearAnimations(cardElement);
        const numSnowflakes = Math.floor(cardElement.offsetWidth / 8);
        for (let i = 0; i < numSnowflakes; i++) {
            const snowflake = document.createElement('div');
            snowflake.classList.add('snowflake');
            snowflake.style.left = `${Math.random() * 100}%`;
            const size = `${3 + Math.random() * 5}px`;
            snowflake.style.width = size;
            snowflake.style.height = size;
            snowflake.style.opacity = `${0.5 + Math.random() * 0.5}`; // Vary initial opacity
            snowflake.style.setProperty('--sway-distance', `${Math.random() * 40 - 20}px`); // -20px to +20px sway
            snowflake.style.animationDuration = `${4 + Math.random() * 4}s`;
            snowflake.style.animationDelay = `${Math.random() * 6}s`;
            cardElement.appendChild(snowflake);
        }
    }

    /**
     * Handles search functionality.
     */
    async function handleSearch() {
        const query = searchInput.value.trim();
        if (!query) {
            updateWeatherUI('searched-city-card', { error: true, message: "Please enter a city name." }, true);
            return;
        }
        // Show a loading state on the searched card
        searchedCityCard.style.display = 'block';
        const loadingElements = {
            cityNameEl: searchedCityCard.querySelector('.city-name'),
            tempEl: searchedCityCard.querySelector('.temperature'),
            descEl: searchedCityCard.querySelector('.weather-description'),
            iconEl: searchedCityCard.querySelector('.weather-icon'),
            errorEl: searchedCityCard.querySelector('.error-message'),
            feelsLikeEl: searchedCityCard.querySelector('.feels-like-temp'),
            humidityEl: searchedCityCard.querySelector('.humidity-value'),
            windEl: searchedCityCard.querySelector('.wind-speed'),
            currentTimeEl: searchedCityCard.querySelector('.current-time')
        };

        loadingElements.cityNameEl.textContent = "Loading...";
        loadingElements.tempEl.textContent = "--°C";
        loadingElements.descEl.textContent = "";
        loadingElements.iconEl.src = weatherIconMap['unknown'];
        loadingElements.errorEl.style.display = 'none';
        if(loadingElements.feelsLikeEl) loadingElements.feelsLikeEl.textContent = '--°C';
        if(loadingElements.humidityEl) loadingElements.humidityEl.textContent = '--%';
        if(loadingElements.windEl) loadingElements.windEl.textContent = '-- m/s';
        if(loadingElements.currentTimeEl) loadingElements.currentTimeEl.textContent = '';
        clearAnimations(searchedCityCard); // Clear animations while loading

        const weatherData = await getWeatherData(query);
        updateWeatherUI('searched-city-card', weatherData, true);
        searchInput.value = ""; // Clear input after search
    }

    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleSearch();
        }
    });

    /**
     * Initializes the weather app by fetching data for fixed cities.
     */
    async function initializeFixedCities() {
        for (const city of fixedCities) {
            const weatherData = await getWeatherData(city.query);
            updateWeatherUI(city.id, weatherData, false); // false for not searched card
        }
    }

    // Start the application
    initializeFixedCities();
    // Initially hide the searched city card or show a prompt
    if (searchedCityCard) {
         updateWeatherUI('searched-city-card', { error: true, message: "Search for a city to see details." }, true);
    }
});