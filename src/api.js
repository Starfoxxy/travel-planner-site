import axios from 'axios';

// Stores API key in an environment variable
const API_KEY = import.meta.env.VITE_API_KEY;

// Stores timestamp of the last API call
let lastRequestTime = 0;
const requestCooldown = 1000;


// Function for delays in retry logic
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


function shouldThrottle() {
    const now = Date.now();
    if (now - lastRequestTime < requestCooldown) {
        console.log("waiting for cooldown...");
        return true
    }
    lastRequestTime = now;
    return false;
}


function handleRateLimitError(error) {
    if (error.response && error.response.status === 429) {
        return true;
    }
    return false;
}

function handleGenericError(error) {
    console.error(error);
    
}


// Function to fetch coordinates by place name
export async function fetchCoordinatesByName(location){
const options = {
  method: 'GET',
  url: 'https://opentripmap-places-v1.p.rapidapi.com/en/places/geoname',
  params: { name: location },
  headers: {
    'x-rapidapi-key': API_KEY,
    'x-rapidapi-host': 'opentripmap-places-v1.p.rapidapi.com'
  }
};

	try {
		const response = await axios.request(options);
        if (!response.data || !response.data.lat || !response.data.lon) {
            throw new Error("Invalid coordinates received.");
        }
		return response.data;
	} catch (error) {
		console.error('Error fetching places:', error);
        throw new Error('Error fetching places. Please try again.');
	}
}


// Function to fetch places near coordinates w/retry logic for rate limiting
export async function fetchPlacesNearby(lat, lon, radius = 1000, category = '', retries = 3, delayTime = 1000){
    if (shouldThrottle()) return;

const options = {
  method: 'GET',
  url: 'https://opentripmap-places-v1.p.rapidapi.com/en/places/radius',
  params: {
    radius, // in meters
    lon,
    lat,
    limit: 10, // Number of places to return
    rate: 2, // Minimum rating filter
    categories: category, //Filter by type of place
    format: 'json',
  },
  headers: {
    'x-rapidapi-key': API_KEY,
    'x-rapidapi-host': 'opentripmap-places-v1.p.rapidapi.com'
  }
};

	try {
		const response = await axios.request(options);
		return response.data;
	} catch (error) {
        // If rate limit has exceeded, wait for `delayTime` ms and retry
        if (error.response && error.response.status === 429 && retries > 0) {
            console.log(`Rate limit exceeded. Retrying in ${delayTime / 1000} seconds...`);
            await delay(delayTime);
            return fetchPlacesNearby(lat, lon, radius, category, retries - 1, delayTime * 2); // Retry with exponential backoff
        }
		console.error('Error fetching nearby places:', error);
        throw new Error('Error fetching nearby places. Please try again.');
	}
}


// Exported function to fetch details by XID
export async function fetchPlaceDetails(xid){
const options = {
  method: 'GET',
  url: `https://opentripmap-places-v1.p.rapidapi.com/en/places/xid/${xid}`,
  headers: {
    'x-rapidapi-key': API_KEY,
    'x-rapidapi-host': 'opentripmap-places-v1.p.rapidapi.com'
  },
};

	try {
		const response = await axios.request(options);
		return response.data;
	} catch (error) {
		console.error('Error fetching place details:', error);
        throw new Error('Error fetching place details. Please try again.');
	}
}
