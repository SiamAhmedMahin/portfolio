// Main Frontend Logic
const loader = document.getElementById('site-loader');
const yearSpan = document.getElementById('year');
yearSpan.innerText = new Date().getFullYear();

// Wait for Supabase to be ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        if (typeof supabaseClient === 'undefined') {
            console.error('Supabase not loaded');
            return;
        }

        // Parallel Fetching for speed
        const [configRes, expRes, projRes, skillRes, achRes] = await Promise.all([
            supabaseClient.from('config').select('*').eq('key', 'global').single(),
            supabaseClient.from('experience').select('*').order('date', { ascending: false }), // We'll sort by text properly in UI if needed, or rely on inserted order
            supabaseClient.from('projects').select('*').order('created_at', { ascending: false }),
            supabaseClient.from('skills').select('*'),
            supabaseClient.from('achievements').select('*')
        ]);

        renderConfig(configRes.data?.value);
        renderExperience(expRes.data);
        renderProjects(projRes.data);
        renderSkills(skillRes.data);
        renderAchievements(achRes.data);

        // Hide Loader
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 500);
        }

    } catch (err) {
        console.error("Error loading content:", err);
        if (loader) loader.innerHTML = "<p style='color:white'>Failed to load content. Please try again later.</p>";
    }
});


/* --- RENDER FUNCTIONS --- */

function renderConfig(data) {
    if (!data) return;

    // Hero
    setText('hero-title', data.heroName);
    setText('nav-logo', (data.heroName || 'Portfolio').toUpperCase());
    setText('hero-subtitle', data.heroSubtitle);

    // Image
    const imgObj = document.getElementById('hero-image');
    if (data.profileImage) {
        imgObj.src = data.profileImage;
        imgObj.onload = () => imgObj.style.opacity = '1';
    }

    // About
    if (data.aboutText) {
        document.getElementById('about-text').innerHTML = data.aboutText; // Allow HTML
    }

    // Resume
    const resumeBtn = document.getElementById('hero-resume');
    if (data.resumeUrl) resumeBtn.href = data.resumeUrl;
    else resumeBtn.style.display = 'none';

    // Socials
    const socialHTML = generateSocialIcons(data.socials);
    document.getElementById('hero-socials').innerHTML = socialHTML;
    document.getElementById('footer-socials').innerHTML = socialHTML;
}

function generateSocialIcons(socials) {
    if (!socials) return '';
    let html = '';

    if (socials.linkedin) {
        html += `<a href="${socials.linkedin}" target="_blank" class="social-link" aria-label="LinkedIn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
        </a>`;
    }
    if (socials.github) {
        html += `<a href="${socials.github}" target="_blank" class="social-link" aria-label="GitHub">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
        </a>`;
    }
    if (socials.email) {
        html += `<a href="mailto:${socials.email}" class="social-link" aria-label="Email">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
        </a>`;
    }
    return html;
}

function renderExperience(items) {
    if (!items || items.length === 0) return;
    const container = document.getElementById('experience-timeline');
    container.innerHTML = items.map(item => `
        <div class="timeline-item active">
            <span class="timeline-date">${item.date}</span>
            <h3 class="timeline-title">${item.role}</h3>
            <span class="timeline-org">${item.company}</span>
            <p>${item.description}</p>
        </div>
    `).join('');
}

function renderProjects(items) {
    if (!items || items.length === 0) return;
    const container = document.getElementById('projects-grid');
    container.innerHTML = items.map(item => `
        <article class="project-card">
            <div class="project-image">
                ${item.imageurl
            ? `<img src="${item.imageurl}" alt="${item.title}" style="width:100%; height:100%; object-fit:cover;">`
            : `<div class="project-placeholder"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle></svg></div>`
        }
            </div>
            <div class="project-content">
                <div class="project-header">
                    <span class="project-status">${item.status || 'Project'}</span>
                </div>
                <span class="project-category">${item.category || 'Development'}</span>
                <h3 class="project-title">${item.title}</h3>
                <p class="project-description">${item.description}</p>
                <div class="project-tech">
                    ${(item.techstack || []).map(t => `<span class="tech-tag">${t}</span>`).join('')}
                </div>
            </div>
        </article>
    `).join('');
}

function renderSkills(items) {
    if (!items || items.length === 0) return;
    const container = document.getElementById('skills-list');
    container.innerHTML = items.map(item => `
        <span class="skill-pill">${item.name}</span>
    `).join('');
}

function renderAchievements(items) {
    if (!items || items.length === 0) return;
    const container = document.getElementById('achievements-grid');
    container.innerHTML = items.map(item => `
        <div class="project-card" style="padding: 2rem;">
            ${item.icon ? `<div style="margin-bottom: 1rem;">${item.icon}</div>` : ''}
            <span class="project-category">${item.category}</span>
            <h3 class="project-title">${item.title}</h3>
            ${item.date ? `<span style="font-size:0.8rem; opacity:0.7">${item.date}</span>` : ''}
        </div>
    `).join('');
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el && text) el.innerText = text;
}

/* Nav Toggle Logic (Kept from original) */
const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');
if (navToggle) {
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
}
