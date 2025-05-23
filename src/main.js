import { fetchCoordinatesByName, fetchPlacesNearby, fetchPlaceDetails } from './api.js';

const fetchBtn = document.getElementById("fetchBtn");
const locationSearchInput = document.getElementById("location-search");
const cardsContainer = document.getElementById("cards-container");

const featuredCities = [
  { name: "Paris", lat: 48.8566, lon: 2.3522 },
  { name: "New York", lat: 40.7128, lon: -74.006 },
  { name: "Tokyo", lat: 35.6895, lon: 139.6917 },
  { name: "Sydney", lat: -33.8688, lon: 151.2093 },
];

// Function to create cards from places array
function createCards(places) {

    // Loops through the places and creates cards dynamically
    places.forEach(place => {
      const card = document.createElement('div');
      card.classList.add('card');

      // Creates elements for place details
      const image = document.createElement('img');
      image.src = place.preview?.source || "https://via.placeholder.com/250"; // Checks if the preview image exists, if not uses placeholder
      image.alt = place.name || "Place image";

      const name = document.createElement('h3');
      name.textContent = place.name || "Unnamed Place";

      const category = document.createElement('p');
      category.textContent = place.kinds || "No category available";

      const moreInfoLink= document.createElement('a');
      moreInfoLink.href = '#';
      moreInfoLink.setAttribute("data-xid", place.xid);
      moreInfoLink.classList.add("more-info-btn");
      moreInfoLink.textContent = 'More Info';

      // Appends the created elements to the cards
      card.appendChild(image);
      card.appendChild(name);
      card.appendChild(category);
      card.appendChild(moreInfoLink);

      // Appends the card to the cards container
      cardsContainer.appendChild(card);
    });

    // Adds event listeners to the 'More Info' buttons inside the current container to fetch additional details
    container.querySelectorAll('.more-info-btn').forEach(button => {
      button.addEventListener('click', async (e) => {
        e.preventDefault();
        const xid = e.target.getAttribute('data-xid');
      try {
        const placeDetails = await fetchPlaceDetails(xid);
        showModal(
          placeDetails.name || 'No title',
          placeDetails.address?.road || 'No address',
          placeDetails.wikipedia_extracts?.text || 'No description available',
          placeDetails.otm || '#'
        );
      } catch (error) {
        alert(error.message || 'Failed to load details.');
      }
    });
  });
}


// Function to load featured cities and create separate sections for each
async function loadFeaturedCities() {
  try {
    for (const city of featuredCities) {
      // Fetch nearby places per coordinates
      const places = await fetchPlacesNearby(city.lat, city.lon);

      const citySection = document.createElement('section');
      citySection.classList.add('city-section');

      const cityHeader = document.createElement('h2');
      const cityCardsContainer = document.createElement('div');
      cityCardsContainer.classList.add('cards-container');

      createCards(places, cityCardsContainer);

      citySection.appendChild(cityCardsContainer);
      cardsContainer.appendChild(citySection);
    }
  } catch (error) {
    console.error('Error loading featured cities:', error);
  }
}

// Call to load featured cities on page load or as needed
loadFeaturedCities();


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

    // Fetches nearby places using these coordinates
    const places = await fetchPlacesNearby(lat, lon);

   cardsContainer.innerText = '';
    createCards(places, cardsContainer);
  } catch (error) {
    alert(error.message || "Failed to load places.");
  }
});

// Modal helper function & close handler same as before
function showModal(title, address, description, wikiLink) {
  const modal = document.getElementById('modal');
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

// Close handlers for modals
document.getElementById('modal-close').addEventListener('click', () => {
  document.getElementById('place-modal').classList.add("hidden");
});
document.getElementById('error-close').addEventListener('click', () => {
  document.getElementById('error-modal').classList.add("hidden");
});

// Load featured cities on page load
window.addEventListener('DOMContentLoaded', loadFeaturedCities);