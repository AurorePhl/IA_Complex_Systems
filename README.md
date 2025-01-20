# IA_Complex_Systems
## Système d’Exploration Autonome par Robots d’Essaim pour la Gestion d’Incendies
Date : 20/01/2025  
Auteures : DURET Laura et PHILIPPE Aurore

---

### Lancement d'une simulation
**Paramètres par défaut :**  
- **Nombre de robots :** 7  
- **Nombre d'humains :** 10
- **Vitesse des robots :** 0,5 seconde par déplacement    
- **Vitesse de propagation des incendies aux cases voisines :** 10 secondes  

**Instructions :**  
Sélectionnez une ou plusieurs cellules cliquables pour définir les emplacements de départ de feu avant de lancer la simulation.    

---

### Caractéristiques des robots
- **Indépendance :** Chaque robot fonctionne de manière autonome.  
- **Contrôle décentralisé et distribué :** Les robots ne dépendent pas d'un contrôle centralisé.  
- **Communication directe :** Les robots transmettent des informations au quartier général à distance.  
- **Interactions locales :** Les robots interagissent avec l'environnement immédiat pour adapter leur comportement.  

---

### Comportement pseudo-parallèle
- **Chargement initial :** Une fonction asynchrone est déclenchée lors du chargement de la simulation.  
- **Exécution des tâches :** Les actions (déplacement, sauvetage, gestion d'incendies) sont réalisées à l'aide d'opérations asynchrones (`setTimeout` et `setInterval`).  

---

### Observations

#### Auto-organisation
Les robots adoptent des rôles spécifiques en fonction des besoins :  
- **Explorateur :** Exploration aléatoire de la ville. 
- **Explorateur-Sauveur :** Priorité donnée au sauvetage des humains tout en explorant.  
- **Explorateur-Pompier :** Priorité donnée à la gestion des incendies tout en explorant.   

#### Comportements émergents
- Les robots élaborent une stratégie d'**exploration étendue**, évitant généralement de se croiser entre eux.  
- Une tendance naturelle émerge pour explorer en priorité les cellules les plus fréquentées.  

#### Limites 
**Surcharge observée :** Les robots ont tendance à se regrouper au quartier général lorsque l'incendie prend trop d'ampleur.  

---

### Scénarios de simulation

#### 1. Monotâche (Sauvetage des humains uniquement)
**Paramètres :**  
- Utilisation des paramètres par défaut.  

**Déroulement :**  
1. **Départ :** Exploration aléatoire.  
2. **Émergence :** Les robots adoptent une stratégie d’exploration étendue.  
3. **Fin :** Retour des robots au quartier général après le sauvetage des humains.  

**Performance :**  
- **Temps d'exécution :** Environ 2 minutes.  
- **Taux de sauvetage des humains :** 100%.  

#### 2. Multitâche (Sauvetage des humains et gestion des incendies)
**Paramètres :**  
- Utilisation des paramètres par défaut.  
- Ajout d’un départ de feu au lancement.  

**Déroulement :**  
1. **Départ :** Exploration aléatoire.  
2. **Émergence :** Une stratégie d’exploration étendue apparaît.  
3. **Évolution des rôles :** Spécialisation des robots en fonction de l'ampleur des incendies.  
   - Début de départ de feu : Explorateur simple.  
   - Incendie peu étendu : Explorateur-Sauveur.  
   - Incendie moyennement étendu : Explorateur-Sauveur-Pompier.   
   - Incendie très étendu : Explorateur-Pompier.  
4. **Fin :** Surcharge des robots au quartier général.  

**Performance :**  
- **Temps d'exécution :** Environ 2 minutes.  
- **Taux de sauvetage des humains :** Variable selon la configuration initiale (souvent 70 % ou moins).  
