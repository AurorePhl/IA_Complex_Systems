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
function initGrid(city, taille) {
    // Initialisation des cases de la grille avec des objets représentant des états de cellule
    for (var i = 0; i < taille; i++) {
        city[i] = new Array(taille); // Création d'un tableau pour chaque ligne
        for (var j = 0; j < taille; j++) {
            // Chaque cellule contient un état par défaut
            city[i][j] = {
                fire: false, // Pas de feu initialement
                robots: [], // Liste vide de robots sur la case
                survivant: false, // Pas de survivant sur la case au départ
                qg: null // Pas de QG par défaut
            };
        }
    }

    // Positionner le quartier général (QG) au centre de la grille
    let mid = Math.floor(taille / 2);
    city[mid][mid].qg = {
        nbSurvivants: 0 // Initialisation du nombre de survivants au QG
    };

    // Placement aléatoire des survivants sur la grille
    placeSurvivants(city, taille, 10);

    return city; // Retourner la grille initialisée
}

// Fonction pour placer un certain nombre de survivants de manière aléatoire sur la grille
function placeSurvivants(city, taille, count) {
    while (count > 0) {
        let x = Math.floor(Math.random() * taille); // Coordonnée x aléatoire
        let y = Math.floor(Math.random() * taille); // Coordonnée y aléatoire
        // Vérification si la case n'est pas déjà occupée par un survivant ou un QG
        if (!city[x][y].survivant && !city[x][y].qg) {
            city[x][y].survivant = true; // Placer un survivant
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
            }
            // Dessiner un rectangle représentant la cellule
            svgContent += `<rect x="${j * cellSize}" y="${i * cellSize}" width="${cellSize}" height="${cellSize}" fill="${color}" stroke="black" />`;
            // Dessiner les robots si présents sur la cellule
            if (cell.robots.length > 0) {
                let positions = getRobotPositions(cellSize, cell.robots.length);
                cell.robots.forEach((robot, index) => {
                    let pos = positions[index];
                    svgContent += `<circle cx="${j * cellSize + pos.cx}" cy="${i * cellSize + pos.cy}" r="${cellSize / 8}" fill="${robot.color}" />`;
                });
            }
            // Dessiner les survivants si présents sur la cellule
            if (cell.survivant) {
                let x = j * cellSize + cellSize / 2;
                let y = i * cellSize + cellSize / 2;
                let size = cellSize / 4;
                svgContent += `<polygon points="${x},${y - size} ${x - size},${y + size} ${x + size},${y + size}" fill="green" />`;
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
            }
        }
    }
    return svgContent; // Retourner le contenu SVG mis à jour
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
        let robot = { x: mid, y: mid, id: generateRandomId(), color: color, hasSurvivor: false }; // Créer un robot avec ses attributs

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

// Fonction pour déplacer un robot à une position voisine
function moveRobot(city, robot, taille) {
    const directions = [
        { dx: 0, dy: -1 }, // Haut
        { dx: 0, dy: 1 },  // Bas
        { dx: -1, dy: 0 }, // Gauche
        { dx: 1, dy: 0 }   // Droite
    ];

    let direction; // Direction choisie pour le robot
    if (robot.hasSurvivor) { // Si le robot porte un survivant
        direction = getDirectionToQG(city, robot); // Aller vers le QG
    } else {
        direction = directions[Math.floor(Math.random() * directions.length)]; // Sinon, mouvement aléatoire
    }

    const newX = robot.x + direction.dx; // Nouvelle position en X
    const newY = robot.y + direction.dy; // Nouvelle position en Y

    if (newX >= 0 && newX < taille && newY >= 0 && newY < taille) { // Vérifier si la nouvelle position est valide
        // Mettre à jour la position du robot dans la grille
        city[robot.x][robot.y].robots = city[robot.x][robot.y].robots.filter(r => r.id !== robot.id); // Retirer le robot de la cellule actuelle

        robot.x = newX;
        robot.y = newY;

        city[newX][newY].robots.push(robot); // Ajouter le robot à la nouvelle position

        // Gérer les actions si le robot rencontre un survivant ou le QG
        if (robot.hasSurvivor && city[newX][newY].qg) {
            robot.hasSurvivor = false; // Déposer le survivant au QG
        } else if (!robot.hasSurvivor && city[newX][newY].survivant) {
            robot.hasSurvivor = true; // Ramasser un survivant
            sendInformation(city); // Envoyer l'information au QG
            city[newX][newY].survivant = false; // Retirer le survivant de la cellule
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

// ================================================================
// LANCEMENT DU PROGRAMME 
// ================================================================

// Attendre que la page soit entièrement chargée avant d'exécuter le programme
document.addEventListener('DOMContentLoaded', async function () {
    // ================================================================
    // VARIABLES D'INITIATION
    // ================================================================
    let taille = 15; // Taille de la grille (15x15)
    let cellSize = 50; // Taille de chaque cellule
    let city = new Array(taille); // Initialisation de la grille
    let robotCount = 7; // Nombre initial de robots
    let robots = []; // Liste vide pour les robots
    let intervalId; // ID pour gérer l'intervalle de mouvement des robots
    let robotSpeed = 500; // Vitesse des robots en millisecondes

    // ================================================================
    // ÉLÉMENTS DU DOM (Interface utilisateur)
    // ================================================================
    const grid = document.getElementById('grid'); // Grille où les robots seront affichés
    const addRobotButton = document.getElementById('addRobot'); // Bouton pour ajouter un robot
    const removeRobotButton = document.getElementById('removeRobot'); // Bouton pour supprimer un robot
    const robotCountDisplay = document.getElementById('robotCount'); // Affichage du nombre de robots
    const robotSpeedInput = document.getElementById('robotSpeedPara'); // Entrée pour ajuster la vitesse des robots

    // ================================================================
    // LISTENERS POUR LES ÉVÉNEMENTS
    // ================================================================
    // Modifier la vitesse des robots
    robotSpeedInput.addEventListener('input', function (e) {
        robotSpeed = parseFloat(e.target.value) * 1000; // Convertir la vitesse en millisecondes
        // Réajuster l'intervalle avec la nouvelle vitesse
        intervalId = startRobotMovement(robots, city, taille, intervalId, grid, cellSize, robotSpeed);
    });

    // Mettre à jour le compteur de robots
    const updateRobotCount = () => {
        robotCountDisplay.textContent = `Robots : ${robots.length}`; // Afficher le nombre de robots
    };

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

            intervalId = startRobotMovement(robots, city, taille, intervalId, grid, cellSize, robotSpeed); // Lancer le mouvement des robots
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
                } else {
                    // Si des robots restent, redémarrer l'intervalle pour continuer leur mouvement
                    intervalId = startRobotMovement(robots, city, taille, intervalId, grid, cellSize, robotSpeed);
                }

                // Log des informations pour le débogage
                console.log("Robot supprimé :", robot);
                console.log("Robots restants dans la cellule :", cell.robots);
                console.log("Nombre total de robots :", robots.length);
            }
        }
    });

    // ================================================================
    // PARTIE MAIN DU PROGRAMME
    // ================================================================
    // Initialiser la grille de la ville
    initGrid(city, taille);

    // Placer les robots sur la grille
    robots = placeRobots(city, taille, robotCount);

    // Démarrer le mouvement des robots à intervalles réguliers
    intervalId = startRobotMovement(robots, city, taille, intervalId, grid, cellSize, robotSpeed);

    // Définir les dimensions du SVG pour la grille
    grid.setAttribute('width', taille * cellSize);
    grid.setAttribute('height', taille * cellSize);

    // Mettre à jour la grille avec les robots placés
    let svgContent = updateGrid(city, taille, cellSize, robots);
    grid.innerHTML = svgContent;

    // Mettre à jour le compteur de robots affiché
    updateRobotCount();

    // Ajouter un délai de 2 secondes avant de démarrer un incendie
    await sleep(2000);

    // Allumer un feu à une position aléatoire et mettre à jour la grille
    let x = Math.floor(Math.random() * taille);  // Choisir une position aléatoire X
    let y = Math.floor(Math.random() * taille);  // Choisir une position aléatoire Y
    startFire(city, x, y);  // Démarrer un incendie à la position (x, y)

    // Mettre à jour la grille après avoir allumé le feu
    svgContent = updateGrid(city, taille, cellSize, robots);
    grid.innerHTML = svgContent;  // Afficher la grille mise à jour avec le feu
});
