/* =========================================================================
   PANNEAU DE DONNEES — bouton de reduction (reste visible, juste replie)
   ========================================================================= */

const readoutToggle = document.getElementById('readout-toggle');
const readoutRows = document.getElementById('readout-rows');

readoutToggle.addEventListener('click', () => {
  const expanded = readoutToggle.getAttribute('aria-expanded') === 'true';
  readoutToggle.setAttribute('aria-expanded', String(!expanded));
  readoutRows.classList.toggle('collapsed', expanded);
});