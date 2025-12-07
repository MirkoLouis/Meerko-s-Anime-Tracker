// Anime Spotlight
let spotlightAnimes = [];
let currentSpotlightIndex = 0;

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

        if (typeof lazyLoadInstance !== 'undefined' && typeof lazyLoadInstance.update === 'function') {
            lazyLoadInstance.update();
        }

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

// Dashboard Spotlight
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

        if (typeof lazyLoadInstance !== 'undefined' && typeof lazyLoadInstance.update === 'function') {
            lazyLoadInstance.update();
        }

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
                    const animeCard = createNewAnimeCard(anime);
                    row.appendChild(animeCard);
                }

                carouselItem.appendChild(row);
                newAnimesContainer.appendChild(carouselItem);
            }
            if (typeof lazyLoadInstance !== 'undefined' && typeof lazyLoadInstance.update === 'function') {
                lazyLoadInstance.update();
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
                    const animeCard = createUpcomingAnimeCard(anime);
                    row.appendChild(animeCard);
                }

                carouselItem.appendChild(row);
                upcomingAnimesContainer.appendChild(carouselItem);
            }
            if (typeof lazyLoadInstance !== 'undefined' && typeof lazyLoadInstance.update === 'function') {
                lazyLoadInstance.update();
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
                const animeSlide = createRecommendedAnimeSlide(anime);
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

            if (typeof lazyLoadInstance !== 'undefined' && typeof lazyLoadInstance.update === 'function') {
                lazyLoadInstance.update();
            }
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
                const row = document.createElement('div');
                row.className = 'row justify-content-center text-center';

                group.forEach(anime => {
                    const animeCard = createMostWatchlistedAnimeCard(anime);
                    row.appendChild(animeCard);
                });

                slide.appendChild(row);
                carouselInner.appendChild(slide);
            }

            if (typeof lazyLoadInstance !== 'undefined' && typeof lazyLoadInstance.update === 'function') {
                lazyLoadInstance.update();
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
                const animeCard = createRandomAnimeCard(anime);
                randomAnimesContainer.appendChild(animeCard);
            });

            if (typeof lazyLoadInstance !== 'undefined' && typeof lazyLoadInstance.update === 'function') {
                lazyLoadInstance.update();
            }
        })
        .catch(error => {
            console.error('Error fetching random animes:', error);
        });
}

function createNewAnimeCard(anime) {
    const col = document.createElement('div');
    col.classList.add('col-md-4', 'px-2');

    const airingDate = new Date(anime.airing_start);
    const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
    const formattedDate = airingDate.toLocaleDateString('en-US', options);

    const animeCard = document.createElement('div');
    animeCard.classList.add('newanime-card', 'text-center');

    const card = document.createElement('div');
    card.className = 'card h-100 d-flex flex-column';

    const img = document.createElement('img');
    img.className = 'd-block w-100 lazy';
    img.setAttribute('data-src', anime.image_url);
    img.src = '/imnota-cat-fubuki.gif';
    img.alt = anime.title + ' cover';
    img.style.objectFit = 'cover';
    img.style.height = '300px';
    img.style.width = '200px';

    const textContainer = document.createElement('div');
    textContainer.className = 'text-container d-flex flex-column flex-grow-1 p-2';

    const title = document.createElement('h5');
    title.title = anime.title;
    title.textContent = anime.title; // SAFE

    const airingInfo = document.createElement('p');
    // Using innerHTML here is safe because formattedDate is generated from a Date object, not user input.
    airingInfo.innerHTML = `<strong>Started Airing:</strong><br>${formattedDate} UTC`;

    const buttonDiv = document.createElement('div');
    buttonDiv.className = 'mt-auto';

    const watchlistBtn = document.createElement('a');
    watchlistBtn.className = 'btn btn-primary add-watchlist-button-hover btn-radius mr-2';
    watchlistBtn.onclick = () => addToWatchlist(anime.AnimeID);
    // The SVG is static and safe to set with innerHTML.
    watchlistBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-caret-right-square-fill align-middle mb-1" viewBox="0 0 16 16"><path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm5.5 10a.5.5 0 0 0 .832.374l4.5-4a.5.5 0 0 0 0-.748l-4.5-4A.5.5 0 0 0 5.5 4z"/></svg> Add to Watchlist`;

    const detailsBtn = document.createElement('a');
    detailsBtn.href = `/anime/${anime.AnimeID}`;
    detailsBtn.className = 'btn btn-secondary btn-radius mr-2';
    detailsBtn.style.marginTop = '10px';
    detailsBtn.textContent = 'View Details'; // SAFE

    buttonDiv.appendChild(watchlistBtn);
    buttonDiv.appendChild(detailsBtn);

    textContainer.appendChild(title);
    textContainer.appendChild(airingInfo);
    textContainer.appendChild(buttonDiv);

    card.appendChild(img);
    card.appendChild(textContainer);

    animeCard.appendChild(card);
    col.appendChild(animeCard);
    
    return col;
}

function createUpcomingAnimeCard(anime) {
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
            if (month <= 2) season = "Winter";
            else if (month <= 5) season = "Spring";
            else if (month <= 8) season = "Summer";
            else season = "Fall";
            return `${season} ${year}`;
        }
        airingText = getAnimeSeason(airingDate);
    }

    const animeCard = document.createElement('div');
    animeCard.classList.add('upcominganime-card', 'text-center');

    const card = document.createElement('div');
    card.className = 'card h-100 d-flex flex-column';

    const img = document.createElement('img');
    img.className = 'd-block w-100 lazy';
    img.setAttribute('data-src', anime.image_url);
    img.src = '/imnota-cat-fubuki.gif';
    img.alt = anime.title + ' cover';
    img.style.objectFit = 'cover';
    img.style.height = '300px';
    img.style.width = '200px';

    const textContainer = document.createElement('div');
    textContainer.className = 'text-container d-flex flex-column flex-grow-1 p-2';

    const title = document.createElement('h5');
    title.title = anime.title;
    title.textContent = anime.title; // SAFE

    const airingInfo = document.createElement('p');
    airingInfo.innerHTML = `<strong>Expected Date:</strong><br>${airingText}`; // airingText is safe

    const buttonDiv = document.createElement('div');
    buttonDiv.className = 'mt-auto';

    const watchlistBtn = document.createElement('a');
    watchlistBtn.className = 'btn btn-primary add-watchlist-button-hover btn-radius mr-2';
    watchlistBtn.onclick = () => addToWatchlist(anime.AnimeID);
    watchlistBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-caret-right-square-fill align-middle mb-1" viewBox="0 0 16 16"><path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm5.5 10a.5.5 0 0 0 .832.374l4.5-4a.5.5 0 0 0 0-.748l-4.5-4A.5.5 0 0 0 5.5 4z"/></svg> Add to Watchlist`;

    const detailsBtn = document.createElement('a');
    detailsBtn.href = `/anime/${anime.AnimeID}`;
    detailsBtn.className = 'btn btn-secondary btn-radius mr-2';
    detailsBtn.style.marginTop = '10px';
    detailsBtn.textContent = 'View Details'; // SAFE

    buttonDiv.appendChild(watchlistBtn);
    buttonDiv.appendChild(detailsBtn);

    textContainer.appendChild(title);
    textContainer.appendChild(airingInfo);
    textContainer.appendChild(buttonDiv);

    card.appendChild(img);
    card.appendChild(textContainer);

    animeCard.appendChild(card);
    col.appendChild(animeCard);
    
    return col;
}

function createRecommendedAnimeSlide(anime) {
    const animeSlide = document.createElement('div');
    animeSlide.classList.add('swiper-slide');

    let synopsis = typeof anime.synopsis === 'string' ? anime.synopsis : 'No description available';

    // Create the overall structure
    const deslideItem = document.createElement('div');
    deslideItem.className = 'deslide-item';
    
    const deslideCover = document.createElement('div');
    deslideCover.className = 'deslide-cover';
    
    const deslideCoverImg = document.createElement('div');
    deslideCoverImg.className = 'deslide-cover-img';
    
    const img = document.createElement('img');
    img.className = 'film-poster-img lazy';
    img.setAttribute('data-src', anime.image_url);
    img.src = '/imnota-cat-fubuki.gif';
    img.alt = anime.title;
    
    const itemContent = document.createElement('div');
    itemContent.className = 'deslide-item-content bg-dark bg-opacity-75 text-white';

    // Populate content safely
    const headTitle = document.createElement('div');
    headTitle.className = 'desi-head-title';
    headTitle.title = anime.title;
    const h4 = document.createElement('h4');
    h4.textContent = anime.title; // SAFE
    headTitle.appendChild(h4);

    const scDetail = document.createElement('div');
    scDetail.className = 'sc-detail';
    
    const typeDiv = document.createElement('div');
    typeDiv.className = 'scd-item';
    typeDiv.innerHTML = '<strong>Type: </strong>';
    typeDiv.appendChild(document.createTextNode(anime.type)); // SAFE
    
    const genresDiv = document.createElement('div');
    genresDiv.className = 'scd-item featured-tags wrapaway';
    genresDiv.innerHTML = '<strong>Genres: </strong>';
    genresDiv.appendChild(document.createTextNode(anime.genres)); // SAFE
    
    const episodesDiv = document.createElement('div');
    episodesDiv.className = 'scd-item';
    episodesDiv.innerHTML = `<strong>Episodes: </strong>${anime.episodes} episodes`; // SAFE

    const statusDiv = document.createElement('div');
    statusDiv.className = 'scd-item';
    statusDiv.innerHTML = `<span class="quality"><strong>Status: </strong>${anime.status}</span>`; // SAFE

    scDetail.appendChild(typeDiv);
    scDetail.appendChild(genresDiv);
    scDetail.appendChild(episodesDiv);
    scDetail.appendChild(statusDiv);
    
    const synopsisTitle = document.createElement('div');
    synopsisTitle.className = 'desi-description';
    synopsisTitle.innerHTML = '<strong>Synopsis: </strong>';
    
    const synopsisContent = document.createElement('div');
    synopsisContent.className = 'desi-description featured-synopsis wrapaway';
    synopsisContent.textContent = synopsis; // SAFE

    const buttons = document.createElement('div');
    buttons.className = 'desi-buttons featured-buttons';
    const watchlistBtn = document.createElement('a');
    watchlistBtn.className = 'btn btn-primary add-watchlist-button-hover btn-radius mr-2';
    watchlistBtn.onclick = () => addToWatchlist(anime.AnimeID);
    watchlistBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-caret-right-square-fill align-middle mb-1" viewBox="0 0 16 16"><path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm5.5 10a.5.5 0 0 0 .832.374l4.5-4a.5.5 0 0 0 0-.748l-4.5-4A.5.5 0 0 0 5.5 4z"/></svg> Add to Watchlist`; // SAFE (static)
    const detailsBtn = document.createElement('a');
    detailsBtn.href = `/anime/${anime.AnimeID}`;
    detailsBtn.className = 'btn btn-secondary btn-radius mr-2';
    detailsBtn.textContent = 'View Details'; // SAFE
    buttons.appendChild(watchlistBtn);
    buttons.appendChild(detailsBtn);

    // Assemble the card
    deslideCoverImg.appendChild(img);
    deslideCover.appendChild(deslideCoverImg);
    itemContent.appendChild(headTitle);
    itemContent.appendChild(scDetail);
    itemContent.appendChild(synopsisTitle);
    itemContent.appendChild(synopsisContent);
    itemContent.appendChild(buttons);
    deslideItem.appendChild(deslideCover);
    deslideItem.appendChild(itemContent);
    animeSlide.appendChild(deslideItem);

    return animeSlide;
}

function createMostWatchlistedAnimeCard(anime) {
    const col = document.createElement('div');
    col.className = 'col-md-4 mb-4';

    let synopsis = typeof anime.synopsis === 'string' ? anime.synopsis : 'No description available';

    const img = document.createElement('img');
    img.className = 'img-fluid rounded shadow mb-3 lazy';
    img.setAttribute('data-src', anime.image_url);
    img.src = '/imnota-cat-fubuki.gif';
    img.alt = anime.title;
    img.style.maxWidth = '600px';
    img.style.height = '400px';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'bg-dark bg-opacity-75 text-white rounded p-3';

    const title = document.createElement('h3');
    title.textContent = anime.title; // SAFE

    const synopsisP = document.createElement('p');
    synopsisP.className = 'small mostwatchlist-synopsis';
    synopsisP.textContent = synopsis; // SAFE

    const detailsP = document.createElement('p');
    detailsP.className = 'mb-2';
    detailsP.innerHTML = `
        <strong>Type:</strong> ${anime.type} |
        <strong>Episodes:</strong> ${anime.episodes} |
        <strong>Status:</strong> ${anime.status}
    `; // SAFE (no user input)

    const watchlistBtn = document.createElement('a');
    watchlistBtn.className = 'btn btn-primary add-watchlist-button-hover btn-radius mr-2';
    watchlistBtn.onclick = () => addToWatchlist(anime.AnimeID);
    watchlistBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-caret-right-square-fill align-middle mb-1" viewBox="0 0 16 16"><path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm5.5 10a.5.5 0 0 0 .832.374l4.5-4a.5.5 0 0 0 0-.748l-4.5-4A.5.5 0 0 0 5.5 4z"/></svg> Add to Watchlist`;

    const detailsBtn = document.createElement('a');
    detailsBtn.href = `/anime/${anime.AnimeID}`;
    detailsBtn.className = 'btn btn-secondary btn-radius mr-2';
    detailsBtn.textContent = 'View Details';

    contentDiv.appendChild(title);
    contentDiv.appendChild(synopsisP);
    contentDiv.appendChild(detailsP);
    contentDiv.appendChild(watchlistBtn);
    contentDiv.appendChild(detailsBtn);

    col.appendChild(img);
    col.appendChild(contentDiv);

    return col;
}

function createRandomAnimeCard(anime) {
    const animeCard = document.createElement('div');
    animeCard.classList.add('card', 'anime-card', 'mb-3');
    animeCard.style.width = '17.4rem';

    const img = document.createElement('img');
    img.className = 'card-img-top anime-image lazy';
    img.setAttribute('data-src', anime.image_url);
    img.src = '/imnota-cat-fubuki.gif';
    img.alt = anime.title + ' cover';

    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';

    const title = document.createElement('h5');
    title.className = 'card-title';
    title.title = anime.title;
    title.textContent = anime.title; // SAFE

    const typeP = document.createElement('p');
    typeP.className = 'card-text';
    typeP.innerHTML = '<strong>Type:</strong> ';
    typeP.appendChild(document.createTextNode(anime.type)); // SAFE

    const studioP = document.createElement('p');
    studioP.className = 'card-text';
    studioP.innerHTML = "<strong>Studio:</strong> ";
    const studioSpan = document.createElement('span');
    studioSpan.className = 'studio-name';
    studioSpan.title = anime.studio_name;
    studioSpan.textContent = anime.studio_name; // SAFE
    studioP.appendChild(studioSpan);

    const tagsP = document.createElement('p');
    tagsP.className = 'card-text tags';
    tagsP.innerHTML = '<strong>Tags:</strong> ';
    tagsP.appendChild(document.createTextNode(anime.genres)); // SAFE
    
    const episodesP = document.createElement('p');
    episodesP.className = 'card-text';
    episodesP.innerHTML = '<strong>Episodes:</strong> ';
    episodesP.appendChild(document.createTextNode(anime.episodes)); // SAFE

    const statusP = document.createElement('p');
    statusP.className = 'card-text';
    statusP.innerHTML = '<strong>Status:</strong> ';
    statusP.appendChild(document.createTextNode(anime.status)); // SAFE

    const watchlistBtn = document.createElement('a');
    watchlistBtn.className = 'btn btn-primary add-watchlist-button-hover btn-radius mr-2';
    watchlistBtn.onclick = () => addToWatchlist(anime.AnimeID);
    watchlistBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-caret-right-square-fill align-middle mb-1" viewBox="0 0 16 16"><path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm5.5 10a.5.5 0 0 0 .832.374l4.5-4a.5.5 0 0 0 0-.748l-4.5-4A.5.5 0 0 0 5.5 4z"/></svg> Add to Watchlist`;

    const detailsBtn = document.createElement('a');
    detailsBtn.href = `/anime/${anime.AnimeID}`;
    detailsBtn.className = 'btn btn-secondary btn-radius mr-2';
    detailsBtn.style.marginTop = '10px';
    detailsBtn.textContent = 'View Details';

    cardBody.appendChild(title);
    cardBody.appendChild(typeP);
    cardBody.appendChild(studioP);
    cardBody.appendChild(tagsP);
    cardBody.appendChild(episodesP);
    cardBody.appendChild(statusP);
    cardBody.appendChild(watchlistBtn);
    cardBody.appendChild(detailsBtn);

    animeCard.appendChild(img);
    animeCard.appendChild(cardBody);

    return animeCard;
}
