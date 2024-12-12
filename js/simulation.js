// Initialisation de la grille de la ville  
let taille = 10;

let city = new Array(taille);

for (var i = 0; i < taille; i++) {
    city[i]=new Array(taille);
    for (var j = 0; j < taille; j++) {
        city[i][j] = false;
    }
}

let cellSize = 20; 
let svgContent = ''; 

for (let i = 0; i < taille; i++) { 
    for (let j = 0; j < taille; j++) { 
        let color = city[i][j] ? "black" : "white"; 
        svgContent += `<rect x="${j * cellSize}" y="${i * cellSize}" width="${cellSize}" height="${cellSize}" fill="${color}" stroke="black" />`; 
    } 
} 


document.addEventListener('DOMContentLoaded', function () {
    const grid = document.getElementById('grid');

    // Définir la largeur et la hauteur de l'élément SVG
    grid.setAttribute('width', taille * cellSize);
    grid.setAttribute('height', taille * cellSize);

    // Ajouter le contenu SVG
    grid.innerHTML = svgContent;
});

