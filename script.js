//import 'https://tomashubelbauer.github.io/github-pages-local-storage/index.js';

const basePath = "https://rtest42.github.io/vta-routle/lines/";

// Fetch the JSON file
fetch(`${basePath}routes.json`)
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch image list');
        }
        return response.json();
    })
    .then(images => {
        if (images.length === 0) {
            throw new Error('No images found in the list');
        }

        // Get today's date and calculate an index
        const today = new Date();
        const index = today.getDate() % images.length;

        // Set the image source
        const randomImage = document.getElementById('randomImage');
        randomImage.src = basePath + images[index];

        // Create buttons for each image
        const buttonContainer = document.getElementById('button-container'); // The div where buttons will go

        // Clear any existing buttons
        buttonContainer.innerHTML = '';

        images.forEach((image, i) => {
            const button = document.createElement('button');
            // Process the file name for the button label
            const fileName = image.split('/').pop(); // Extract the file name from the path
            let label = fileName.slice(0, -11); // Remove the last 11 characters (file extension and any extra characters)
            label = label.replace(/-/g, ' '); // Replace hyphens with spaces
            label = label.replace(/\b\w/g, char => char.toUpperCase()); // Capitalize first letter of each word

            button.textContent = label; // Set the button's text to the formatted label

            // Define button click behavior
            button.onclick = function () {
                if (image === images[index]) {
                    // Correct button clicked
                    button.style.backgroundColor = 'green'; // Change to green for correct
                    disableButtons();
                    alert(`Correct! The route is ${label}.`);
                } else {
                    // Incorrect button clicked
                    button.style.backgroundColor = 'red'; // Change to red for incorrect
                    button.disabled = true; // Disable button
                    button.style.cursor = "not-allowed";
                    alert('Oops! That is not the correct route.');
                }
            };
            buttonContainer.appendChild(button);
        });

        // Disable all buttons (after correct selection)
        function disableButtons() {
            const allButtons = buttonContainer.querySelectorAll('button');
            allButtons.forEach(btn => {
                btn.disabled = true; // Disable each button
                btn.style.cursor = "not-allowed";
            });
        }
    })
    .catch(error => console.error('Error:', error));
