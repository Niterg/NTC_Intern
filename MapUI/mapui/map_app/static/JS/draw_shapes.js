window.towersInRegion = [];

document.addEventListener("DOMContentLoaded", function () {
    const drawnItems = new L.FeatureGroup();
    window.map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
        edit: { featureGroup: drawnItems },
        draw: {
            polygon: true,
            rectangle: true,
            circle: true,
            marker: false,
            polyline: false,
        },
    });

    window.map.addControl(drawControl);

    function isPointInShape(point, layer) {
        if (layer instanceof L.Circle) {
            const center = layer.getLatLng();
            const radius = layer.getRadius();
            const points = 64;
            const coords = [];

            for (let i = 0; i < points; i++) {
                const angle = (i / points) * (2 * Math.PI);
                const lat = center.lat + (radius / 111319) * Math.sin(angle);
                const lng = center.lng + (radius / (111319 * Math.cos(center.lat * (Math.PI / 180)))) * Math.cos(angle);
                coords.push([lng, lat]);
            }
            coords.push(coords[0]);

            const circleAsPolygon = {
                type: "Feature",
                properties: {},
                geometry: {
                    type: "Polygon",
                    coordinates: [coords]
                }
            };
            return turf.booleanPointInPolygon(turf.point(point), circleAsPolygon);
        } else {
            const shapeGeoJSON = layer.toGeoJSON();
            return turf.booleanPointInPolygon(turf.point(point), shapeGeoJSON);
        }
    }

    function displaySelectedTowers() {
        const towerInfo = document.getElementById("towerInfo");
        if (!towerInfo) return;

        if (drawnItems.getLayers().length === 0) {
            towerInfo.style.display = "none";
            return;
        }

        const selectedTowers = new Set();

        drawnItems.getLayers().forEach(layer => {
            window.towersInRegion.forEach(tower => { // Only check towers already in `towersInRegion`
                if (isPointInShape([tower.longitude, tower.latitude], layer)) {
                    selectedTowers.add(tower);
                }
            });
        });

        if (selectedTowers.size === 0) {
            towerInfo.style.display = "none";
        } else {
            towerInfo.style.display = "block";
            towerInfo.innerHTML = `<strong>Selected Towers (${selectedTowers.size}):</strong><br>`;
            selectedTowers.forEach(tower => {
                towerInfo.innerHTML += ` ${tower.name} [Lat: ${tower.latitude}, Lng: ${tower.longitude}]<br>`;
            });
        }
    }

    window.map.on("draw:created", (e) => {
        drawnItems.addLayer(e.layer);
        displaySelectedTowers();
    });

    window.map.on("draw:edited", () => {
        displaySelectedTowers();
    });

    window.map.on("draw:deleted", () => {
        displaySelectedTowers();
    });
});
