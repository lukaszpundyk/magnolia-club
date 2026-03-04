/**
 * Magnolia Club — Tour Filters (Client-side instant filtering)
 */
document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.tour-card');
  const transportBtns = document.querySelectorAll('[data-filter-transport]');
  const daysBtns = document.querySelectorAll('[data-filter-days]');
  const destinationSelect = document.getElementById('filter-destination');
  const priceRange = document.getElementById('filter-price');
  const priceValue = document.getElementById('price-value');
  const noResults = document.getElementById('no-results');
  const resultsCount = document.getElementById('results-count');

  let filters = {
    transport: 'all',
    days: 'all',
    destination: 'all',
    maxPrice: priceRange ? parseFloat(priceRange.max) : Infinity
  };

  function applyFilters() {
    let visibleCount = 0;

    cards.forEach(card => {
      const cardTransport = card.dataset.transport;
      const cardDays = parseInt(card.dataset.days);
      const cardDestination = card.dataset.destination;
      const cardPrice = parseFloat(card.dataset.price);

      let show = true;

      // Transport filter
      if (filters.transport !== 'all' && cardTransport !== filters.transport) {
        show = false;
      }

      // Days filter
      if (filters.days !== 'all') {
        if (filters.days === '1' && cardDays !== 1) show = false;
        else if (filters.days === '2-3' && (cardDays < 2 || cardDays > 3)) show = false;
        else if (filters.days === '4-7' && (cardDays < 4 || cardDays > 7)) show = false;
        else if (filters.days === '8+' && cardDays < 8) show = false;
      }

      // Destination filter
      if (filters.destination !== 'all' && cardDestination !== filters.destination) {
        show = false;
      }

      // Price filter
      if (cardPrice > filters.maxPrice) {
        show = false;
      }

      card.style.display = show ? '' : 'none';
      if (show) visibleCount++;
    });

    // Update UI
    if (noResults) {
      noResults.style.display = visibleCount === 0 ? '' : 'none';
    }
    if (resultsCount) {
      resultsCount.textContent = visibleCount;
    }
  }

  function setActiveBtn(group, activeValue) {
    group.forEach(btn => {
      const value = btn.dataset.filterTransport || btn.dataset.filterDays;
      if (value === activeValue) {
        btn.classList.add('bg-mc-accent', 'text-mc-bg');
        btn.classList.remove('bg-mc-dark', 'text-mc-muted');
      } else {
        btn.classList.remove('bg-mc-accent', 'text-mc-bg');
        btn.classList.add('bg-mc-dark', 'text-mc-muted');
      }
    });
  }

  // Transport filter buttons
  transportBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      filters.transport = btn.dataset.filterTransport;
      setActiveBtn(transportBtns, filters.transport);
      applyFilters();
    });
  });

  // Days filter buttons
  daysBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      filters.days = btn.dataset.filterDays;
      setActiveBtn(daysBtns, filters.days);
      applyFilters();
    });
  });

  // Destination select
  if (destinationSelect) {
    destinationSelect.addEventListener('change', () => {
      filters.destination = destinationSelect.value;
      applyFilters();
    });
  }

  // Price range slider
  if (priceRange) {
    priceRange.addEventListener('input', () => {
      filters.maxPrice = parseFloat(priceRange.value);
      if (priceValue) {
        priceValue.textContent = filters.maxPrice + ' PLN';
      }
      applyFilters();
    });
  }
});
