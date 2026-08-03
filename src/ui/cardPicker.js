/**
 * בחירת כרטיס בדף הכרטיסים —
 * מציג רק את הכרטיס שנבחר, בלי גלילה בין כולם.
 */

/**
 * מחליף את הכרטיס המוצג לפי מזהה.
 * @param {string} cardId
 */
function selectCard(cardId) {
  const panels = document.querySelectorAll('[data-card-panel]');
  const options = document.querySelectorAll('[data-select-card]');

  panels.forEach((panel) => {
    const isMatch = panel.getAttribute('data-card-panel') === cardId;
    panel.hidden = !isMatch;
  });

  options.forEach((option) => {
    const isMatch = option.getAttribute('data-select-card') === cardId;
    option.classList.toggle('is-selected', isMatch);
    option.setAttribute('aria-selected', String(isMatch));
  });
}

/**
 * מחבר את כפתורי בחירת הכרטיס.
 */
export function bindCardPicker() {
  const options = document.querySelectorAll('[data-select-card]');

  if (options.length === 0) {
    return;
  }

  options.forEach((option) => {
    option.addEventListener('click', () => {
      const cardId = option.getAttribute('data-select-card');

      if (cardId) {
        selectCard(cardId);
      }
    });
  });
}
