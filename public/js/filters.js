/**
 * Magnolia Club — Tour Filters
 * Handles filter form submission with preserved query params
 */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('filter-form');
  if (!form) return;

  // Price slider live update
  const priceSlider = document.getElementById('maxPrice');
  const priceDisplay = document.getElementById('price-display');
  if (priceSlider && priceDisplay) {
    priceSlider.addEventListener('input', () => {
      priceDisplay.textContent = priceSlider.value + ' PLN';
    });
    // Submit on mouse/touch release
    priceSlider.addEventListener('change', () => {
      form.submit();
    });
  }
});
