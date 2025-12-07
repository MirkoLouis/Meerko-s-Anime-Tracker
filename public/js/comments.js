// Function to fetch and render comments for an anime
async function fetchAndRenderComments(animeId, currentUser) {
    const commentsList = document.getElementById('comments-list');
    commentsList.innerHTML = '<p>Loading comments...</p>';

    try {
        const response = await fetch(`/api/anime/${animeId}/comments`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const comments = await response.json();

        commentsList.innerHTML = ''; // Clear loading message

        if (comments.length === 0) {
            commentsList.innerHTML = '<p>No comments yet. Be the first to comment!</p>';
        } else {
            comments.forEach(comment => {
                const commentContainer = document.createElement('div');
                commentContainer.classList.add('d-flex', 'align-items-start', 'mb-3'); // Flex container for comment and button

                const commentElement = document.createElement('div');
                commentElement.classList.add('card', 'flex-grow-1'); // Comment card takes available space
                
                const cardBody = document.createElement('div');
                cardBody.classList.add('card-body');

                const cardTitle = document.createElement('h5');
                cardTitle.classList.add('card-title');
                cardTitle.textContent = comment.display_name;

                const cardSubtitle = document.createElement('h6');
                cardSubtitle.classList.add('card-subtitle', 'mb-2', 'text-muted');
                cardSubtitle.textContent = new Date(comment.created_at).toLocaleString();

                const cardText = document.createElement('p');
                cardText.classList.add('card-text');
                cardText.textContent = comment.comment_text;

                cardBody.appendChild(cardTitle);
                cardBody.appendChild(cardSubtitle);
                cardBody.appendChild(cardText);
                commentElement.appendChild(cardBody);
                commentContainer.appendChild(commentElement);

                if (currentUser && currentUser.role === 'admin') {
                    const deleteButtonWrapper = document.createElement('div');
                    deleteButtonWrapper.classList.add('ms-3', 'mt-3');
                    
                    const deleteButton = document.createElement('button');
                    deleteButton.className = 'btn btn-danger btn-md';
                    deleteButton.textContent = 'Delete';
                    deleteButton.onclick = () => deleteComment(comment.CommentID, animeId);

                    deleteButtonWrapper.appendChild(deleteButton);
                    commentContainer.appendChild(deleteButtonWrapper);
                }
                commentsList.appendChild(commentContainer);
            });
        }
    } catch (error) {
        console.error('Error fetching and rendering comments:', error);
        commentsList.innerHTML = '<p>Error loading comments.</p>';
    }
}

// Function to submit a new comment
async function submitComment(event, currentUser) {
    event.preventDefault(); // Prevent default form submission

    if (!currentUser) {
        showAlert('Please log in to leave a comment.', 'info');
        // Optionally redirect to login page
        // window.location.href = '/login';
        return;
    }

    const animeId = window.location.pathname.split('/').pop();
    const commentInput = document.getElementById('comment-input');
    const comment_text = commentInput.value.trim();

    if (!comment_text) {
        showAlert('Comment cannot be empty.', 'warning');
        return;
    }

    try {
        const response = await fetch(`/api/anime/${animeId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${document.cookie.split('; ').find(row => row.startsWith('jwt='))?.split('=')[1]}`
            },
            body: JSON.stringify({ comment_text })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Comment added successfully!', 'success');
            commentInput.value = ''; // Clear the input field
            await fetchAndRenderComments(animeId, currentUser); // Re-render comments
        } else {
            showAlert(data.error || 'Failed to add comment.', 'danger');
        }
    } catch (error) {
        console.error('Error submitting comment:', error);
        showAlert('An error occurred while submitting comment.', 'danger');
    }
}

// Function to delete a comment
async function deleteComment(commentId, animeId) {
    if (!confirm('Are you sure you want to delete this comment?')) {
        return;
    }

    const currentUser = window.currentUser; // Get current user again for safety
    if (!currentUser || currentUser.role !== 'admin') {
        showAlert('You do not have permission to delete comments.', 'danger');
        return;
    }

    try {
        const response = await fetch(`/api/comments/${commentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${document.cookie.split('; ').find(row => row.startsWith('jwt='))?.split('=')[1]}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Comment deleted successfully!', 'success');
            await fetchAndRenderComments(animeId, currentUser); // Re-render comments
        } else {
            showAlert(data.error || 'Failed to delete comment.', 'danger');
        }
    } catch (error) {
        console.error('Error deleting comment:', error);
        showAlert('An error occurred while deleting comment.', 'danger');
    }
}

async function fetchAnimeDetails(currentUser) {
    const animeId = window.location.pathname.split('/').pop();
    if (!animeId) {
        console.error('Anime ID not found in URL.');
        return;
    }

    try {
        const response = await fetch(`/focusanime/${animeId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const anime = await response.json();

        if (anime) {
            document.getElementById('anime-details-banner').style.backgroundImage = `url('${anime.image_url}')`;
            document.getElementById('anime-title-banner').textContent = anime.title || 'Unknown Title';
            document.getElementById('anime-image').src = anime.image_url || '';
            document.getElementById('anime-image').alt = anime.title || 'Anime Image';
            document.getElementById('anime-title').textContent = anime.title || 'Unknown Title';
            document.getElementById('anime-type').textContent = anime.type || 'N/A';
            document.getElementById('anime-episodes').textContent = anime.episodes || 'N/A';
            document.getElementById('anime-status').textContent = anime.status || 'N/A';
            document.getElementById('anime-airing-start').textContent = anime.airing_start ? new Date(anime.airing_start).toLocaleDateString() : 'N/A';
            document.getElementById('anime-airing-end').textContent = anime.airing_end ? new Date(anime.airing_end).toLocaleDateString() : 'N/A';
            document.getElementById('anime-rating').textContent = anime.rating || 'N/A';
            document.getElementById('anime-studio-name').textContent = anime.studio_name || 'N/A';
            document.getElementById('anime-genres').textContent = anime.genres || 'N/A';
            document.getElementById('anime-synopsis').textContent = anime.synopsis || 'No synopsis available.';
            
            const addToWatchlistBtn = document.getElementById('add-to-watchlist-btn');
            if (addToWatchlistBtn) {
                addToWatchlistBtn.dataset.animeId = anime.AnimeID;
            }

            console.log('Anime details populated successfully.');
            await fetchAndRenderComments(anime.AnimeID, currentUser); // Fetch and render comments after anime details
        } else {
            console.error('No anime data received.');
        }
    } catch (error) {
        console.error('Error fetching anime details:', error);
    }
}