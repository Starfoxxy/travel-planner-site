import { fetchCoordinatesByName, fetchPlacesNearby, fetchPlaceDetails, translateToEnglish } from './api.js';

const fetchBtn = document.getElementById("fetchBtn");
const locationSearchInput = document.getElementById("location-search");
const cardsContainer = document.getElementById("cards-container");
const filters = document.querySelectorAll('.filter-panel input[type="checkbox"]');

let allPlaces = [];

const featuredCities = [
  { name: "Paris", lat: 48.8566, lon: 2.3522 },
  { name: "New York", lat: 40.7128, lon: -74.006 },
  { name: "Tokyo", lat: 35.6895, lon: 139.6917 },
  { name: "Sydney", lat: -33.8688, lon: 151.2093 },
];



// Function to create cards from places array
function createCards(places, container) {
  // clear old cards
  container.innerHTML = '';
  // Deduplicate places by xid before creating cards
  const uniquePlaces = [];
  const seen = new Set();

   places.forEach(place => {
    console.log("Place name:", place.name);

    if (!place.xid || seen.has(place.xid)) return;
    seen.add(place.xid);
    uniquePlaces.push(place);
  });

    // Loops through the places and creates cards dynamically
    uniquePlaces.forEach(place => {
      const card = document.createElement('div');
      card.classList.add('card');

      // // Grabs a travel image based on place name from Unsplash
      const image = document.createElement('img');
      const keywords = place.name ? `${place.name},landmark,travel` : 'travel';
      image.src = `https://source.unsplash.com/400x300/?${encodeURIComponent(keywords)}`;
      image.alt = place.name || "Destination image";

      const title = document.createElement('h3');
      title.textContent = place.name || "Beautiful Destination";

       // Fix description fallback before slicing
      const extract = place.wikipedia_extracts?.text || "Discover this amazing place.";
      const shortDescription = extract.length > 120 ? extract.slice(0, 120) + "..." : extract;

      const description = document.createElement('p');
      description.textContent = shortDescription;

      const exploreBtn= document.createElement('a');
      exploreBtn.href = '#';
      exploreBtn.setAttribute("data-xid", place.xid);
      exploreBtn.classList.add("explore-btn");
      exploreBtn.textContent = 'Explore';

      // Appends the created elements to the cards
      card.appendChild(image);
      card.appendChild(title);
      card.appendChild(description);
      card.appendChild(exploreBtn);

      // Appends the card to the cards container
      container.appendChild(card);
    });



    // Adds event listeners to newly created explore buttons
    container.querySelectorAll('.explore-btn').forEach(button => {
      button.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log('Explore clicked');
        const xid = e.target.getAttribute('data-xid');
      try {
        const placeDetails = await fetchPlaceDetails(xid);
        console.log("Fetched place details:", placeDetails);

        let descriptionText = placeDetails.wikipedia_extracts?.text || 'No description available';
        console.log("Original description:", descriptionText);

      if (!/^[\x00-\x7F]*$/.test(descriptionText)) {
        try {
          descriptionText = await translateToEnglish(descriptionText);
          console.log("Translated description:", descriptionText);
        } catch (error) {
          console.error('Translation failed:', error);
        }
      }

        showModal(
          placeDetails.name || 'No title',
          placeDetails.address?.road || 'No address',
          placeDetails.wikipedia_extracts?.text || 'No description',
          placeDetails.otm || '#'
        );
        console.log('Modal should be shown now');
      } catch (error) {
        alert(error.message || 'Failed to load details.');
      }
    });
  });
}



// Filter handler function
function applyFilters() {
  // Get selected filters values
  const checkedFilters = Array.from(filters)
    .filter(input => input.checked)
    .map(input => input.value);

  // Filter the global list of places accordingly
  const filteredPlaces = allPlaces.filter(place => {
    if (checkedFilters.length === 0) return true; // No filters? Show all
    return checkedFilters.some(filter => place.kinds?.includes(filter));
  });

  // Clear old cards and render filtered results
  cardsContainer.innerHTML = '';
  createCards(filteredPlaces, cardsContainer);
}

// Set event listeners on filters to trigger filtering
filters.forEach(filter => {
  filter.addEventListener('change', applyFilters);
});



 //  Click handler to search by user input location
fetchBtn.addEventListener('click', async () => {
  const location = locationSearchInput.value.trim();

  // Show the modal
  if (!location) {
    showErrorModal("Please enter a destination.");
    return;
  }


  try {
    // Fetches coordinates of the location (lat, lon)
    const { lat, lon } = await fetchCoordinatesByName(location);
    console.log("Coordinates:", lat, lon);
    allPlaces = await fetchPlacesNearby(lat, lon); // Save full list globally

    applyFilters(); // Render places with current filters if applicable
  } catch (error) {
    alert(error.message || "Failed to load places.");
  }
});



// Modal helper function & close handler same as before
function showModal(title, address, description, wikiLink) {
  const modal = document.getElementById('place-modal');
  modal.querySelector('.modal-title').textContent = title;
  modal.querySelector('.modal-address').textContent = address;
  modal.querySelector('.modal-description').textContent = description;
  modal.querySelector('.modal-link').href = wikiLink;
  modal.classList.remove('hidden');
}

// Show error modal for input errors
function showErrorModal(message) {
  const errorModal = document.getElementById('error-modal');
  const modalMessage = errorModal.querySelector('.error-message');
  modalMessage.textContent = message;
  errorModal.classList.remove('hidden');
}

// Close any modals
document.querySelectorAll('.modal-close').forEach(button => {
  button.addEventListener('click', () => {
    const targetId = button.getAttribute('data-target');
    const modal = document.getElementById(targetId);
    if (modal) modal.classList.add('hidden');
  });
});


// Function to load featured cities and create separate sections for each
async function loadFeaturedCities() {
  try {
      const featuredContainer = document.getElementById('featured-cities-container');
      featuredContainer.innerHTML = ''; // Clear existing featured content

    for (const city of featuredCities) {
      // Fetch places nearby — but limit to top 3
      const samplePlaces = (await fetchPlacesNearby(city.lat, city.lon)).slice(0, 3);

      const citySection = document.createElement('section');
      citySection.classList.add('city-section');

      const cityHeader = document.createElement('h2');
      cityHeader.textContent = city.name;

      const cityCardsContainer = document.createElement('div');
      cityCardsContainer.classList.add('cards-container');

      citySection.appendChild(cityHeader);
      citySection.appendChild(cityCardsContainer);

      featuredContainer.appendChild(citySection);

       createCards(samplePlaces, cityCardsContainer);
    }
  } catch (error) {
    console.error('Error loading featured cities:', error);
  }
}


// Calls to load featured cities on page load
window.addEventListener('DOMContentLoaded', loadFeaturedCities);