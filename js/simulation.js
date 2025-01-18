// ================================================================
// TITRE : Script JavaScript de simulation d'incendie
// DATE : 20/01/2025
// AUTEURES : DURET Laura et PHILIPPE Aurore
// ================================================================

// ================================================================
// FONCTIONS  
// ================================================================

// Fonction d'initialisation de la grille de la ville
// Crée une grille carrée de taille 'taille' avec des cases initialisées à des valeurs par défaut
function initGrid(city, taille, survivorCount) {
    // Initialisation des cases de la grille avec des objets représentant des états de cellule
    for (var i = 0; i < taille; i++) {
        city[i] = new Array(taille); // Création d'un tableau pour chaque ligne
        for (var j = 0; j < taille; j++) {
            // Chaque cellule contient un état par défaut
            city[i][j] = {
                fire: false, // Pas de feu initialement
                robots: [], // Liste vide de robots sur la case
                survivant: { present: false, mort: false }, // Pas de survivant sur la case au départ
                qg: null, // Pas de QG par défaut
                cri: null, // Pas de cri par défaut,  plus tard associé à la position du survivant pour le retrouver directement
            };
        }
    }

    // Positionner le quartier général (QG) au centre de la grille
    let mid = Math.floor(taille / 2);
    city[mid][mid].qg = {
        nbSurvivants: 0, // Initialisation du nombre de survivants au QG
        nbMort: 0, // Initialisation du nombre de morts au QG
        nbTotalSurvivants: survivorCount // Nombre total de survivants à sauver
    };

    // Placement aléatoire des survivants sur la grille
    placeSurvivants(city, taille, survivorCount);

    return city; // Retourner la grille initialisée
}

// Fonction pour placer un certain nombre de survivants de manière aléatoire sur la grille
function placeSurvivants(city, taille, count) {
    while (count > 0) {
        let x = Math.floor(Math.random() * taille); // Coordonnée x aléatoire
        let y = Math.floor(Math.random() * taille); // Coordonnée y aléatoire
        // Vérification si la case n'est pas déjà occupée par un survivant ou un QG
        if (!city[x][y].survivant.present && !city[x][y].qg) {
            city[x][y].survivant.present = true; // Placer un survivant
            addCriSurvivants(city, x, y, taille); // Ajouter un cri aux cellules adjacentes
            count--; // Décrémenter le compteur de survivants
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
            svgContent += `<rect id="cell-${j}-${i}" x="${j * cellSize}" y="${i * cellSize}" width="${cellSize}" height="${cellSize}" fill="${color}" stroke="black" />`;
            // Dessiner les robots si présents sur la cellule
            if (cell.robots.length > 0) {
                let positions = getRobotPositions(cellSize, cell.robots.length);
                cell.robots.forEach((robot, index) => {
                    let pos = positions[index];
                    svgContent += `<circle cx="${j * cellSize + pos.cx}" cy="${i * cellSize + pos.cy}" r="${cellSize / 8}" fill="${robot.color}" />`;
                });
            }
            // Dessiner les survivants si présents et pas morts sur la cellule
            if (cell.survivant.present) {
                let x = j * cellSize + cellSize / 2;
                let y = i * cellSize + cellSize / 2;
                let size = cellSize / 4;
                let fillColor = cell.survivant.mort ? "black" : "green";
                svgContent += `<polygon points="${x},${y - size} ${x - size},${y + size} ${x + size},${y + size}" fill="${fillColor}" />`;
            }
            // Dessiner le QG et afficher le nombre de survivants
            if (cell.qg) {
                let x = j * cellSize + cellSize / 2;
                let y = i * cellSize + cellSize / 2;
                svgContent += `<text x="${x}" y="${y}" font-size="${cellSize / 4}" text-anchor="middle" fill="black">${cell.qg.nbSurvivants}</text>`;
                let triangleSize = cellSize / 6;
                let triangleX = x + cellSize / 4;
                let triangleY = y - cellSize / 8;
                svgContent += `<polygon points="${triangleX},${triangleY} ${triangleX - triangleSize},${triangleY + triangleSize} ${triangleX + triangleSize},${triangleY + triangleSize}" fill="green" />`;
                if (cell.qg.nbMort > 0) {
                    let blackTriangleX = x + cellSize / 4; // Ajuster la position du triangle noir à droite du nombre de morts
                    let blackTriangleY = y + cellSize / 4;
                    svgContent += `<text x="${x}" y="${y + cellSize / 4}" font-size="${cellSize / 4}" text-anchor="middle" fill="black">${cell.qg.nbMort}</text>`;
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
    let robotColor = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink']; // Palette de couleurs pour les robots

    let mid = Math.floor(taille / 2); // Positionner les robots au centre de la grille

    for (let i = 0; i < count; i++) {
        let color = robotColor[i % robotColor.length]; // Choisir une couleur de robot
        let robot = { x: mid, y: mid, id: generateRandomId(), color: color, hasSurvivor: false, stopped: false }; // Créer un robot avec ses attributs

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

// Fonction pour envoyer les informations de survivants au QG
function sendInformation(city) {
    let mid = Math.floor(city.length / 2); // Récupérer la position du QG
    if (city[mid][mid].qg) { // Si un QG existe
        city[mid][mid].qg.nbSurvivants += 1; // Ajouter un survivant au QG
    }
}
function sendDeathInformation(city) {
    let mid = Math.floor(city.length / 2);
    if (city[mid][mid].qg) {
        city[mid][mid].qg.nbMort += 1;
    }
}
function checkSurvivorDeath(city, x, y) { // Vérifier si un survivant est mort
    if (city[x][y].survivant.present && city[x][y].fire) {
        setTimeout(() => {
            if (city[x][y].survivant.present && city[x][y].fire) {
                city[x][y].survivant.mort = true; // Marquer le survivant comme mort
                console.log(`Survivant à (${x}, ${y}) est mort.`);
            }
        }, 1000); // Vérifier après 1 seconde
    }
}
function diffuseRetourQG(city, taille) {
    const mid = Math.floor(taille / 2);
    const directions = [
        { dx: 0, dy: -1 }, // Haut
        { dx: 0, dy: 1 },  // Bas
        { dx: -1, dy: 0 }, // Gauche
        { dx: 1, dy: 0 },  // Droite
        { dx: -1, dy: -1 }, // Haut-Gauche
        { dx: 1, dy: -1 },  // Haut-Droite
        { dx: -1, dy: 1 },  // Bas-Gauche
        { dx: 1, dy: 1 }    // Bas-Droite
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

// Fonction pour enlever un cri des cellules adjacentes dès qu'un survivant est sauvé
function removeCriSurvivants(city, x, y, taille) {
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
            city[newX][newY].cri = null; // Enlever la référence au survivant
        }
    });
}

// Fonction pour ajouter un cri aux cellules adjacentes
function addCriSurvivants(city, x, y, taille) {
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
            city[newX][newY].cri = { x, y }; // Ajouter une référence au survivant
        }
    });
}

// Fonction pour déplacer un robot à une position voisine
function moveRobot(city, robot, taille) {
    if (robot.stopped) return;  // Arrêter le robot s'il a déjà atteint le QG et que tout les survivants on été sauvés

    let direction;
    if (robot.hasSurvivor) { // Si le robot a un survivant
        direction = getDirectionToQG(city, robot); // Trouver la direction vers le QG
    } else if (city[robot.x][robot.y].cri) { // Si un cri est entendu
        let cri = city[robot.x][robot.y].cri; // Récupérer la position du survivant
        direction = { // Trouver la direction vers le survivant
            dx: Math.sign(cri.x - robot.x),
            dy: Math.sign(cri.y - robot.y)
        };
    } else if (city[robot.x][robot.y].messageRetourQG) { // Si un message est entendu
        direction = getDirectionToQG(city, robot); // Trouver la direction vers le QG
    } else { // Si aucune information n'est disponible
        const directions = [
            { dx: 0, dy: -1 }, // Haut
            { dx: 0, dy: 1 },  // Bas
            { dx: -1, dy: 0 }, // Gauche
            { dx: 1, dy: 0 }   // Droite
        ];
        direction = directions[Math.floor(Math.random() * directions.length)]; // Choisir une direction aléatoire
    }

    const newX = robot.x + direction.dx; // Nouvelle position en X
    const newY = robot.y + direction.dy; // Nouvelle position en Y

    if (newX >= 0 && newX < taille && newY >= 0 && newY < taille) { // Vérifier si la nouvelle position est valide
        // Mettre à jour la position du robot dans la grille
        city[robot.x][robot.y].robots = city[robot.x][robot.y].robots.filter(r => r.id !== robot.id); // Retirer le robot de la cellule actuelle

        robot.x = newX;
        robot.y = newY;

        city[newX][newY].robots.push(robot); // Ajouter le robot à la nouvelle position

        // Gérer les actions a un survivant et est au QG
        if (robot.hasSurvivor && city[newX][newY].qg) {
            robot.hasSurvivor = false; // Déposer le survivant au QG
            if (city[newX][newY].qg && (city[newX][newY].qg.nbSurvivants + city[newX][newY].qg.nbMort) === city[newX][newY].qg.nbTotalSurvivants) { // Si le robot a atteint le QG et que tout les survivants ont été détecté
                diffuseRetourQG(city, taille); // Diffuser le message autour du QG
            }
        } else if (!robot.hasSurvivor && city[newX][newY].survivant.present && !city[newX][newY].survivant.mort) {
            robot.hasSurvivor = true; // Ramasser le survivant
            sendInformation(city); // Envoyer l'information au QG
            city[newX][newY].survivant.present = false; // Retirer le survivant de la cellule
            removeCriSurvivants(city, newX, newY, taille); // Enlever les cris

        } else if (city[newX][newY].survivant.mort) { // Si le robot rencontre un survivant mort
            sendDeathInformation(city); // Envoyer l'information au QG 
            removeCriSurvivants(city, newX, newY, taille); // Enlever les cris pour plus que le robot ne se déplace vers un survivant mort
            city[newX][newY].survivant.present = false; // Retirer le survivant de la cellule
            city[newX][newY].survivant.mort = false; // Retirer le survivant mort de la cellule
        }

        if (city[newX][newY].qg && city[newX][newY].qg.nbSurvivants + city[newX][newY].qg.nbMort === city[newX][newY].qg.nbTotalSurvivants) { // Si le robot a atteint le QG et que tout les survivants ont été sauvés
            robot.stopped = true;
        }
    }
}

// Fonction pour démarrer le mouvement des robots
function startRobotMovement(robots, city, taille, intervalId, grid, cellSize, robotSpeed) {
    if (intervalId) {
        clearInterval(intervalId); // Si un mouvement est déjà en cours, le nettoyer
    }

    // Créer un nouvel intervalle pour le mouvement des robots
    intervalId = setInterval(() => {
        robots.forEach(robot => {
            moveRobot(city, robot, taille); // Déplacer chaque robot
        });
        let svgContent = updateGrid(city, taille, cellSize, robots); // Mettre à jour la grille SVG
        grid.innerHTML = svgContent; // Afficher la grille mise à jour
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
    ];

    directions.forEach(([dx, dy]) => {
        const nx = x + dx;
        const ny = y + dy;

        if (nx >= 0 && nx < taille && ny >= 0 && ny < taille && !city[nx][ny].fire && !city[nx][ny].qg) {
            // await sleep(2000); // Délai de propagation en ms 
            startFire(city, nx, ny);
        }
    });

    let svgContent = updateGrid(city, taille, cellSize, robots); // Mettre à jour la grille SVG
    grid.innerHTML = svgContent; // Afficher la grille mise à jour
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

function startFirePropagation(city, taille, grid, cellSize, firePropagationIntervalId) {
    if (firePropagationIntervalId) {
        clearInterval(firePropagationIntervalId); // Nettoyer le précédent intervalle
    }

    firePropagationIntervalId = setInterval(() => {
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
        });
    }, 100); // Propage le feu à chaque itération

    return firePropagationIntervalId;
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
    let firePropagationIntervalId;
    let robotSpeed = 500; // Vitesse des robots en millisecondes
    let survivorCount = 10; // Nombre initial de survivants
    let totalSurvivants = 0;  // Nombre total de survivants
    let totalHumans = 0;  // Nombre total d'humains
    let totalHumansInDanger = 0;  // Nombre d'humains en danger

    // ================================================================
    // ÉLÉMENTS DU DOM (Interface utilisateur)
    // ================================================================
    const grid = document.getElementById('grid'); // Grille où les robots seront affichés
    const addRobotButton = document.getElementById('addRobot'); // Bouton pour ajouter un robot
    const removeRobotButton = document.getElementById('removeRobot'); // Bouton pour supprimer un robot
    const robotCountDisplay = document.getElementById('robotCount'); // Affichage du nombre de robots
    const robotSpeedInput = document.getElementById('robotSpeedPara'); // Entrée pour ajuster la vitesse des robots
    const survivorCountInput = document.getElementById('survivorCountInput'); // Entrée pour ajuster le nombre de survivants
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

    // Modifier le nombre de survivants via l'interface
    survivorCountInput.addEventListener('input', function (e) {
        survivorCount = parseInt(e.target.value); // Lire la nouvelle valeur de survivant
        city = initGrid(new Array(taille), taille, survivorCount); // Réinitialiser la grille avec le nouveau nombre de survivants
        robots = placeRobots(city, taille, robotCount); // Réinitialiser les robots
        let svgContent = updateGrid(city, taille, cellSize, robots); // Mettre à jour la grille SVG
        grid.innerHTML = svgContent; // Afficher la grille mise à jour
    });

    // Mettre à jour le compteur de robots
    const updateRobotCount = () => {
        robotCountDisplay.textContent = `Total robots : ${robots.length}`; // Afficher le nombre de robots
    };

    const updateHumansCount = () => {
        // Réinitialiser les compteurs avant de les mettre à jour
        totalHumans = 0;
        totalHumansInDanger = 0;
        totalSurvivants = 0;
        // Parcours de la grille pour mettre à jour les comptages
        for (let i = 0; i < taille; i++) {
            for (let j = 0; j < taille; j++) {
                let cell = city[i][j];
                if (cell.survivant) {
                    totalHumans++;  // On compte les humains
                    if (cell.fire) {
                        totalHumansInDanger++;  // Si un humain est dans une case avec un incendie, il est en danger
                    }
                    if (cell.qg) {
                        totalSurvivants += cell.qg.nbSurvivants; // Si un humain est au qg, il est sauvé et devient un survivant
                    }
                }
            }
        }
        humansCountDisplay.textContent = `Total humains : ${totalHumans}`;
        survivantsCountDisplay.textContent = `Humains sauvés : ${totalSurvivants}`;
        humansInDangerDisplay.textContent = `Humains en danger : ${totalHumansInDanger}`;
    }

    // Ajouter un survivant
    document.getElementById('addHuman').addEventListener('click', () => {
        // Appel de placeSurvivant pour ajouter un survivant à la grille
        placeSurvivants(city, taille, 1);
        updateHumansCount();
    });

    // Ajouter un robot
    addRobotButton.addEventListener('click', () => {
        if (robotCount < taille * taille) { // Limite le nombre de robots en fonction de la taille de la grille
            robotCount++;
            let mid = Math.floor(taille / 2); // Placer le robot au centre de la grille
            let color = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink'][robotCount % 7]; // Assigner une couleur au robot
            let robot = { x: mid, y: mid, id: generateRandomId(), color: color, hasSurvivor: false }; // Créer un robot

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
    initGrid(city, taille, survivorCount);

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
    updateHumansCount();

    // Ajouter un délai de 2 secondes avant de démarrer un incendie
    // await sleep(2000);

    // Allumer un feu à une position aléatoire et mettre à jour la grille
    // let x = Math.floor(Math.random() * taille);  // Choisir une position aléatoire X
    // let y = Math.floor(Math.random() * taille);  // Choisir une position aléatoire Y
    // startFire(city, x, y);  // Démarrer un incendie à la position (x, y)
    // startMultipleFires(city, 25); // Démarrer plusieurs incendies aléatoires

    

    // Démarrer les les robots après avoir cliqué sur le bouton de démarrage
    startSimulation.addEventListener('click', () => {
        intervalId = startRobotMovement(robots, city, taille, intervalId, grid, cellSize, robotSpeed);
        firePropagationIntervalId = startFirePropagation(city,taille,grid,cellSize,firePropagationIntervalId);
    });

    updateHumansCount();

});

document.addEventListener('DOMContentLoaded', () => {
const grid = document.getElementById('grid'); // Grille où les robots seront affichés
const allRects = document.querySelectorAll('rect'); // Balises <rect> dans le DOM

// Démarrer un feu 
allRects.forEach((rect) => {
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