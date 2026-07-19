// Category Filter
function initCategoryFilter() {
    const filter = document.getElementById('categoryFilter') as HTMLSelectElement;
    if (!filter) return;

    filter.addEventListener('change', () => {
        const selected = filter.value;
        document.querySelectorAll<HTMLElement>('.products .product').forEach((product) => {
            if (selected === 'all' || product.dataset.category === selected) {
                product.classList.remove('hide');
                product.style.display = 'flex';
            } else {
                product.classList.add('hide');
                product.style.display = 'none';
            }
        });
    });
}

// Scroll Reveal
function initScrollReveal() {
    const items = document.querySelectorAll('.product, .section-title, .contact');
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('show');
                }
            });
        },
        { threshold: 0.05 }
    );

    items.forEach((item) => observer.observe(item));
}

// Variant Sliders
function initVariantSliders() {
    document.querySelectorAll<HTMLElement>('.variant-product').forEach((el) => {
        const variantsData = el.dataset.variants;
        if (!variantsData) return;

        const variants = JSON.parse(variantsData);
        let currentIndex = 0;

        

        const img = el.querySelector<HTMLImageElement>('.slider-image');
        const colorLabel = el.querySelector('.variant-color-label');
        const dots = el.querySelectorAll<HTMLElement>('.variant-dot');
        const prevBtn = el.querySelector('.variant-nav.prev');
        const nextBtn = el.querySelector('.variant-nav.next');

        function update() {
            const variant = variants[currentIndex];
            if (img) {
                img.style.opacity = '0';
                setTimeout(() => {
                    img.src = variant.img;
                    img.alt = variant.color;
                    img.style.opacity = '1';
                }, 150);
            }
            if (colorLabel) colorLabel.textContent = `Color: ${variant.color}`;
            dots.forEach((dot, idx) => {
                dot.classList.toggle('active', idx === currentIndex);
            });
        }

        prevBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            currentIndex = (currentIndex - 1 + variants.length) % variants.length;
            update();
        });

        nextBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            currentIndex = (currentIndex + 1) % variants.length;
            update();
        });

        dots.forEach((dot, idx) => {
            dot.addEventListener('click', (e) => {
                e.stopPropagation();
                currentIndex = idx;
                update();
            });
        });
    });
}

// Initialize everything after the intro screen hides (2.2s) to avoid
// running intersection observers and DOM queries during the splash
function init() {
    initCategoryFilter();
    initScrollReveal();
    initVariantSliders();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 2300));
} else {
    setTimeout(init, 2300);
}
