// Category Filter
function initCategoryFilter() {
    const filter = document.getElementById('categoryFilter') as HTMLSelectElement;
    if (!filter) return;

    const filterWrap = filter.closest('.select-wrap');

    filter.addEventListener('change', () => {
        const selected = filter.value;
        filterWrap?.classList.remove('is-bursting');
        void filter.offsetWidth;
        filterWrap?.classList.add('is-bursting');

        document.querySelectorAll<HTMLElement>('.products .product').forEach((product) => {
            if (selected === 'all' || product.dataset.category === selected) {
                product.classList.remove('hide');
                product.style.display = 'flex';
            } else {
                product.classList.add('hide');
                product.style.display = 'none';
            }
        });

        window.setTimeout(() => {
            filterWrap?.classList.remove('is-bursting');
        }, 750);
    });
}

// Scroll Reveal
function initScrollReveal() {
    const groups = [
        '.hero-brand, .hero .bio, .hero-nav',
        '.featured-section > .section-title, .featured-image-wrapper, .featured-details',
        '.likha-heading, .likha-card',
        '#collections > .section-title, #collections > .select-wrap, #collections .product',
        '.shipping-shell > .section-title, .shipping-card',
        '.testimonials-section > .section-title, .testimonial-divider, #feedback-carousel, #feedback-dots',
        '.inquiry-section > .section-title, .inquiry-form .form-row, .inquiry-form > .submit-btn',
        '.contact-intro > .eyebrow, .contact-intro > h2, .contact-card, .contact-links',
        'footer'
    ];
    const items: HTMLElement[] = [];
    const seen = new Set<HTMLElement>();

    groups.forEach((selector) => {
        document.querySelectorAll<HTMLElement>(selector).forEach((item, index) => {
            if (seen.has(item)) return;
            seen.add(item);
            item.classList.add('depth-reveal');
            item.style.setProperty('--reveal-order', String(index % 5));
            items.push(item);
        });
    });

    if (!items.length) return;

    const revealImmediately = () => {
        items.forEach((item) => item.classList.add('is-depth-visible'));
        document.body.classList.add('has-depth-reveal');
    };

    if (
        window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        !('IntersectionObserver' in window)
    ) {
        revealImmediately();
        return;
    }

    const initiallyVisible = items.filter((item) => {
        const bounds = item.getBoundingClientRect();
        return bounds.top < window.innerHeight * 0.94 && bounds.bottom > 0;
    });
    initiallyVisible.forEach((item) => item.classList.add('is-depth-visible'));
    document.body.classList.add('has-depth-reveal');

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                entry.target.classList.toggle('is-depth-visible', entry.isIntersecting);
            });
        },
        {
            threshold: 0.12,
            rootMargin: '0px 0px -8% 0px'
        }
    );

    items.forEach((item) => observer.observe(item));
}

function initSmoothAnchors() {
    const links = document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]:not([href="#"])');
    if (!links.length) return;

    links.forEach((link) => {
        link.addEventListener('click', (event) => {
            const hash = link.getAttribute('href');
            if (!hash) return;

            const target = document.querySelector<HTMLElement>(hash);
            if (!target) return;

            event.preventDefault();

            const header = document.querySelector<HTMLElement>('.header-wrapper');
            const headerOffset = header ? header.offsetHeight + 14 : 0;
            const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;

            window.scrollTo({
                top: Math.max(0, top),
                behavior: 'smooth'
            });

            if (history.pushState) {
                history.pushState(null, '', hash);
            }
        }, { passive: false });
    });
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

// Initialize after the cinematic intro completes to avoid running
// observers and DOM queries while the full-screen overlay is active.
function init() {
    initCategoryFilter();
    initScrollReveal();
    initVariantSliders();
    initSmoothAnchors();
}

let initialized = false;

function initOnce() {
    if (initialized) return;
    initialized = true;
    init();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.addEventListener('gbp:intro-complete', initOnce, { once: true });
        setTimeout(initOnce, 4300);
    });
} else {
    window.addEventListener('gbp:intro-complete', initOnce, { once: true });
    setTimeout(initOnce, 4300);
}
