/**
 * Magnolia Club — Image Gallery Lightbox
 */
document.addEventListener('DOMContentLoaded', () => {
  // Create lightbox overlay
  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.innerHTML = `
    <button class="absolute top-4 right-4 text-white text-3xl hover:text-mc-accent transition-colors z-10 w-12 h-12 flex items-center justify-center" id="lightbox-close">&times;</button>
    <button class="absolute left-4 top-1/2 -translate-y-1/2 text-white text-3xl hover:text-mc-accent transition-colors z-10 w-12 h-12 flex items-center justify-center bg-black/50 rounded-full" id="lightbox-prev">&lsaquo;</button>
    <button class="absolute right-4 top-1/2 -translate-y-1/2 text-white text-3xl hover:text-mc-accent transition-colors z-10 w-12 h-12 flex items-center justify-center bg-black/50 rounded-full" id="lightbox-next">&rsaquo;</button>
    <img src="" alt="Gallery image" id="lightbox-img" class="max-w-[90vw] max-h-[85vh] object-contain rounded-lg">
    <div class="absolute bottom-4 text-white text-sm" id="lightbox-counter"></div>
  `;
  document.body.appendChild(overlay);

  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');
  const lightboxCounter = document.getElementById('lightbox-counter');

  let images = [];
  let currentIndex = 0;

  function openLightbox(index) {
    currentIndex = index;
    updateImage();
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  function updateImage() {
    if (images[currentIndex]) {
      lightboxImg.src = images[currentIndex];
      lightboxCounter.textContent = `${currentIndex + 1} / ${images.length}`;
    }
  }

  function nextImage() {
    currentIndex = (currentIndex + 1) % images.length;
    updateImage();
  }

  function prevImage() {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    updateImage();
  }

  // Event listeners
  lightboxClose.addEventListener('click', closeLightbox);
  lightboxNext.addEventListener('click', nextImage);
  lightboxPrev.addEventListener('click', prevImage);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeLightbox();
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
  });

  // Initialize gallery thumbnails
  const galleryItems = document.querySelectorAll('[data-gallery-item]');
  images = Array.from(galleryItems).map(item => item.dataset.galleryItem);

  galleryItems.forEach((item, index) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      openLightbox(index);
    });
    item.style.cursor = 'pointer';
  });
});
