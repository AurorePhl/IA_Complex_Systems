// ================================================================
// TITRE : Web Worker qui gère la propagation des incendies
// DATE : 20/01/2025
// AUTEURES : DURET Laura et PHILIPPE Aurore
// ================================================================

self.onmessage = function (event) {
    const { city, fireCells, taille } = event.data;
    const updatedFireCells = propagateFire(city, fireCells, taille);
    self.postMessage(updatedFireCells); // Retourner les cellules mises à jour
};

function propagateFire(city, fireCells, taille) {
    const newFireCells = [];
    fireCells.forEach(cell => {
        // Exemple : Propagation du feu dans les 4 directions
        const directions = [
            [0, 1], // Droite
            [0, -1], // Gauche
            [1, 0], // Bas
            [-1, 0], // Haut
            [1, 1], // Diagonale Bas-Droite
            [1, -1], // Diagonale Bas-Gauche
            [-1, 1], // Diagonale Haut-Droite
            [-1, -1], // Diagonale Haut-Gauche
        ];
        directions.forEach(([dx, dy]) => {
            const newX = cell.x + dx;
            const newY = cell.y + dy;
            if (newX >= 0 && newX < taille && newY >= 0 && newY < taille && city[newX][newY] === 'empty') {
                city[newX][newY] = 'fire';
                newFireCells.push({ x: newX, y: newY });
            }
        });
    });
    return newFireCells;
}
