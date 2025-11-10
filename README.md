# 🎮 REWIND PROTOCOL

**Break the loop - Kill the nazi robots and turn off the TVs**

Un jeu rétro top-down explorant les cycles répétitifs de l'histoire humaine à travers une aventure dans des labyrinthes où un scientifique doit éteindre des télévisions tout en combattant des robots nazis.

---

## 🎯 Objectif du projet

L'objectif principal de ce projet était de **travailler le mode responsive** pour optimiser le contrôle et l'affichage à la fois sur **ordinateur** et sur **mobile**, en créant une expérience de jeu fluide et adaptée à chaque plateforme.

### Fonctionnalités responsive implémentées

#### 🖥️ **Version Desktop**
- Contrôles clavier personnalisables (QSDZ, ZQSD, WASD, Flèches)
- Visée précise à la souris
- Tir au clic ou barre d'espace
- Déplacement manuel de la caméra avec les flèches directionnelles
- Interface HUD optimisée

#### 📱 **Version Mobile**
- Joystick virtuel tactile pour le déplacement (360°)
- Bouton de tir dédié
- Pan caméra avec un doigt (navigation type carte)
- Pinch zoom custom (2 doigts) avec contrôles toujours visibles
- Interface adaptative en unités viewport (vw/vh)
- Détection automatique du mode paysage

---

## 🎮 Gameplay

### Objectif
Éteindre **7 télévisions** par niveau tout en survivant aux vagues de robots nazis.

### Mécaniques
- **3 niveaux** avec difficulté croissante
- **25 robots** spawns au début de chaque niveau
- **4 types différents** de robots nazis avec IA de patrouille/poursuite
- **5 vies** au départ
- **Munitions infinies**
- Score basé sur robots tués (100 pts) et TVs éteintes (500 pts)

### Contrôles Desktop
- **Déplacement** : QSDZ / ZQSD / WASD / Flèches (configurable)
- **Visée** : Souris
- **Tir** : Clic gauche ou Barre d'espace
- **Caméra** : Flèches directionnelles
- **Pause** : Échap ou P

### Contrôles Mobile
- **Déplacement** : Joystick virtuel (bas gauche)
- **Tir** : Bouton tactile (bas droite)
- **Caméra** : Glisser un doigt sur l'écran
- **Zoom** : Pinch avec deux doigts
- **Pause** : Bouton coin supérieur droit

---

## 🛠️ Technologies utilisées

- **HTML5 Canvas** pour le rendu graphique
- **Vanilla JavaScript** (architecture orientée objet)
- **Web Audio API** pour la musique et effets sonores synthétiques
- **CSS3** avec animations et effets rétro
- **LocalStorage** pour sauvegarde paramètres et leaderboard

---

## 📁 Structure du projet

/rewind-protocol
├── index.html          # Landing page
├── game.html           # Jeu
├── styles.css          # Styles globaux
├── game.css            # Styles spécifiques au jeu
├── main.js             # Navigation, menus
├── game.js             # Logique du jeu
└── assets/             # Images (sprites, explosions)
├── scientist_right.png
├── scientist_left.png
├── nazi_robot_right_1.png
├── nazi_robot_left_1.png
└── explosion_1.png → explosion_5.png

---

## 🚀 Installation & Lancement

1. Cloner le repository
2. Placer les assets dans le dossier `/assets`
3. Ouvrir `index.html` dans un navigateur moderne
4. Ou utiliser un serveur local :
```bash
npx serve

---

## 🎨 Design & Identité visuelle

- **Palette** : Néons bleu/cyan (#00ffff) et rose/magenta (#ff00ff)
- **Typographie** : Share Tech Mono (style terminal rétro)
- **Effets** : Scanlines, glitch effects, ombres néon
- **Thème** : Rétro-futuriste 80s avec ambiance coldwave

---

## 🏆 Fonctionnalités avancées

- Génération procédurale de labyrinthes (chemins largeur 2)
- Système de particules et animations d'explosion
- IA ennemie avec états patrouille/poursuite
- Gestion de caméra intelligente (suivi joueur + contrôle manuel)
- Leaderboard local (top 10)
- Easter eggs (glitch "LOOP", message caché, compteur de morts)
- Système de paramètres persistants

---

## 👨‍💻 Développeur

**Jawed Tahir**  
Développeur Full Stack, Data & Solutions IA

📧 jawed_tahir@yahoo.fr  
🌐 [javed.fr](https://javed.fr)

---

## 📜 Licence

Projet personnel - Tous droits réservés

---

*"L'histoire se répète en boucle... À vous de briser le cycle."*