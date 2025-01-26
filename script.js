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
})
.catch(error => console.error('Error:', error));