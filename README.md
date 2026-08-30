# Relève — v1 (squelette)

Outil de transmissions entre infirmiers libéraux d'un **cabinet unique**. Souverain, chiffré, hors-ligne. Aucune donnée ne quitte l'appareil, sauf par un **export chiffré volontaire** partagé entre soignants.

## Ce que fait ce squelette

- **Coffre chiffré** — une phrase secrète du cabinet déverrouille tout (PBKDF2 → AES-GCM, WebCrypto). Les données sont chiffrées au repos dans le navigateur (IndexedDB).
- **Patients** — fiche complète : identité, adresse, code porte, contact famille, pathologies, soins, notes, et **alertes** (Critique / Précaution / Info).
- **Transmissions** — journal horodaté et signé par patient, en ajout continu (on n'écrase pas la mémoire). Texte **et mémos vocaux** (enregistrés dans le navigateur, chiffrés eux aussi).
- **Tournée & planning** — une tournée par date, arrêts ordonnés (le « fil »), réordonnables.
- **Carte + localisation** — les arrêts du jour sur une carte, reliés dans l'ordre. Pour situer un patient, trois moyens du plus souverain au plus dépannage : **capter la position GPS** de l'appareil sur place (rien n'est envoyé, marche hors-ligne), **poser l'épingle** sur la carte OpenStreetMap, ou **chercher par adresse** via la Base Adresse Nationale.
- **Partage (palier A)** — export/import d'un **bundle chiffré** (`.releve`) entre collègues, avec la même phrase secrète.

## Déployer sur GitHub Pages

1. Crée un dépôt et dépose ces fichiers à la racine (`index.html`, `manifest.webmanifest`, `sw.js`, les deux `icon-*.png`).
2. **Settings → Pages** → source : branche `main`, dossier `/root`.
3. Ouvre l'URL `https://<toi>.github.io/<repo>/`. Sur mobile : « Ajouter à l'écran d'accueil » pour l'installer comme application.

> Le site **doit** être servi en HTTPS (ce que fait GitHub Pages) pour que le chiffrement, le micro et le hors-ligne fonctionnent. En ouverture directe d'un fichier (`file://`), plusieurs de ces fonctions sont bloquées par le navigateur — c'est normal.

## Premier usage

À la première ouverture, tu **crées** la phrase secrète du cabinet. Tous les soignants du cabinet utilisent **la même phrase** — c'est elle qui rend les bundles interchangeables entre vos appareils. Note-la ailleurs : **sans elle, les données sont irrécupérables** (personne, pas même l'hébergeur, ne peut les déchiffrer). C'est le prix de la souveraineté.

## Carte hors-ligne (Protomaps / PMTiles)

Par défaut la carte utilise les tuiles OpenStreetMap en ligne. Pour qu'elle s'affiche **hors-ligne** sur le secteur, on embarque un **seul fichier vecteur** (`bigouden.pmtiles`) hébergé en statique. C'est la voie propre : pas d'aspiration en masse des serveurs OSM (interdite par leur politique), un fichier, aucune dépendance à un serveur de tuiles.

**Étape 1 — produire le fichier (une fois).** Cette étape demande un terminal et une seule commande ; elle ne télécharge que les octets de ton secteur, pas la planète.

1. Récupère le binaire `pmtiles` : https://github.com/protomaps/go-pmtiles/releases (choisis ton OS).
2. Repère le dernier build quotidien sur https://maps.protomaps.com/builds/ (une date `AAAAMMJJ`).
3. Lance, en remplaçant la date par le build du jour :

   ```
   pmtiles extract https://build.protomaps.com/AAAAMMJJ.pmtiles bigouden.pmtiles \
     --bbox=-4.44,47.90,-4.28,48.06 --maxzoom=16
   ```

   La bbox `-4.44,47.90,-4.28,48.06` (ouest, sud, est, nord) couvre Plozévet, Pouldreuzic, Plovan, Peumerit, Landudec, Plogastel-Saint-Germain, Gourlizon, et au nord Mahalon et Guiler-sur-Goyen, avec une marge. Le fichier obtenu fait quelques Mo à ~20 Mo — bien sous la limite GitHub de 100 Mo. Pour l'élargir plus tard : redessine la bbox sur http://bboxfinder.com/.

**Étape 2 — brancher.** Dépose `bigouden.pmtiles` à la racine du repo (via l'interface GitHub), puis dans `index.html` passe `const USE_PMTILES=false;` à `true`. C'est la seule ligne à changer : les deux cartes et le service worker suivent. À la première ouverture en ligne, le fichier est mis en cache entier ; ensuite la carte s'affiche sans réseau.

**Si la carte reste blanche :** c'est presque toujours un décalage de versions entre la librairie et le tileset du build. `protomaps-leaflet@5` attend un build basemap **v4+** (les builds récents le sont). En cas de souci, essaie un build plus récent, ou épingle une autre version majeure de `protomaps-leaflet` dans `index.html` et `sw.js`. Vérifie ton fichier sur https://protomaps.github.io/PMTiles/.



- **Ce n'est pas le dossier de soins réglementaire.** Relève remplace le groupe WhatsApp, pas le dossier légal.
- **Partage manuel.** Palier A : on s'échange des bundles. La **synchro chiffrée automatique** (palier B) — roster partagé vivant, sans jamais confier de clair à l'hébergeur — est le chantier suivant.
- **Localiser un patient (vie privée).** Le moyen principal est le plus simple *et* le plus souverain : **capter la position GPS** sur place, ou **poser l'épingle** à la main sur la carte — dans les deux cas, rien ne sort de l'appareil, et le GPS marche même sans réseau. La **recherche par adresse** (Base Adresse Nationale, `api-adresse.data.gouv.fr`, service public FR, sans clé) n'est qu'un secours pour préparer depuis le cabinet : elle n'envoie **que la chaîne d'adresse** — jamais le nom, la pathologie, ni le fait qu'il s'agit d'un patient. Les coordonnées obtenues sont mises en cache dans la fiche, donc la carte fonctionne ensuite hors-ligne.
- **Carte hors-ligne : mécanisme prêt, fichier à générer.** Le code lit un `bigouden.pmtiles` local et le sert hors-ligne (voir la section dédiée). Tant que ce fichier n'est pas déposé et `USE_PMTILES` activé, la carte utilise les tuiles OSM en ligne. La génération du fichier demande une commande en terminal, une seule fois.
- **Gestion de clé simple.** Une phrase partagée. La **rotation de clé** (quand quelqu'un quitte le cabinet) reste à outiller.
- **Sauvegarde.** Local uniquement pour l'instant : un appareil perdu = données perdues. Exporte un bundle régulièrement en attendant le palier B. C'est précisément ce qui justifie B.

## Pile

HTML/CSS/JS statique · WebCrypto · IndexedDB · MediaRecorder · Leaflet + protomaps-leaflet (carte). Rien à compiler.
