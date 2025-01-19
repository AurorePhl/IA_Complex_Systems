// ================================================================
// TITRE : Web Worker qui gère le mouvement des robots
// DATE : 20/01/2025
// AUTEURES : DURET Laura et PHILIPPE Aurore
// ================================================================

self.onmessage = function (event) {
    const { city, robots, taille } = event.data;
    const updatedRobots = robots.map(robot => moveRobot(city, robot, taille));
    self.postMessage(updatedRobots); // Retourner les robots mis à jour
};

function moveRobot(city, robot, taille) {
    // Logique de déplacement des robots
    robot.position.x = Math.min(taille - 1, robot.position.x + 1); // Exemple : déplacement simple à droite
    robot.position.y = Math.min(taille - 1, robot.position.y + 1); // Exemple : déplacement en diagonale
    return robot;
}
