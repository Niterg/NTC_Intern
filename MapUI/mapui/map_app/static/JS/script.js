document.addEventListener("DOMContentLoaded", function () {
    window.map = L.map('map').setView([28.3949, 84.1240], 7);
    consttiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    let nepalLayer;
    let provinceLayer;
    let districtLayer;
    let municipalityLayer;
    let wardLayer;
    let towerLayer;
    let allDistricts = null;
    let allMunicipalities = null;
    let allWards = null;
    window.allTowers = [];

    async function loadTowers() {
        const response = await fetch('/get-towers/');
        const data = await response.json();
        allTowers = data.towers;
    }

    function displayTowers(filteredTowers) {
        const towerInfo = document.getElementById('towerInfo');

        // Clear previous tower markers
        if (towerLayer) {
            map.removeLayer(towerLayer);
        }

        if (filteredTowers.length === 0) {
            towerInfo.style.display = "none";
            return;
        }

        towerInfo.style.display = "block";
        towerInfo.innerHTML = `<strong>Registered Towers(${filteredTowers.length}):</strong><br>`;

        let markers = [];

        filteredTowers.forEach(tower => {
            const marker = L.circleMarker([tower.latitude, tower.longitude], {
                color: 'blue',
                radius: 2,
                fillOpacity: 0.7,
                stroke: 1
            }).bindTooltip(tower.name);

            markers.push(marker);

            towerInfo.innerHTML += `<div>• ${tower.name}<br> [Lat: ${tower.latitude}, Lng: ${tower.longitude}]</div>`;
        });
        // Store all markers in a layer group and add it to the map
        towerLayer = L.layerGroup(markers).addTo(map);
    }

    loadTowers();
    function filterTowers(selectedFeature) {
        if (!selectedFeature) {
            displayTowers([]);
            return;
        }

        const selectedGeometry = turf.flatten(selectedFeature.geometry);
        const towersInRegion = allTowers.filter(tower => {
            const towerPoint = turf.point([tower.longitude, tower.latitude]);
            return selectedGeometry.features.some(geo => turf.booleanContains(geo, towerPoint));
        });

        displayTowers(towersInRegion);
    }

    // Load all data first
    Promise.all([
        fetch('static/JSON/nepal.geojson').then(res => res.json()),
        fetch('static/JSON/provinces.geojson').then(res => res.json()),
        fetch('static/JSON/districts.geojson').then(res => res.json()),
        fetch('static/JSON/municipalities.geojson').then(res => res.json()),
        fetch('static/JSON/wards.geojson').then(res => res.json())
    ]).then(([nepalData, provincesData, districtsData, municipalitiesData, wardsData]) => {
        allDistricts = districtsData;
        allMunicipalities = municipalitiesData;
        allWards = wardsData;

        // Load nepal layer
        nepalLayer = L.geoJSON(nepalData, {
            style: { color: 'orange', weight: 2, fillOpacity: 0.1 }
        }).addTo(map);
        const Nepal = nepalData.features.find(f => f.properties["name"] === "नेपाल");
        filterTowers(Nepal);

        // Setup province dropdown
        const provinceDropdown = document.getElementById('provinceDropdown');
        provinceDropdown.innerHTML = '<option value="">Select a province</option>';
        provincesData.features.forEach(feature => {
            const name = feature.properties['name'];
            const option = document.createElement('option');
            option.value = name;
            option.textContent = feature.properties['name:en'];
            provinceDropdown.appendChild(option);
        });

        // Province dropdown change event
        provinceDropdown.addEventListener('change', function (e) {
            const districtDropdown = document.getElementById('districtDropdown');
            const municipalityDropdown = document.getElementById('municipalityDropdown');
            const wardDropdown = document.getElementById('wardDropdown');

            districtDropdown.innerHTML = '<option value="">Select a district</option>';
            municipalityDropdown.innerHTML = '<option value="">Select a district first</option>';
            districtDropdown.disabled = true;
            municipalityDropdown.disabled = true;
            wardDropdown.disabled = true;

            if (provinceLayer) map.removeLayer(provinceLayer);
            if (districtLayer) map.removeLayer(districtLayer);
            if (municipalityLayer) map.removeLayer(municipalityLayer);
            if (wardLayer) map.removeLayer(wardLayer);

            const selectedName = e.target.value;
            if (selectedName) {
                const selectedProvince = provincesData.features.find(f => f.properties['name'] === selectedName);
                provinceLayer = L.geoJSON(selectedProvince, {
                    style: { color: 'green', weight: 2, fillOpacity: 0.1 }
                }).addTo(map);
                map.fitBounds(provinceLayer.getBounds());
                updateDistrictDropdown(selectedProvince);
                filterTowers(selectedProvince);
                districtDropdown.disabled = false;
            } else {

                if (nepalLayer) map.addLayer(nepalLayer);
                map.fitBounds(nepalLayer.getBounds());
            }
        });

        // Setup district dropdown change event
        function updateDistrictDropdown(provinceFeature) {
            const districtDropdown = document.getElementById('districtDropdown');
            districtDropdown.innerHTML = '<option value="">Select a district</option>';

            const provinceGeometry = turf.flatten(provinceFeature.geometry);

            allDistricts.features.forEach(districtFeature => {
                try {
                    const districtGeometry = turf.flatten(districtFeature.geometry);
                    const isContained = provinceGeometry.features.some(parentPart =>
                        districtGeometry.features.some(childPart =>
                            turf.booleanContains(parentPart, childPart)
                        )
                    );

                    if (isContained) {
                        const option = document.createElement('option');
                        option.value = districtFeature.properties['name'];
                        option.textContent = districtFeature.properties['name:en'];
                        districtDropdown.appendChild(option);
                    }
                } catch (e) {
                    console.error('District containment error:', e);
                }
            });

            districtDropdown.addEventListener('change', function (e) {
                const municipalityDropdown = document.getElementById('municipalityDropdown');
                const wardDropdown = document.getElementById('wardDropdown');
                municipalityDropdown.innerHTML = '<option value="">Select a municipality</option>';
                municipalityDropdown.disabled = true;
                wardDropdown.disabled = true;

                if (districtLayer) map.removeLayer(districtLayer);
                if (municipalityLayer) map.removeLayer(municipalityLayer);
                if (wardLayer) map.removeLayer(wardLayer);


                const selectedDistrictName = e.target.value;
                if (selectedDistrictName) {
                    const selectedDistrict = allDistricts.features.find(
                        f => f.properties['name'] === selectedDistrictName
                    );
                    districtLayer = L.geoJSON(selectedDistrict, {
                        style: { color: 'red', weight: 1, fillOpacity: 0.1 }
                    }).addTo(map);
                    map.fitBounds(districtLayer.getBounds());
                    updateMunicipalityDropdown(selectedDistrict);
                    filterTowers(selectedDistrict);
                    municipalityDropdown.disabled = false;
                }
            });
        }

        function updateMunicipalityDropdown(districtFeature) {
            const municipalityDropdown = document.getElementById('municipalityDropdown');
            municipalityDropdown.innerHTML = '<option value="">Select a municipality</option>';

            const districtGeometry = turf.flatten(districtFeature.geometry);

            allMunicipalities.features.forEach(municipalityFeature => {
                try {
                    const municipalityGeometry = turf.flatten(municipalityFeature.geometry);
                    const isContained = districtGeometry.features.some(parentPart =>
                        municipalityGeometry.features.some(childPart =>
                            turf.booleanContains(parentPart, childPart)
                        )
                    );

                    if (isContained) {
                        const option = document.createElement('option');
                        option.value = municipalityFeature.properties.name;
                        option.textContent = municipalityFeature.properties['name'];
                        municipalityDropdown.appendChild(option);
                    }
                } catch (e) {
                    console.error('Municipality containment error:', e);
                }
            });

            municipalityDropdown.addEventListener('change', function (e) {
                const wardDropdown = document.getElementById('wardDropdown');
                wardDropdown.innerHTML = '<option value="">Select a ward</option>';
                wardDropdown.disabled = true;

                if (municipalityLayer) map.removeLayer(municipalityLayer);
                if (wardLayer) map.removeLayer(wardLayer);

                const selectedMunicipalityName = e.target.value;
                if (selectedMunicipalityName) {
                    const selectedMunicipality = allMunicipalities.features.find(
                        f => f.properties.name === selectedMunicipalityName
                    );
                    municipalityLayer = L.geoJSON(selectedMunicipality, {
                        style: { color: 'purple', weight: 1, fillOpacity: 0.1 }
                    }).addTo(map);
                    map.fitBounds(municipalityLayer.getBounds());
                    updateWardDropdown(selectedMunicipality);
                    filterTowers(selectedMunicipality);
                    wardDropdown.disabled = false;
                }
            });
        }

        function updateWardDropdown(municipalityFeature) {
            const wardDropdown = document.getElementById('wardDropdown');
            wardDropdown.innerHTML = '<option value="">Select a ward</option>';

            const municipalityGeometry = turf.flatten(municipalityFeature.geometry);

            allWards.features.forEach(wardFeature => {
                try {
                    const wardGeometry = turf.flatten(wardFeature.geometry);
                    const isContained = municipalityGeometry.features.some(parentPart =>
                        wardGeometry.features.some(childPart =>
                            turf.booleanContains(parentPart, childPart)
                        )
                    );

                    if (isContained) {
                        const option = document.createElement('option');
                        option.value = wardFeature.properties.name;
                        option.textContent = wardFeature.properties.name;
                        wardDropdown.appendChild(option);
                    }
                } catch (e) {
                    console.error('Ward containment error:', e);
                }
            });

            wardDropdown.addEventListener('change', function (e) {
                if (wardLayer) map.removeLayer(wardLayer);

                const selectedWardName = e.target.value;
                if (selectedWardName) {
                    const selectedWard = allWards.features.find(
                        f => f.properties.name === selectedWardName
                    );
                    wardLayer = L.geoJSON(selectedWard, {
                        style: { color: 'aqua', weight: 1, fillOpacity: 0.2 }
                    }).addTo(map);
                    map.fitBounds(wardLayer.getBounds());
                    filterTowers(selectedWard);
                }
            });
        }
    }).catch(error => {
        console.error('Error loading GeoJSON data:', error);
    });
});
