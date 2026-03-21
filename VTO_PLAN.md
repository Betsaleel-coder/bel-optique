# Plan d'Implémentation - Essayage Virtuel (VTO) & Mesure d'Écart Pupillaire (EP)

Ce document détaille les étapes pour finaliser l'expérience d'essayage virtuel (**Virtual Try-On**) pour Bel'Optique, incluant la précision des mesures et le rendu 3D réaliste.

## 🏁 Phase 1 : Consolidation technique (En cours)
- [x] Configuration de **MediaPipe Face Mesh** pour le tracking facial.
- [x] Mise en place de **React Three Fiber** pour le rendu 3D.
- [x] Composant `ARScene` de base pour le positionnement des lunettes.
- [x] Intégration dans la page `VirtualTryOn.tsx`.

## 📐 Phase 2 : Précision des Mesures (Écart Pupillaire - EP)
L'objectif est de passer d'une estimation arbitraire à une mesure précise utilisable par les opticiens.

- [x] **Calibration par Objet de Référence (Carte)** :
  - [x] Ajout d'une étape de calibration avec un rectangle d'alignement (format carte standard 85.6mm).
- [x] **Calcul de l'EP** :
  - [x] Utilisation des centres des iris (points 468, 473) et application du ratio de calibration.
- [x] **Validation UI** :
  - [x] Nouvelle interface de calibration et affichage de la mesure en mm.

## 🕶️ Phase 3 : Réalisme du Rendu 3D (Asset Pipeline)
Remplacer les modèles de démonstration (cubes) par de vraies montures.

- [x] **Chargement de Modèles GLTF/GLB** :
  - [x] Ajout de la colonne `model_3d_url` dans la base de données.
  - [x] Support du chargement dynamique via `useGLTF`.
- [x] **Matériaux et Éclairage** :
  - [x] Utilisation de matériaux PBR réalistes (métal, verre, acétate).
  - [x] Configuration d'un environnement "Studio" pour des reflets premium.
- [x] **Auto-Scaling Logic** :
  - [x] Calcul du scale basé sur la distance entre les tempes (points 127 et 356) pour une adaptation parfaite au visage.

## 📱 Phase 4 : Optimisation et Partage
- [x] **Performance Mobile** :
  - [x] Détection automatique du support (mobile/desktop).
  - [x] Ajustement de la résolution de la caméra (640x480 sur mobile) pour fluidifier le tracking.
- [x] **Capture et Partage** :
  - [x] Bouton de capture avec effet "Flash" visuel.
  - [x] Algorithme de fusion (Merge) du flux vidéo et du canvas 3D vers une image JPEG.
  - [x] Prévisualisation de la capture avant envoi.
  - [x] Bouton WhatsApp générant un message complet avec le modèle choisi et l'EP mesuré.

## 🛠️ Prochaines étapes immédiates
1. Charger un vrai modèle 3D de lunettes dans `ARScene.tsx`.
2. Implémenter l'algorithme de mesure d'EP avec calibration.
3. Affiner l'UI pour guider l'utilisateur durant la prise de mesure.
