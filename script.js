//import 'https://tomashubelbauer.github.io/github-pages-local-storage/index.js';
async function list_directory(user, repo, directory) {
    const url = `https://api.github.com/repos/${user}/${repo}/git/trees/master`;
    const list = await fetch(url).then(res => res.json());
    const dir = list.tree.find(node => node.path === directory);
    if (dir) {
       const list = await fetch(dir.url).then(res => res.json());
       return list.tree.map(node => node.path);
    }
  }

const images = list_directory("rtest42", "vta-routle", "main")

  // Get today's date and calculate an index
  const today = new Date();
  const index = today.getDate() % images.length;

  // Set the image source
  const randomImage = document.getElementById('randomImage');
  randomImage.src = "./lines/" + images[index];