function applyDynamicFonts(element) {
    // Get the raw text content without existing HTML formatting
    let text = element.innerText;

    // Define regex for Devanagari and Latin characters
    let devanagariRegex = /[\u0900-\u097F]+/g;
    let latinRegex = /[a-zA-Z0-9]+/g;

    // Create HTML with correctly applied fonts
    let formattedText = text
        .split(/(\s+)/) // Split by whitespace while preserving it
        .map(word => {
            if (devanagariRegex.test(word)) {
                return `<span style="font-family: 'Tiro Devanagari Sanskrit', serif; font-size: larger;">${word}</span>`;
            } else if (latinRegex.test(word)) {
                return `<span style="font-family: 'Poppins', sans-serif;">${word}</span>`;
            }
            return word; // Keep other characters (like punctuation) as-is
        })
        .join('');

    // Prevent infinite nesting by setting innerHTML only if it has changed
    if (element.innerHTML !== formattedText) {
        element.innerHTML = formattedText;
        placeCaretAtEnd(element);
    }
}

function placeCaretAtEnd(el) {
    el.focus();
    let range = document.createRange();
    let sel = window.getSelection();
    range.selectNodeContents(el);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
}

// Add event listeners for both fields
document.getElementById("message").addEventListener("input", function () {
    applyDynamicFonts(this);
});

document.getElementById("phoneNumbers").addEventListener("input", function () {
    applyDynamicFonts(this);
});
document.addEventListener("DOMContentLoaded", function () {
    window.map = L.map('map').setView([28.3949, 84.1240], 7);
    consttiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© OpenStreetMap'
    }).addTo(map);
    function updateFontStyle(textarea) {
        let text = textarea.value;
        let devanagariRegex = /[\u0900-\u097F]/; // Unicode range for Devanagari script

        if (devanagariRegex.test(text)) {
            textarea.style.fontFamily = "'Tiro Devanagari Sanskrit', serif";
        } else {
            textarea.style.fontFamily = "'Poppins', sans-serif";
        }
    }

    // Attach event listener to both textareas
    document.getElementById("phoneNumbers").addEventListener("input", function () {
        updateFontStyle(this);
    });

    document.getElementById("message").addEventListener("input", function () {
        updateFontStyle(this);
    });

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
    window.displayTowers = displayTowers;  // Expose function globally
    window.displayedTowers = [];  // Store currently displayed towers
    window.selectedGeojsonTowers = [];  // Store towers from the selected GeoJSON area

    async function loadTowers() {
        const response = await fetch('/map/get-towers/');
        const data = await response.json();
        allTowers = data.towers;
    }
    // loadTowers();

    // Keeps track of the towers shown on the map
    async function displayTowers(filteredTowers = null, updateMap = true) {
        const towerInfo = document.getElementById('towerInfo');

        // Fetch all towers if not already loaded
        if (allTowers.length === 0) {
            const response = await fetch('/map/get-towers/');
            const data = await response.json();
            allTowers = data.towers;
        }

        const towersToShow = filteredTowers ?? selectedGeojsonTowers; // Show towers from the selected GeoJSON

        towerInfo.innerHTML = `<h3>Registered Towers (${towersToShow.length}):</h3><br>`;

        if (towersToShow.length === 0) {
            towerInfo.style.display = "none";
        } else {
            towerInfo.style.display = "block";
        }

        // Display towers in the info panel
        towersToShow.forEach(tower => {

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.role = 'switch';
            checkbox.value = tower.id;
            checkbox.id = `tower-${tower.id}`;
            checkbox.className = `mx-2 form-check-input form-switch`;
            checkbox.checked = true;  // Default checked

            const label = document.createElement('label');
            label.htmlFor = `tower-${tower.id}`;
            label.innerText = ` ${tower.name}`;
            // If longitude and lattitude is needed
            // label.innerText = ` ${tower.name} [Lat: ${tower.latitude}, Lng: ${tower.longitude}]`;


            towerInfo.appendChild(checkbox);
            towerInfo.appendChild(label);
            towerInfo.appendChild(document.createElement('br'));
        });

        // Update Map Only If Needed
        if (updateMap) {
            updateMapTowers(towersToShow);
        }
    }

    function updateMapTowers(towers) {
        if (towerLayer) {
            map.removeLayer(towerLayer);
        }

        let markers = towers.map(tower => {
            return L.marker([tower.latitude, tower.longitude], {
                icon: L.icon({
                    iconUrl: '/static/Images/tower_2.png',
                    iconSize: [12, 26],
                    iconAnchor: [6, 26],
                    popupAnchor: [0, -26]
                })
            }).bindTooltip(`<strong>${tower.name}</strong>`);
        });
        // let markers = towers.map(tower => {
        //     return L.circleMarker([tower.latitude, tower.longitude], {
        //         radius: 1.5,            // Size of the marker
        //         color: "blue",
        //         fillColor: "#ff0000", // Fill color (Red)
        //         fillOpacity: 0.8
        //     }).bindTooltip(`<strong>${tower.name}</strong>`);
        // });
        towerLayer = L.layerGroup(markers).addTo(map);
        displayedTowers = towers; // Store currently displayed towers
    }

    function filterTowers(selectedFeature) {
        if (!selectedFeature) {
            // If no area is selected, clear the towers
            selectedGeojsonTowers = [];
            displayTowers([], true);  // Clear map and towerInfo
            return;
        }

        // Flatten the selected GeoJSON feature to a simpler geometry
        const selectedGeometry = turf.flatten(selectedFeature.geometry);
        // Filter towers that are inside the selected GeoJSON area
        selectedGeojsonTowers = allTowers.filter(tower => {
            const towerPoint = turf.point([tower.longitude, tower.latitude]);
            return selectedGeometry.features.some(geo => turf.booleanContains(geo, towerPoint));
        });

        // Show the towers from the selected GeoJSON area
        displayTowers(selectedGeojsonTowers, true);  // Show on map and towerInfo
    }

    // Load all data first
    Promise.all([
        fetch('/static/JSON/Nepal_.geojson').then(res => res.json()),
        fetch('/static/JSON/provinces.geojson').then(res => res.json()),
        fetch('/static/JSON/districts.geojson').then(res => res.json()),
        fetch('/static/JSON/municipalities.geojson').then(res => res.json()),
        fetch('/static/JSON/wards.geojson').then(res => res.json()),

    ]).then(([nepalData, provincesData, districtsData, municipalitiesData, wardsData]) => {
        allDistricts = districtsData;
        allMunicipalities = municipalitiesData;
        allWards = wardsData;

        // Load nepal layer
        nepalLayer = L.geoJSON(nepalData, {
            style: feature => ({
                color: '#F6AE2D', weight: 2, fillOpacity: 0.1
            }),
            onEachFeature: (feature, layer) => {
                if (feature.properties) {
                    // Detailed tooltip with additional properties
                    const tooltipContent = `
                            <strong>${feature.properties['name:en'] || feature.properties['name']}</strong><br>
                            <strong>Nepali Name: ${feature.properties['name:ne'] || 'N/A'}</strong><br>
                            
                        `;
                    layer.bindTooltip(tooltipContent, { sticky: true });
                }
            }
        }).addTo(map);
        const Nepal = nepalData.features.find(f => f.properties["name"] === "नेपाल");
        console.log(Nepal);
        if (Nepal) {
            selectedGeojsonTowers = [];
            filterTowers(Nepal);
        }



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
            wardDropdown.innerHTML = '<option value="">Select municipality first</option>';
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
                    style: feature => ({
                        color: '#2F4858', weight: 2, fillOpacity: 0.1
                    }),
                    onEachFeature: (feature, layer) => {
                        if (feature.properties) {
                            // Detailed tooltip with additional properties
                            const tooltipContent = `
                            <strong>${feature.properties['name:en'] || feature.properties['name']}</strong><br>
                           
                            <strong>Nepali Name: ${feature.properties['name:ne'] || 'N/A'}</strong><br>
                            
                        `;
                            layer.bindTooltip(tooltipContent, { sticky: true });
                        }
                    }
                }).addTo(map);
                map.fitBounds(provinceLayer.getBounds());
                updateDistrictDropdown(selectedProvince);
                selectedGeojsonTowers = [];
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
                wardDropdown.innerHTML = '<option value="">Select municipality first</option>';
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
                        style: feature => ({
                            color: '#F26419', weight: 2, fillOpacity: 0.1
                        }),
                        onEachFeature: (feature, layer) => {
                            if (feature.properties) {
                                // Detailed tooltip with additional properties
                                const tooltipContent = `
                            <strong>${feature.properties['name:en'] || feature.properties['name']}</strong><br>
                            
                            <strong>Nepali Name: ${feature.properties['name:ne'] || 'N/A'}</strong><br>
                            
                        `;
                                layer.bindTooltip(tooltipContent, { sticky: true });
                            }
                        }
                    }).addTo(map);
                    map.fitBounds(districtLayer.getBounds());
                    updateMunicipalityDropdown(selectedDistrict);
                    selectedGeojsonTowers = [];
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
                        option.textContent = municipalityFeature.properties['name:en'] || municipalityFeature.properties['name'];
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
                        style: feature => ({
                            color: '#118AB2', weight: 2, fillOpacity: 0.1
                        }),
                        onEachFeature: (feature, layer) => {
                            if (feature.properties) {
                                // Detailed tooltip with additional properties
                                const tooltipContent = `
                            <strong>${feature.properties['name:en'] || feature.properties['name']}</strong><br>
                              <strong>[${feature.properties['name:suffix']}]</strong><br>
                            
                            
                        `;
                                layer.bindTooltip(tooltipContent, { sticky: true });
                            }
                        }
                    }).addTo(map);
                    map.fitBounds(municipalityLayer.getBounds());
                    updateWardDropdown(selectedMunicipality);
                    selectedGeojsonTowers = [];
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
                        style: feature => ({
                            color: '#47682C', weight: 2, fillOpacity: 0.1
                        }),
                        onEachFeature: (feature, layer) => {
                            if (feature.properties) {
                                // Detailed tooltip with additional properties
                                const tooltipContent = `
                            <strong>${feature.properties['name:en'] || feature.properties['name']}</strong><br>
                                            
                        `;
                                layer.bindTooltip(tooltipContent, { sticky: true });
                            }
                        }
                    }).addTo(map);
                    map.fitBounds(wardLayer.getBounds());
                    selectedGeojsonTowers = [];
                    filterTowers(selectedWard);
                }
            });
        }
    }).catch(error => {
        console.error('Error loading GeoJSON data:', error);
    });
});

const loadingModal = document.getElementById("loadingModal");

// Function to show the modal
function showLoadingModal() {
    loadingModal.classList.add("show");
}

// Function to hide the modal
function hideLoadingModal() {
    loadingModal.classList.remove("show");
}

window.sendMessage = async function () {
    const selectedTowers = [...document.querySelectorAll('#towerInfo input:checked')].map(cb => cb.value);
    const message = document.getElementById('message').value;

    if (selectedTowers.length === 0 || message.trim() === '') {
        alert('Please select at least one tower and enter a message.');
        return;
    }

    let usersToSend = new Set();

    try {
        showLoadingModal();  // Show modal before sending message
        alert("Firebase Connected! Sending message...");

        // Fetch users linked to each tower
        for (const towerId of selectedTowers) {
            const towerRef = ref(db, `user_cells/${towerId}`);
            try {
                const snapshot = await get(towerRef);
                if (snapshot.exists()) {
                    snapshot.val().forEach(user => usersToSend.add(user));
                }
            } catch (error) {
                console.error(`Error fetching users for Tower ${towerId}:`, error);
            }
        }

        usersToSend = [...usersToSend]; // Convert Set to Array
        if (usersToSend.length === 0) {
            alert("No users found for the selected towers.");
            return;
        }

        // Store the message in Firebase under each user and tower
        for (const towerId of selectedTowers) {
            for (const user of usersToSend) {
                const dbRef = ref(db, `messages/tower_${towerId}/user_${user}`);
                await set(dbRef, {
                    message: message,
                    towerId: towerId,
                    timestamp: Date.now()
                });
            }
        }

        alert(`Message sent successfully to ${usersToSend.length} users!`);
    } catch (error) {
        console.error("Error sending message:", error);
        alert("Failed to send message. Please try again.");
    } finally {
        hideLoadingModal(); // Hide modal after completion
    }
};
