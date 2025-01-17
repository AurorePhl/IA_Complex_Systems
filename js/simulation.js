function initGrid(city,taille) {
    // Initialisation de la grille de la ville  

    for (var i = 0; i < taille; i++) { 
        city[i] = new Array(taille); 
        for (var j = 0; j < taille; j++) {
            city[i][j] = { 
                fire: false, // au début, il n'y a pas de feu sur les cases
                robots: [], // listes des robots possiblement sur la case, au début aucun robot
                survivant: false, // au début aucun survivant, on suppose qu'il peut y avoir un seul survivatn sur une cellule
                qg : null // au début, il n'y a pas de QG sur les cases
            }; 
        }
    }

    // quatier général
    let mid = Math.floor(taille / 2);
    city[mid][mid].qg = {
        nbSurvivants: 0 
    };
    // peut etre mettre 4 cases pour le QG pour avoir exactement le milieu mais on verra après

    // les survivants
    placeSurvivants(city, taille, 10);

    return city;
}

// placer des survivants aléatoirement dans la grille
function placeSurvivants(city, taille, count) {
    while (count > 0) {
        let x = Math.floor(Math.random() * taille);
        let y = Math.floor(Math.random() * taille);
        if (!city[x][y].survivant && !city[x][y].qg) { // on ne peut pas placer un survivant sur un QG
            city[x][y].survivant = true; // on place un survivant
            count--;
        }
    }
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
                    svgContent += `<circle cx="${j * cellSize + pos.cx}" cy="${i * cellSize + pos.cy}" r="${cellSize / 8}" fill="${robot.color}" />`;
                });
            }
            if (cell.survivant) { // afficher les survivants
                let x = j * cellSize + cellSize / 2;
                let y = i * cellSize + cellSize / 2;
                let size = cellSize / 4;
                svgContent += `<polygon points="${x},${y - size} ${x - size},${y + size} ${x + size},${y + size}" fill="green" />`;
            }
            if (cell.qg) { // afficher le nombre de survivants au QG (informations)
                let x = j * cellSize + cellSize / 2;
                let y = i * cellSize + cellSize / 2;
                svgContent += `<text x="${x}" y="${y}" font-size="${cellSize / 4}" text-anchor="middle" fill="black">${cell.qg.nbSurvivants}</text>`;
                let triangleSize = cellSize / 6; 
                let triangleX = x + cellSize / 4; 
                let triangleY = y - cellSize / 8;
                svgContent += `<polygon points="${triangleX},${triangleY} ${triangleX - triangleSize},${triangleY + triangleSize} ${triangleX + triangleSize},${triangleY + triangleSize}" fill="green" />`;
            }
        }
    }
    return svgContent;
}

// Fonction pour générer un ID aléatoire
function generateRandomId() {
    return Math.random().toString(36).substr(2, 9); // Génère un identifiant alphanumérique court
}

 // Positionne 7 robots aléatoirement dans la grille
 function placeRobots(city,taille, count) {
    let robots = [];
    let robotColor = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink'];

    let mid = Math.floor(taille / 2);

    for (let i = 0; i < count; i++) {
        let color = robotColor[i % robotColor.length]; // couleur du robot
        let robot = { x: mid, y: mid, id: generateRandomId(), color: color, hasSurvivor: false }; // caracteristiques du robot

        city[mid][mid].robots.push(robot); // ajouter à city (caracteristiques des cellules)
        robots.push(robot); // ajouter à la liste des robots > peut etre a enlever

/*         intervalId = setInterval(() => { // bouger les robots
            moveRobot(city, robot, taille); // bouger le robot
            const grid = document.getElementById('grid'); // mettre à jour la grille
            let svgContent = updateGrid(city, taille, 50, robots);  // mettre à jour la grille
            grid.innerHTML = svgContent; // mettre à jour la grille
        }, 500); // bouger les robots toutes les secondes */

    }
    console.log('voici les robots', robots);
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

function getDirectionToQG(city, robot) { // direction du robot vers le QG
    const mid = Math.floor(city.length / 2);
    const dx = mid - robot.x;
    const dy = mid - robot.y;

    if (Math.abs(dx) > Math.abs(dy)) {
        return { dx: Math.sign(dx), dy: 0 }; 
    } else {
        return { dx: 0, dy: Math.sign(dy) }; 
    }
}

function sendInformation(city) { // pour le moment il y a juste les informations pour le nombre de survivants
    let mid = Math.floor(city.length / 2); // recupérer le qg
    if (city[mid][mid].qg) { // si le QG existe (vérification)
        city[mid][mid].qg.nbSurvivants += 1; // ajouter un survivant au QG
    }
}

function moveRobot(city, robot, taille) {
    const directions = [
        { dx: 0, dy: -1 }, // haut
        { dx: 0, dy: 1 },  // bas
        { dx: -1, dy: 0 }, // gauche
        { dx: 1, dy: 0 }   // droite
    ];

    let direction; // direction du robot
    if (robot.hasSurvivor) { // si le robot a un survivant
        direction = getDirectionToQG(city, robot); // aller vers le QG
    } else { // sinon
        direction = directions[Math.floor(Math.random() * directions.length)]; // aller dans une direction aléatoire
    }

    const newX = robot.x + direction.dx; // nouvelle position du robot
    const newY = robot.y + direction.dy; // nouvelle position du robot

    if (newX >= 0 && newX < taille && newY >= 0 && newY < taille) { // si la nouvelle position est dans la grille
        city[robot.x][robot.y].robots = city[robot.x][robot.y].robots.filter(r => r.id !== robot.id); // enlever le robot de la case actuelle

        robot.x = newX;
        robot.y = newY;

        city[newX][newY].robots.push(robot); // ajouter le robot à la nouvelle case

        if (robot.hasSurvivor && city[newX][newY].qg) { // si le robot a un survivant et qu'il est sur le QG
            
            robot.hasSurvivor = false;
        } else if (!robot.hasSurvivor && city[newX][newY].survivant) { // si le robot n'a pas de survivant et qu'il y a un survivant sur la case
            robot.hasSurvivor = true;
            sendInformation(city); // envoyer les informations au QG (meme si le survivant n'est pas encore au QG)
            city[newX][newY].survivant = false; // enlever le survivant de la case
        }
    }
}

// Fonction pour créer l'intervalle de mouvement des robots
function startRobotMovement(robots, city, taille, intervalId, grid, cellSize, robotSpeed) {
    if (intervalId) {
        clearInterval(intervalId);  // Si un intervalle existe, on le nettoie
    }

    // Crée un nouvel intervalle pour le mouvement des robots
    intervalId = setInterval(() => {
        robots.forEach(robot => {
            moveRobot(city, robot, taille); // Bouger chaque robot
        });
        let svgContent = updateGrid(city, taille, cellSize, robots);  // Mettre à jour la grille
        grid.innerHTML = svgContent; // Mettre à jour la grille
    }, robotSpeed); // Bouger les robots toutes les secondes

    return intervalId;  // Retourner l'intervalId pour une gestion future
}



// Appel au chargement de la page
document.addEventListener('DOMContentLoaded', async function () {
    const grid = document.getElementById('grid');
    const addRobotButton = document.getElementById('addRobot');
    const removeRobotButton = document.getElementById('removeRobot');
    const robotCountDisplay = document.getElementById('robotCount'); 
    const robotSpeedInput = document.getElementById('robotSpeedPara');

    let taille = 15;
    let cellSize = 50;
    let city = new Array(taille);
    let robotCount = 7; // Nombre de robots à placer
    let robots = [];
    let intervalId ;
    let robotSpeed = 500;

    // Modifier vitesse des robots 
    robotSpeedInput.addEventListener('input', function (e) {
        robotSpeed = parseFloat(e.target.value) * 1000; // Convertir la vitesse en ms
        // Réajuster l'intervalle avec la nouvelle vitesse
        intervalId = startRobotMovement(robots, city, taille, intervalId, grid, cellSize, robotSpeed);
    });

    // Initialiser la grille
    initGrid(city, taille);

    // Placer les robots
    robots = placeRobots(city,taille, robotCount);

    // Faire bouger les robots 
    intervalId = startRobotMovement(robots, city, taille, intervalId, grid, cellSize, robotSpeed);

    grid.setAttribute('width', taille * cellSize);
    grid.setAttribute('height', taille * cellSize);

    // Mettre à jour et afficher la grille initiale
    let svgContent = updateGrid(city, taille, cellSize, robots);
    grid.innerHTML = svgContent;

    // Mettre à jour le compteur de robots
    const updateRobotCount = () => {
        robotCountDisplay.textContent = `Robots : ${robots.length}`;
    };

    // Ajouter un robot
    addRobotButton.addEventListener('click', () => {
        if (robotCount < taille * taille) { // Limite au nombre total de cellules
            robotCount++;
            let mid = Math.floor(taille / 2);
            let color = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink'][robotCount % 7];
            let robot = { x: mid, y: mid, id: generateRandomId(), color: color, hasSurvivor: false };
            robots.push(robot);
            city[mid][mid].robots.push(robot); // Ajouter le robot au QG

            updateRobotCount();

            intervalId = startRobotMovement(robots, city, taille, intervalId, grid, cellSize, robotSpeed);
        }
    });

    removeRobotButton.addEventListener('click', () => {
        if (robotCount > 0) {
            // Choisir un index aléatoire parmi les robots globaux
            let randomIndex = Math.floor(Math.random() * robots.length);
            let robot = robots[randomIndex];
    
            if (robot) {
                // Supprimer le robot de la liste des robots globaux
                robots.splice(randomIndex, 1);
    
                // Retirer le robot de la cellule correspondante dans `city`
                let cell = city[robot.x][robot.y];
                if (cell.robots) {
                    cell.robots = cell.robots.filter(r => r.id !== robot.id);
                }
    
                // Mettre à jour la grille SVG
                svgContent = updateGrid(city, taille, cellSize, robots);
                grid.innerHTML = svgContent;
    
                // Mettre à jour l'affichage du compteur de robots
                updateRobotCount();

                // Si il n'y a plus de robots, nettoyer l'intervalle
            if (robots.length === 0) {
                clearInterval(intervalId);
            } else {
                // Si des robots restent, redémarrez l'intervalle
                intervalId = startRobotMovement(robots, city, taille, intervalId, grid, cellSize, robotSpeed);
            }
    
                console.log("Robot supprimé :", robot);
                console.log("Robots restants dans la cellule :", cell.robots);
                console.log("Nombre total de robots :", robots.length);
            }
        }
    });
      

    svgContent = updateGrid(city, taille, cellSize, robots);
    grid.innerHTML = svgContent;
    updateRobotCount();

    await sleep(2000);
    // Allumer un feu aléatoire et mettre à jour la grille
    let x = Math.floor(Math.random() * taille);
    let y = Math.floor(Math.random() * taille);
    startFire(city, x, y);
    svgContent = updateGrid(city, taille, cellSize, robots);
    grid.innerHTML = svgContent;


});