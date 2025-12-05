// Anime Sections Loader
// Event listener that fires when the DOM is fully loaded.
// It initializes various anime sections and functionalities on the page.
document.addEventListener('DOMContentLoaded', () => {
    fetchAnimeSpotlights();
    populateDashboardSpotlight();
    fetchNewAnimes();
    fetchUpcomingAnimes();
    fetchRecommendedAnimes();
    fetchMostwatchlistAnimes();
    fetchRandomAnimes();
    console.log("DOM Fully Loaded");
});

let selectedTags = [];
let allTags = [];

// Fetches all available anime tags from the backend and stores them in the `allTags` array.
// This is typically used for populating filter options.
function fetchAllTags() {
    fetch('/anime/all-tags')
        .then(response => response.json())
        .then(data => {
            allTags = data.map(row => row.tag).sort();
        })
        .catch(error => console.error('Failed to fetch tags:', error));
}

fetchAllTags(); // Call it once on initial load

// Anime Spotlight

// Function to fetch anime spotlights data
// Asynchronously fetches anime spotlight data from the backend.
// This data is used to populate the main spotlight banner on the homepage.
async function fetchAnimeSpotlights() {
    try {
        const response = await fetch('/anime/animespotlight-animes');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching anime data:', error);
        return null;
    }
}

// Function to update the spotlight with anime data
// Updates the content of the main anime spotlight section with data from a given anime object.
// It populates the title, description, image, and other details.
function updateSpotlight(anime) {
    try {
        // Get required elements
        const spotlightContainer = document.querySelector('.spotlight-banner');
        const animeTitle = document.getElementById('anime-title');
        const animeDescription = document.getElementById('anime-description');
        const spotlightImage = spotlightContainer.querySelector('.spotlight-img');
        
        const tagsItem = spotlightContainer.querySelector('.info-item:nth-child(1) .info-text');
        const typeItem = spotlightContainer.querySelector('.info-item:nth-child(2) .info-text');
        const episodesItem = spotlightContainer.querySelector('.info-item:nth-child(3) .info-text');
        const dateItem = spotlightContainer.querySelector('.info-item:nth-child(4) .info-text');
        
        // Validate if all elements exist
        if (!spotlightContainer || !animeTitle || !animeDescription || !spotlightImage || 
            !tagsItem || !typeItem || !episodesItem || !dateItem) {
            throw new Error('Required DOM elements not found');
        }

        // Update elements with fallback values in case of error
        animeTitle.textContent = anime.title || 'Unknown Title';
        
        let synopsis = typeof anime.synopsis === 'string' ? anime.synopsis : '';

        if (!synopsis) synopsis = 'No description available';

        animeDescription.textContent = synopsis;

        spotlightImage.classList.add('lazy');
        spotlightImage.src = anime.image_url || '';
        spotlightImage.alt = `${anime.title || 'Anime'} image`;
        
        tagsItem.textContent = anime.genres || 'Tags';
        typeItem.textContent = anime.type || 'TV';
        episodesItem.textContent = anime.episodes ? `${anime.episodes} episodes` : 'Unknown episodes';
        dateItem.textContent = anime.airing_start ? 
            new Date(anime.airing_start).toLocaleDateString() : 
            'Unknown start date';

        const addToWatchlistBtn = document.getElementById('add-to-watchlist-btn');
        const viewDetailsBtn = document.getElementById('view-details-btn');

        if (viewDetailsBtn) {
            viewDetailsBtn.href = `/anime/${anime.AnimeID}`;
        }

        if (addToWatchlistBtn) {
            // Remove previous click listener just in case
            addToWatchlistBtn.replaceWith(addToWatchlistBtn.cloneNode(true));
            const freshBtn = document.getElementById('add-to-watchlist-btn');
    
            freshBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Clicked Add with ID:', anime.AnimeID);
                addToWatchlist(anime.AnimeID);
            });
        }

        lazyLoadInstance.update();

        console.log('Successfully updated spotlight with anime data');
    } catch (error) {
        console.error('Error updating spotlight:', error);
    }
}

// Function to populate the anime spotlight
// Populates the main anime spotlight section.
// Fetches anime spotlight data and updates the spotlight with the first anime in the list.
async function populateAnimeSpotlight() {
    try {
        const animes = await fetchAnimeSpotlights();
        
        if (!animes) {
            console.warn('No anime data received');
            return;
        }

        if (animes.length === 0) {
            console.warn('Empty anime list received');
            return;
        }

        // Set the first anime to be Spotlighted
        updateSpotlight(animes[0]);

    } catch (error) {
        console.error('Error populating anime spotlight:', error);
    }
}

// Function to rotate the anime spotlight
// Manages the automatic rotation of the anime spotlight.
// It fetches spotlight animes, initializes navigation buttons, and sets up an interval for rotation.
async function rotateSpotlight() {
    try {
        const animes = await fetchAnimeSpotlights();
        
        if (!animes || !animes.length) {
            console.warn('No anime data available');
            return;
        }

        let currentIndex = 0;
        const navContainer = document.getElementById('spotlight-nav');

        if (navContainer) {
            navContainer.innerHTML = '';

            animes.forEach((_, index) => {
                const btn = document.createElement('button');
                btn.classList.add('nav-btn');
                btn.textContent = index + 1;
                btn.addEventListener('click', async () => {
                    currentIndex = index;
                    await updateSpotlight(animes[currentIndex]);
                    updateNavButtons();
                });
                navContainer.appendChild(btn);
            });
        }

        function updateNavButtons() {
            const buttons = navContainer.querySelectorAll('button');
            buttons.forEach((btn, idx) => {
                if (idx === currentIndex) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        }

        async function rotate() {
            await updateSpotlight(animes[currentIndex]);
            updateNavButtons();
            currentIndex = (currentIndex + 1) % animes.length;
        }

        await rotate();

        const rotationInterval = setInterval(async () => {
            await rotate();
        }, 5000);

        return () => clearInterval(rotationInterval);
    } catch (error) {
        console.error('Error rotating spotlight:', error);
    }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    const cleanup = await rotateSpotlight();
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', cleanup);
});

// Dashboard Spotlight
let spotlightAnimes = [];
let currentSpotlightIndex = 0;

// Function to fetch the dashboard spotlight
// Asynchronously fetches personalized anime spotlight data for the user's dashboard.
// This data is tailored based on user activity or general popularity if no user-specific data is available.
async function fetchDashboardAnimeSpotlight() {
    try {
        const response = await fetch('/api/user/spotlight');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        } 
        return await response.json();
    } catch (error) {
        console.error('Error fetching dashboard spotlight:', error);
        return null;
    }
}

// Function to update the dashboard spotlight
// Updates the content of the dashboard spotlight section with data from a given anime object.
// It populates the image, title, type, episodes, rating, genres, and synopsis.
function updateDashboardSpotlight(anime) {
    try {
        const spotlightImage = document.querySelector('.dashboard-spotlight-img');
        if (!spotlightImage) throw new Error('Dashboard spotlight image not found');

        spotlightImage.src = anime.image_url || '/default-spotlight.jpg';
        spotlightImage.alt = anime.title || 'Anime Spotlight';

        const titleElement = document.querySelector('.spotlight-content h4');
        titleElement.textContent = anime.title || 'Anime Spotlight';
        titleElement.setAttribute('title', anime.title || 'Anime Spotlight');

        document.querySelector('.spotlight-content h6:nth-of-type(2)').textContent = `${anime.type} | ${anime.episodes} Episodes`;
        document.querySelector('.spotlight-content h6:nth-of-type(3)').textContent = `Rating: ${anime.rating || 'N/A'} | ${anime.genres || 'Unknown'}`;
        document.querySelector('.spotlight-content p:nth-of-type(2)').textContent = anime.synopsis || 'No synopsis available.';

        const addToWatchlistBtn = document.getElementById('add-to-watchlist-btn');
        const viewDetailsBtn = document.getElementById('view-details-btn');

        if (viewDetailsBtn) {
            viewDetailsBtn.href = `/anime/${anime.AnimeID}`;
        }
        
        if (addToWatchlistBtn) {
            addToWatchlistBtn.replaceWith(addToWatchlistBtn.cloneNode(true));
            const freshBtn = document.getElementById('add-to-watchlist-btn');
            freshBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Clicked Add with ID:', anime.AnimeID);
                addToWatchlist(anime.AnimeID);
            });
        }

        console.log('Dashboard spotlight updated');
    } catch (error) {
        console.error('Error updating dashboard spotlight:', error);
    }
}

// Function to populate the dashboard spotlight
// Populates the dashboard spotlight section with personalized anime recommendations.
// It fetches dashboard spotlight data, initializes the display, and sets up navigation for rotating through animes.
async function populateDashboardSpotlight() {
    try {
        const animes = await fetchDashboardAnimeSpotlight();
        if (!animes || !animes.length) return;

        spotlightAnimes = animes;
        currentSpotlightIndex = 0;
        updateDashboardSpotlight(spotlightAnimes[currentSpotlightIndex]);

        const nextBtn = document.getElementById('next-spotlight-btn');
        if (nextBtn) {
            nextBtn.replaceWith(nextBtn.cloneNode(true));
            const freshNextBtn = document.getElementById('next-spotlight-btn');
            freshNextBtn.addEventListener('click', () => {
                currentSpotlightIndex = (currentSpotlightIndex + 1) % spotlightAnimes.length;
                updateDashboardSpotlight(spotlightAnimes[currentSpotlightIndex]);
            });
        }

    } catch (error) {
        console.error('Error populating dashboard spotlight:', error);
    }
}

document.addEventListener('DOMContentLoaded', populateDashboardSpotlight);

// Function to fetch new animes data
// Fetches data for newly airing animes and dynamically populates a carousel section on the page.
// Displays anime cards with title, airing date, and an "Add to Watchlist" button.
function fetchNewAnimes() {
    fetch('/anime/new-animes')
        .then(response => response.json())
        .then(animes => {
            console.log("Fetched New Animes: ", animes);
            const newAnimesContainer = document.querySelector('.new-carousel-inner');
            newAnimesContainer.innerHTML = '';

            for (let i = 0; i < animes.length; i += 3) {
                const carouselItem = document.createElement('div');
                carouselItem.classList.add('carousel-item');
                if (i === 0) carouselItem.classList.add('active');

                const row = document.createElement('div');
                row.classList.add('row', 'g-3');

                for (let j = i; j < i + 3 && j < animes.length; j++) {
                    const anime = animes[j];
                    const col = document.createElement('div');
                    col.classList.add('col-md-4', 'px-2');

                    const airingDate = new Date(anime.airing_start);
                    const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
                    const formattedDate = airingDate.toLocaleDateString('en-US', options);                    

                    const animeCard = document.createElement('div');
                    animeCard.classList.add('newanime-card', 'text-center');
                    animeCard.innerHTML = `
                        <div class="card h-100 d-flex flex-column">
                            <img data-src="${anime.image_url}" src="${anime.image_url}" alt="${anime.title} cover" class="d-block w-100 lazy" style="object-fit: cover; height: 300px; width:200px;">
                            <div class="text-container d-flex flex-column flex-grow-1 p-2">
                                <h5 title='${anime.title}'>${anime.title}</h5>
                                <p><strong>Started Airing:</strong><br>${formattedDate} UTC</p>
                                <div class="mt-auto">
                                    <a class="btn btn-primary add-watchlist-button-hover btn-radius mr-2" onclick="addToWatchlist(${anime.AnimeID})">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" 
                                            class="bi bi-caret-right-square-fill align-middle mb-1" viewBox="0 0 16 16">
                                            <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm5.5 10a.5.5 0 0 0 .832.374l4.5-4a.5.5 0 0 0 0-.748l-4.5-4A.5.5 0 0 0 5.5 4z"/>
                                        </svg> Add to Watchlist
                                    </a>
                                    <a href="/anime/${anime.AnimeID}" class="btn btn-secondary btn-radius mr-2">View Details</a>
                                </div>
                            </div>
                        </div>`;
                    col.appendChild(animeCard);
                    row.appendChild(col);
                }

                carouselItem.appendChild(row);
                newAnimesContainer.appendChild(carouselItem);
            }
        })
        .catch(error => console.error('Error fetching new animes:', error));
}

// Function to fetch upcoming animes data
// Fetches data for upcoming animes and dynamically populates a carousel section on the page.
// Displays anime cards with title, expected airing season/year, and an "Add to Watchlist" button.
function fetchUpcomingAnimes() {
    fetch('/anime/upcoming-animes')
        .then(response => response.json())
        .then(animes => {
            console.log("Fetched Upcoming Animes: ", animes);
            const upcomingAnimesContainer = document.querySelector('.upcoming-carousel-inner');
            upcomingAnimesContainer.innerHTML = '';

            const currentYear = new Date().getFullYear();

            for (let i = 0; i < animes.length; i += 3) {
                const carouselItem = document.createElement('div');
                carouselItem.classList.add('carousel-item');
                if (i === 0) carouselItem.classList.add('active');

                const row = document.createElement('div');
                row.classList.add('row', 'g-3');

                for (let j = i; j < i + 3 && j < animes.length; j++) {
                    const anime = animes[j];
                    const col = document.createElement('div');
                    col.classList.add('col-md-4', 'px-2');

                    let airingText;

                    const now = new Date();

                    const isValidDate = anime.airing_start && !isNaN(Date.parse(anime.airing_start));
                    const airingDate = isValidDate ? new Date(anime.airing_start) : null;
                    const isFutureDate = airingDate && airingDate >= now;
                    
                    if (!isValidDate || !isFutureDate) {
                        airingText = "Confirmed but unknown";
                    } else {
                        function getAnimeSeason(date) {
                            const month = date.getUTCMonth();
                            const year = date.getUTCFullYear();
                    
                            let season;
                            if (month <= 2) {
                                season = "Winter";
                            } else if (month <= 5) {
                                season = "Spring";
                            } else if (month <= 8) {
                                season = "Summer";
                            } else {
                                season = "Fall";
                            }
                    
                            return `${season} ${year}`;
                        }
                    
                        airingText = getAnimeSeason(airingDate);
                    }

                    const animeCard = document.createElement('div');
                    animeCard.classList.add('upcominganime-card', 'text-center');
                    animeCard.innerHTML = `
                        <div class="card h-100 d-flex flex-column">
                            <img data-src="${anime.image_url}" src="${anime.image_url}" alt="${anime.title} cover" class="d-block w-100 lazy" style="object-fit: cover; height: 300px; width:200px;">
                            <div class="text-container d-flex flex-column flex-grow-1 p-2">
                                <h5 title='${anime.title}'>${anime.title}</h5>
                                <p><strong>Expected Date:</strong><br>${airingText}</p>
                                <div class="mt-auto">
                                    <a class="btn btn-primary add-watchlist-button-hover btn-radius mr-2" onclick="addToWatchlist(${anime.AnimeID})">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" 
                                            class="bi bi-caret-right-square-fill align-middle mb-1" viewBox="0 0 16 16">
                                            <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm5.5 10a.5.5 0 0 0 .832.374l4.5-4a.5.5 0 0 0 0-.748l-4.5-4A.5.5 0 0 0 5.5 4z"/>
                                        </svg> Add to Watchlist
                                    </a>
                                    <a href="/anime/${anime.AnimeID}" class="btn btn-secondary btn-radius mr-2">View Details</a>
                                </div>
                            </div>
                        </div>`;
                    col.appendChild(animeCard);
                    row.appendChild(col);
                }

                carouselItem.appendChild(row);
                upcomingAnimesContainer.appendChild(carouselItem);
            }
        })
        .catch(error => console.error('Error fetching upcoming animes:', error));
}

// Function to fetch recommended animes data
// Fetches data for recommended animes and populates a Swiper carousel.
// Each slide displays anime details like type, genres, episodes, status, and synopsis, along with an "Add to Watchlist" button.
function fetchRecommendedAnimes() {
    fetch('/anime/recommended-animes')
        .then(response => response.json())
        .then(animes => {
            console.log("Fetched Featured Animes: ", animes);
            const swiperWrapper = document.querySelector('.swiper-wrapper');
            swiperWrapper.innerHTML = '';

            const recanimes = animes.slice(0, 15);

            recanimes.forEach((anime, index) => {
                const animeSlide = document.createElement('div');
                animeSlide.classList.add('swiper-slide');

                let synopsis = typeof anime.synopsis === 'string' ? anime.synopsis : '';

                if (!synopsis) synopsis = 'No description available';

                animeSlide.innerHTML = `
                    <div class="deslide-item">
                        <div class="deslide-cover">
                            <div class="deslide-cover-img">
                                <img class="film-poster-img lazy" data-src="${anime.image_url}" src="${anime.image_url}" alt="${anime.title}">
                            </div>
                        </div>
                        <div class="deslide-item-content bg-dark bg-opacity-75 text-white">
                            <!-- <div class="desi-sub-text">Recommendation #${index + 1}</div> -->
                            <div class="desi-head-title" title='${anime.title}'><h4>${anime.title}</h4></div>
                            <div class="sc-detail">
                                <div class="scd-item"><strong>Type: </strong>${anime.type}</div>
                                <div class="scd-item featured-tags wrapaway"><strong>Type: </strong>${anime.genres}</div>
                                <div class="scd-item"><strong>Episodes: </strong>${anime.episodes} episodes</div>
                                <div class="scd-item"><span class="quality"><strong>Status: </strong>${anime.status}</span></div>
                            </div>
                            <div class="desi-description"><strong>Synopsis: </strong></div>
                            <div class="desi-description featured-synopsis wrapaway">${synopsis}</div>
                            <div class="desi-buttons featured-buttons">
                                <a class="btn btn-primary add-watchlist-button-hover btn-radius mr-2" onclick="addToWatchlist(${anime.AnimeID})"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-caret-right-square-fill align-middle mb-1" viewBox="0 0 16 16">
                                    <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm5.5 10a.5.5 0 0 0 .832.374l4.5-4a.5.5 0 0 0 0-.748l-4.5-4A.5.5 0 0 0 5.5 4z"/>
                                    </svg> Add to Watchlist</a>
                                <a href="/anime/${anime.AnimeID}" class="btn btn-secondary btn-radius mr-2">View Details</a>
                            </div>
                        </div>
                    </div>
                `;
                swiperWrapper.appendChild(animeSlide);
            });

            // Reinitialize Swiper after adding new slides
            const swiper = new Swiper('#slider', {
                slidesPerView: 3,
                spaceBetween: 15,
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true,
                },
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                },
                breakpoints: {
                    0: { slidesPerView: 1 },      // Phones
                    768: { slidesPerView: 2 },    // Laptops
                    1100: { slidesPerView: 3 }    // Desktops
                }
            });
        })
        .catch(error => {
            console.error('Error fetching featured animes:', error);
        });
}

// Function to fetch recommended animes data
// Fetches data for the most watchlisted animes and populates a carousel.
// Each card displays anime details including synopsis, type, episodes, and status, with an option to add to watchlist.
function fetchMostwatchlistAnimes() {
    fetch('/anime/mostwatchlist-animes')
        .then(response => response.json())
        .then(animes => {
            console.log("Fetched Most Wachlisted Animes: ", animes);
            const carouselInner = document.querySelector('#mostWatchlistCarouselInner');
            carouselInner.innerHTML = '';

            const recanimes = animes.slice(0, 30);

            for (let i = 0; i < recanimes.length; i += 3) {
                const group = recanimes.slice(i, i + 3);
                const isActive = i === 0 ? 'active' : '';

                const slide = document.createElement('div');
                slide.className = `carousel-item ${isActive}`;
                slide.innerHTML = `
                    <div class="row justify-content-center text-center">
                        ${group.map(anime => {
                            let synopsis = typeof anime.synopsis === 'string' ? anime.synopsis : 'No description available';
                            return `
                                <div class="col-md-4 mb-4">
                                    <img data-src="${anime.image_url}" src="${anime.image_url}" class="img-fluid rounded shadow mb-3 lazy" alt="${anime.title}" style="max-width: 600px; height: 400px;">
                                    <div class="bg-dark bg-opacity-75 text-white rounded p-3">
                                        <h3>${anime.title}</h3>
                                        <p class="small mostwatchlist-synopsis">${synopsis}</p>
                                        <p class="mb-2">
                                            <strong>Type:</strong> ${anime.type} |
                                            <strong>Episodes:</strong> ${anime.episodes} |
                                            <strong>Status:</strong> ${anime.status}
                                        </p>
                                        <a class="btn btn-primary add-watchlist-button-hover btn-radius mr-2" onclick="addToWatchlist(${anime.AnimeID})">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" 
                                                class="bi bi-caret-right-square-fill align-middle mb-1" viewBox="0 0 16 16">
                                                <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm5.5 10a.5.5 0 0 0 .832.374l4.5-4a.5.5 0 0 0 0-.748l-4.5-4A.5.5 0 0 0 5.5 4z"/>
                                            </svg> Add to Watchlist
                                        </a>
                                        <a href="/anime/${anime.AnimeID}" class="btn btn-secondary btn-radius mr-2">View Details</a>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
                carouselInner.appendChild(slide);
            }
        })
        .catch(error => {
            console.error('Error fetching most watchlisted animes:', error);
        });
}

// Function to fetch random anime data
// Fetches data for a random selection of animes and displays them in a card-based layout.
// Each card shows anime details like title, type, studio, tags, episodes, and status, with an "Add to Watchlist" option.
function fetchRandomAnimes() {
    fetch('/anime/random-animes')
        .then(response => response.json())
        .then(animes => {
            console.log("Fetched Random Animes: ", animes);
            const randomAnimesContainer = document.getElementById('random-animes');
            randomAnimesContainer.innerHTML = '';

            animes.forEach(anime => {
                const animeCard = document.createElement('div');
                animeCard.classList.add('card', 'anime-card', 'mb-3');
                animeCard.style.width = '17.4rem';

                animeCard.innerHTML = `
                    <img data-src="${anime.image_url}" src="${anime.image_url}" alt="${anime.title} cover" class="card-img-top anime-image lazy">
                    <div class="card-body">
                        <h5 class="card-title" title='${anime.title}'>${anime.title}</h5>
                        <p class="card-text"><strong>Type:</strong> ${anime.type}</p>

                        <p class="card-text">
                            <strong>Studio:</strong> 
                            <span class='studio-name' title='${anime.studio_name}'> ${anime.studio_name} </span>
                        </p>

                        <p class="card-text tags"><strong>Tags:</strong> ${anime.genres}</p>
                        <p class="card-text"><strong>Episodes:</strong> ${anime.episodes}</p>
                        <p class="card-text"><strong>Status:</strong> ${anime.status}</p>
                        <a class="btn btn-primary add-watchlist-button-hover btn-radius mr-2" onclick="addToWatchlist(${anime.AnimeID})">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-caret-right-square-fill align-middle mb-1" viewBox="0 0 16 16">
                                <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm5.5 10a.5.5 0 0 0 .832.374l4.5-4a.5.5 0 0 0 0-.748l-4.5-4A.5.5 0 0 0 5.5 4z"/>
                            </svg> Add to Watchlist
                        </a>
                        <a href="/anime/${anime.AnimeID}" class="btn btn-secondary btn-radius mr-2">View Details</a>
                    </div>
                `;
                randomAnimesContainer.appendChild(animeCard);
            });
        })
        .catch(error => {
            console.error('Error fetching random animes:', error);
        });
}

let watchlistVisible = false;
let completedWatchlistVisible = false;
let currentPage = 1;
const itemsPerPage = 26;
let currentWatchlist = [];
let currentCompletedWatchlist = [];

// Watchlist Toggle
// Event listener for the "My Watchlist" button. Toggles the visibility of the main watchlist container.
// When activated, it hides the completed watchlist and renders the current watchlist.
document.getElementById('myListBtn').addEventListener('click', () => {
    watchlistVisible = !watchlistVisible;
    const watchlistContainer = document.getElementById('watchlist-container');
    const completedContainer = document.getElementById('completed-container');

    if (watchlistVisible) {
        completedWatchlistVisible = false;
        fadeSwapContent('watchlist-container', () => renderWatchlist(currentPage));
        completedContainer.innerHTML = '';
    } else {
        watchlistVisible = false;
        watchlistContainer.innerHTML = '';
    }
});

// Event listener for the "My Completed Animes" button. Toggles the visibility of the completed watchlist container.
// When activated, it hides the current watchlist and renders the completed watchlist.
document.getElementById('myCompletedAnimesBtn').addEventListener('click', () => {
    completedWatchlistVisible = !completedWatchlistVisible;
    const completedContainer = document.getElementById('completed-container');
    const watchlistContainer = document.getElementById('watchlist-container');

    if (completedWatchlistVisible) {
        watchlistVisible = false;
        fadeSwapContent('completed-container', () => renderCompletedWatchlist());
        watchlistContainer.innerHTML = '';
    } else {
        completedWatchlistVisible = false;
        completedContainer.innerHTML = '';
    }
});

// Fetches and renders the user's current watchlist (Watching and Plan to Watch statuses).
// Displays anime cards with details, watchlist status, and options to update status or remove from watchlist.
function renderWatchlist(page = 1) {
    currentPage = page;
    const container = document.getElementById('watchlist-container');
    fetch('/api/user/watchlist')
        .then(response => response.json())
        .then(watchlist => {
            currentWatchlist = watchlist;
    
            container.innerHTML = '';
    
            if (watchlist.length === 0) {
                container.innerHTML = '<p>Your watchlist is empty.</p>';
                return;
            }
    
            const list = document.createElement('div');
            list.className = 'row';
    
            const updatedSection = document.createElement('div');
            updatedSection.className = 'col-12 mb-3';
            updatedSection.innerHTML = `
                <h4><span class="badge bg-info">Last Updated: ${new Date(watchlist[0].last_updated).toLocaleString()}</span></h4>
            `;
            list.appendChild(updatedSection);

            const start = (page - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            const paginated = watchlist.slice(start, end);

            container.appendChild(generatePaginationControls(watchlist.length, page, 'top'));
    
            paginated.forEach(anime => {
                const col = document.createElement('div');
                col.className = 'col-md-6 mb-4 d-flex';
                col.id = `anime-card-${anime.AnimeID}`;
                col.innerHTML = `
                <div class="card h-100 shadow-sm w-100">
                    <img data-src="${anime.image_url}" src="${anime.image_url}" class="card-img-top lazy" alt="${anime.title}" style="height: 225px; object-fit: cover;">
                    <div class="card-body d-flex flex-column">
                        <h4 class="card-title">${anime.title}</h4> 
                        <p><strong>Type:</strong> ${anime.type} • ${anime.episodes} Episodes • Score: ${anime.rating}</p>
                        <p><strong>Studio:</strong> ${anime.studio_name}</p>
                        <p><strong>Tags:</strong> ${anime.genres}</p>
                        <p><strong>Watchlist Status:</strong> <span id="status-${anime.AnimeID}">${anime.watchlist_status}</span></p>
    
                        <div class="input-group mb-2">
                            <select class="form-select" id="status-select-${anime.AnimeID}">
                                <option value="Watching" ${anime.watchlist_status === 'Watching' ? 'selected' : ''}>Watching</option>
                                <option value="Completed" ${anime.watchlist_status === 'Completed' ? 'selected' : ''}>Completed</option>
                                <option value="Plan to Watch" ${anime.watchlist_status === 'Plan to Watch' ? 'selected' : ''}>Plan to Watch</option>
                            </select>
                            <button class="btn btn-primary" onclick="updateStatus(${anime.AnimeID})">Save</button>
                        </div>
                        <div class="d-flex align-items-center gap-2 mb-1">
                            <button class="btn btn-outline-danger btn-sm" onclick="removeFromWatchlist(${anime.AnimeID})"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill mb-1" viewBox="0 0 16 16">
                                <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
                            </svg> Remove</button>
                            <a href="/anime/${anime.AnimeID}" class="btn btn-secondary btn-sm">View Details</a>
                            <span class="badge bg-secondary">Added on: ${new Date(anime.date_added).toLocaleString()}</span>
                            <span class="badge bg-secondary">Last updated: ${new Date(anime.last_updated).toLocaleString()}</span>
                        </div>
                    </div>
                </div>`;
                list.appendChild(col);
            });
    
            container.appendChild(list);
            container.appendChild(generatePaginationControls(watchlist.length, page, 'bottom'));

        })
        .catch(() => {
            container.innerHTML = '<p>Error loading watchlist.</p>';
        });
}

// Fetches and renders the user's completed watchlist.
// Displays anime cards with details, completed status, and options to update status or remove from watchlist.
function renderCompletedWatchlist(page = 1) {
    currentPage = page;
    const container = document.getElementById('completed-container');
    fetch('/api/user/watchlist/completed')
        .then(response => response.json())
        .then(completedWatchlist => {
            currentWatchlist = completedWatchlist;
    
            container.innerHTML = '';
    
            if (completedWatchlist.length === 0) {
                container.innerHTML = '<p>Your completed watchlist is empty.</p>';
                return;
            }
    
            const list = document.createElement('div');
            list.className = 'row';
    
            const updatedSection = document.createElement('div');
            updatedSection.className = 'col-12 mb-3';
            updatedSection.innerHTML = `
                <h4><span class="badge bg-info">Last Updated: ${new Date(completedWatchlist[0].last_updated).toLocaleString()}</span></h4>
            `;
            list.appendChild(updatedSection);

            const start = (page - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            const paginated = completedWatchlist.slice(start, end);

            container.appendChild(generatePaginationControls(completedWatchlist.length, page, 'top'));
    
            paginated.forEach(anime => {
                const col = document.createElement('div');
                col.className = 'col-md-6 mb-4 d-flex';
                col.id = `anime-card-${anime.AnimeID}`;
                col.innerHTML = `
                <div class="card h-100 shadow-sm w-100">
                    <img data-src="${anime.image_url}" src="${anime.image_url}" class="card-img-top lazy" alt="${anime.title}" style="height: 225px; object-fit: cover;">
                    <div class="card-body d-flex flex-column">
                        <h4 class="card-title">${anime.title}</h4> 
                        <p><strong>Type:</strong> ${anime.type} • ${anime.episodes} Episodes • Score: ${anime.rating}</p>
                        <p><strong>Studio:</strong> ${anime.studio_name}</p>
                        <p><strong>Tags:</strong> ${anime.genres}</p>
                        <p><strong>Watchlist Status:</strong> <span id="status-${anime.AnimeID}">${anime.watchlist_status}</span></p>
    
                        <div class="input-group mb-2">
                            <select class="form-select" id="status-select-${anime.AnimeID}">
                                <option value="Watching" ${anime.watchlist_status === 'Watching' ? 'selected' : ''}>Watching</option>
                                <option value="Completed" ${anime.watchlist_status === 'Completed' ? 'selected' : ''}>Completed</option>
                                <option value="Plan to Watch" ${anime.watchlist_status === 'Plan to Watch' ? 'selected' : ''}>Plan to Watch</option>
                            </select>
                            <button class="btn btn-primary" onclick="updateStatus(${anime.AnimeID})">Save</button>
                        </div>
                        <div class="d-flex align-items-center gap-2 mb-1">
                            <button class="btn btn-outline-danger btn-sm" onclick="removeFromWatchlist(${anime.AnimeID})"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill mb-1" viewBox="0 0 16 16">
                                <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
                            </svg> Remove</button>
                            <a href="/anime/${anime.AnimeID}" class="btn btn-secondary btn-sm">View Details</a>
                            <span class="badge bg-secondary">Completed: ${new Date(anime.last_updated).toLocaleString()}</span>
                        </div>
                    </div>
                </div>`;
                list.appendChild(col);
            });
    
            container.appendChild(list);
            container.appendChild(generatePaginationControls(completedWatchlist.length, page, 'bottom'));

        })
        .catch(() => {
            container.innerHTML = '<p>Error loading completed watchlist.</p>';
        });
}

// Generates and appends pagination controls to navigate through long lists of anime (e.g., watchlist, search results).
// Includes "Prev", "Next", page number buttons, and jump-to-top/bottom buttons.
function generatePaginationControls(totalItems, currentPage, position = 'bottom') {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const container = document.createElement('div');
    container.className = 'd-flex justify-content-center align-items-center mt-4 position-relative';

    const ul = document.createElement('ul');
    ul.className = 'pagination mx-auto';

    const createPageItem = (label, page, disabled = false, active = false) => {
        const li = document.createElement('li');
        li.className = `page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}`;
        const a = document.createElement('a');
        a.className = 'page-link';
        a.href = 'javascript:void(0)';
        a.textContent = label;
        a.addEventListener('click', (e) => {
            e.preventDefault();
            if (!disabled && page !== currentPage) renderWatchlist(page);
        });
        li.appendChild(a);
        return li;
    };

    ul.appendChild(createPageItem('Prev', currentPage - 1, currentPage === 1));

    const visiblePages = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) visiblePages.push(i);
    } else {
        visiblePages.push(1);
        if (currentPage > 3) visiblePages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
            if (i > 1 && i < totalPages) visiblePages.push(i);
        }
        if (currentPage < totalPages - 2) visiblePages.push('...');
        visiblePages.push(totalPages);
    }

    visiblePages.forEach(p => {
        if (p === '...') {
            const li = document.createElement('li');
            li.className = 'page-item disabled';
            const span = document.createElement('span');
            span.className = 'page-link';
            span.textContent = '...';
            li.appendChild(span);
            ul.appendChild(li);
        } else {
            ul.appendChild(createPageItem(p, p, false, p === currentPage));
        }
    });

    ul.appendChild(createPageItem('Next', currentPage + 1, currentPage === totalPages));

    const jumpBtn = document.createElement('button');
    jumpBtn.href = 'javascript:void(0)';
    jumpBtn.className = 'btn position-absolute mb-1';
    jumpBtn.style.zIndex = '10';
    jumpBtn.style.backgroundColor = '#fff';

    if (position === 'top') {
        jumpBtn.innerHTML = `
        <span class='mb-1'><svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-arrow-down-circle-fill" viewBox="0 0 16 16">
            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.5 4.5a.5.5 0 0 0-1 0v5.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293z"/>
        </svg> JUMP TO BOTTOM</span>`;
        jumpBtn.style.right = '300px';
        jumpBtn.style.bottom = '10px';
        jumpBtn.addEventListener('click', () => {
            document.getElementById('watchlist-container').scrollIntoView({ behavior: 'smooth', block: 'end' });
        });
    } else {
        jumpBtn.innerHTML = `
        <span class='mb-1'><svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-arrow-up-circle-fill" viewBox="0 0 16 16">
            <path d="M16 8A8 8 0 1 0 0 8a8 8 0 0 0 16 0m-7.5 3.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707z"/>
        </svg> JUMP TO TOP</span>`;
        jumpBtn.style.left = '335px';
        jumpBtn.style.bottom = '10px';
        jumpBtn.addEventListener('click', () => {
            document.getElementById('watchlist-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    container.appendChild(jumpBtn);
    container.appendChild(ul);
    return container;
}

// Provides a fade-out/fade-in effect when swapping content in a specified container.
// This creates a smoother transition for the user when content is reloaded or changed.
function fadeSwapContent(containerId, renderFunction) {
    const container = document.getElementById(containerId);
    if (!container) return renderFunction();

    container.classList.add('fade-out');

    setTimeout(() => {
        renderFunction();
        container.classList.remove('fade-out');
        container.classList.add('fade-in');

        setTimeout(() => container.classList.remove('fade-in'), 300);
    }, 300);
}

// Watchlist Status Update Function
// Updates the watchlist status of a specific anime for the logged-in user.
// Sends a PUT request to the backend with the new status and refreshes the UI accordingly.
function updateStatus(animeId) {
    const newStatus = document.getElementById(`status-select-${animeId}`).value;

    fetch(`/api/user/watchlist/${animeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
    })
    .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
    })
    .then(() => {
        document.getElementById(`status-${animeId}`).textContent = newStatus;

        const now = new Date().toLocaleString();
        const card = document.getElementById(`anime-card-${animeId}`);
        const badge = card?.querySelector('.badge.bg-secondary');
        if (badge) badge.textContent = `Last updated: ${now}`;

        const topBadge = document.querySelector('#watchlist-container .badge.bg-info');
        if (topBadge) topBadge.textContent = `Last Updated: ${now}`;

        showAlert('Watchlist status updated!');

        if (watchlistVisible) {
            if (!['Watching', 'Plan to Watch'].includes(newStatus)) {
                card?.remove();
            } else {
                renderWatchlist(currentPage);
            }
        }

        if (completedWatchlistVisible) {
            if (newStatus === 'Completed') {
                renderCompletedWatchlist();
            } else {
                card?.remove();
            }
        }

    })
    .catch(() => {
        showAlert('Error updating watchlist status.', 'danger');
    });
}

//Watchlist Addition Function
// Adds an anime to the user's watchlist with an initial status of "Plan to Watch".
// Sends a POST request to the backend and provides user feedback through an alert.
function addToWatchlist(animeId) {

    fetch('/api/user/watchlist', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify({
        animeId: animeId,
        status: 'Plan to Watch'
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            showAlert(data.error, "danger");
        } else {
            showAlert('Anime added to your watchlist as "Plan to Watch"!', "success");

        if (watchlistVisible) {
            renderWatchlist(currentPage);
        }

        const topBadge = document.querySelector('#watchlist-container .badge.bg-info');
        if (topBadge) {
            topBadge.textContent = `Last Updated: ${new Date().toLocaleString()}`;
            }
        }
    })
    .catch(err => {
        console.error(err);
        showAlert('This anime might already exist in your watchlist or something went wrong.', "danger");
    });
}

// Watchlist Deletion Function
// Removes a specific anime from the user's watchlist after a confirmation prompt.
// Sends a DELETE request to the backend and updates the UI by removing the anime card.
function removeFromWatchlist(animeId) {
    if (!confirm("Are you sure you want to remove this anime from your watchlist?")) return;

    fetch(`/api/user/watchlist/${animeId}`, {
        method: 'DELETE'
    })
    .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
    })
    .then(data => {
        if (data.error) {
            showAlert(data.error, "danger");
        } else {
            showAlert(data.message, "success");

            const animeCard = document.getElementById(`anime-card-${animeId}`);
            if (animeCard) animeCard.remove();

            const watchlistSection = document.getElementById('watchlist-section');
            const completedSection = document.getElementById('completed-watchlist-section');

            const watchlistVisible = watchlistSection && watchlistSection.style.display !== 'none';
            const completedVisible = completedSection && completedSection.style.display !== 'none';

            if (completedVisible) {
                renderCompletedWatchlist(currentCompletedPage);
            } else if (watchlistVisible) {
                renderWatchlist(currentPage);
            }
        }
    })
    .catch(() => {
        showAlert('Error removing anime from watchlist.', 'danger');
    });
}

//Function to show Alerts in Badges
// Displays a temporary toast notification to provide feedback to the user.
// The notification can be customized with a message, type (success, danger, etc.), and duration.
function showAlert(message, type = "success", duration = 3000) {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-bg-${type} border-0`;
    toast.role = 'alert';
    toast.ariaLive = 'assertive';
    toast.ariaAtomic = 'true';
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        `;

    toastContainer.appendChild(toast);

    const bsToast = new bootstrap.Toast(toast, { delay: duration });
    bsToast.show();

    toast.addEventListener('hidden.bs.toast', () => toast.remove());
}

//Function to handle searched anime data
// Handles the anime search functionality, including query submission and filter application.
// Fetches search results from the backend, dynamically creates filter options, and renders the paginated results.
function handleSearch(event, page = 1) {
    if (event) event.preventDefault();

    const query = document.getElementById('search-input').value.trim();
    const selectedTagsParam = selectedTags.join(',');
    const selectedStudio = document.getElementById('filter-studio')?.value || '';
    const selectedRating = document.getElementById('filter-rating')?.value || '';

    const url = `/search?q=${encodeURIComponent(query)}&page=${page}&tags=${encodeURIComponent(selectedTagsParam)}&studio=${encodeURIComponent(selectedStudio)}&rating=${encodeURIComponent(selectedRating)}`;

    fetch(url)
        .then(response => response.json())
        .then(({ results: data, total, page }) => {
            // Collect studios and tags
            const uniqueStudios = [...new Set(data.map(anime => anime.studio_name))].sort();
            const uniqueTags = allTags;

            // Create filters
            const filterRow = document.getElementById('filter-row');
            filterRow.innerHTML = `
                <div class="col-md-4">
                    <select id="filter-tag" class="form-select">
                        <option value="">All Tags</option>
                        ${uniqueTags.map(tag => `<option value="${tag}">${tag}</option>`).join('')}
                    </select>
                </div>
                <div class="col-md-4">
                    <select id="filter-studio" class="form-select">
                        <option value="">All Studios</option>
                        ${uniqueStudios.map(studio => `<option value="${studio}" ${studio === selectedStudio ? 'selected' : ''}>${studio}</option>`).join('')}
                    </select>
                </div>
                <div class="col-md-4">
                    <select id="filter-rating" class="form-select">
                        <option value="">All Ratings</option>
                        ${[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(r => `<option value="${r}" ${r == selectedRating ? 'selected' : ''}>${r}</option>`).join('')}
                    </select>
                </div>
            `;

            function applyFilters() {
                const selectedStudio = document.getElementById('filter-studio').value;
                const selectedRating = document.getElementById('filter-rating').value;
            
                const filteredData = data.filter(anime => {
                    const animeTags = anime.genres.split(', ').map(tag => tag.trim());
                    const matchesTags = selectedTags.length > 0 
                        ? selectedTags.every(selected => animeTags.includes(selected))
                        : true;
                    const matchesStudio = selectedStudio ? anime.studio_name === selectedStudio : true;
                    const matchesRating = selectedRating ? String(anime.rating) === selectedRating : true;
                    return matchesTags && matchesStudio && matchesRating;
                });
            
                const container = document.getElementById('search-results');
                container.innerHTML = '';
            
                if (filteredData.length === 0) {
                    container.innerHTML = '<p>No results found.</p>';
                } else {
                    filteredData.forEach(anime => {
                        const animeCard = `
                            <div class="col-md-4">
                                <div class="card h-100 d-flex flex-column">
                                    <img data-src="${anime.image_url}" src="${anime.image_url}" class="card-img-top lazy" alt="${anime.title}">
                                    
                                    <div class="card-body d-flex flex-column flex-grow-1">
                                        <h5 class="card-title">${anime.title}</h5>
                                        <p class="search-details"><strong>Type:</strong> ${anime.type} • ${anime.episodes} Episodes</p>
                                        <p class="search-details"><strong>Studio:</strong> ${anime.studio_name}</p>
                                        <p class="search-genres"><strong>Tags:</strong> ${anime.genres}
                                        <p class="search-details"><strong>Rating:</strong> ${anime.rating}</p>
                                        <p class="search-details"><strong>Synopsis:</strong></p>
                                        <p class="search-synopsis">${anime.synopsis}</p>
                                        
                                        <div class="mt-auto">
                                            <a class="btn btn-primary add-watchlist-button-hover btn-radius mr-2" onclick="addToWatchlist(${anime.AnimeID})">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" 
                                                    class="bi bi-caret-right-square-fill align-middle mb-1" viewBox="0 0 16 16">
                                                    <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm5.5 10a.5.5 0 0 0 .832.374l4.5-4a.5.5 0 0 0 0-.748l-4.5-4A.5.5 0 0 0 5.5 4z"/>
                                                </svg> Add to Watchlist
                                            </a>
                                            <a href="/anime/${anime.AnimeID}" class="btn btn-secondary btn-radius mr-2">View Details</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                        container.innerHTML += animeCard;
                    });
                }
            }            

            document.querySelectorAll('.pagination').forEach(el => el.remove());
            renderPagination(total, page, query, selectedTags, selectedStudio, selectedRating);

            // Apply filters initially
            applyFilters();
            renderSelectedTags();

            // Add event listeners for filtering
            document.getElementById('filter-tag').addEventListener('change', function() {
                const tag = this.value;
                if (tag && !selectedTags.includes(tag)) {
                    selectedTags.push(tag);
                    renderSelectedTags();
                    handleSearch(null, 1);
                }
                this.value = '';
            });        
            document.getElementById('filter-studio').addEventListener('change', () => handleSearch(null, 1));
            document.getElementById('filter-rating').addEventListener('change', () => handleSearch(null, 1));

            // Show the results section only
            document.getElementById('search-results-section').style.display = 'block';
            document.getElementById('search-results-container').style.display = 'block';
            document.getElementById('all-section').style.display = 'none';
        })
        .catch(error => console.error('Search error:', error));
}

// Helper Function to render selected tags as badges
// Renders the currently selected tags as interactive badges.
// Allows users to visualize their active tag filters and remove them individually.
function renderSelectedTags() {
    const container = document.getElementById('selected-tags-container');
    container.innerHTML = selectedTags.map(tag => `
        <span class="badge bg-primary me-2 mb-2">
            ${tag}
            <button type="button" class="btn-close btn-close-white btn-sm ms-1" aria-label="Remove" onclick="removeTag('${tag}')"></button>
        </span>
    `).join('');
}

// Helper Function for removing tags
// Removes a specified tag from the list of selected tags and triggers a new search to update results.
function removeTag(tag) {
    selectedTags = selectedTags.filter(t => t !== tag);
    renderSelectedTags();
    handleSearch(null, 1);
}

// Renders pagination controls for search results.
// Dynamically creates "Prev", "Next", and page number inputs based on the total number of results.
function renderPagination(total, currentPage, query) {
    const totalPages = Math.ceil(total / 51);
    const paginationHTML = [];

    if (totalPages <= 1) return;

    paginationHTML.push(`<nav><ul class="pagination justify-content-center">`);

    paginationHTML.push(`
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <button class="page-link" onclick="handleSearch(null, ${currentPage - 1})">Prev</button>
        </li>
    `);

    paginationHTML.push(`
        <li class="page-item">
            <input type="number" class="form-control" value="${currentPage}" 
                min="1" max="${totalPages}" 
                onchange="handleSearch(null, this.value)">
        </li>
        <li class="page-item">
            <span class="page-link">/ ${totalPages}</span>
        </li>
    `);

    paginationHTML.push(`
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <button class="page-link" onclick="handleSearch(null, ${currentPage + 1})">Next</button>
        </li>
    `);

    paginationHTML.push(`</ul></nav>`);

    document.getElementById('pagination-top').innerHTML = paginationHTML.join('');
    document.getElementById('pagination-bottom').innerHTML = paginationHTML.join('');
}

function fetchAnimeDetails() {
    const animeId = window.location.pathname.split('/').pop();
    if (animeId) {
        fetch(`/focusanime/${animeId}`)
            .then(response => response.json())
            .then(anime => {
                if (anime.error) {
                    console.error(anime.error);
                } else {
                    document.querySelector('.col-md-4 img').src = anime.image_url;
                    document.querySelector('.col-md-4 img').alt = anime.title;
                    document.querySelector('.col-md-8 h1').textContent = anime.title;
                    document.querySelector('.col-md-8 p:nth-of-type(1)').innerHTML = `<strong>Type:</strong> ${anime.type}`;
                    document.querySelector('.col-md-8 p:nth-of-type(2)').innerHTML = `<strong>Episodes:</strong> ${anime.episodes}`;
                    document.querySelector('.col-md-8 p:nth-of-type(3)').innerHTML = `<strong>Status:</strong> ${anime.status}`;
                    document.querySelector('.col-md-8 p:nth-of-type(4)').innerHTML = `<strong>Airing Start:</strong> ${anime.airing_start}`;
                    document.querySelector('.col-md-8 p:nth-of-type(5)').innerHTML = `<strong>Airing End:</strong> ${anime.airing_end}`;
                    document.querySelector('.col-md-8 p:nth-of-type(6)').innerHTML = `<strong>Rating:</strong> ${anime.rating}`;
                    document.querySelector('.col-md-8 p:nth-of-type(7)').innerHTML = `<strong>Studio:</strong> ${anime.studio_name}`;
                    document.querySelector('.col-md-8 p:nth-of-type(8)').innerHTML = `<strong>Genres:</strong> ${anime.genres}`;
                    document.querySelector('.col-md-8 p:nth-of-type(10)').textContent = anime.synopsis;
                    document.querySelector('.btn-primary').setAttribute('onclick', `addToWatchlist(${anime.AnimeID})`);
                }
            })
            .catch(error => console.error('Error fetching anime details:', error));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('/anime/')) {
        fetchAnimeDetails();
    }
});
