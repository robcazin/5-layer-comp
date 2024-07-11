document.getElementById('bgColor').addEventListener('input', async () => {
    const colorName = document.getElementById('bgColor').value.trim();
    if (colorName) {
        const color = await fetchColor(colorName);
        if (color) {
            applyColor('preview', color.hex);
        }
    }
});

['layer1Color', 'layer2Color', 'layer3Color', 'layer4Color'].forEach(layerId => {
    document.getElementById(layerId).addEventListener('input', async (event) => {
        const colorName = event.target.value.trim();
        if (colorName) {
            const color = await fetchColor(colorName);
            if (color) {
                const layer = layerId.replace('Color', '');
                applyColor(layer, color.hex);
            }
        }
    });
});

async function fetchColor(colorName) {
    try {
        const response = await fetch('colors.json');
        const colors = await response.json();
        return colors.find(color => color.color_name.toLowerCase() === colorName.toLowerCase());
    } catch (error) {
        console.error('Error fetching color data:', error);
    }
}

function applyColor(elementId, hex) {
    const element = document.getElementById(elementId);
    element.style.backgroundColor = `#${hex}`;
}

// Handle pattern selection
function selectPattern(pattern) {
    // Set the selected pattern thumbnails for each layer
    document.getElementById('layer1Thumbnail').src = `${pattern}_layer1_wb.png`;
    document.getElementById('layer2Thumbnail').src = `${pattern}_layer2_wb.png`;
    document.getElementById('layer3Thumbnail').src = `${pattern}_layer3_wb.png`;
    document.getElementById('layer4Thumbnail').src = `${pattern}_layer4_wb.png`;

    // Optionally, you can also update the preview layers with the selected pattern
    document.getElementById('layer1').style.maskImage = `url(${pattern}_layer1.png)`;
    document.getElementById('layer2').style.maskImage = `url(${pattern}_layer2.png)`;
    document.getElementById('layer3').style.maskImage = `url(${pattern}_layer3.png)`;
    document.getElementById('layer4').style.maskImage = `url(${pattern}_layer4.png)`;
}

// Store combinations
let savedCombinations = [];

document.getElementById('saveCombination').addEventListener('click', () => {
    if (savedCombinations.length < 8) {
        const combination = {
            bgColor: document.getElementById('bgColor').value.trim(),
            layer1Color: document.getElementById('layer1Color').value.trim(),
            layer2Color: document.getElementById('layer2Color').value.trim(),
            layer3Color: document.getElementById('layer3Color').value.trim(),
            layer4Color: document.getElementById('layer4Color').value.trim(),
        };
        savedCombinations.push(combination);
        displaySavedCombinations();
    } else {
        alert('You can save up to 8 combinations only.');
    }
});

function displaySavedCombinations() {
    const container = document.getElementById('combinationsContainer');
    container.innerHTML = '';
    savedCombinations.forEach((combination, index) => {
        const combinationDiv = document.createElement('div');
        combinationDiv.className = 'combination bg-dark text-light';
        combinationDiv.innerHTML = `
            <h4 class="text-xl font-semibold mb-2">Combination ${index + 1}</h4>
            <p><strong>Background:<br></strong> ${combination.bgColor}</p>
            <p><strong>Layer 1:<br></strong> ${combination.layer1Color}</p>
            <p><strong>Layer 2:<br></strong> ${combination.layer2Color}</p>
            <p><strong>Layer 3:<br></strong> ${combination.layer3Color}</p>
            <p><strong>Layer 4:<br></strong> ${combination.layer4Color}</p>
            <div class="button-container">
                <button class="view-combination bg-blue-300 text-white rounded p-2 mt-2" onclick="viewCombination(${index})">View</button>
                <button class="delete-combination bg-red-400 text-white rounded p-2 mt-2" onclick="deleteCombination(${index})">Delete</button>
            </div>
        `;
        container.appendChild(combinationDiv);
    });
}


function viewCombination(index) {
    const combination = savedCombinations[index];
    const bgColorInput = document.getElementById('bgColor');
    const layer1ColorInput = document.getElementById('layer1Color');
    const layer2ColorInput = document.getElementById('layer2Color');
    const layer3ColorInput = document.getElementById('layer3Color');
    const layer4ColorInput = document.getElementById('layer4Color');

    bgColorInput.value = combination.bgColor;
    layer1ColorInput.value = combination.layer1Color;
    layer2ColorInput.value = combination.layer2Color;
    layer3ColorInput.value = combination.layer3Color;
    layer4ColorInput.value = combination.layer4Color;

    // Trigger input events to update colors
    bgColorInput.dispatchEvent(new Event('input'));
    layer1ColorInput.dispatchEvent(new Event('input'));
    layer2ColorInput.dispatchEvent(new Event('input'));
    layer3ColorInput.dispatchEvent(new Event('input'));
    layer4ColorInput.dispatchEvent(new Event('input'));
}

function deleteCombination(index) {
    savedCombinations.splice(index, 1);
    displaySavedCombinations();
}


