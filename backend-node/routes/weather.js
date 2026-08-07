const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/authMiddleware');

function cleanValue(val, fallback = 0, maxThreshold = 1000) {
    if (val === undefined || val === null || isNaN(val)) return fallback;
    const num = Number(val);
    if (num === 99998 || num === 99999 || num > maxThreshold) {
        return fallback;
    }
    return num;
}

router.get('/live', protect, async (req, res) => {
    try {
        const { city, state, lat: queryLat, lon: queryLon } = req.query;

        const apiKey = process.env.OPENWEATHER_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ status: "error", message: "OpenWeather API Key not configured in env" });
        }

        let lat, lon, name, resolvedState;

        if (queryLat && queryLon) {
            lat = parseFloat(queryLat);
            lon = parseFloat(queryLon);

            try {
                const reverseGeo = await axios.get(`http://api.openweathermap.org/geo/1.0/reverse`, {
                    params: { lat, lon, limit: 1, appid: apiKey }
                });
                if (reverseGeo.data && reverseGeo.data.length > 0) {
                    name = reverseGeo.data[0].name;
                    resolvedState = reverseGeo.data[0].state || '';
                } else {
                    name = "GPS Position";
                    resolvedState = "";
                }
            } catch (err) {
                console.error("Reverse geocoding failed:", err.message);
                name = "GPS Position";
                resolvedState = "";
            }
        } else {
            if (!city) {
                return res.status(400).json({ status: "fail", message: "Missing city query parameter" });
            }

            // 1. Geocoding
            let query = `${city},IN`;
            if (state) {
                query = `${city},${state},IN`;
            }

            let geoRes;
            try {
                geoRes = await axios.get(`http://api.openweathermap.org/geo/1.0/direct`, {
                    params: {
                        q: query,
                        limit: 1,
                        appid: apiKey
                    }
                });
            } catch (geoErr) {
                console.error("Geocoding failed:", geoErr.message);
                return res.status(502).json({ status: "error", message: "Failed to resolve city coordinates" });
            }

            if (!geoRes.data || geoRes.data.length === 0) {
                // Fallback try without state/country filters just in case
                try {
                    geoRes = await axios.get(`http://api.openweathermap.org/geo/1.0/direct`, {
                        params: {
                            q: city,
                            limit: 1,
                            appid: apiKey
                        }
                    });
                } catch (fallbackErr) {
                    console.error("Geocoding fallback failed:", fallbackErr.message);
                }

                if (!geoRes.data || geoRes.data.length === 0) {
                    return res.status(404).json({ status: "fail", message: `City '${city}' not found.` });
                }
            }

            lat = geoRes.data[0].lat;
            lon = geoRes.data[0].lon;
            name = geoRes.data[0].name;
            resolvedState = geoRes.data[0].state;
        }

        // 2. Fetch weather, pollution, and forecast details in parallel
        let weatherData = null;
        let pollutionData = null;
        let forecastData = null;

        try {
            const [weatherRes, pollutionRes, forecastRes] = await Promise.all([
                axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
                    params: { lat, lon, units: 'metric', appid: apiKey }
                }),
                axios.get(`http://api.openweathermap.org/data/2.5/air_pollution`, {
                    params: { lat, lon, appid: apiKey }
                }),
                axios.get(`https://api.openweathermap.org/data/2.5/forecast`, {
                    params: { lat, lon, units: 'metric', appid: apiKey }
                })
            ]);

            weatherData = weatherRes.data;
            pollutionData = pollutionRes.data;
            forecastData = forecastRes.data;
        } catch (fetchErr) {
            console.error("Telemetry fetch failed:", fetchErr.message);
            return res.status(502).json({ status: "error", message: "Failed to fetch telemetry details from weather services" });
        }

        // Extract and sanitize current weather components
        const temperature = cleanValue(weatherData.main.temp, 20);
        const feelsLike = cleanValue(weatherData.main.feels_like, temperature);
        const humidity = cleanValue(weatherData.main.humidity, 50, 100);
        const pressure = cleanValue(weatherData.main.pressure, 1013);
        const windSpeed = cleanValue(weatherData.wind ? weatherData.wind.speed : 0, 2);
        const weatherCondition = weatherData.weather[0].main;
        const weatherDescription = weatherData.weather[0].description;
        const icon = weatherData.weather[0].icon;

        const aqi = cleanValue(pollutionData.list[0].main.aqi, 1, 5); // OWM AQI range 1-5
        const components = pollutionData.list[0].components || {};
        const pm2_5 = cleanValue(components.pm2_5, 0);
        const pm10 = cleanValue(components.pm10, 0);
        const no2 = cleanValue(components.no2, 0);

        // Sanitize all pollutant components inside components object
        const cleanedComponents = {};
        for (const key in components) {
            cleanedComponents[key] = cleanValue(components[key], 0);
        }

        // Calculate Solar Irradiance, UV Index, and Estimated City Rooftop Yield (GW)
        const now = weatherData.dt;
        const sunrise = weatherData.sys.sunrise;
        const sunset = weatherData.sys.sunset;
        const isDay = now > sunrise && now < sunset;

        let solarIrradianceWM2 = 0;
        let uvIndex = 0;
        let estimatedCityYieldGW = 0;

        if (isDay) {
            const cloudCover = weatherData.clouds ? weatherData.clouds.all : 0;
            const dayLength = sunset - sunrise;
            const timeIntoDay = now - sunrise;
            const solarAngleFactor = Math.sin((timeIntoDay / dayLength) * Math.PI); // Peak at noon (sin(pi/2) = 1)

            // Solar irradiance is approx 1000 W/m2 under clear sky, reduced by solar angle and cloud cover
            solarIrradianceWM2 = Math.round(1000 * solarAngleFactor * (1 - 0.75 * (cloudCover / 100)));
            if (solarIrradianceWM2 < 50) solarIrradianceWM2 = 50;

            // UV index is approx 12 peak, reduced by solar angle and clouds
            uvIndex = parseFloat((12 * solarAngleFactor * (1 - 0.5 * (cloudCover / 100))).toFixed(1));
            if (uvIndex < 0) uvIndex = 0;

            // Rooftop potential based on City Weight Map capacity
            const CITY_WEIGHT_MAP = {
                MUMBAI: 14.50, DELHI: 15.00, BENGALURU: 12.00, AHMEDABAD: 10.20, CHENNAI: 9.80,
                HYDERABAD: 9.50, KOLKATA: 9.00, SURAT: 6.50, PUNE: 6.80, VADODARA: 5.20,
                JAIPUR: 5.80, KANPUR: 5.50, LUCKNOW: 5.80, RAJKOT: 3.20, NAGPUR: 3.80,
                AGRA: 3.50, NASHIK: 3.40, VARANASI: 3.20, AURANGABAD: 3.10, JODHPUR: 3.20,
                KOTA: 3.40, GORAKHPUR: 2.80
            };
            const cityNameUpper = name.toUpperCase();
            const cityWeight = CITY_WEIGHT_MAP[cityNameUpper] || 5.0; // Default capacity factor

            // rooftop potential = weight * (irradiance/1000) * 15% efficiency
            estimatedCityYieldGW = parseFloat((cityWeight * (solarIrradianceWM2 / 1000) * 0.15).toFixed(3));
        }

        // Format 5-Day / 3-Hour Forecast with Sanitized Values
        const forecast = (forecastData.list || []).map(item => {
            const date = new Date(item.dt * 1000);
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const shortTime = `${date.getDate()} ${months[date.getMonth()]}, ${String(date.getHours()).padStart(2, '0')}:00`;
            return {
                shortTime,
                temp: cleanValue(item.main.temp, 20),
                humidity: cleanValue(item.main.humidity, 50, 100),
                windSpeed: cleanValue(item.wind ? item.wind.speed : 0, 2),
                pop: cleanValue(item.pop !== undefined ? Math.round(item.pop * 100) : 0, 0, 100)
            };
        });

        // Indian AQI Calculation for hazard alert trigger (0-500 scale based on PM2.5)
        function calculateIndianAQI(pm25) {
            if (!pm25 && pm25 !== 0) return 0;
            if (pm25 <= 30) return Math.round((pm25 / 30) * 50);
            if (pm25 <= 60) return Math.round(50 + ((pm25 - 30) / 30) * 50);
            if (pm25 <= 90) return Math.round(100 + ((pm25 - 60) / 30) * 100);
            if (pm25 <= 120) return Math.round(200 + ((pm25 - 90) / 30) * 100);
            if (pm25 <= 250) return Math.round(300 + ((pm25 - 120) / 130) * 100);
            return Math.round(400 + ((pm25 - 250) / 250) * 100);
        }

        const calculatedAqi = calculateIndianAQI(pm2_5);
        const alertTriggered = temperature >= 38 || calculatedAqi > 200;

        const alert = {
            triggered: alertTriggered,
            message: alertTriggered
                ? `MUNICIPAL EMERGENCY ALERT: Environmental hazard limit breached. ${temperature >= 38 ? 'Temperature is ' + temperature.toFixed(1) + '°C (>= 38°C). ' : ''}${calculatedAqi > 200 ? 'Calculated AQI is ' + calculatedAqi + ' (> 200). ' : ''}Mitigation protocols must be initiated.`
                : null
        };

        res.json({
            status: "success",
            data: {
                city: name,
                state: resolvedState || state,
                coordinates: { lat, lon },
                weather: {
                    temperature,
                    feelsLike,
                    humidity,
                    pressure,
                    windSpeed,
                    weatherCondition,
                    weatherDescription,
                    icon
                },
                pollution: {
                    aqi,
                    calculatedAqi,
                    pm2_5,
                    pm10,
                    no2,
                    components: cleanedComponents
                },
                solar: {
                    solarIrradianceWM2,
                    uvIndex,
                    estimatedCityYieldGW
                },
                forecast,
                alert
            }
        });

    } catch (error) {
        res.status(500).json({ status: "error", message: "Internal server error fetching weather telemetry", error: error.message });
    }
});

module.exports = router;
