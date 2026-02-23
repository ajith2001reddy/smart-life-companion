const express = require("express");
const axios = require("axios");

const router = express.Router();

/**
 * GET /api/weather
 * Supports:
 *   ?city=New York
 *   ?lat=40.7&lon=-74.0
 */
router.get("/", async (req, res) => {
    try {
        if (!process.env.OPENWEATHER_API_KEY) {
            return res.status(500).json({ error: "Missing OPENWEATHER_API_KEY" });
        }

        let params = {
            appid: process.env.OPENWEATHER_API_KEY,
            units: "metric",
        };

        if (req.query.lat && req.query.lon) {
            params.lat = req.query.lat;
            params.lon = req.query.lon;
        } else {
            const city = req.query.city || "New York";
            params.q = city;
        }

        const response = await axios.get(
            "https://api.openweathermap.org/data/2.5/weather",
            { params }
        );

        const data = response.data;

        res.json({
            location: data.name,
            temperature: data.main.temp,
            condition: data.weather[0].main,
            description: data.weather[0].description,
            humidity: data.main.humidity,
            windSpeed: data.wind.speed,
            icon: data.weather[0].icon,
            lat: data.coord.lat,
            lon: data.coord.lon,
        });

    } catch (error) {
        console.error("Weather error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to fetch weather" });
    }
});

/**
 * GET /api/weather/geocode
 * Proxies Nominatim reverse geocoding to avoid browser CORS issues.
 * ?lat=41.3&lon=-72.9
 */
router.get("/geocode", async (req, res) => {
    try {
        const { lat, lon } = req.query;

        if (!lat || !lon) {
            return res.status(400).json({ error: "lat and lon are required" });
        }

        const response = await axios.get(
            "https://nominatim.openstreetmap.org/reverse",
            {
                params: { lat, lon, format: "json" },
                headers: {
                    // Nominatim requires a descriptive User-Agent
                    "User-Agent": "SmartLifeApp/1.0 (contact@smartlife.app)",
                },
            }
        );

        const addr = response.data.address || {};
        const city =
            addr.city ||
            addr.town ||
            addr.village ||
            addr.county ||
            "Unknown";

        res.json({ city });

    } catch (error) {
        console.error("Geocode error:", error.message);
        res.status(500).json({ error: "Geocoding failed", city: "Unknown" });
    }
});

module.exports = router;