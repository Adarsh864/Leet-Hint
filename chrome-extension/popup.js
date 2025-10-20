document.addEventListener('DOMContentLoaded', () => {
    const getHintsBtn = document.getElementById('get-hints-btn');
    const hintsContainer = document.getElementById('hints-container');
    const loadingDiv = document.getElementById('loading');
    const errorContainer = document.getElementById('error-container');

    const BACKEND_URL = "http://127.0.0.1:8000/hint";

    // --- NEW FUNCTION TO HANDLE COMMUNICATION ---
    // This function will first check if the content script is ready.
    function getProblemDetails() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            // Check if we can even talk to the tab
            if (!tabs[0] || !tabs[0].id) {
                displayError("Could not connect to the active tab.");
                return;
            }

            // Send a message to the content script and set a timeout.
            // If we don't get a response in a reasonable time, we assume it's not ready.
            chrome.tabs.sendMessage(tabs[0].id, { action: "getProblem" }, (response) => {
                if (chrome.runtime.lastError) {
                    // This error is the key. It means the content script didn't respond.
                    displayError("Could not communicate with the page. Please ensure you are on a LeetCode problem page and refresh the page.");
                    console.error(chrome.runtime.lastError.message);
                    return;
                }

                if (response && response.title) {
                    fetchHints(response.title, response.desc);
                } else {
                    displayError(response?.error || "An unknown error occurred while getting problem details.");
                }
            });
        });
    }

    function fetchHints(title, desc) {
        fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, desc })
        })
        .then(async res => {
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || `HTTP error! Status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            loadingDiv.classList.add('hidden');
            getHintsBtn.classList.remove('hidden');
            const hintsText = data.hint;
            const hints = hintsText.split('\n').filter(line => line.trim().match(/^\d+\./));
            displayHints(hints);
        })
        .catch(error => {
            console.error('Error fetching hints:', error);
            displayError(`Failed to fetch hints. Is the backend server running? Error: ${error.message}`);
        });
    }

    getHintsBtn.addEventListener('click', () => {
        // Reset UI
        getHintsBtn.classList.add('hidden');
        loadingDiv.classList.remove('hidden');
        hintsContainer.innerHTML = '';
        errorContainer.classList.add('hidden');

        // Start the process
        getProblemDetails();
    });

    function displayHints(hints) {
        if (hints.length === 0) {
            displayError("The AI did not return any valid hints. Please try again.");
            return;
        }
        hintsContainer.innerHTML = ''; // Clear previous hints
        hints.forEach((hintText, index) => {
            const hintDiv = document.createElement('div');
            hintDiv.className = 'hint';
            const header = document.createElement('div');
            header.className = 'hint-header';
            header.textContent = `Hint ${index + 1}`;
            const content = document.createElement('div');
            content.className = 'hint-content';
            content.textContent = hintText.replace(/^\d+\.\s*/, '');
            header.addEventListener('click', () => {
                content.classList.toggle('show');
                header.classList.toggle('active');
            });
            hintDiv.appendChild(header);
            hintDiv.appendChild(content);
            hintsContainer.appendChild(hintDiv);
        });
    }
    
    function displayError(message) {
        loadingDiv.classList.add('hidden');
        getHintsBtn.classList.remove('hidden');
        errorContainer.textContent = message;
        errorContainer.classList.remove('hidden');
    }
});

