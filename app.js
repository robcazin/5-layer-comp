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
