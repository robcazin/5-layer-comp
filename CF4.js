console.log("Running app2.js version: CLEAN_2025-03-04_v19");

// Add to your global scope or appState
let currentPattern = null;
let currentLayers = [];
let patterns = []; // Populated by initialize




document.querySelectorAll(".thumbnail").forEach(thumb => {
    thumb.addEventListener("click", () => {
        const patternId = thumb.dataset.patternId;
        console.log("Thumbnail clicked, pattern ID:", patternId);

        const selectedPattern = patterns.find(p => p.id === patternId);
        if (!selectedPattern) {
            console.error("Pattern not found for ID:", patternId);
            return;
        }

        console.log("Selected pattern:", selectedPattern.name);
        console.log("LAYER SEPARATIONS:", selectedPattern.layers);

        // Determine background color
        let backgroundColor;
        if (selectedPattern.curatedColors && selectedPattern.curatedColors.length > 0) {
            backgroundColor = selectedPattern.curatedColors[0];
        } else {
            const topRow = patterns.find(p => p.number && p.number.endsWith("-100") && p.collection === selectedPattern.collection);
            backgroundColor = topRow && topRow.curatedColors && topRow.curatedColors.length > 0
                ? topRow.curatedColors[0]
                : "#ffffff";
        }

        // Update state
        currentPattern = selectedPattern;
        currentLayers = [];

        // Add background layer
        const backgroundLayer = {
            imageUrl: null,
            color: backgroundColor,
            label: "background"
        };
        currentLayers.push(backgroundLayer);

        // Add overlay layers with position-based labels
        const overlayLayers = selectedPattern.layers || [];
        overlayLayers.forEach((layerUrl, index) => {
            const label = `layer-${index + 1}`; // Position-based label (Layer 1, Layer 2, etc.)

            currentLayers.push({
                imageUrl: layerUrl,
                color: selectedPattern.curatedColors[index + 1] || "#000000",
                label: label
            });
        });

        console.log("Total layers (including background):", currentLayers.length);
        console.log("Overlay layers:", overlayLayers);

        // Update appState
        appState.layerInputs = [];
        createColorInput("Background", "bgColorInput", backgroundColor, true);
        currentLayers.slice(1).forEach((layer, index) => {
            createColorInput(`Layer ${index + 1}`, `layer${index + 1}ColorInput`, layer.color);
        });

        appState.cachedLayerPaths = currentLayers.slice(1).map(layer => ({ url: layer.imageUrl }));
        console.log("Updated cachedLayerPaths:", appState.cachedLayerPaths);

  
      // Trigger preview update
      updatePreview();
    });
  });

const loadJSON = async (url) => {
    try {
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        console.error(`Error loading ${url}:`, error);
        throw error;
    }
};

// Utility Functions
const toInitialCaps = (str) =>
    str
        .toLowerCase()
        .split(/[\s-]+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

const getContrastClass = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? "text-black" : "text-white";
};

// State Management
const appState = {
    selectedCollection: null,
    selectedPattern: null,
    currentScale: 40,
    layerInputs: [],
    colorsData: [],
    cachedLayerPaths: [],
    lastSelectedLayer: null,
    collectionsData: null,
};

// DOM Cache - Lazy load after DOMContentLoaded
let dom = {};

// Airtable Setup
if (typeof Airtable === 'undefined') {
    console.error('Airtable library not loaded in color-flex2.html.');
    throw new Error('Airtable not defined');
}

const airtable = new Airtable({ apiKey: 'patFtSWH6rXymvmio.c4b5cf40de13b1c3f8468c169a391dd4bfd49bb4d0079220875703ff5affe7c3' });
const base = airtable.base('appsywaKYiyKQTnl3');

const loadAirtableData = async (tableName, options = {}) => {
    return new Promise((resolve, reject) => {
        console.log(`Starting fetch for ${tableName}`);
        base(tableName).select(options).all((err, records) => {
            if (err) {
                console.error(`Error loading ${tableName}:`, err);
                reject(err);
            } else {
                console.log(`Loaded ${records.length} records from ${tableName}`);
                resolve(records);
            }
        });
    });
};

let colorData = [];
const getColorHex = (colorName) => {
    console.log("getColorHex called with:", colorName);
    if (!colorName?.trim()) {
        console.warn("No color name provided, returning default #FF0000");
        return "#FF0000";
    }
    const cleanName = colorName.replace(/^(SW|HGSW)\s*\d+\s*/i, "").trim().toLowerCase();
    console.log("Cleaned color name:", cleanName);
    const color = colorData.find(c => c.color_name.toLowerCase() === cleanName);
    if (color) {
        console.log("Found color hex:", `#${color.hex}`);
        return `#${color.hex}`;
    } else {
        console.warn(`Color "${cleanName}" not found, returning default #FF0000`);
        return "#FF0000";
    }
};

const fallbackCuratedColors = [
    "SW 7069 Iron Ore",
    "SW7067 Cityscape",
    "SW3441 Foothills",
    "SW6135 Ecru",
    "SW7699 Rustic City",
    "SW6206 Oyster Bay",
    "SW6186 Dried Thyme",
    "HGSW1472 Slate Tile",
    "SW0006 Toile Red"
];

// UI Creation
const createColorInput = (labelText, id, initialColor, isBackground = false) => {
    const container = document.createElement("div");
    container.className = "layer-input-container";
    const label = document.createElement("div");
    label.className = "layer-label";
    label.textContent = labelText || "Unknown Layer"; // Fallback label
    console.log(`Creating color input with label: ${labelText}, ID: ${id}`); // Debug
    const circle = document.createElement("div");
    circle.className = "circle-input";
    circle.id = `${id}Circle`;
    const input = document.createElement("input");
    input.type = "text";
    input.className = "layer-input";
    input.id = id;
    input.placeholder = `Enter ${labelText ? labelText.toLowerCase() : 'layer'} color`;
    input.value = toInitialCaps(initialColor || "Snowbound");
    circle.style.backgroundColor = getColorHex(input.value);
    container.append(label, circle, input);
    if (dom.layerInputsContainer) {
        dom.layerInputsContainer.appendChild(container);
    } else {
        console.error("layerInputsContainer not found in DOM");
    }

    const layerData = { input, circle, isBackground };
    appState.layerInputs.push(layerData);

    circle.addEventListener("click", () => {
        appState.lastSelectedLayer = layerData;
        highlightActiveLayer(circle);
        console.log("Layer selected:", labelText);
        console.log("Before popup call, localStorage.hidePopup:", localStorage.getItem("hidePopup"));
        if (localStorage.getItem("hidePopup") !== "true") {
            console.log("Attempting to show popup for layer selection");
            showPopupMessage("🎨 Now, click a curated color to set this color, OR enter an SW name.", "hidePopup");
        }
        console.log("After popup call");
    });

    const updateColor = () => {
        const formatted = toInitialCaps(input.value.trim());
        input.value = formatted;
        const hex = getColorHex(formatted) || getColorHex("Snowbound");
        console.log("Updating circle color to:", hex);
        circle.style.backgroundColor = hex;
        updateDisplays();
    };

    input.addEventListener("blur", updateColor);
    input.addEventListener("keydown", (e) => e.key === "Enter" && updateColor());

    return layerData;
};

const highlightActiveLayer = (circle) => {
    document.querySelectorAll(".circle-input").forEach((c) => (c.style.outline = "none"));
    circle.style.outline = "6px solid rgb(244, 255, 219)";
};

const showPopupMessage = (message, storageKey) => {
    console.log("Attempting to show popup:", message, "Storage check:", localStorage.getItem(storageKey));
    if (localStorage.getItem(storageKey) === "true" || document.getElementById("popupMessage")) {
        console.log("Popup suppressed or already exists");
        return;
    }
    const popup = document.createElement("div");
    popup.id = "popupMessage";
    popup.className = "custom-popup";
    Object.assign(popup.style, {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        background: "rgb(243, 230, 212)",
        padding: "20px",
        borderRadius: "10px",
        boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
        zIndex: "10000",
        textAlign: "center",
        fontFamily: "'Special Elite', cursive",
        color: "#333",
    });
    popup.innerHTML = `
        <p style="margin-bottom: 15px; font-size: 18px">${message}</p>
        <div style="display: flex; align-items: center; justify-content: center; margin-top: 10px">
            <input type="checkbox" id="popupDismiss" style="margin-right: 5px">
            <label for="popupDismiss" style="font-size: 14px">Don't show this again</label>
        </div>
        <button style="margin-top: 10px; padding: 10px 20px; background: rgb(123, 128, 112); color: #fff; border: none; border-radius: 5px; cursor: pointer; font-family: 'Special Elite', cursive">OK</button>
    `;
    popup.querySelector("button").addEventListener("click", () => {
        if (popup.querySelector("#popupDismiss").checked) {
            localStorage.setItem(storageKey, "true");
            console.log("Popup dismissed forever:", storageKey);
        }
        document.body.removeChild(popup);
    });
    document.body.appendChild(popup);
    console.log("Popup added to DOM");
};


// Core Logic
const loadThumbnails = (patterns) => {
    const thumbnailsContainer = dom.collectionThumbnails;
    thumbnailsContainer.innerHTML = "";
    patterns.forEach(pattern => {
        const thumbDiv = document.createElement("div");
        thumbDiv.className = "thumbnail";
        thumbDiv.dataset.patternId = pattern.id;
        const img = document.createElement("img");
        img.src = pattern.thumbnail || "https://placehold.co/150x150?text=No+Thumbnail"; // Use a reliable fallback
        if (!pattern.thumbnail) {
            console.warn(`Using fallback thumbnail for pattern ${pattern.name}`);
        }
        img.alt = pattern.name || "Unknown Pattern";
        thumbDiv.appendChild(img);
        thumbnailsContainer.appendChild(thumbDiv);
    });
};

const handleCollectionSelection = (collection) => {
    console.log(`Selecting collection: ${collection.name}`);
    appState.selectedCollection = collection;
    if (dom.collectionHeader) {
        dom.collectionHeader.textContent = `${toInitialCaps(collection.name)} Collection`;
    } else {
        console.warn("collectionHeader not found, skipping update");
    }
    loadThumbnails(collection.patterns);
};

const handlePatternSelection = (patternName) => {
    console.log(`Attempting to select pattern: ${patternName}`);
    appState.selectedPattern = appState.selectedCollection.patterns.find(
        (p) => p.name.toUpperCase() === patternName.toUpperCase()
    );
    if (!appState.selectedPattern) {
        console.error(`Pattern "${patternName}" not found in ${appState.selectedCollection.name}`);
        appState.selectedPattern = appState.selectedCollection.patterns[0];
        console.warn(`Falling back to first pattern: ${appState.selectedPattern?.name || 'None'}`);
        if (!appState.selectedPattern) {
            console.error("No patterns available in collection");
            return;
        }
    }

    console.log("Selected pattern:", appState.selectedPattern);
    
    let backgroundColor;
    if (appState.selectedPattern.curatedColors && appState.selectedPattern.curatedColors.length > 0) {
        backgroundColor = appState.selectedPattern.curatedColors[0];
    } else {
        const topRow = appState.selectedCollection.patterns.find(p => p.number && p.number.endsWith("-100") && p.collection === appState.selectedPattern.collection);
        backgroundColor = topRow && topRow.curatedColors && topRow.curatedColors.length > 0
            ? topRow.curatedColors[0]
            : "#ffffff";
    }

    currentPattern = appState.selectedPattern;
    currentLayers = [];

    const backgroundLayer = {
        imageUrl: null,
        color: backgroundColor,
        label: "background"
    };
    currentLayers.push(backgroundLayer);

    const overlayLayers = appState.selectedPattern.layers || [];
    overlayLayers.forEach((layerUrl, index) => {
        const filename = layerUrl.split('/').pop();
        const layerDescription = filename
            .split(' - ')
            .slice(2)
            .join(' - ')
            .replace('.jpg', '')
            .trim();
        const label = layerDescription || `Layer ${index + 1}`;
        console.log(`Derived label for layer ${index + 1} from "${filename}": "${label}"`); // Debug
        currentLayers.push({
            imageUrl: layerUrl,
            color: appState.selectedPattern.curatedColors[index + 1] || "#000000",
            label: label
        });
    });

    console.log("Total layers (including background):", currentLayers.length);
    console.log("Overlay layers with names:", currentLayers.slice(1).map(l => l.label));

    appState.layerInputs = [];
    createColorInput("Background", "bgColorInput", backgroundColor, true);
    currentLayers.slice(1).forEach((layer, index) => {
        createColorInput(layer.label, `layer${index + 1}ColorInput`, layer.color);
    });

    appState.cachedLayerPaths = currentLayers.slice(1).map(layer => ({
        url: layer.imageUrl,
        name: layer.label
    }));
    console.log("Cached layer paths:", appState.cachedLayerPaths);

    if (dom.patternName) dom.patternName.textContent = appState.selectedPattern.name;

    const curatedColors = appState.selectedCollection.curatedColors || fallbackCuratedColors;
    console.log("Collection curated colors:", curatedColors);

    try {
        populateLayerInputs(curatedColors);
        populateCuratedColors(curatedColors);
        populateCoordinates(appState.selectedPattern.coordinatePrints || []);
        updateDisplays();
    } catch (error) {
        console.error("Error in handlePatternSelection:", error);
    }
};

const populateCuratedColors = (colors) => {
    console.log("Populating curated colors:", colors);
    if (!dom.curatedColorsContainer) {
        console.error("curatedColorsContainer not found in DOM");
        return;
    }
    dom.curatedColorsContainer.innerHTML = "";
    if (!colors.length) {
        dom.curatedColorsContainer.textContent = "No curated colors available.";
        return;
    }
    colors.forEach((colorName) => {
        const hex = getColorHex(colorName);
        const container = document.createElement("div");
        container.className = "curated-color-container flex items-center justify-center";
        container.innerHTML = `
            <div class="curated-color-circle w-24 h-24 rounded-full overflow-hidden relative flex items-center justify-center" style="background-color: ${hex}">
                <div class="absolute ${getContrastClass(hex)} text-xs text-center" style="line-height: 1.4">
                    <span>${toInitialCaps(colorName)}</span>
                </div>
            </div>
        `;
        console.log("Created curated color container for:", colorName);
        container.addEventListener("click", () => {
            console.log("Curated color clicked:", colorName, "lastSelectedLayer:", appState.lastSelectedLayer);
            if (!appState.lastSelectedLayer) {
                showPopupMessage("❌ Please click a background or layer circle first.", "hideSelectionWarning");
                return;
            }
            appState.lastSelectedLayer.input.value = toInitialCaps(colorName);
            appState.lastSelectedLayer.circle.style.backgroundColor = hex;
            updateDisplays();
            updateRoomMockup(); // Ensure mockup updates
            updatePreview();   // Ensure preview updates
            populateCoordinates(); // Trigger coordinates update

            // Optional: Update current pattern if tied to color
            const selectedPattern = appState.collectionsData.flatMap(c => c.patterns).find(p => 
                p.curatedColors.includes(colorName)
            );
            if (selectedPattern && selectedPattern !== appState.currentPattern) {
                appState.currentPattern = selectedPattern;
                console.log("Pattern updated to:", selectedPattern.name, "coordinates:", selectedPattern.coordinatePrints);
                populateCoordinates(); // Call again if pattern change affects coordinates
            }
        });
        dom.curatedColorsContainer.appendChild(container);
    });
    console.log("Finished populating curated colors, total:", colors.length);
};

// INPUTS create inputs for pattern based on layer separation count
const populateLayerInputs = (curatedColors) => {
    const totalLayerCount = appState.cachedLayerPaths.length + 1;
    console.log(`Populating inputs for ${totalLayerCount} layers`);
    console.log("Cached layer paths for inputs:", appState.cachedLayerPaths); // Debug
    dom.layerInputsContainer.innerHTML = "";
    appState.layerInputs = [];
    createColorInput("Background", "bgColorInput", curatedColors[0], true); // Background input

    // Populate layer inputs with derived names
    // appState.cachedLayerPaths.forEach((layer, index) => {
    //     const label = layer.name || `Layer ${index + 1}`; // Use derived name
    //     console.log(`Creating input for layer ${index + 1} with label: ${label}`); // Debug
    //     const colorIndex = index + 1; // Offset for curatedColors
    //     const initialColor = curatedColors[colorIndex] || "#000000"; // Fallback color
    //     createColorInput(label, `layer${index + 1}ColorInput`, initialColor);
    // });
    appState.cachedLayerPaths.forEach((layer, index) => {
        const label = layer.name || `Layer ${index + 1}`;
        console.log(`Creating input for layer ${index + 1} with label: ${label}`);
        const colorIndex = index + 1;
        const fullColor = appState.collectionsData[0].curatedColors[colorIndex] || "#000000"; // "SW7069 Iron Ore"
        const initialColor = fullColor.startsWith("#") ? fullColor : fullColor.replace(/^(SW|HGSW)\d+\s*/i, ""); // "Iron Ore"
        createColorInput(label, `layer${index + 1}ColorInput`, initialColor);
    });

    console.log("Layer inputs:", appState.layerInputs.map(input => ({
        id: input.input.id,
        label: input.input.previousSibling.textContent,
        value: input.input.value
    })));
};

const populateCoordinates = () => {
    if (!dom.coordinatesContainer) {
        console.error("coordinatesContainer not found in DOM");
        return;
    }
    const coordinates = appState.currentPattern?.coordinatePrints || [];
    console.log("Populating coordinates for current pattern:", appState.currentPattern?.name, "coordinates:", coordinates);
    console.log("Current layerInputs:", appState.layerInputs.map(li => li?.input.value));

    dom.coordinatesContainer.innerHTML = "";
    dom.coordinatesContainer.style.position = "relative";
    if (!coordinates.length) {
        dom.coordinatesContainer.textContent = "No matching coordinates available.";
        console.log("No coordinates to display");
        return;
    }

    const bgColor = getColorHex(appState.layerInputs[0]?.input.value || "Iron Ore");
    const layer1ColorSource = appState.layerInputs[1]?.input.value || "Snowbound";
    const layer1Color = getColorHex(layer1ColorSource);
    console.log("Background color:", bgColor, "Layer 1 color - Source:", layer1ColorSource, "Color:", layer1Color);

    // Calculate group dimensions and centering
    const numCoordinates = coordinates.length;
    const xStep = 80;
    const yStep = 60;
    const totalXSpan = (numCoordinates - 1) * xStep; // Distance from first to last item's left edge
    const totalYSpan = numCoordinates > 1 ? yStep : 0; // Max y-offset for alternating pattern
    const xStart = -(totalXSpan / 2); // Center of horizontal span
    const yStart = -(totalYSpan / 2.5); // Center of vertical span
    console.log(`Group span - X: ${totalXSpan}px, Y: ${totalYSpan}px, xStart: ${xStart}px, yStart: ${yStart}px`);

    coordinates.forEach((coord, index) => {
        const div = document.createElement("div");
        div.className = "coordinate-item";

        // Staggered offsets from centered start
        const xOffset = xStart + (index * xStep);
        const yOffset = yStart +10 + (index % 2 === 0 ? yStep : 0);
        div.style.setProperty("--x-offset", `${xOffset}px`);
        div.style.setProperty("--y-offset", `${yOffset}px`);
        div.style.left = "50%";
        div.style.top = "50%";
        console.log(`Coordinate ${index + 1} - x-offset: ${xOffset}px, y-offset: ${yOffset}px`);

        // Background div
        const bgDiv = document.createElement("div");
        bgDiv.style.cssText = `
            background-color: ${bgColor};
            width: 100%;
            height: 100%;
            position: absolute;
            top: 0;
            left: 0;
            z-index: 0;
            opacity: 1;
        `;
        div.appendChild(bgDiv);

        // Layer 1 div with mask
        processImage(coord.url, (processedUrl) => {
            const layerDiv = document.createElement("div");
            layerDiv.style.cssText = `
                background-color: ${layer1Color};
                width: 100%;
                height: 100%;
                position: absolute;
                top: 0;
                left: 0;
                z-index: 1;
                mask-image: url(${processedUrl});
                -webkit-mask-image: url(${processedUrl});
                mask-size: 100%;
                -webkit-mask-size: 100%;
                mask-position: center;
                -webkit-mask-position: center;
                mask-repeat: no-repeat;
                -webkit-mask-repeat: no-repeat;
                opacity: 1;
            `;
            div.appendChild(layerDiv);
        });

        dom.coordinatesContainer.appendChild(div);
    });
    console.log("Coordinates populated, count:", coordinates.length);
};

const updatePreview = () => {
    if (!dom.preview) {
        console.error("preview not found in DOM");
        return;
    }
    const bgInput = appState.layerInputs[0]?.input;
    if (!bgInput) {
        console.error("Background input not found in appState.layerInputs");
        return;
    }
    const bgColor = getColorHex(bgInput.value);
    console.log("Updating preview with bgColor from input:", bgInput.value, "converted to:", bgColor);

    dom.preview.classList.remove("aspect-square");
    dom.preview.classList.add("w-[565px]", "h-[630px]", "overflow-hidden", "relative", "z-0", "flex-shrink-0");
    dom.preview.style.cssText = "";
    dom.preview.innerHTML = "";

    const bgDiv = document.createElement("div");
    bgDiv.style.cssText = `
        background-color: ${bgColor};
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        z-index: 0;
        opacity: 1; /* Explicit full opacity */
    `;
    dom.preview.appendChild(bgDiv);

    appState.cachedLayerPaths.forEach((layer, index) => {
        const layerColor = getColorHex(appState.layerInputs[index + 1]?.input.value || "Snowbound");
        console.log(`Layer ${index + 1} URL: ${layer.url}, Color: ${layerColor}`);
        processImage(layer.url, (processedUrl) => {
            const div = document.createElement("div");
            div.style.cssText = `
                background-color: ${layerColor};
                width: 100%;
                height: 100%;
                position: absolute;
                top: 0;
                left: 0;
                z-index: ${index + 1};
                mask-image: url(${processedUrl});
                -webkit-mask-image: url(${processedUrl});
                mask-size: contain;
                -webkit-mask-size: contain;
                mask-position: center;
                -webkit-mask-position: center;
                display: block !important;
                opacity: 1; /* Explicit full opacity */
            `;
            dom.preview.appendChild(div);
        });
    });
};

const updateRoomMockup = () => {
    if (!dom.roomMockup) {
        console.error("roomMockup not found in DOM");
        return;
    }
    const bgInput = appState.layerInputs[0]?.input;
    if (!bgInput) {
        console.error("Background input not found in appState.layerInputs");
        return;
    }
    const bgColor = getColorHex(bgInput.value || "Iron Ore");
    console.log("Updating room mockup with bgColor from input:", bgInput.value, "converted to:", bgColor);

    dom.roomMockup.classList.remove("aspect-square");
    dom.roomMockup.classList.add("w-[600px]", "max-w-[600px]", "pb-[75.33%]", "h-0", "overflow-hidden", "relative", "z-0", "flex-shrink-0");
    dom.roomMockup.innerHTML = "";

    const bgDiv = document.createElement("div");
    bgDiv.style.cssText = `
        background-color: ${bgColor};
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        z-index: 0;
        opacity: 1; /* Full opacity */
    `;
    dom.roomMockup.appendChild(bgDiv);

    appState.cachedLayerPaths.forEach((layer, index) => {
        const layerColor = getColorHex(appState.layerInputs[index + 1]?.input.value || "Snowbound");
        console.log(`Layer ${index + 1} URL: ${layer.url}, Color: ${layerColor}`);
        processImage(layer.url, (processedUrl) => {
            const div = document.createElement("div");
            div.style.cssText = `
                background-color: ${layerColor};
                width: 100%;
                height: 100%;
                position: absolute;
                top: 0;
                left: 0;
                z-index: ${index + 1};
                mask-image: url(${processedUrl});
                -webkit-mask-image: url(${processedUrl});
                mask-size: ${appState.currentScale}%;
                -webkit-mask-size: ${appState.currentScale}%;
                mask-repeat: repeat;
                -webkit-mask-repeat: repeat;
                mask-position: center;
                -webkit-mask-position: center;
                display: block !important;
                opacity: 1; /* Full opacity, was 0.8 */
            `;
            dom.roomMockup.appendChild(div);
        });
    });

    const overlay = document.createElement("div");
    overlay.style.cssText = `
        background-image: url(./mockups/English-Countryside-Bedroom-1.png);
        background-size: cover !important;
        background-repeat: no-repeat;
        background-position: center top;
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        z-index: 110;
        opacity: 1; /* Ensure overlay doesn’t darken */
    `;
    dom.roomMockup.appendChild(overlay);
};

// Updated processImage function with contrast maximization
const processImage = (url, callback, layerColor = '#7f817e', gamma = 2.2) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;

    img.onload = () => {
        console.log("Image loaded successfully:", url);

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const width = img.width;
        const height = img.height;
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        console.log("Original Sample (R,G,B,A):", data[0], data[1], data[2], data[3]);

        let minLuminance = 255, maxLuminance = 0;
        for (let i = 0; i < data.length; i += 4) {
            const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            minLuminance = Math.min(minLuminance, luminance);
            maxLuminance = Math.max(maxLuminance, luminance);
        }

        console.log("Min Luminance:", minLuminance, "Max Luminance:", maxLuminance);

        const range = maxLuminance - minLuminance || 1; // Avoid division by zero

        // Parse the layer color (hex to RGB)
        const hex = layerColor.replace("#", "");
        const rLayer = parseInt(hex.substring(0, 2), 16);
        const gLayer = parseInt(hex.substring(2, 4), 16);
        const bLayer = parseInt(hex.substring(4, 6), 16);

        for (let i = 0; i < data.length; i += 4) {
            let luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

            // Normalize to 0-1 range
            let normalized = (luminance - minLuminance) / range;
            normalized = Math.max(0, Math.min(1, normalized));

            // Apply gamma correction
            let gammaCorrected = Math.pow(normalized, 1 / gamma);

            // Invert for mask effect
            let inverted = 1 - gammaCorrected;

            // Use inverted value as a mask to blend with the layer color
            data[i] = Math.round(inverted * rLayer);
            data[i + 1] = Math.round(inverted * gLayer);
            data[i + 2] = Math.round(inverted * bLayer);

            // Transparency: Make originally white areas transparent
            // Use the original luminance to determine transparency
            let alpha = (luminance / 255); // 0 (black) to 1 (white)
            alpha = 1 - alpha; // Invert: white (1) becomes 0 (transparent), black (0) becomes 1 (opaque)
            data[i + 3] = Math.round(alpha * 255); // Scale to 0-255
        }

        console.log("Processed Sample (R,G,B,A):", data[0], data[1], data[2], data[3]);

        ctx.putImageData(imageData, 0, 0);
        callback(canvas.toDataURL("image/png", 1.0));
    };

    img.onerror = () => console.error(`Canvas image load failed: ${url}`);
};

const updateDisplays = () => {
    console.log("Updating displays...");
    console.log("DOM elements:", {
        preview: !!dom.preview,
        roomMockup: !!dom.roomMockup,
        coordinatesContainer: !!dom.coordinatesContainer,
        layerInputsContainer: !!dom.layerInputsContainer,
        curatedColorsContainer: !!dom.curatedColorsContainer
    });
    updatePreview();
    updateRoomMockup();
};

const initialize = async () => {
    try {
        console.log("Initializing local/session storage...");
        ["hidePopup", "hideSelectionWarning"].forEach((key) => {
            console.log(`Checking ${key}:`, localStorage.getItem(key));
            localStorage.setItem(key, "false");
            console.log(`Set ${key} to:`, localStorage.getItem(key));
        });
        if (sessionStorage.getItem("appLaunched") !== "true") {
            localStorage.removeItem("hidePopup");
            localStorage.removeItem("hideSelectionWarning");
            sessionStorage.setItem("appLaunched", "true");
        }

        appState.colorsData = ["Iron Ore", "Snowbound"];
        colorData = await loadJSON("./colors.json");
        console.log("Loaded colors.json:", colorData);

        const collectionTables = [
            { name: "5 - FARMHOUSE", curatedField: "CURATED COLORS" },
            { name: "8 - BOMBAY", curatedField: "CURATED COLORS" },
        ];
        const collectionsData = [];
        for (const { name: tableName, curatedField } of collectionTables) {
            const collectionRecords = await loadAirtableData(tableName, {
                filterByFormula: "RIGHT({NUMBER}, 3) = '100'",
                view: "SAFFRON COTTAGE PRODUCTS",
            });
            console.log(`Collection records for ${tableName}:`, collectionRecords);

            const patternRecords = await loadAirtableData(tableName, {
                filterByFormula: "AND({TRADE SHOW} = 1, RIGHT({NUMBER}, 3) != '100')",
                view: "SAFFRON COTTAGE PRODUCTS",
            });
            console.log(`Pattern records for ${tableName}:`, patternRecords);

            const curatedColorsRaw = collectionRecords[0]?.fields?.["CURATED COLORS"] || "";
            const curatedColors = curatedColorsRaw
                ? curatedColorsRaw.split(',').map(c => c.trim())
                : [];
            const strippedColors = curatedColors.map(c => c.replace(/^(SW|HGSW)\d+\s*/i, ""));
            appState.colorsData = [...new Set([...appState.colorsData, ...strippedColors])];

            const patternsForCollection = patternRecords.map(record => {
                const recordFields = record.fields || {};
                const rawName = recordFields.Name || recordFields.NAME || recordFields.name || "Unknown Pattern";
                const derivedName = rawName
                    .replace(/^\d+[A-Z]*\d*\s*-\s*/, '')
                    .replace(/\s*-\s*(MULTIPLE COLORS VERSION \d+|LAYER SEPARATIONS|DESIGN|PATTERN|COLOR SEPARATIONS|.*24X24.*)$/i, '')
                    .trim();
                return {
                    id: record.id,
                    rawName: rawName,
                    name: derivedName,
                    number: recordFields.NUMBER || "",
                    collection: recordFields.COLLECTION || "",
                    layers: recordFields['LAYER SEPARATIONS'] ? recordFields['LAYER SEPARATIONS'].map(attachment => attachment.url) : [],
                    layerLabel: recordFields["LAYER LABEL"] || "Layer 1", // Use LAYER LABEL
                    curatedColors: curatedColors,
                    thumbnail: recordFields.THUMBNAIL && recordFields.THUMBNAIL.length > 0 ? recordFields.THUMBNAIL[0].url : "",
                    coordinatePrints: recordFields["COORDINATE PRINTS"] || []
                };
            });

            collectionsData.push({
                name: tableName.replace(/^\d+ - /, ""),
                patterns: patternsForCollection,
                curatedColors: curatedColors,
            });

            patterns.push(...patternsForCollection);
        }

        appState.collectionsData = collectionsData;
        console.log("Collections loaded:", appState.collectionsData);
        console.log("Updated colorsData:", appState.colorsData);
        appState.currentPattern = appState.collectionsData[0].patterns[0];
        console.log("Initial current pattern:", appState.currentPattern);

        // Set up color controls with 2x3 grid
        const layerInputsContainer = document.getElementById("layerInputsContainer");
        layerInputsContainer.innerHTML = ""; // Clear once
        appState.layerInputs = []; // Reset once

        // Background
        createColorInput("Background", "bgColorInput", "Iron Ore", true);
        appState.layerInputs[0] = { 
            input: document.getElementById("bgColorInput"), 
            circle: document.getElementById("bgColorInputCircle"), 
            isBackground: true 
        };

        // Layer 1 with LAYER LABEL
        const firstPattern = appState.collectionsData[0].patterns[0];
        const layerLabel = firstPattern.layerLabel || "Layer 1";
        createColorInput(layerLabel, "layer1ColorInput", firstPattern.curatedColors[1] || "Snowbound");
        appState.layerInputs[1] = { 
            input: document.getElementById("layer1ColorInput"), 
            circle: document.getElementById("layer1ColorInputCircle") 
        };

        // Pattern Scale
        const scaleContainer = document.createElement("div");
        scaleContainer.className = "layer-input-container";
        scaleContainer.innerHTML = `
            <div class="layer-label">Pattern Scale</div>
            <div class="input-wrapper">
                <input type="range" id="patternScale" min="10" max="200" value="100" step="10" class="slider">
            </div>
        `;
        layerInputsContainer.appendChild(scaleContainer);

        // Add listeners once
        appState.layerInputs.forEach((layerInput, index) => {
            if (layerInput?.input) {
                layerInput.input.addEventListener("input", () => {
                    console.log(`Layer ${index} input changed to: ${layerInput.input.value}`);
                    updateRoomMockup();
                    updatePreview();
                    populateCoordinates();
                });
            }
        });

        // Populate coordinates once after inputs are set
        populateCoordinates();        

                const displaySize = document.createElement('div');
                document.body.appendChild(displaySize);
                displaySize.style.position = 'fixed';
                displaySize.style.top = '10px';
                displaySize.style.left = '10px';
                displaySize.style.background = 'rgba(0,0,0,0.7)';
                displaySize.style.color = 'white';
                displaySize.style.padding = '5px';
                displaySize.style.borderRadius = '5px';
                
                function updateSize() {
                    displaySize.textContent = `Viewport: ${window.innerWidth} x ${window.innerHeight}`;
                }
                
                window.addEventListener('resize', updateSize);
                updateSize(); // Run initially

        return collectionsData;
    } catch (error) {
        console.error("Error in initialize:", error);
        throw error;
    }
};

const startApp = (collectionsData, collectionName = "FARMHOUSE", patternName = "LANCASTER TOLE") => {
    try {
        console.log(`Starting app with collection: ${collectionName}, pattern: ${patternName}`);
        if (!collectionsData) {
            console.error("collectionsData is undefined in startApp");
            return;
        }
        const collection = collectionsData.find((c) => c.name.toLowerCase() === collectionName.toLowerCase());
        if (!collection) {
            console.error(`Collection "${collectionName}" not found.`);
            return;
        }
        appState.selectedCollection = collection;
        console.log("Available patterns:", collection.patterns.map(p => p.name));
        handleCollectionSelection(collection);

        const normalizedPatternName = patternName.toUpperCase();
        const validPattern = collection.patterns.find(p => p.name.toUpperCase() === normalizedPatternName);
        if (validPattern) {
            handlePatternSelection(patternName);
        } else {
            console.warn(`Pattern "${patternName}" not found, using first available pattern`);
            const firstPatternName = collection.patterns[0]?.name || "LANCASTER TOLE";
            handlePatternSelection(firstPatternName);
        }
    } catch (error) {
        console.error("Error in startApp:", error);
    }
};

// Update DOMContentLoaded
document.addEventListener("DOMContentLoaded", async () => {
    try {
        console.log("DOM content loaded, initializing...");
        window.resizeTo(2210, 1220);
        window.moveTo(100, 100);

        dom = {
            patternName: document.getElementById("patternName"),
            collectionHeader: document.getElementById("collectionHeader"),
            collectionThumbnails: document.getElementById("collectionThumbnails"),
            layerInputsContainer: document.getElementById("layerInputsContainer"),
            curatedColorsContainer: document.getElementById("curatedColorsContainer"),
            preview: document.getElementById("preview"),
            roomMockup: document.getElementById("roomMockup"),
            patternScaleSlider: document.getElementById("patternScale"),
            coordinatesContainer: document.getElementById("coordinatesContainer"),
        };
        console.log("Initial DOM check:", {
            patternName: !!dom.patternName,
            collectionHeader: !!dom.collectionHeader,
            collectionThumbnails: !!dom.collectionThumbnails,
            layerInputsContainer: !!dom.layerInputsContainer,
            curatedColorsContainer: !!dom.curatedColorsContainer,
            preview: !!dom.preview,
            roomMockup: !!dom.roomMockup,
            patternScaleSlider: !!dom.patternScaleSlider,
            coordinatesContainer: !!dom.coordinatesContainer
        });

        const collectionsData = await initialize();
        if (!collectionsData) {
            console.error("initialize returned undefined");
            return;
        }
        startApp(collectionsData);

        // Add thumbnail click handler
        document.querySelectorAll(".thumbnail").forEach(thumb => {
            thumb.addEventListener("click", () => {
                const patternId = thumb.dataset.patternId;
                console.log("Thumbnail clicked, pattern ID:", patternId);
                const pattern = appState.selectedCollection.patterns.find(p => p.id === patternId);
                if (pattern) {
                    const derivedPatternName = pattern.name; // Use derived name
                    console.log("Selected pattern name:", derivedPatternName);
                    handlePatternSelection(derivedPatternName);
                } else {
                    console.error("Pattern not found for ID:", patternId);
                }
            });
        });
    } catch (error) {
        console.error("Error in DOMContentLoaded handler:", error);
    }
});