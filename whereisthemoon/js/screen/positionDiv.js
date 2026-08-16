/* =========================================================================
   PANNEAU "MA POSITION" — ville, heure solaire locale, visibilite de la
   Lune, prochaine eclipse solaire
   ========================================================================= */
const locationToggle = document.getElementById('location-toggle');
const locationBody = document.getElementById('location-body');

locationToggle.addEventListener('click', () => {
  const expanded = locationToggle.getAttribute('aria-expanded') === 'true';
  locationToggle.setAttribute('aria-expanded', String(!expanded));
  locationBody.classList.toggle('open', !expanded);
});