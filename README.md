# [VTA Historoutle](https://rtest42.github.io/vta-routle)

Click the link above to play!

This is a static web project that tests a user's knowledge of [VTA](https://vta.org)'s routes before the new transit network applied in late 2019. Every day, a random route is chosen, and the user has five guesses to guess the correct route.

### Explanation of the Files
- icon.png: The VTA logo that is displayed on the header and the favicon.
- index.html: The HTML file that displays content of the website.
- styles.css: The CSS file that customizes how HTML elements should be displayed.
- script.js: The browser-side JavaScript file that handles the frontend logic.
- shapes/X.json: A JSON file that contains a list of coordinates to display the shape ID, which corresponds to a route X. (The shape ID to route ID handling was simple in this case; the shape ID started with the route ID.)
- routes.json: A JSON file that contains a list of route IDs and full names.
