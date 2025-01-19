// ================================================================
// TITRE : Script JavaScript de simulation d'incendie
// DATE : 20/01/2025
// AUTEURES : DURET Laura et PHILIPPE Aurore
// ================================================================

// ================================================================
// FONCTIONS  
// ================================================================

// Démarre les workers au lancement de la simulation 
// function startSimulation(robotWorker,fireWorker) {
//     postMessage , timeout, interval, onmessage,...
// }

// Nettoie les workers à la fin de la simulation
// function stopSimulation(robotWorker,fireWorker) {
//     robotWorker.terminate(); // Nettoie le worker qui gère le mouvement des robots
//     fireWorker.terminate(); // Nettoie le worker qui gère la propagation des incendies
//     console.log("Simulation terminée."); // Message de fin de simulation envoyé dans la console 
// }

// Fonction d'initialisation de la grille de la ville
// Crée une grille carrée de taille 'taille' avec des cases initialisées à des valeurs par défaut
function initGrid(city, taille, humanCount) {
    // Initialisation des cases de la grille avec des objets représentant des états de cellule
    for (var i = 0; i < taille; i++) {
        city[i] = new Array(taille); // Création d'un tableau pour chaque ligne
        for (var j = 0; j < taille; j++) {
            // Chaque cellule contient un état par défaut
            city[i][j] = {
                fire: false, // Pas de feu initialement
                robots: [], // Liste vide de robots sur la case
                human : { present: false, mort: false }, // Pas d'humain sur la case au départ
                qg: null, // Pas de QG par défaut
                cri: null, // Pas de cri par défaut,  plus tard associé à la position du survivant pour le retrouver directement
            };
        }
    }

    // Positionner le quartier général (QG) au centre de la grille
    let mid = Math.floor(taille / 2);
    city[mid][mid].qg = {
        totalSurvivants: 0, // Initialisation du nombre de survivants au QG
        totalMorts: 0, // Initialisation du nombre de morts au QG
        totalHumans : humanCount // Nombre total d'humains à sauver
    };

    // Placement aléatoire des humains sur la grille
    placeHumans(city, taille, humanCount);

    return city; // Retourner la grille initialisée
}

// Fonction pour placer un certain nombre d'huamins de manière aléatoire sur la grille
function placeHumans(city, taille, count) {
    while (count > 0) {
        let x = Math.floor(Math.random() * taille); // Coordonnée x aléatoire
        let y = Math.floor(Math.random() * taille); // Coordonnée y aléatoire
        // Vérification si la case n'est pas déjà occupée par un humain ou un QG
        if (!city[x][y].human.present && !city[x][y].qg) {
            city[x][y].human.present = true; // Placer un human
            addCriHumans(city, x, y, taille); // Ajouter un cri aux cellules adjacentes
            count--; // Décrémenter le compteur de humains
        }
    }
}

// Fonction pour obtenir les positions des robots sur une cellule donnée
// Calcul des positions des robots en fonction de la taille de la cellule
function getRobotPositions(cellSize, robotCount) {
    const positions = [];
    const offset = cellSize / 4; // Décalage pour espacer les robots
    const center = cellSize / 2; // Centre de la cellule

    for (let i = 0; i < robotCount; i++) {
        let angle = (2 * Math.PI * i) / robotCount; // Calcul de l'angle pour chaque robot
        positions.push({
            cx: center + offset * Math.cos(angle),
            cy: center + offset * Math.sin(angle),
        });
    }

    return positions; // Retourne les positions calculées
}

// Fonction pour mettre à jour la grille SVG avec les états actuels des cellules
function updateGrid(city, taille, cellSize, robots) {
    let svgContent = '';
    for (let i = 0; i < taille; i++) {
        for (let j = 0; j < taille; j++) {
            let cell = city[i][j];
            let color = cell.fire ? "red" : "white"; // Si la cellule est en feu, la couleur est rouge
            if (cell.qg) {
                color = "#bfbfbf"; // Couleur grise pour le QG
            } else if (cell.messageRetourQG) {
                color = "#d3d3d3"; // Couleur grisée claire pour les messages de diffusion retour au QG
            }
            // Dessiner un rectangle représentant la cellule
            svgContent += `<rect id="cell-${j}-${i}" class="isNotFlammable" x="${j * cellSize}" y="${i * cellSize}" width="${cellSize}" height="${cellSize}" fill="${color}" stroke="black" />`;
            // Dessiner les robots si présents sur la cellule
            if (cell.robots.length > 0) {
                let positions = getRobotPositions(cellSize, cell.robots.length);
                cell.robots.forEach((robot, index) => {
                    let pos = positions[index];
                    svgContent += `<circle cx="${j * cellSize + pos.cx}" cy="${i * cellSize + pos.cy}" r="${cellSize / 8}" fill="${robot.color}" />`;
                });
            }
            // Dessiner les humains si présents et pas morts sur la cellule
            if (cell.human.present ) {
                let x = j * cellSize + cellSize / 2;
                let y = i * cellSize + cellSize / 2;
                let size = cellSize / 4;
                let fillColor = cell.human.mort ? "black" : "green";
                svgContent += `<polygon points="${x},${y - size} ${x - size},${y + size} ${x + size},${y + size}" fill="${fillColor}" />`;
            }
            // Dessiner le QG et afficher le nombre d'humains sauvés et morts
            if (cell.qg) {
                let x = j * cellSize + cellSize / 2;
                let y = i * cellSize + cellSize / 2;
                svgContent += `<text x="${x}" y="${y}" font-size="${cellSize / 4}" text-anchor="middle" fill="black">${cell.qg.totalSurvivants}</text>`;
                let triangleSize = cellSize / 6;
                let triangleX = x + cellSize / 4;
                let triangleY = y - cellSize / 8;
                svgContent += `<polygon points="${triangleX},${triangleY} ${triangleX - triangleSize},${triangleY + triangleSize} ${triangleX + triangleSize},${triangleY + triangleSize}" fill="green" />`;
                if (cell.qg.totalMorts > 0) {
                    let blackTriangleX = x + cellSize / 4; // Ajuster la position du triangle noir à droite du nombre de morts
                    let blackTriangleY = y + cellSize / 4;
                    svgContent += `<text x="${x}" y="${y + cellSize / 4}" font-size="${cellSize / 4}" text-anchor="middle" fill="black">${cell.qg.totalMorts}</text>`;
                    svgContent += `<polygon points="${blackTriangleX},${blackTriangleY} ${blackTriangleX - triangleSize},${blackTriangleY + triangleSize} ${blackTriangleX + triangleSize},${blackTriangleY + triangleSize}" fill="black" />`;
                }
            }
            // Dessiner les cris, peut etre a enlever pour que ce soit plus lisible
            if (cell.cri) {
                svgContent += `<line x1="${j * cellSize}" y1="${i * cellSize}" x2="${(j + 1) * cellSize}" y2="${(i + 1) * cellSize}" stroke="green" stroke-width="2" />`;
            }
        }
    }
    return svgContent; // Retourner le contenu SVG mis à jour
}

// Fonction pour mettre à jour city 
function updateCity(city){
    for (let i = 0; i < taille; i++) {
        for (let j = 0; j < taille; j++) {

        }
    }
}

// Fonction pour générer un ID aléatoire pour chaque robot
function generateRandomId() {
    return Math.random().toString(36).substr(2, 9); // ID alphanumérique unique
}

// Fonction pour placer des robots de manière aléatoire dans la grille
function placeRobots(city, taille, count) {
    let robots = [];
    let robotColor = ['tomato', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink']; // Palette de couleurs pour les robots

    let mid = Math.floor(taille / 2); // Positionner les robots au centre de la grille

    for (let i = 0; i < count; i++) { // Pour chaque robot
        let color = robotColor[i % robotColor.length]; // Choisir une couleur de robot
        let role = i < 4 ? 'sauveur' : 'pompier';
        let robot = { x: mid, y: mid, id: generateRandomId(), color: color, hasHuman: false, stopped: false, epuise :false, role: role }; // Créer un robot avec ses attributs
        city[mid][mid].robots.push(robot); // Ajouter le robot au QG
        robots.push(robot); // Ajouter à la liste des robots

        // Le mouvement des robots peut être géré ici (commenté pour l'instant)
    }

    console.log('Robots initialement placés:', robots);
    return robots; // Retourner la liste des robots
}

// Fonction pour allumer un feu à une position donnée dans la grille
function startFire(city, x, y) {
    if (x >= 0 && x < city.length && y >= 0 && y < city[x].length) {
        city[x][y].fire = true; // Allumer un feu sur la cellule spécifiée
        console.log(city[x][y].fire);
        checkSurvivorDeath(city, x, y);
    }
}

// fonction temporaire pour allumer plusieurs feux
function startMultipleFires(city, count) {
    let taille = city.length;
    while (count > 0) {
        let x = Math.floor(Math.random() * taille); // Coordonnée x aléatoire
        let y = Math.floor(Math.random() * taille); // Coordonnée y aléatoire
        if (!city[x][y].fire) { // Vérifier si la cellule n'est pas déjà en feu
            startFire(city, x, y); // Allumer un feu
            checkSurvivorDeath(city, x, y);
            count--; // Décrémenter le compteur de feux
        }
    }
}

// Fonction pour faire une pause entre deux actions (utilisé pour temporiser dans l'exécution)
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Fonction pour obtenir la direction à prendre pour que le robot se dirige vers le QG
function getDirectionToQG(city, robot) {
    const mid = Math.floor(city.length / 2); // Trouver la position centrale du QG
    const dx = mid - robot.x; // Calcul de la différence en X
    const dy = mid - robot.y; // Calcul de la différence en Y

    if (Math.abs(dx) > Math.abs(dy)) {
        return { dx: Math.sign(dx), dy: 0 }; // Déplacement horizontal
    } else {
        return { dx: 0, dy: Math.sign(dy) }; // Déplacement vertical
    }
}

// Fonction pour envoyer les informations au QG
function sendInformation(city) {
    let mid = Math.floor(city.length / 2); // Récupérer la position du QG
    if (city[mid][mid].qg) { // Si un QG existe
        city[mid][mid].qg.totalSurvivants += 1; // Ajouter un survivant au QG
    }
}
function sendDeathInformation(city) {
    let mid = Math.floor(city.length / 2);
    if (city[mid][mid].qg) {
        city[mid][mid].qg.totalMorts += 1; // Ajouter un mort au QG
    }
}
function checkSurvivorDeath(city, x, y) { // Vérifier si un humain est mort
    if (city[x][y].human.present && city[x][y].fire) {
        setTimeout(() => {
            if (city[x][y].human.present && city[x][y].fire) {
                city[x][y].human.mort = true; // Marquer l'humain comme mort
                console.log(`human à (${x}, ${y}) est mort.`);
            }
        }, 10000); // Vérifier après 10 seconde sur la case en feu 
    }
}
function diffuseRetourQG(city, taille) {
    const mid = Math.floor(taille / 2);
    const directions = [
        { dx: 0, dy: -1 }, // Haut
        { dx: 0, dy: 1 },  // Bas
        { dx: -1, dy: 0 }, // Gauche
        { dx: 1, dy: 0 },  // Droite
    ];

    directions.forEach(direction => {
        for (let i = 1; i <= 4; i++) { // Étendre la portée à 3 cases
            const newX = mid + direction.dx * i;
            const newY = mid + direction.dy * i;
            if (newX >= 0 && newX < taille && newY >= 0 && newY < taille) {
                city[newX][newY].messageRetourQG = true; // Ajouter un message pour attirer les robots
            }
        }
    });
}

// Fonction pour enlever un cri des cellules adjacentes dès qu'un humain soit détecté
function removeCriHumans(city, x, y, taille) {
    const directions = [
        { dx: 0, dy: -1 }, // Haut
        { dx: 0, dy: 1 },  // Bas
        { dx: -1, dy: 0 }, // Gauche
        { dx: 1, dy: 0 }   // Droite
    ];

    directions.forEach(direction => { // Pour chaque direction
        const newX = x + direction.dx;
        const newY = y + direction.dy;
        if (newX >= 0 && newX < taille && newY >= 0 && newY < taille) { // Vérifier si la nouvelle position est valide
            city[newX][newY].cri = null; // Enlever la référence a l' humain
        }
    });
}

// Fonction pour ajouter un cri aux cellules adjacentes
function addCriHumans(city, x, y, taille) {
    const directions = [
        { dx: 0, dy: -1 }, // Haut
        { dx: 0, dy: 1 },  // Bas
        { dx: -1, dy: 0 }, // Gauche
        { dx: 1, dy: 0 }   // Droite
    ];

    directions.forEach(direction => { // Pour chaque direction
        const newX = x + direction.dx;
        const newY = y + direction.dy;
        if (newX >= 0 && newX < taille && newY >= 0 && newY < taille) {
            city[newX][newY].cri = { x, y }; // Ajouter une référence a l'humain
        }
    });
}




// Fonction pour déplacer un robot dans la ville
function moveRobot(city, robot, taille) { 
    if (robot.stopped) return; // Si le robot est arrêté, ne pas le déplacer

    let direction = determineDirection(city, robot); // Déterminer la direction à prendre
    if (!direction) {
        console.error('Direction indéfinie pour le robot:', robot);
        return;
    }
    let { newX, newY } = calculateNewPosition(robot, direction); // Calculer la nouvelle position

    if (isValidPosition(newX, newY, taille)) { // Vérifier si la nouvelle position est valide
        updateRobotPosition(city, robot, newX, newY); // Mettre à jour la position du robot
        if (robot.role === 'pompier') {
            pompierAction(city, robot, newX, newY); // Gérer l'interaction avec le feu
        }
        else if (robot.role === 'sauveur') {
            humanAction(city, robot, newX, newY, taille); // Gérer l'interaction avec les humains
        }
        checkEpuise(city, robot, newX, newY); // Gérer l'épuisement du robot
        checkFinish(city, robot, newX, newY); // Vérifier si tous les humains ont été détectés
    }

}

// Fonction pour déterminer la direction à prendre par un robot
function determineDirection(city, robot) { 
    if (robot.hasHuman || (robot.epuise && !robot.hasHuman)) { // Si le robot a un humain ou est épuisé
        return getDirectionToQG(city, robot); // Retourner la direction vers le QG
    } else if (city[robot.x][robot.y].cri && robot.role === 'sauveur') { // Si un cri est détecté
        let cri = city[robot.x][robot.y].cri; // Récupérer la position du cri
        return { dx: Math.sign(cri.x - robot.x), dy: Math.sign(cri.y - robot.y) }; // Se diriger vers le cri
    } else if (city[robot.x][robot.y].messageRetourQG) { // Si un message de retour au QG est détecté
        return getDirectionToQG(city, robot); // Retourner la direction vers le QG
    } else { // Sinon, choisir une direction aléatoire
        const directions = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 }
        ];
        return directions[Math.floor(Math.random() * directions.length)]; // Choisir une direction aléatoire
    }
}

function calculateNewPosition(robot, direction) { // Calculer la nouvelle position du robot
    return {
        newX: robot.x + direction.dx,
        newY: robot.y + direction.dy
    };
}

function isValidPosition(x, y, taille) { // Vérifier si la position est valide (dans la grille)
    return x >= 0 && x < taille && y >= 0 && y < taille;
}

function updateRobotPosition(city, robot, newX, newY) { // Mettre à jour la position du robot
    city[robot.x][robot.y].robots = city[robot.x][robot.y].robots.filter(r => r.id !== robot.id);
    robot.x = newX;
    robot.y = newY;
    city[newX][newY].robots.push(robot);
}

function pompierAction(city, robot, newX, newY) { // Gérer l'interaction avec le feu
    if (city[newX][newY].fire && !robot.epuise) { // Si la cellule est en feu
        robot.stopped = true; // Arrêter le robot
        setTimeout(() => { // Après 3 secondes
            city[newX][newY].fire = false; // Éteindre le feu
            robot.stopped = false; // Redémarrer le robot
            let svgContent = updateGrid(city, taille, cellSize, robots); // Mettre à jour la grille SVG
            grid.innerHTML = svgContent; // Afficher la grille mise à jour
        }, 3000);
        robot.epuise = true;    // Le robot est épuisé
    }
}

function humanAction(city, robot, newX, newY, taille) { // Gérer l'interaction avec les humains
    if (robot.hasHuman && city[newX][newY].qg) { // Si le robot a un humain et est au QG
        robot.hasHuman = false; // Lâcher l'humain
    } else if (!robot.hasHuman && city[newX][newY].human.present && !city[newX][newY].human.mort) { // Si le robot n'a pas d'humain et qu'un humain est présent et non mort
        robot.hasHuman = true;  // Prendre l'humain
        sendInformation(city); // Envoyer l'information au QG
        city[newX][newY].human.present = false; // Marquer l'humain comme plus présent
        removeCriHumans(city, newX, newY, taille);  // Enlever le cri des cellules adjacentes
        let mid = Math.floor(taille / 2);
        if (city[mid][mid].qg.totalSurvivants + city[mid][mid].qg.totalMorts === city[mid][mid].qg.totalHumans) { 
            diffuseRetourQG(city, taille);
        }
    } else if (city[newX][newY].human.mort) { // Si un humain est mort
        sendDeathInformation(city); // Envoyer l'information au QG
        removeCriHumans(city, newX, newY, taille); // Enlever le cri des cellules adjacentes
        city[newX][newY].human.present = false; // Marquer l'humain comme plus présent
        city[newX][newY].human.mort = false; // Marquer l'humain comme non mort (existe plus)
        let mid = Math.floor(taille / 2);
        if (city[mid][mid].qg.totalSurvivants + city[mid][mid].qg.totalMorts === city[mid][mid].qg.totalHumans) { 
            diffuseRetourQG(city, taille);
        }   
    }
}

function checkEpuise(city, robot, newX, newY) {
    if (robot.epuise && city[newX][newY].qg) {
        robot.stopped = true;
        setTimeout(() => {
            robot.epuise = false;
            robot.stopped = false;
        }, 2000);
    }
}

function checkFinish(city, robot, newX, newY) {

    if (city[newX][newY].qg && city[newX][newY].qg.totalSurvivants + city[newX][newY].qg.totalMorts === city[newX][newY].qg.totalHumans) {
        console.log("Tous les humains ont été sauvés ou sont morts je suis dans le QG");
        robot.stopped = true;
    }
}



// Fonction pour vérifier si tous les robots sont rentrés au QG
function allRobotsAtQG(city, robots) {
    const mid = Math.floor(city.length / 2);
    return robots.every(robot => robot.x === mid && robot.y === mid);
}
// Fonction pour vérifier si tous les survivants ont été détectés
function allSurvivorsDetected(city) {
    const mid = Math.floor(city.length / 2);
    const qg = city[mid][mid].qg;
    return qg.totalSurvivants + qg.totalMorts === qg.totalHumans;
}
// Fonction pour démarrer le mouvement des robots
function startRobotMovement(robots, city, taille, intervalId, grid, cellSize, robotSpeed, gridLock) {
    if (intervalId) {
        clearInterval(intervalId); // Si un mouvement est déjà en cours, le nettoyer
    }
    let startTime, endTime;
    startTime = Date.now(); 

    // Créer un nouvel intervalle pour le mouvement des robots
    intervalId = setInterval(() => {
        robots.forEach(robot => {
            if (!gridLock) {
                gridLock = true;
                moveRobot(city, robot, taille); // Déplacer chaque robot
                gridLock = false;
            }
        });
        let svgContent = updateGrid(city, taille, cellSize, robots); // Mettre à jour la grille SVG
        grid.innerHTML = svgContent; // Afficher la grille mise à jour

        // Vérifier si tous les robots sont rentrés au QG
        if (allRobotsAtQG(city, robots)  && allSurvivorsDetected(city)) {
            clearInterval(intervalId); // Arrêter l'intervalle
            endTime = Date.now(); // Enregistrer le temps de fin de la simulation
            displayPerformance(city, startTime, endTime); // Afficher les performances
        }
    }, robotSpeed); // Déplacer les robots à un intervalle de 'robotSpeed' millisecondes


    return intervalId; // Retourner l'intervalle pour gestion future
}

// Propagation d'un feu d'une cellule
function propagateFire(city, x, y, taille) {
    const directions = [
        [0, 1], // Droite
        [0, -1], // Gauche
        [1, 0], // Bas
        [-1, 0], // Haut
        [1, 1],  // Bas-Droite
        [1, -1], // Bas-Gauche
        [-1, 1], // Haut-Droite
        [-1, -1] // Haut-Gauche
    ];

    directions.forEach(([dx, dy]) => {
        const nx = x + dx;
        const ny = y + dy;

        if (nx >= 0 && nx < taille && ny >= 0 && ny < taille && !city[nx][ny].fire && !city[nx][ny].qg) {
            startFire(city, nx, ny);
        }
    });

    let svgContent = updateGrid(city, taille, cellSize, robots); // Mettre à jour la grille SVG
    grid.innerHTML = svgContent; // Afficher la grille mise à jour
}

// Mettre à jour l'intervalle de propagation des feux 
function propagateFireInterval(city,taille,grid,cellSize,robots,fireSpeed,firePropagationId, gridLock) {
    if (firePropagationId) {
        clearInterval(firePropagationId); // Si une propagation est déjà en cours, nettoyer l'intervalle
    }

    // Créer un nouvel intervalle pour la propagation des feux 
    firePropagationId = setInterval(() => {
        const cellsOnFire = []; // Liste des cellules en feu actuellement

        // Identifier toutes les cellules en feu
        for (let i = 0; i < taille; i++) {
            for (let j = 0; j < taille; j++) {
                if (city[i][j].fire) { // Vérifie si une cellule est en feu
                    cellsOnFire.push([i, j]); // AJoute la cellule en feu à la liste des cellules en feu actuellement
                }
            }
        }

        // Propage le feu à partir des cellules identifiées comme étant en feu actuellement
        cellsOnFire.forEach(([x, y]) => {
            if (!gridLock) {
                gridLock = true;
                propagateFire(city, x, y, taille); // Propage le feu aux cellules voisines de celle en feu
                gridLock = false;
            }
        });

        let svgContent = updateGrid(city, taille, cellSize, robots); // Mettre à jour la grille SVG
        grid.innerHTML = svgContent; // Afficher la grille mise à jour
    }, fireSpeed); // Vitesse de propagation des feux 

    return firePropagationId; // Retourner l'intervalle pour gestion future
}

// Fonction pour récupérer un rect par son ID
function getRectById(rectId) {
    let grid = document.getElementById('grid'); // Grille où les robots seront affichés
    if (!grid) {
        console.error('Le conteneur SVG est introuvable.');
        return null;
    }
    // Récupérer le rect avec son ID à partir du conteneur
    const rect = grid.querySelector(`#${rectId}`);
    if (!rect) {
        console.warn(`Aucun rect trouvé avec l'id : ${rectId}`);
    }

    return rect;
}



function startFirePropagation(city, taille, grid, cellSize, startFireSimulationIntervalId) {
    if (startFireSimulationIntervalId) {
        clearInterval(startFireSimulationIntervalId); // Nettoyer le précédent intervalle
    }

    startFireSimulationIntervalId = setInterval(() => {
        const updatedRects = document.querySelectorAll('rect');
        updatedRects.forEach((rect) => {
            const x = parseInt(rect.getAttribute('x') / cellSize);
            const y = parseInt(rect.getAttribute('y') / cellSize);
            if (rect.getAttribute('class') === "isFlammable" && !city[x][y].fire) {
                startFire(city, y, x);
                console.log("Feu sur :", x, y);
                // Mettre à jour la grille après avoir allumé le feu
                svgContent = updateGrid(city, taille, cellSize, robots);
                grid.innerHTML = svgContent;  // Afficher la grille mise à jour avec le feu
            }
            rect.setAttribute('class','startSimulation');
        });
    }, 100); // Propage le feu à chaque itération

    return startFireSimulationIntervalId;
}

// Fonction pour afficher les performances de la simulation
function displayPerformance(city, startTime, endTime) {
    const executionTime = (endTime - startTime) / 1000; // Calculer le temps d'exécution en secondes
    const mid = Math.floor(city.length / 2);
    const qg = city[mid][mid].qg;
    const totalSurvivants = qg.totalSurvivants;
    const totalHumans = qg.totalHumans;
    const survivorRate = (totalSurvivants / totalHumans) * 100; // Calculer le taux d'humains sauvés

    // Afficher les performances dans le DOM
    document.getElementById('executionTimeValue').textContent = executionTime.toFixed(2);
    document.getElementById('survivorRateValue').textContent = survivorRate.toFixed(2);
}


// ================================================================
// VARIABLES GLOBALES 
// ================================================================
let city; 
let taille;
let cellSize;
let robots


// ================================================================
// LANCEMENT DU PROGRAMME 
// ================================================================
// Attendre que la page soit entièrement chargée avant d'exécuter le programme
document.addEventListener('DOMContentLoaded', async function () {
    // ================================================================
    // VARIABLES D'INITIATION
    // ================================================================
    taille = 15; // Taille de la grille (15x15)
    cellSize = 50; // Taille de chaque cellule
    city = new Array(taille); // Initialisation de la grille
    let robotCount = 7; // Nombre initial de robots
    robots = []; // Liste vide pour les robots
    let intervalId; // ID pour gérer l'intervalle de mouvement des robots
    let startFireSimulationIntervalId; // ID pour gérer l'intervalle de début des feux au lancement de la simulation
    let firePropagationId; // ID pour gérer l'intervalle de propagation des feux 
    let robotSpeed = 500; // Vitesse des robots en millisecondes
    let fireSpeed = 10000; // Vitesse de propagation des feux en millisecondes
    let humanCount = 10; // Nombre initial de survivants
    let totalSurvivants = 0;  // Nombre total de survivants
    let totalHumans = 0;  // Nombre total d'humains
    let totalHumansInDanger = 0;  // Nombre d'humains en danger
    let gridLock = false; // Gestion des conflits entre les intervalles avec un verrou 

    // ================================================================
    // ÉLÉMENTS DU DOM (Interface utilisateur)
    // ================================================================
    // const robotWorker = new Worker('/js/robotWorker.js'); // Web Worker pour le déplacement des robots
    // const fireWorker = new Worker('/js/fireWorker.js'); // Web Worker pour la propagation des incendies 
    const grid = document.getElementById('grid'); // Grille où les robots seront affichés
    const addRobotButton = document.getElementById('addRobot'); // Bouton pour ajouter un robot
    const removeRobotButton = document.getElementById('removeRobot'); // Bouton pour supprimer un robot
    const robotCountDisplay = document.getElementById('robotCount'); // Affichage du nombre de robots
    const robotSpeedInput = document.getElementById('robotSpeedPara'); // Entrée pour ajuster la vitesse des robots
    const fireSpeedInput = document.getElementById('fireSpeedPara'); // Entrée pour ajuster la vitesse de propagation des feux
    const humanCountInput = document.getElementById('humanCountInput'); // Entrée pour ajuster le nombre d'humains
    const startSimulation = document.getElementById('startSimulation'); // Bouton pour démarrer le mouvement des robots
    const resetButton = document.getElementById('resetSimulation'); // Bouton pour réinitialiser la simulation
    const survivantsCountDisplay = document.getElementById('survivantsCount'); // Affichage du nombre de survivants
    const humansCountDisplay = document.getElementById('humansCount'); // Affichage du nombre total d'humains
    const humansInDangerDisplay = document.getElementById('humansInDanger'); // Affichage du nombre d'humains en danger
    const addHumanButton = document.getElementById('addHuman'); // Bouton pour ajouter un humain 

    // ================================================================
    // LISTENERS POUR LES ÉVÉNEMENTS
    // ================================================================
    // Modifier la vitesse des robots
    robotSpeedInput.addEventListener('input', function (e) {
        robotSpeed = parseFloat(e.target.value) * 1000; // Convertir la vitesse en millisecondes
        // Réajuster l'intervalle avec la nouvelle vitesse
        if (intervalId) {
            clearInterval(intervalId); // Nettoyer l'intervalle existant
            intervalId = startRobotMovement(robots, city, taille, intervalId, grid, cellSize, robotSpeed); // Redémarrer avec la nouvelle vitesse
        }
    });

    // Modifier la vitesse de propagation des feux 
    fireSpeedInput.addEventListener('input', function (e) {
        fireSpeed = parseFloat(e.target.value) * 1000; // Convertir la vitesse en millisecondes
        // Réajuster l'intervalle avec la nouvelle vitesse
        if (firePropagationId) {
            clearInterval(firePropagationId); // Nettoyer l'intervalle existant
            firePropagationId = propagateFireInterval(city, taille, grid, cellSize, fireSpeed, firePropagationId); // Redémarrer avec la nouvelle vitesse
        }
    });

    // Modifier le nombre d'huamin via l'interface
    humanCountInput.addEventListener('input', function (e) {
        humanCount = parseInt(e.target.value); // Lire la nouvelle valeur de l'humain
        city = initGrid(new Array(taille), taille, humanCount); // Réinitialiser la grille avec le nouveau nombre d'humains
        robots = placeRobots(city, taille, robotCount); // Réinitialiser les robots
        let svgContent = updateGrid(city, taille, cellSize, robots); // Mettre à jour la grille SVG
        grid.innerHTML = svgContent; // Afficher la grille mise à jour
    });

    // Mettre à jour le compteur de robots
    const updateRobotCount = () => {
        robotCountDisplay.textContent = `Total robots : ${robots.length}`; // Afficher le nombre de robots
    };


    // Ajouter un robot
    addRobotButton.addEventListener('click', () => {
        if (robotCount < taille * taille) { // Limite le nombre de robots en fonction de la taille de la grille
            robotCount++;
            let mid = Math.floor(taille / 2); // Placer le robot au centre de la grille
            let color = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink'][robotCount % 7]; // Assigner une couleur au robot
            let robot = { x: mid, y: mid, id: generateRandomId(), color: color, hasHuman: false }; // Créer un robot

            robots.push(robot); // Ajouter le robot à la liste
            city[mid][mid].robots.push(robot); // Ajouter le robot au QG
            updateRobotCount(); // Mettre à jour le compteur de robots

            //intervalId = startRobotMovement(robots, city, taille, intervalId, grid, cellSize, robotSpeed); // Lancer le mouvement des robots
            let svgContent = updateGrid(city, taille, cellSize, robots);
            grid.innerHTML = svgContent; // Mettre à jour la grille avec le nouveau robot
        }
    });

    // Supprimer un robot
    removeRobotButton.addEventListener('click', () => {
        if (robotCount > 0) {
            // Choisir un index aléatoire parmi les robots actuellement dans la liste globale `robots`
            let randomIndex = Math.floor(Math.random() * robots.length);
            let robot = robots[randomIndex];  // Sélectionner un robot aléatoire

            if (robot) {
                // Supprimer le robot de la liste des robots globaux
                robots.splice(randomIndex, 1);

                // Retirer le robot de la cellule correspondante dans la grille `city`
                let cell = city[robot.x][robot.y];
                if (cell.robots) {
                    // Filtrer et supprimer ce robot de la liste des robots dans cette cellule
                    cell.robots = cell.robots.filter(r => r.id !== robot.id);
                }

                // Mettre à jour la grille SVG pour refléter la suppression du robot
                svgContent = updateGrid(city, taille, cellSize, robots);
                grid.innerHTML = svgContent;  // Mettre à jour le contenu HTML de la grille

                // Mettre à jour l'affichage du compteur de robots restants
                updateRobotCount();

                // Si tous les robots ont été supprimés, arrêter l'intervalle de mouvement des robots
                if (robots.length === 0) {
                    clearInterval(intervalId);  // Nettoyer l'intervalle
                }

                // Log des informations pour le débogage
                console.log("Robot supprimé :", robot);
                console.log("Robots restants dans la cellule :", cell.robots);
                console.log("Nombre total de robots :", robots.length);
            }
        }
    });

    // Réinitialiser la simulation
    resetButton.addEventListener('click', () => {
        location.reload(); // Recharger la page pour réinitialiser la simulation
    });

    // ================================================================
    // PARTIE MAIN DU PROGRAMME
    // ================================================================
    // Initialiser la grille de la ville
    initGrid(city, taille, humanCount);

    // Placer les robots sur la grille
    robots = placeRobots(city, taille, robotCount);

    // Définir les dimensions du SVG pour la grille
    grid.setAttribute('width', taille * cellSize);
    grid.setAttribute('height', taille * cellSize);

    // Mettre à jour la grille avec les robots placés
    let svgContent = updateGrid(city, taille, cellSize, robots);
    grid.innerHTML = svgContent;

    // Mettre à jour le compteur de robots affiché
    updateRobotCount();

    // Mettre à jour les compteurs relatifs aux humains
    // updateHumansCount();

    // Ajouter un délai de 2 secondes avant de démarrer un incendie
    // await sleep(2000);

    // Allumer un feu à une position aléatoire et mettre à jour la grille
    // let x = Math.floor(Math.random() * taille);  // Choisir une position aléatoire X
    // let y = Math.floor(Math.random() * taille);  // Choisir une position aléatoire Y
    // startFire(city, x, y);  // Démarrer un incendie à la position (x, y)
    // startMultipleFires(city, 25); // Démarrer plusieurs incendies aléatoires

    

    // Démarrer les les robots après avoir cliqué sur le bouton de démarrage
    startSimulation.addEventListener('click', () => {
        intervalId = startRobotMovement(robots, city, taille, intervalId, grid, cellSize, robotSpeed,gridLock);
        startFireSimulationIntervalId = startFirePropagation(city,taille,grid,cellSize,startFireSimulationIntervalId);
        firePropagationId = propagateFireInterval(city,taille,grid,cellSize,robots,fireSpeed,firePropagationId,gridLock);
    });

    // updateHumansCount();
});

document.addEventListener('DOMContentLoaded', () => {
const grid = document.getElementById('grid'); // Grille où les robots seront affichés
const allRects = document.querySelectorAll('rect'); // Balises <rect> dans le DOM

// Démarrer un feu 
allRects.forEach((rect) => {
    if (rect.id=="cell-7-7") {
        rect.setAttribute('class', 'qg'); 
    }
    if (rect.id && rect.id!="cell-7-7") {
        rect.addEventListener('click', function () {
            if(rect.getAttribute('class')!="isFlammable"){
                console.log(`Cellule cliquée : id=${rect.id}`);
                rect.setAttribute('class', 'isFlammable'); // Rend la cellule inflammable
                rect.setAttribute('fill', 'red'); // Change la couleur de la cellule en temps réel
            } 
        });
    }
});

});