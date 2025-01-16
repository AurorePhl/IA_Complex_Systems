function initGrid(city,taille) {
    // Initialisation de la grille de la ville  

    for (var i = 0; i < taille; i++) { 
        city[i] = new Array(taille); 
        for (var j = 0; j < taille; j++) {
            city[i][j] = { 
                fire: false, // au début, il n'y a pas de feu sur les cases
                robots: [], // listes des robots possiblement sur la case, au début aucun robot
                survivants: [], // liste des survivants possiblement sur la case, au début aucun survivant
                qg : false // au début, il n'y a pas de QG sur les cases
            }; 
        }
    }

    // quatier général
    let mid = Math.floor(taille / 2);
    city[mid][mid].qg = true;
    // peut etre mettre 4 cases pour le QG pour avoir exactement le milieu mais on verra après

    return city;
}

// pour visualiser les robots sur les cellules
function getRobotPositions(cellSize, robotCount) {
    const positions = [];
    const offset = cellSize / 4;
    const center = cellSize / 2;

    for (let i = 0; i < robotCount; i++) {
        let angle = (2 * Math.PI * i) / robotCount; 
        positions.push({
            cx: center + offset * Math.cos(angle),
            cy: center + offset * Math.sin(angle),
        });
    }

    return positions;
}


// Mise à jour de la grille SVG
function updateGrid(city, taille, cellSize,robots) {
    let svgContent = '';
    for (let i = 0; i < taille; i++) {
        for (let j = 0; j < taille; j++) {
            let cell = city[i][j];
            let color = cell.fire ? "red" : "white";
            if (cell.qg) {
                color = "#bfbfbf"; 
            }
            svgContent += `<rect x="${j * cellSize}" y="${i * cellSize}" width="${cellSize}" height="${cellSize}" fill="${color}" stroke="black" />`;
            if (cell.robots.length > 0) {
                let positions = getRobotPositions(cellSize, cell.robots.length);
                cell.robots.forEach((robot, index) => {
                    let pos = positions[index];
                    svgContent += `<circle cx="${j * cellSize + pos.cx}" cy="${i * cellSize + pos.cy}" r="${cellSize / 8}" fill="blue" />`;
                });
            }
        }
    }

    return svgContent;
}

 // Positionne 7 robots aléatoirement dans la grille
 function placeRobots(city,taille, count) {
    let robots = [];
    let mid = Math.floor(taille / 2);

    for (let i = 0; i < count; i++) {
        let robot = { x: mid, y: mid, id: i};
        city[mid][mid].robots.push(robot); // ajouter à city (caracteristiques des cellules)
        robots.push(robot); // ajouter à la liste des robots > peut etre a enlever
    }
    return robots;
}

// Allume un feu à une position donnée
function startFire(city, x, y) {
    if (x >= 0 && x < city.length && y >= 0 && y < city[x].length) {
        city[x][y].fire = true;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Appel au chargement de la page
document.addEventListener('DOMContentLoaded', async function () {
    let taille = 15;
    let cellSize = 50;
    let city = new Array(taille);

    // Initialiser la grille
    initGrid(city, taille);

    // Placer les robots
    let robots = placeRobots(city,taille, 7);

    const grid = document.getElementById('grid');
    grid.setAttribute('width', taille * cellSize);
    grid.setAttribute('height', taille * cellSize);

    // Mettre à jour et afficher la grille initiale
    let svgContent = updateGrid(city, taille, cellSize, robots);
    grid.innerHTML = svgContent;

    await sleep(2000);
    // Allumer un feu aléatoire et mettre à jour la grille
    let x = Math.floor(Math.random() * taille);
    let y = Math.floor(Math.random() * taille);
    startFire(city, x, y);
    svgContent = updateGrid(city, taille, cellSize, robots);
    grid.innerHTML = svgContent;

    
});