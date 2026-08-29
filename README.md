# Relève — v1 (squelette)

Outil de transmissions entre infirmiers libéraux d'un **cabinet unique**. Souverain, chiffré, hors-ligne. Aucune donnée ne quitte l'appareil, sauf par un **export chiffré volontaire** partagé entre soignants.

## Ce que fait ce squelette

- **Coffre chiffré** — une phrase secrète du cabinet déverrouille tout (PBKDF2 → AES-GCM, WebCrypto). Les données sont chiffrées au repos dans le navigateur (IndexedDB).
- **Patients** — fiche complète : identité, adresse, code porte, contact famille, pathologies, soins, notes, et **alertes** (Critique / Précaution / Info).
- **Transmissions** — journal horodaté et signé par patient, en ajout continu (on n'écrase pas la mémoire). Texte **et mémos vocaux** (enregistrés dans le navigateur, chiffrés eux aussi).
- **Tournée & planning** — une tournée par date, arrêts ordonnés (le « fil »), réordonnables.
- **Carte** — les arrêts du jour sur une carte, reliés dans l'ordre.
- **Partage (palier A)** — export/import d'un **bundle chiffré** (`.releve`) entre collègues, avec la même phrase secrète.

## Déployer sur GitHub Pages

1. Crée un dépôt et dépose ces fichiers à la racine (`index.html`, `manifest.webmanifest`, `sw.js`, les deux `icon-*.png`).
2. **Settings → Pages** → source : branche `main`, dossier `/root`.
3. Ouvre l'URL `https://<toi>.github.io/<repo>/`. Sur mobile : « Ajouter à l'écran d'accueil » pour l'installer comme application.

> Le site **doit** être servi en HTTPS (ce que fait GitHub Pages) pour que le chiffrement, le micro et le hors-ligne fonctionnent. En ouverture directe d'un fichier (`file://`), plusieurs de ces fonctions sont bloquées par le navigateur — c'est normal.

## Premier usage

À la première ouverture, tu **crées** la phrase secrète du cabinet. Tous les soignants du cabinet utilisent **la même phrase** — c'est elle qui rend les bundles interchangeables entre vos appareils. Note-la ailleurs : **sans elle, les données sont irrécupérables** (personne, pas même l'hébergeur, ne peut les déchiffrer). C'est le prix de la souveraineté.

## Seuils honnêtes de cette v1

- **Ce n'est pas le dossier de soins réglementaire.** Relève remplace le groupe WhatsApp, pas le dossier légal.
- **Partage manuel.** Palier A : on s'échange des bundles. La **synchro chiffrée automatique** (palier B) — roster partagé vivant, sans jamais confier de clair à l'hébergeur — est le chantier suivant.
- **Coordonnées carte à la main.** On saisit lat/lng dans la fiche. Le **géocodage depuis l'adresse** (sans exposer l'adresse à un tiers) viendra ensuite.
- **Tuiles de carte en ligne.** Le seul élément qui exige du réseau ; le reste marche hors-ligne. Des **tuiles hors-ligne** pour le Cap Sizun sont un item identifié.
- **Gestion de clé simple.** Une phrase partagée. La **rotation de clé** (quand quelqu'un quitte le cabinet) reste à outiller.
- **Sauvegarde.** Local uniquement pour l'instant : un appareil perdu = données perdues. Exporte un bundle régulièrement en attendant le palier B. C'est précisément ce qui justifie B.

## Pile

HTML/CSS/JS statique · WebCrypto · IndexedDB · MediaRecorder · Leaflet (seule dépendance externe). Rien à compiler.
