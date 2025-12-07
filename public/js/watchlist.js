let watchlistVisible = false;
let completedWatchlistVisible = false;
let currentPage = 1;
const itemsPerPage = 26;
let currentWatchlist = [];
let currentCompletedWatchlist = [];

// Watchlist Toggle
// Event listener for the "My Watchlist" button. Toggles the visibility of the main watchlist container.
// When activated, it hides the completed watchlist and renders the current watchlist.
const myListBtn = document.getElementById('myListBtn');
if (myListBtn) {
    myListBtn.addEventListener('click', () => {
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
}

// Event listener for the "My Completed Animes" button. Toggles the visibility of the completed watchlist container.
// When activated, it hides the current watchlist and renders the completed watchlist.
const myCompletedAnimesBtn = document.getElementById('myCompletedAnimesBtn');
if (myCompletedAnimesBtn) {
    myCompletedAnimesBtn.addEventListener('click', () => {
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
}

function createWatchlistCard(anime, cardType = 'watchlist') {
    const col = document.createElement('div');
    col.className = 'col-md-6 mb-4 d-flex';
    col.id = `anime-card-${anime.AnimeID}`;

    const card = document.createElement('div');
    card.className = 'card h-100 shadow-sm w-100';

    const img = document.createElement('img');
    img.className = 'card-img-top lazy';
    img.setAttribute('data-src', anime.image_url);
    img.src = anime.image_url;
    img.alt = anime.title;
    img.style.height = '225px';
    img.style.objectFit = 'cover';

    const cardBody = document.createElement('div');
    cardBody.className = 'card-body d-flex flex-column';

    const title = document.createElement('h4');
    title.className = 'card-title';
    title.textContent = anime.title; // SAFE

    const details1 = document.createElement('p');
    details1.innerHTML = `<strong>Type:</strong> ${anime.type} • ${anime.episodes} Episodes • Score: ${anime.rating}`; // SAFE

    const studio = document.createElement('p');
    studio.innerHTML = '<strong>Studio:</strong> ';
    studio.appendChild(document.createTextNode(anime.studio_name)); // SAFE

    const tags = document.createElement('p');
    tags.innerHTML = '<strong>Tags:</strong> ';
    tags.appendChild(document.createTextNode(anime.genres)); // SAFE
    
    const status = document.createElement('p');
    status.innerHTML = '<strong>Watchlist Status:</strong> ';
    const statusSpan = document.createElement('span');
    statusSpan.id = `status-${anime.AnimeID}`;
    statusSpan.textContent = anime.watchlist_status; // SAFE
    status.appendChild(statusSpan);

    const inputGroup = document.createElement('div');
    inputGroup.className = 'input-group mb-2';
    inputGroup.innerHTML = `
        <select class="form-select" id="status-select-${anime.AnimeID}">
            <option value="Watching" ${anime.watchlist_status === 'Watching' ? 'selected' : ''}>Watching</option>
            <option value="Completed" ${anime.watchlist_status === 'Completed' ? 'selected' : ''}>Completed</option>
            <option value="Plan to Watch" ${anime.watchlist_status === 'Plan to Watch' ? 'selected' : ''}>Plan to Watch</option>
        </select>
        <button class="btn btn-primary" onclick="updateStatus(${anime.AnimeID})">Save</button>
    `; // SAFE (no user input)

    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'd-flex align-items-center gap-2 mb-1';
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn btn-outline-danger btn-sm';
    removeBtn.onclick = () => removeFromWatchlist(anime.AnimeID);
    removeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill mb-1" viewBox="0 0 16 16"><path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/></svg> Remove`;

    const detailsBtn = document.createElement('a');
    detailsBtn.href = `/anime/${anime.AnimeID}`;
    detailsBtn.className = 'btn btn-secondary btn-sm';
    detailsBtn.textContent = 'View Details';

    buttonGroup.appendChild(removeBtn);
    buttonGroup.appendChild(detailsBtn);

    if (cardType === 'watchlist') {
        const addedBadge = document.createElement('span');
        addedBadge.className = 'badge bg-secondary';
        addedBadge.textContent = `Added on: ${new Date(anime.date_added).toLocaleString()}`;
        
        const updatedBadge = document.createElement('span');
        updatedBadge.className = 'badge bg-secondary';
        updatedBadge.textContent = `Last updated: ${new Date(anime.last_updated).toLocaleString()}`;

        buttonGroup.appendChild(addedBadge);
        buttonGroup.appendChild(updatedBadge);
    } else if (cardType === 'completed') {
        const completedBadge = document.createElement('span');
        completedBadge.className = 'badge bg-secondary';
        completedBadge.textContent = `Completed: ${new Date(anime.last_updated).toLocaleString()}`;
        buttonGroup.appendChild(completedBadge);
    }
    
    cardBody.appendChild(title);
    cardBody.appendChild(details1);
    cardBody.appendChild(studio);
    cardBody.appendChild(tags);
    cardBody.appendChild(status);
    cardBody.appendChild(inputGroup);
    cardBody.appendChild(buttonGroup);

    card.appendChild(img);
    card.appendChild(cardBody);
    col.appendChild(card);

    return col;
}

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
                const animeCard = createWatchlistCard(anime, 'watchlist');
                list.appendChild(animeCard);
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
                const animeCard = createWatchlistCard(anime, 'completed');
                list.appendChild(animeCard);
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