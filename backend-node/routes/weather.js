const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/authMiddleware');

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

        // 2. Fetch weather and pollution details in parallel
        let weatherData = null;
        let pollutionData = null;

        try {
            const [weatherRes, pollutionRes] = await Promise.all([
                axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
                    params: { lat, lon, units: 'metric', appid: apiKey }
                }),
                axios.get(`http://api.openweathermap.org/data/2.5/air_pollution`, {
                    params: { lat, lon, appid: apiKey }
                })
            ]);

            weatherData = weatherRes.data;
            pollutionData = pollutionRes.data;
        } catch (fetchErr) {
            console.error("Telemetry fetch failed:", fetchErr.message);
            return res.status(502).json({ status: "error", message: "Failed to fetch telemetry details from weather services" });
        }

        // Extract components
        const temperature = weatherData.main.temp;
        const feelsLike = weatherData.main.feels_like;
        const humidity = weatherData.main.humidity;
        const pressure = weatherData.main.pressure;
        const windSpeed = weatherData.wind.speed;
        const weatherCondition = weatherData.weather[0].main;
        const weatherDescription = weatherData.weather[0].description;
        const icon = weatherData.weather[0].icon;

        const aqi = pollutionData.list[0].main.aqi; // 1 = Good, 2 = Fair, 3 = Moderate, 4 = Poor, 5 = Very Poor
        const components = pollutionData.list[0].components;
        const pm2_5 = components.pm2_5;
        const pm10 = components.pm10;
        const no2 = components.no2;

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
                    pm2_5,
                    pm10,
                    no2,
                    components
                }
            }
        });

    } catch (error) {
        res.status(500).json({ status: "error", message: "Internal server error fetching weather telemetry", error: error.message });
    }
});

module.exports = router;
