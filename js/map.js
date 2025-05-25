import { CENTER_COORDS } from './utils.js';

export let map;
const routeLayers = {};

export function initMap() {
    map = L.map('map', {
        center: CENTER_COORDS,
        zoom: 11,
        zoomControl: true,
        dragging: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        touchZoom: true
    });
}

function loadShape(shapes, clr) {
    for (const shapeID in shapes) {
        const coordinates = shapes[shapeID].map(([lat, lon]) => [lon, lat]);

        const geoJSON = {
            type: "FeatureCollection",
            features: [{
                type: "Feature",
                geometry: { type: "LineString", coordinates },
                properties: { name: shapeID }
            }]
        };

        routeLayers[shapeID] = L.geoJSON(geoJSON, {
            style: { color: clr, weight: 3, opacity: 1 }
        });

        routeLayers[shapeID].addTo(map);
    }
}

export const loadRouteShape = (routeID, color = 'red') =>
    fetch(`shapes/${routeID}.json`)
        .then(res => res.json())
        .then(data => loadShape(data, color))
        .catch(err => console.error(`Failed to load shape for ${routeID}`, err.message));

