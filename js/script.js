/* ==========================================================================
   Daviculture – script commun à toutes les pages
   Chaque bloc vérifie que ses éléments existent : le même fichier peut donc
   être chargé sur toutes les pages, même celles sans horaires.
   ========================================================================== */

(function () {
  'use strict';

  /* ---------- 1. Menu mobile (burger) ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('menu-principal');

  if (toggle && nav) {
    var label = toggle.querySelector('.visually-hidden');

    function setMenu(open) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      nav.classList.toggle('is-open', open);
      if (label) {
        label.textContent = open ? 'Fermer le menu' : 'Ouvrir le menu';
      }
    }

    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });

    // Fermer le menu après un clic sur un lien (utile pour les ancres)
    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) {
        setMenu(false);
      }
    });

    // Fermer le menu avec la touche Échap
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        setMenu(false);
        toggle.focus();
      }
    });
  }

  /* ---------- 2. Année en cours dans le pied de page ---------- */
  var annee = document.getElementById('annee');
  if (annee) {
    annee.textContent = new Date().getFullYear();
  }

  /* ---------- 3. Mise en évidence du jour d'ouverture actuel ---------- */
  // Chaque ligne d'horaire porte data-days="1,2,3" (0 = dimanche … 6 = samedi)
  var aujourdhui = String(new Date().getDay());
  var lignes = document.querySelectorAll('.hours-row[data-days]');

  lignes.forEach(function (ligne) {
    var jours = ligne.getAttribute('data-days').split(',');
    if (jours.indexOf(aujourdhui) !== -1) {
      ligne.classList.add('is-today');
    }
  });

  /* ---------- 4. Carrousels d'images (code générique pour toutes les cartes) ---------- */
  // Structure HTML attendue :
  // <div class="carousel" data-carousel aria-label="Photos : …">
  //   <div class="carousel-track">
  //     <figure class="carousel-slide"><img …></figure> (au moins 2)
  //   </div>
  // </div>
  // Le script ajoute les flèches, les points et l'annonce pour lecteurs d'écran.
  // Le swipe repose sur le défilement natif (scroll-snap) : il marche même sans JS.
  var animationsReduites = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function creerBouton(classe, label, contenu) {
    var bouton = document.createElement('button');
    bouton.type = 'button';
    bouton.className = classe;
    bouton.setAttribute('aria-label', label);
    if (contenu) {
      bouton.innerHTML = '<span aria-hidden="true">' + contenu + '</span>';
    }
    return bouton;
  }

  document.querySelectorAll('[data-carousel]').forEach(function (carousel) {
    var piste = carousel.querySelector('.carousel-track');
    var slides = piste ? piste.querySelectorAll('.carousel-slide') : [];
    var total = slides.length;
    if (total < 2) {
      return; // une seule image : pas de contrôles
    }

    var courant = 0;
    carousel.classList.add('is-ready');
    carousel.setAttribute('role', 'region');
    carousel.setAttribute('aria-roledescription', 'carrousel');

    var precedent = creerBouton('carousel-btn carousel-prev', 'Photo précédente', '&#8249;');
    var suivant = creerBouton('carousel-btn carousel-next', 'Photo suivante', '&#8250;');

    var zonePoints = document.createElement('div');
    zonePoints.className = 'carousel-dots';
    var points = [];

    slides.forEach(function (slide, i) {
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-roledescription', 'photo');
      slide.setAttribute('aria-label', (i + 1) + ' sur ' + total);

      var point = creerBouton('carousel-dot', 'Afficher la photo ' + (i + 1) + ' sur ' + total);
      point.addEventListener('click', function () {
        allerA(i);
      });
      zonePoints.appendChild(point);
      points.push(point);
    });

    // Annonce discrète du changement de photo pour les lecteurs d'écran
    var annonce = document.createElement('p');
    annonce.className = 'visually-hidden';
    annonce.setAttribute('aria-live', 'polite');

    carousel.appendChild(precedent);
    carousel.appendChild(suivant);
    carousel.appendChild(zonePoints);
    carousel.appendChild(annonce);

    // Met à jour les points, masque les photos non visibles et annonce la position
    function majEtat(annoncer) {
      points.forEach(function (point, i) {
        point.setAttribute('aria-current', i === courant ? 'true' : 'false');
      });
      slides.forEach(function (slide, i) {
        slide.setAttribute('aria-hidden', i === courant ? 'false' : 'true');
      });
      if (annoncer) {
        annonce.textContent = 'Photo ' + (courant + 1) + ' sur ' + total;
      }
    }

    // Va à la photo i (boucle : après la dernière, retour à la première)
    function allerA(i) {
      courant = (i + total) % total;
      piste.scrollTo({
        left: courant * piste.clientWidth,
        behavior: animationsReduites ? 'auto' : 'smooth'
      });
      majEtat(true);
    }

    precedent.addEventListener('click', function () {
      allerA(courant - 1);
    });
    suivant.addEventListener('click', function () {
      allerA(courant + 1);
    });

    // Swipe : quand le défilement s'arrête, on recalcule la photo affichée
    var minuterie;
    piste.addEventListener('scroll', function () {
      clearTimeout(minuterie);
      minuterie = setTimeout(function () {
        var i = Math.round(piste.scrollLeft / piste.clientWidth);
        if (i !== courant) {
          courant = i;
          majEtat(true);
        }
      }, 120);
    });

    // Clavier : flèches gauche/droite quand le focus est dans le carrousel
    carousel.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        allerA(courant - 1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        allerA(courant + 1);
      }
    });

    // Garder la bonne photo cadrée si la largeur change (rotation du téléphone)
    window.addEventListener('resize', function () {
      piste.scrollLeft = courant * piste.clientWidth;
    });

    majEtat(false);
  });
})();
