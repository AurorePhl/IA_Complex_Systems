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
function updateGrid(city, taille, cellSize,robots) {
    let svgContent = '';
    for (let i = 0; i < taille; i++) {
        for (let j = 0; j < taille; j++) {
            let color = city[i][j] ? "red" : "white";
            svgContent += `<rect x="${j * cellSize}" y="${i * cellSize}" width="${cellSize}" height="${cellSize}" fill="${color}" stroke="black" />`;
        }
    }

    // Ajouter les robots en tant que cercles
    robots.forEach(robot => {
        let cx = robot.y * cellSize + cellSize / 2;
        let cy = robot.x * cellSize + cellSize / 2;
        svgContent += `<circle cx="${cx}" cy="${cy}" r="${cellSize / 4}" fill="blue" />`;
    });

    return svgContent;
}

 // Positionne 7 robots aléatoirement dans la grille
 function placeRobots(taille, count) {
    let robots = [];
    while (robots.length < count) {
        let x = Math.floor(Math.random() * taille);
        let y = Math.floor(Math.random() * taille);

        // Vérifier que le robot n'est pas déjà à cette position
        if (!robots.some(robot => robot.x === x && robot.y === y)) {
            robots.push({ x, y });
        }
    }
    return robots;
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

    // Placer les robots
    let robots = placeRobots(taille, 7);

    const grid = document.getElementById('grid');
    grid.setAttribute('width', taille * cellSize);
    grid.setAttribute('height', taille * cellSize);

    // Mettre à jour et afficher la grille initiale
    let svgContent = updateGrid(city, taille, cellSize, robots);
    grid.innerHTML = svgContent;

    await sleep(2000);
    // Allumer un feu et mettre à jour la grille
    startFire(city, 5, 1);
    svgContent = updateGrid(city, taille, cellSize);
    grid.innerHTML = svgContent;
});