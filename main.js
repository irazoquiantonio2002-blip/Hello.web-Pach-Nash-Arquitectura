/* ============================================================
   PACH&NASH ARQUITECTURA — MAIN.JS
   Vanilla JS puro. Sin GSAP, sin Anime.js, sin librerías.
   ============================================================ */

'use strict';

/* ============================================================
   UTILIDADES
   ============================================================ */

// Interpolación lineal
const lerp = (a, b, t) => a + (b - a) * t;

// Clamp
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

// Ease out cubic
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

// Ease out quint
const easeOutQuint = t => 1 - Math.pow(1 - t, 5);

// Spring ease (aproximación)
const easeOutSpring = t => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1
        : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};

// Animar un valor con rAF
function animateValue({ from, to, duration, ease = easeOutCubic, onUpdate, onComplete }) {
    const start = performance.now();
    const tick = (now) => {
        const elapsed = now - start;
        const progress = clamp(elapsed / duration, 0, 1);
        const value = from + (to - from) * ease(progress);
        onUpdate(value, progress);
        if (progress < 1) requestAnimationFrame(tick);
        else if (onComplete) onComplete();
    };
    requestAnimationFrame(tick);
}

/* ============================================================
   1. LOADER PREMIUM
   ============================================================ */
(function initLoader() {
    const loader    = document.getElementById('site-loader');
    const bar       = loader.querySelector('.loader-bar');
    const pct       = document.getElementById('loaderPct');
    let   progress  = 0;
    let   raf;

    // Simula progreso de carga realista
    function simulateProgress() {
        const speeds = [
            { target: 30,  speed: 0.8 },
            { target: 60,  speed: 0.4 },
            { target: 85,  speed: 0.2 },
            { target: 100, speed: 0.6 }
        ];

        let stage = 0;

        function step() {
            const { target, speed } = speeds[stage] || speeds[speeds.length - 1];
            if (progress < target) {
                progress = Math.min(progress + speed * (Math.random() * 0.8 + 0.6), target);
                bar.style.width = progress + '%';
                pct.textContent  = Math.round(progress) + '%';
            } else {
                stage++;
                if (stage >= speeds.length) return finishLoader();
            }
            raf = requestAnimationFrame(step);
        }

        step();
    }

    function finishLoader() {
        cancelAnimationFrame(raf);
        bar.style.width = '100%';
        pct.textContent = '100%';

        // Pequeña pausa, luego abre las cortinas
        setTimeout(() => {
            loader.classList.add('exit');
            document.body.classList.remove('loading');

            // Inicia las animaciones del hero
            setTimeout(startHeroAnimations, 600);

            // Oculta el loader completamente
            loader.addEventListener('transitionend', () => {
                if (loader.classList.contains('exit')) {
                    loader.classList.add('hidden');
                }
            }, { once: true });

        }, 350);
    }

    // Espera a que el DOM esté listo + pequeño delay de staging
    setTimeout(simulateProgress, 400);
})();

/* ============================================================
   2. HERO — SECUENCIA DE ENTRADA
   ============================================================ */
function startHeroAnimations() {

    // Revelar líneas SVG
    const heroLines = document.querySelector('.hero-lines');
    if (heroLines) heroLines.classList.add('visible');

    // Timeline manual con delays encadenados
    const timeline = [
        { delay: 0,    fn: revealEyebrow        },
        { delay: 280,  fn: revealTitle           },
        { delay: 1050, fn: revealDivider         },
        { delay: 1250, fn: revealDesc            },
        { delay: 1500, fn: revealButtons         },
        { delay: 1700, fn: revealScrollIndicator },
        { delay: 1400, fn: revealBadge1          },
        { delay: 1600, fn: revealBadge2          },
        { delay: 1800, fn: revealBadge3          },
        { delay: 1900, fn: revealStatsBar        },
    ];

    timeline.forEach(({ delay, fn }) => setTimeout(fn, delay));
}

function revealEyebrow() {
    const el = document.getElementById('heroEyebrow');
    if (el) el.classList.add('visible');
}

function revealTitle() {
    const words = document.querySelectorAll('#heroTitle .word');
    words.forEach((word, i) => {
        setTimeout(() => word.classList.add('revealed'), i * 100);
    });
}

function revealDivider() {
    const el = document.getElementById('heroDivider');
    if (el) el.classList.add('visible');
}

function revealDesc() {
    const el = document.getElementById('heroDesc');
    if (el) el.classList.add('visible');
}

function revealButtons() {
    const el = document.getElementById('heroButtons');
    if (el) el.classList.add('visible');
}

function revealScrollIndicator() {
    const el = document.getElementById('scrollIndicator');
    if (el) el.classList.add('visible');
}

function revealBadge(id, fromX, fromY) {
    const el = document.getElementById(id);
    if (!el) return;

    el.style.transform   = el.id === 'badge3'
        ? `translateX(-50%) translateY(${fromY}px)`
        : `translateX(${fromX}px) translateY(${fromY}px)`;
    el.style.opacity     = '0';
    el.style.transition  = 'none';

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            el.style.transition = 'opacity 0.7s cubic-bezier(0.34,1.56,0.64,1), transform 0.9s cubic-bezier(0.34,1.56,0.64,1)';
            el.style.opacity    = '1';
            el.style.transform  = el.id === 'badge3' ? 'translateX(-50%) translateY(0)' : 'translateX(0) translateY(0)';
        });
    });
}

function revealBadge1() { revealBadge('badge1', -50, 0); }
function revealBadge2() { revealBadge('badge2',  50, 0); }
function revealBadge3() { revealBadge('badge3',  0, 30); }

function revealStatsBar() {
    const el = document.getElementById('heroStatsBar');
    if (el) el.classList.add('visible');
}

/* ============================================================
   3. CANVAS — SISTEMA DE PARTÍCULAS FLOTANTES
   ============================================================ */
(function initParticles() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;

    const ctx   = canvas.getContext('2d');
    let W, H, particles, raf;

    const CONFIG = {
        count:       60,
        maxRadius:   2.2,
        minRadius:   0.4,
        maxSpeed:    0.35,
        colorMain:   'rgba(200,169,110,',
        colorAccent: 'rgba(255,255,255,',
    };

    function resize() {
        W = canvas.width  = canvas.offsetWidth;
        H = canvas.height = canvas.offsetHeight;
    }

    class Particle {
        constructor() { this.reset(true); }

        reset(init = false) {
            this.x  = Math.random() * W;
            this.y  = init ? Math.random() * H : H + 10;
            this.r  = CONFIG.minRadius + Math.random() * (CONFIG.maxRadius - CONFIG.minRadius);
            this.vx = (Math.random() - 0.5) * CONFIG.maxSpeed * 0.5;
            this.vy = -(CONFIG.maxSpeed * 0.3 + Math.random() * CONFIG.maxSpeed);
            this.life = 0;
            this.maxLife = 0.4 + Math.random() * 0.6;
            this.gold = Math.random() > 0.35;
            this.twinkleOffset = Math.random() * Math.PI * 2;
        }

        update(t) {
            this.x += this.vx;
            this.y += this.vy;
            this.life += 0.0008 + Math.random() * 0.0004;
            if (this.y < -10 || this.life >= 1) this.reset();
        }

        draw() {
            // Parpadeo suave
            const twinkle = 0.5 + 0.5 * Math.sin(performance.now() * 0.001 + this.twinkleOffset);
            // Opacidad basada en ciclo de vida (fade in / fade out)
            const lifePct = this.life / this.maxLife;
            const alpha = lifePct < 0.2
                ? lifePct / 0.2
                : lifePct > 0.7
                    ? 1 - (lifePct - 0.7) / 0.3
                    : 1;

            const baseAlpha = 0.15 + twinkle * 0.35;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fillStyle = this.gold
                ? CONFIG.colorMain   + (baseAlpha * alpha).toFixed(3) + ')'
                : CONFIG.colorAccent + (baseAlpha * alpha * 0.6).toFixed(3) + ')';
            ctx.fill();
        }
    }

    function init() {
        resize();
        particles = Array.from({ length: CONFIG.count }, () => new Particle());
    }

    function loop(t) {
        ctx.clearRect(0, 0, W, H);
        particles.forEach(p => { p.update(t); p.draw(); });
        raf = requestAnimationFrame(loop);
    }

    window.addEventListener('resize', () => {
        resize();
        particles.forEach(p => p.reset(true));
    }, { passive: true });

    init();
    raf = requestAnimationFrame(loop);
})();

/* ============================================================
   4. PARALLAX Y MOUSE TRACKING
   ============================================================ */
(function initMouseEffects() {
    const heroBg       = document.getElementById('heroBg');
    const heroGrad     = document.getElementById('heroGradAnim');
    const orb1         = document.getElementById('orb1');
    const orb2         = document.getElementById('orb2');
    const badge1       = document.getElementById('badge1');
    const badge2       = document.getElementById('badge2');
    const heroContent  = document.getElementById('heroContent');

    let targetMX = 0.5, targetMY = 0.5;
    let currentMX = 0.5, currentMY = 0.5;
    let isHero = false;
    let raf;

    const hero = document.getElementById('inicio');

    hero && hero.addEventListener('mouseenter', () => { isHero = true; });
    hero && hero.addEventListener('mouseleave', () => {
        isHero = false;
        targetMX = 0.5;
        targetMY = 0.5;
    });

    window.addEventListener('mousemove', (e) => {
        targetMX = e.clientX / window.innerWidth;
        targetMY = e.clientY / window.innerHeight;

        // Gradiente dinámico sigue al cursor
        if (heroGrad) {
            heroGrad.style.setProperty('--mx', (targetMX * 100) + '%');
            heroGrad.style.setProperty('--my', (targetMY * 100) + '%');
        }
    }, { passive: true });

    function tick() {
        // Suavizado del movimiento del mouse
        currentMX = lerp(currentMX, targetMX, 0.06);
        currentMY = lerp(currentMY, targetMY, 0.06);

        const dx = (currentMX - 0.5);
        const dy = (currentMY - 0.5);

        // Parallax del fondo (muy sutil)
        if (heroBg) {
            heroBg.style.transform = `translate(${dx * -18}px, ${dy * -12}px) scale(1.08)`;
        }

        // Orbes siguen al mouse con fuerza diferente
        if (orb1) orb1.style.transform = `translate(${dx * 30}px, ${dy * 20}px)`;
        if (orb2) orb2.style.transform = `translate(${dx * -20}px, ${dy * -14}px)`;

        // Tilt 3D sutil en el contenido central
        if (heroContent && isHero) {
            const rotY = dx * 4;
            const rotX = dy * -3;
            heroContent.style.transform = `perspective(1200px) rotateY(${rotY}deg) rotateX(${rotX}deg)`;
        } else if (heroContent) {
            const curTX = parseFloat(heroContent.dataset.tx || '0');
            heroContent.style.transform = `perspective(1200px) rotateY(0deg) rotateX(0deg)`;
        }

        // Badges con tilt opuesto (sensación de profundidad)
        if (badge1) {
            badge1.style.transform = `translateX(${dx * -12}px) translateY(${dy * -8}px)`;
        }
        if (badge2) {
            badge2.style.transform = `translateX(${dx * 12}px) translateY(${dy * 8}px)`;
        }

        raf = requestAnimationFrame(tick);
    }

    tick();
})();

/* ============================================================
   5. PARALLAX DEL FONDO CON SCROLL
   ============================================================ */
(function initScrollParallax() {
    const heroBg    = document.getElementById('heroBg');
    const hero      = document.getElementById('inicio');

    if (!heroBg || !hero) return;

    // Combinamos el efecto scroll con el mouse (se mezclan en el tick de mouse)
    // Aquí solo ajustamos la posición Y basada en scroll
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const heroH   = hero.offsetHeight;

        if (scrollY < heroH * 1.5) {
            const pct = scrollY / heroH;
            heroBg.style.setProperty('--scroll-y', (scrollY * 0.40) + 'px');
        }
    }, { passive: true });
})();

/* ============================================================
   6. HEADER — SCROLL STATE
   ============================================================ */
(function initHeader() {
    const header = document.getElementById('header');
    if (!header) return;

    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
    }, { passive: true });
})();

/* ============================================================
   7. INTERSECTION OBSERVER — SECCIONES INFERIORES
   ============================================================ */
(function initScrollAnimations() {
    const opts = { threshold: 0.12, rootMargin: '0px 0px -50px 0px' };

    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el    = entry.target;
            const delay = parseInt(el.dataset.delay || 0);
            setTimeout(() => el.classList.add('visible'), delay);
            io.unobserve(el);
        });
    }, opts);

    document.querySelectorAll('.animate-section, .animate-card').forEach(el => io.observe(el));
})();

/* ============================================================
   8. CONTADORES ANIMADOS — MÉTRICAS
   ============================================================ */
(function initCounters() {
    const strip = document.querySelector('.metrics-strip');
    if (!strip) return;

    const io = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;

        strip.querySelectorAll('.metric-num').forEach(el => {
            const target = parseInt(el.dataset.target);
            animateValue({
                from: 0,
                to: target,
                duration: 1800,
                ease: easeOutQuint,
                onUpdate: (v) => { el.textContent = Math.round(v); }
            });
        });

        io.unobserve(strip);
    }, { threshold: 0.5 });

    io.observe(strip);
})();

/* ============================================================
   9. BOTÓN MAGNÉTICO (btn-magnetic hover)
   ============================================================ */
(function initMagneticButtons() {
    document.querySelectorAll('.btn-magnetic').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const cx   = rect.left + rect.width / 2;
            const cy   = rect.top  + rect.height / 2;
            const dx   = (e.clientX - cx) * 0.28;
            const dy   = (e.clientY - cy) * 0.28;
            btn.style.transform = `translate(${dx}px, ${dy}px)`;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transition = 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)';
            btn.style.transform  = 'translate(0,0)';
            setTimeout(() => { btn.style.transition = ''; }, 500);
        });
    });
})();

/* ============================================================
   10. HOVER 3D EN TARJETAS DE BENEFICIOS
   ============================================================ */
(function initCardTilt() {
    document.querySelectorAll('.benefit-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x    = (e.clientX - rect.left) / rect.width  - 0.5;
            const y    = (e.clientY - rect.top)  / rect.height - 0.5;
            card.style.transform   = `perspective(600px) rotateY(${x * 8}deg) rotateX(${y * -6}deg) translateY(-6px)`;
            card.style.transition  = 'transform 0.15s ease, box-shadow 0.15s ease';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform  = '';
            card.style.transition = 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s ease';
        });
    });
})();

/* ============================================================
   11. HOVER 3D EN GALERÍA
   ============================================================ */
(function initGalleryTilt() {
    document.querySelectorAll('.gallery-item').forEach(item => {
        item.addEventListener('mousemove', (e) => {
            const rect = item.getBoundingClientRect();
            const x    = (e.clientX - rect.left) / rect.width  - 0.5;
            const y    = (e.clientY - rect.top)  / rect.height - 0.5;
            item.style.transform  = `perspective(800px) rotateY(${x * 5}deg) rotateX(${y * -4}deg) scale(1.02)`;
            item.style.transition = 'transform 0.15s ease';
            item.style.zIndex     = '10';
        });

        item.addEventListener('mouseleave', () => {
            item.style.transform  = '';
            item.style.transition = 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)';
            item.style.zIndex     = '';
        });
    });
})();

/* ============================================================
   12. FORMULARIO — REDIRIGE A WHATSAPP CON TODOS LOS DATOS
   ============================================================ */
(function initForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const WA_NUMBER = '5219512504438';

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const btn  = document.getElementById('formSubmitBtn');
        const span = btn.querySelector('span');
        const icon = btn.querySelector('i');

        // Recolectar datos del formulario
        const nombre  = (document.getElementById('nombre')?.value  || '').trim();
        const telefono= (document.getElementById('telefono')?.value || '').trim();
        const email   = (document.getElementById('email')?.value   || '').trim();
        const tipo    = (document.getElementById('tipo')?.value    || '');
        const mensaje = (document.getElementById('mensaje')?.value || '').trim();

        // Mapear tipo de proyecto a texto legible
        const tipoTexto = {
            'arquitectura': 'Arquitectura residencial',
            'comercial':    'Arquitectura comercial',
            'interiorismo': 'Diseño de interiores',
            'remodelacion': 'Remodelación',
            'otro':         'Otro',
            '':             'No especificado'
        }[tipo] || tipo;

        // Construir el mensaje estructurado para WhatsApp
        const waMsg = [
            '🏛️ *Nuevo contacto desde la página web de Pach&Nash Arquitectura*',
            '',
            `👤 *Nombre:* ${nombre}`,
            `📞 *Teléfono:* ${telefono || 'No proporcionado'}`,
            `✉️ *Correo:* ${email}`,
            `🔨 *Tipo de proyecto:* ${tipoTexto}`,
            '',
            `💬 *Mensaje:*`,
            mensaje,
            '',
            '---',
            '_Enviado desde el formulario de contacto_'
        ].join('\n');

        const waURL = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waMsg)}`;

        // Animación de envío
        btn.disabled = true;
        btn.style.transition = 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)';
        btn.style.transform  = 'scale(0.96)';

        setTimeout(() => {
            btn.style.transform = 'scale(1.02)';
            if (span) span.textContent = 'Abriendo WhatsApp...';
            if (icon) icon.className = 'fab fa-whatsapp';
            btn.style.background = '#25D366';
        }, 120);

        // Pequeño delay para que el usuario vea el feedback, luego abre WhatsApp
        setTimeout(() => {
            window.open(waURL, '_blank', 'noopener');

            // Resetear botón y formulario
            setTimeout(() => {
                if (span) span.textContent = 'Enviar por WhatsApp';
                if (icon) icon.className = 'fab fa-whatsapp';
                btn.style.background = '';
                btn.style.transform  = '';
                btn.disabled = false;
                form.reset();
            }, 2000);
        }, 700);
    });

    // Micro-animación en campos al recibir foco
    form.querySelectorAll('input, textarea, select').forEach(field => {
        field.addEventListener('focus', () => {
            field.parentElement.style.transform  = 'translateX(3px)';
            field.parentElement.style.transition = 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)';
        });
        field.addEventListener('blur', () => {
            field.parentElement.style.transform = '';
        });
    });
})();

/* ============================================================
   13. ACTIVE NAV — RESALTA SECCIÓN VISIBLE
   ============================================================ */
(function initActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const links    = document.querySelectorAll('.nav-links a[href^="#"]');

    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                links.forEach(l => l.classList.remove('active'));
                const match = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
                if (match) match.classList.add('active');
            }
        });
    }, { threshold: 0.45 });

    sections.forEach(s => io.observe(s));
})();

/* ============================================================
   14. CERRAR MENÚ MÓVIL AL NAVEGAR
   ============================================================ */
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        const toggle = document.getElementById('menu-toggle');
        if (toggle) toggle.checked = false;
    });
});
