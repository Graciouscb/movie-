// IMPORTANT: Replace 'YOUR_API_KEY' with your actual TMDB API key.
        const TMDB_API_KEY = '5c53e226be1981a3633171ea9f6e9215';
        const searchInput = document.getElementById('searchInput');
        const searchButton = document.getElementById('searchButton');
        const movieResults = document.getElementById('movieResults');
        const loadingIndicator = document.getElementById('loadingIndicator');
        const movieModal = document.getElementById('movieModal');
        const modalContent = document.getElementById('modalContent');
        const noResults = document.getElementById('noResults');

        // Base URL for TMDB API and images
        const API_BASE_URL = 'https://api.themoviedb.org/3';
        const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

        // Event listener for the search button
        searchButton.addEventListener('click', () => {
            const query = searchInput.value.trim();
            if (query) {
                searchMovies(query);
            }
        });

        // Event listener for pressing Enter in the search input
        searchInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                searchButton.click();
            }
        });
        // Function to fetch and display movies
        async function searchMovies(query) {
            loadingIndicator.classList.remove('hidden');
            movieResults.innerHTML = '';
            noResults.classList.add('hidden');

            try {
                const response = await fetch(`${API_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`);
                const data = await response.json();

                if (data.results && data.results.length > 0) {
                    displayMovies(data.results);
                } else {
                    noResults.classList.remove('hidden');
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                alertMessage('Error fetching data. Please try again later.');
            } finally {
                loadingIndicator.classList.add('hidden');
            }
        }
        // Function to display movie cards
        function displayMovies(movies) {
            movies.forEach(movie => {
                const posterPath = movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : 'https://placehold.co/500x750/333333/FFFFFF?text=No+Poster';
                const releaseDate = movie.release_date ? movie.release_date.substring(0, 4) : 'N/A';
                const cardWrapper = document.createElement('div');
                // Make each grid item stretch and be mobile friendly
                cardWrapper.className = 'w-full flex';

                const movieCard = document.createElement('div');
                movieCard.className = 'bg-[#1E1E1E] rounded-lg overflow-hidden shadow-xl transform transition-transform duration-300 hover:scale-105 cursor-pointer w-full';
                movieCard.innerHTML = `
                    <div class="w-full">
                        <img src="${posterPath}" alt="${movie.title} Poster" class="w-full h-auto object-cover rounded-t-lg">
                        <div class="p-4">
                            <h3 class="text-sm sm:text-md font-semibold text-gray-200 mb-1 leading-tight">${movie.title}</h3>
                            <p class="text-xs sm:text-sm text-gray-400">${releaseDate}</p>
                        </div>
                    </div>
                `;

                movieCard.addEventListener('click', () => {
                    showMovieDetails(movie.id);
                });

                cardWrapper.appendChild(movieCard);
                movieResults.appendChild(cardWrapper);
            });
        }

        // Function to show detailed movie information in a modal (responsive + watch providers + custom link)
        async function showMovieDetails(movieId) {
            try {
                const response = await fetch(`${API_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}`);
                const movie = await response.json();

                const posterPath = movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : 'https://placehold.co/500x750/333333/FFFFFF?text=No+Poster';
                const genres = movie.genres.map(g => g.name).join(', ') || 'N/A';
                const runtime = movie.runtime ? `${movie.runtime} min` : 'N/A';
                const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
                const releaseDate = movie.release_date || 'N/A';

                // Fetch watch providers (default to US)
                let watchProvidersHtml = '';
                try {
                    const providerRes = await fetch(`${API_BASE_URL}/movie/${movieId}/watch/providers?api_key=${TMDB_API_KEY}`);
                    const providerData = await providerRes.json();
                    const country = providerData.results && providerData.results.US ? providerData.results.US : null;

                    const sections = [];
                    if (country) {
                        ['flatrate','rent','buy'].forEach(key => {
                            if (country[key] && country[key].length > 0) {
                                sections.push({title: key === 'flatrate' ? 'Stream' : (key === 'rent' ? 'Rent' : 'Buy'), list: country[key]});
                            }
                        });
                    }

                    if (sections.length) {
                        watchProvidersHtml = `<div class="mt-4">
                            <p class='font-semibold text-gray-200 mb-2'>Where to watch</p>
                            <div class='flex flex-wrap gap-2'>`;

                        sections.forEach(sec => {
                            watchProvidersHtml += `<div class='w-full text-xs text-gray-300 mb-2'><p class='font-medium text-gray-200 mb-1'>${sec.title}:</p><div class='flex flex-wrap gap-2'>`;
                            watchProvidersHtml += sec.list.map(p => `
                                <a href='${country.link || '#'}' target='_blank' rel='noopener' class='inline-flex items-center gap-2 bg-[#282828] text-gray-300 text-xs font-medium px-2.5 py-1 rounded-full hover:bg-[#FF5722] transition'>
                                    ${p.logo_path ? `<img src='https://image.tmdb.org/t/p/w45${p.logo_path}' alt='${p.provider_name}' class='h-5 w-5 rounded-full'>` : ''}
                                    ${p.provider_name}
                                </a>
                            `).join('');
                            watchProvidersHtml += `</div></div>`;
                        });

                        watchProvidersHtml += `</div></div>`;
                    } else {
                        watchProvidersHtml = `<div class='mt-4 text-gray-400 text-sm'>No streaming providers found for US.</div>`;
                    }
                } catch (e) {
                    watchProvidersHtml = `<div class='mt-4 text-gray-400 text-sm'>No streaming provider data available.</div>`;
                }

                // Custom streaming link for all movies (YouTube trailer search)
                const customProviderHtml = `<div class='mt-3'><a href='https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + ' trailer')}' target='_blank' rel='noopener' class='inline-flex items-center gap-2 bg-red-600 text-white text-sm font-medium px-3 py-2 rounded-full hover:bg-red-700 transition'>
                    <svg xmlns='http://www.w3.org/2000/svg' class='h-4 w-4' fill='currentColor' viewBox='0 0 24 24'><path d='M23.498 6.186a2.994 2.994 0 0 0-2.112-2.12C19.228 3.5 12 3.5 12 3.5s-7.228 0-9.386.566a2.994 2.994 0 0 0-2.112 2.12C0 8.355 0 12 0 12s0 3.645.502 5.814a2.994 2.994 0 0 0 2.112 2.12C4.772 20.5 12 20.5 12 20.5s7.228 0 9.386-.566a2.994 2.994 0 0 0 2.112-2.12C24 15.645 24 12 24 12s0-3.645-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z'/></svg>
                    Watch trailer on YouTube
                </a></div>`;

                modalContent.innerHTML = `
                    <button id="closeModal" class="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 transition-transform duration-300 transform hover:rotate-90 z-50">&times;</button>
                    <div class="w-full flex flex-col md:flex-row">
                        <div class="flex-shrink-0 w-full md:w-1/3">
                            <img src="${posterPath}" alt="${movie.title} Poster" class="w-full h-auto object-cover rounded-t-xl md:rounded-l-xl md:rounded-tr-none shadow-lg">
                        </div>
                        <div class="p-4 md:p-6 flex flex-col justify-between w-full md:w-2/3">
                            <div>
                                <h2 class="text-xl md:text-3xl font-bold mb-2 text-[#FF5722] leading-tight">${movie.title}</h2>
                                <p class="text-sm md:text-md text-gray-400 mb-3">${releaseDate} • ${runtime}</p>
                                <p class="text-sm md:text-base text-gray-300 mb-4">${movie.overview || 'No overview available.'}</p>
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p class="font-semibold text-gray-200">Genres:</p>
                                        <p class="text-gray-400">${genres}</p>
                                    </div>
                                    <div>
                                        <p class="font-semibold text-gray-200">Rating:</p>
                                        <p class="text-yellow-400 flex items-center">${rating} / 10</p>
                                    </div>
                                </div>
                                ${watchProvidersHtml}
                                ${customProviderHtml}
                            </div>
                            <div class="mt-4 flex flex-wrap gap-2">
                                ${movie.genres.map(g => `<span class="bg-[#282828] text-gray-300 text-xs font-medium px-3 py-1 rounded-full">${g.name}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                `;

                movieModal.classList.remove('hidden');
                setTimeout(() => {
                    modalContent.classList.remove('scale-95', 'opacity-0');
                }, 10);

                // Add event listener to the new close button
                const closeBtn = document.getElementById('closeModal');
                if (closeBtn) closeBtn.addEventListener('click', closeModal);

            } catch (error) {
                console.error('Error fetching movie details:', error);
                alertMessage('Error fetching movie details. Please try again.');
            }
        }
         // Function to close the modal
        function closeModal() {
            modalContent.classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                movieModal.classList.add('hidden');
                modalContent.innerHTML = '';
            }, 300);
        }

        // Close modal when clicking outside
        movieModal.addEventListener('click', (event) => {
            if (event.target === movieModal) {
                closeModal();
            }
        });

        // Function to create a custom alert message box
        function alertMessage(message) {
            const messageBox = document.createElement('div');
            messageBox.className = 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#FF5722] text-white px-8 py-4 rounded-xl shadow-2xl z-[100] text-center max-w-sm transition-all duration-500 transform scale-0 opacity-0';
            messageBox.textContent = message;
            document.body.appendChild(messageBox);
            
            setTimeout(() => {
                messageBox.classList.remove('scale-0', 'opacity-0');
                messageBox.classList.add('scale-100', 'opacity-100');
            }, 10);
             setTimeout(() => {
                messageBox.classList.remove('scale-100', 'opacity-100');
                messageBox.classList.add('scale-0', 'opacity-0');
                setTimeout(() => messageBox.remove(), 500);
            }, 3000);
        }
