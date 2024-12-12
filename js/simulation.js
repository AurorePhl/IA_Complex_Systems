function initGrid(city,taille) {
    // Initialisation de la grille de la ville  

    for (var i = 0; i < taille; i++) {
        city[i] = new Array(taille);
        for (var j = 0; j < taille; j++) {
            city[i][j] = false;
        }
    }

    return city;
}

// Mise à jour de la grille SVG
function updateGrid(city, taille, cellSize) {
    let svgContent = '';
    for (let i = 0; i < taille; i++) {
        for (let j = 0; j < taille; j++) {
            let color = city[i][j] ? "black" : "white";
            svgContent += `<rect x="${j * cellSize}" y="${i * cellSize}" width="${cellSize}" height="${cellSize}" fill="${color}" stroke="black" />`;
        }
    }
    return svgContent;
}

// Allume un feu à une position donnée
function startFire(city, x, y) {
    if (x >= 0 && x < city.length && y >= 0 && y < city[x].length) {
        city[x][y] = true;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Appel au chargement de la page
document.addEventListener('DOMContentLoaded', async function () {
    let taille = 10;
    let cellSize = 50;
    let city = new Array(taille);

    // Initialiser la grille
    initGrid(city, taille);

    const grid = document.getElementById('grid');
    grid.setAttribute('width', taille * cellSize);
    grid.setAttribute('height', taille * cellSize);

    // Mettre à jour et afficher la grille initiale
    let svgContent = updateGrid(city, taille, cellSize);
    grid.innerHTML = svgContent;

    await sleep(2000);
    // Allumer un feu et mettre à jour la grille
    startFire(city, 5, 1);
    svgContent = updateGrid(city, taille, cellSize);
    grid.innerHTML = svgContent;
});