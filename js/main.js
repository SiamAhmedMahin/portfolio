import { fetchPortfolioData } from './api.js';
import { renderAll } from './ui.js';

// Main Frontend Logic
const loader = document.getElementById('site-loader');
const yearSpan = document.getElementById('year');
if (yearSpan) yearSpan.innerText = new Date().getFullYear();

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const data = await fetchPortfolioData();
        renderAll(data);

        // Hide Loader
        if (loader) {
            setTimeout(() => {
                loader.style.opacity = '0';
                setTimeout(() => loader.remove(), 500);
            }, 500); // Slight delay for smooth transition
        }

    } catch (err) {
        console.error("Error loading content:", err);
        if (loader) loader.innerHTML = "<div class='container' style='text-align:center'><p style='color:white'>Failed to load content.</p><button onclick='location.reload()' class='btn btn-primary' style='margin-top:1rem'>Retry</button></div>";
    }

    initScrollSpy();
    initScrollReveal();
});

function initScrollSpy() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                // Remove active class from all
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    link.removeAttribute('aria-current');
                });
                // Add active class to current
                const activeLink = document.querySelector(`.nav-link[href="#${id}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                    activeLink.setAttribute('aria-current', 'page');
                }
            }
        });
    }, {
        threshold: 0.3 // Trigger when 30% of section is visible
    });

    sections.forEach(section => observer.observe(section));
}

function initScrollReveal() {
    const reveals = document.querySelectorAll('section, .project-card, .timeline-item');

    // Add reveal class initially to sections if they don't have it (optional, but good for style.css match)
    // Actually, style.css .reveal handles the hidden state. 
    // We need to add the class .reveal to elements we want to animate.
    // Since content is dynamic, we might need to re-run this or use MutationObserver.
    // But for top-level sections it's fine. For dynamic content like .project-card, 
    // we need to call this AFTER renderAll. 
    // `renderAll` is awaited in the main block.

    // Let's attach a MutationObserver to the container to auto-add reveal to new items
    // OR just simple: add .reveal class in the render functions in ui.js? 
    // Modifying ui.js is cleaner for dynamic content. 
    // For static sections, we can do it here.

    document.querySelectorAll('section').forEach(sec => sec.classList.add('reveal'));

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                revealObserver.unobserve(entry.target); // Animate once
            }
        });
    }, {
        threshold: 0.1
    });

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    // Make global so ui.js can call it if needed, or use MutationObserver
    window.observeNewElements = () => {
        document.querySelectorAll('.project-card, .timeline-item').forEach(el => {
            el.classList.add('reveal');
            revealObserver.observe(el);
        });
    }
    // Call it immediately for any static content
    window.observeNewElements();
}

// Event Listeners

// 1. Modal Close on Outside Click
const modal = document.getElementById('details-modal');
if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target.id === 'details-modal') {
            if (window.closeDetails) window.closeDetails();
        }
    });
}

// 2. Nav Toggle
const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');
if (navToggle) {
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
}

// 3. Back to Top
const backToTopBtn = document.getElementById('back-to-top');
if (backToTopBtn) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}
