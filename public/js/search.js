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

function createSearchCard(anime) {
    const col = document.createElement('div');
    col.className = 'col-md-4';

    const card = document.createElement('div');
    card.className = 'card h-100 d-flex flex-column';

    const img = document.createElement('img');
    img.className = 'card-img-top lazy';
    img.setAttribute('data-src', anime.image_url);
    img.src = anime.image_url;
    img.alt = anime.title;
    
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body d-flex flex-column flex-grow-1';

    const title = document.createElement('h5');
    title.className = 'card-title';
    title.textContent = anime.title; // SAFE

    const details1 = document.createElement('p');
    details1.className = 'search-details';
    details1.innerHTML = `<strong>Type:</strong> ${anime.type} • ${anime.episodes} Episodes`; // SAFE

    const studio = document.createElement('p');
    studio.className = 'search-details';
    studio.innerHTML = '<strong>Studio:</strong> ';
    studio.appendChild(document.createTextNode(anime.studio_name)); // SAFE
    
    const genres = document.createElement('p');
    genres.className = 'search-genres';
    genres.innerHTML = '<strong>Tags:</strong> ';
    genres.appendChild(document.createTextNode(anime.genres)); // SAFE
    
    const rating = document.createElement('p');
    rating.className = 'search-details';
    rating.innerHTML = '<strong>Rating:</strong> ';
    rating.appendChild(document.createTextNode(anime.rating)); // SAFE

    const synopsisTitle = document.createElement('p');
    synopsisTitle.className = 'search-details';
    synopsisTitle.innerHTML = '<strong>Synopsis:</strong>';

    const synopsis = document.createElement('p');
    synopsis.className = 'search-synopsis';
    synopsis.textContent = anime.synopsis; // SAFE
    
    const buttonDiv = document.createElement('div');
    buttonDiv.className = 'mt-auto';

    const watchlistBtn = document.createElement('a');
    watchlistBtn.className = 'btn btn-primary add-watchlist-button-hover btn-radius mr-2';
    watchlistBtn.onclick = () => addToWatchlist(anime.AnimeID);
    watchlistBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-caret-right-square-fill align-middle mb-1" viewBox="0 0 16 16"><path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm5.5 10a.5.5 0 0 0 .832.374l4.5-4a.5.5 0 0 0 0-.748l-4.5-4A.5.5 0 0 0 5.5 4z"/></svg> Add to Watchlist`;

    const detailsBtn = document.createElement('a');
    detailsBtn.href = `/anime/${anime.AnimeID}`;
    detailsBtn.className = 'btn btn-secondary btn-radius mr-2';
    detailsBtn.textContent = 'View Details';
    
    buttonDiv.appendChild(watchlistBtn);
    buttonDiv.appendChild(detailsBtn);

    cardBody.appendChild(title);
    cardBody.appendChild(details1);
    cardBody.appendChild(studio);
    cardBody.appendChild(genres);
    cardBody.appendChild(rating);
    cardBody.appendChild(synopsisTitle);
    cardBody.appendChild(synopsis);
    cardBody.appendChild(buttonDiv);
    
    card.appendChild(img);
    card.appendChild(cardBody);
    col.appendChild(card);

    return col;
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
                                        const animeCard = createSearchCard(anime);
                                        container.appendChild(animeCard);
                                    });                }
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
