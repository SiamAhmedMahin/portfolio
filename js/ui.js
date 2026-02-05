// Themes are now handled via CSS variables and data-theme attribute

export function renderAll(data) {
    if (!data) return;
    renderConfig(data.config);
    renderExperience(data.experience);
    renderProjects(data.projects);
    renderEducation(data.education);
    renderSkills(data.skills);
    renderAchievements(data.achievements);
}

/**
 * Preloads all background assets (images, banners) to ensure instant UI response.
 * @param {Object} data - The complete portfolio data object.
 */
export function preloadAssets(data) {
    if (!data) return;

    const urls = new Set();

    // 1. Profile Image
    if (data.config?.profileImage) urls.add(data.config.profileImage);

    // 2. Project Images & Banners
    if (data.projects) {
        data.projects.forEach(p => {
            if (p.imageurl) urls.add(p.imageurl);
            if (p.bannerurl) urls.add(p.bannerurl);
        });
    }

    // 3. Education Images
    if (data.education) {
        data.education.forEach(e => {
            if (e.imageurl) urls.add(e.imageurl);
        });
    }

    // 4. Achievement Images
    if (data.achievements) {
        data.achievements.forEach(a => {
            if (a.imageurl) urls.add(a.imageurl);
        });
    }

    // Load each unique URL
    console.log(`[Preloader] Initializing background load for ${urls.size} assets...`);
    urls.forEach(url => {
        const img = new Image();
        img.src = url;
        // No need to append to DOM, browser cache handles it
    });
}

function renderConfig(data) {
    if (!data) return;

    // Apply Theme
    if (data.theme) {
        document.documentElement.setAttribute('data-theme', data.theme);
        localStorage.setItem('site-theme', data.theme);

        // Specific class for Titanium Grid
        if (data.theme === 'titanium') {
            document.body.classList.add('grid-bg');
        } else {
            document.body.classList.remove('grid-bg');
        }
    } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.removeItem('site-theme');
        document.body.classList.remove('grid-bg');
    }

    // Hero
    setText('hero-title', data.heroName);
    setText('nav-logo-text', (data.heroName || 'Portfolio').toUpperCase());
    setText('hero-subtitle', data.heroSubtitle);

    // Nav Logo Image
    const navLogoImg = document.querySelector('.logo-img');
    if (navLogoImg && data.profileImage) {
        navLogoImg.src = data.profileImage;
    }

    // Image & Frame
    const imgObj = document.getElementById('hero-image');
    const imgContainer = imgObj?.parentElement;

    if (data.profileImage) {
        imgObj.src = data.profileImage;
    }

    // Apply Framing Style
    if (imgContainer) {
        // Remove all previous frame classes
        const frameClasses = ['frame-soft', 'frame-circle', 'frame-hexagon', 'frame-square', 'frame-blueprint'];
        imgContainer.classList.remove(...frameClasses);

        // Add new class (default to soft)
        imgContainer.classList.add(data.heroPhotoStyle || 'frame-soft');
    }

    if (imgObj && imgObj.complete) {
        imgObj.style.opacity = '1';
        // Apply crop if available and not yet applied
        if (data.profileCrop && !imgObj.dataset.cropped && imgObj.naturalWidth) {
            applyProfileCrop(imgObj, data.profileCrop);
        }
    } else if (imgObj) {
        imgObj.onload = () => {
            imgObj.style.opacity = '1';
            if (data.profileCrop) applyProfileCrop(imgObj, data.profileCrop);
        };
    }

    // About
    if (data.aboutText) {
        document.getElementById('about-text').innerHTML = data.aboutText;
    }

    // Resume
    const resumeBtn = document.getElementById('hero-resume');
    if (data.resumeUrl) resumeBtn.href = data.resumeUrl;
    // Keep default assets/cv.pdf if nothing in DB, and don't hide
    else resumeBtn.href = 'assets/cv.pdf';
    resumeBtn.style.display = 'inline-flex';

    // Socials
    const socialHTML = generateSocialIcons(data.socials);
    const heroSocials = document.getElementById('hero-socials');
    const footerSocials = document.getElementById('footer-socials');

    if (heroSocials) heroSocials.innerHTML = socialHTML;
    if (footerSocials) footerSocials.innerHTML = socialHTML;
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
    if (socials.facebook) {
        html += `<a href="${socials.facebook}" target="_blank" class="social-link" aria-label="Facebook">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
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
    if (!container) return;
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
    if (!container) return;
    container.innerHTML = items.map(item => `
        <article class="project-card" onclick='openDetails(${JSON.stringify(item).replace(/'/g, "&#39;")})' style="cursor: pointer;">
            <div class="project-image">
                ${item.imageurl
            ? `<img src="${item.imageurl}" alt="${item.title}" loading="lazy" style="width:100%; height:100%; object-fit:contain; padding: 10px;">`
            : `<div class="project-placeholder"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle></svg></div>`
        }
            </div>
            <div class="project-content">
                <div class="project-header">
                    <span class="project-status">${item.status || 'Project'}</span>
                </div>
                <span class="project-category">${item.category || 'Development'}</span>
                <h3 class="project-title">${item.title}</h3>
                <p class="project-description">${item.description ? item.description.substring(0, 100) + '...' : ''}</p>
                <div class="project-tech">
                    ${(Array.isArray(item.techstack) ? item.techstack : (item.techstack ? item.techstack.split(',').map(s => s.trim()) : [])).map(t => `<span class="tech-tag">${t}</span>`).join('')}
                </div>
            </div>
        </article>
    `).join('');
}

function renderSkills(items) {
    if (!items || items.length === 0) return;
    const container = document.getElementById('skills-list');
    if (!container) return;
    container.innerHTML = items.map(item => `
        <span class="skill-pill">${item.name}</span>
    `).join('');
}

function renderEducation(items) {
    if (!items || items.length === 0) return;
    const container = document.getElementById('education-grid');
    if (!container) return;
    container.innerHTML = items.map(item => `
        <article class="project-card" onclick='openDetails(${JSON.stringify(item).replace(/'/g, "&#39;")})' style="cursor: pointer;">
            ${item.imageurl ? `
                <div class="project-image">
                    <img src="${item.imageurl}" alt="${item.school}" loading="lazy" style="width:100%; height:100%; object-fit:contain; padding: 10px;">
                </div>
            ` : ''}
            <div class="project-content" style="padding: 2rem;">
                <div class="project-header">
                    <span class="project-status" style="border-color: var(--text-secondary); color: var(--text-secondary);">
                        ${item.start_year} - ${item.end_year || 'Present'}
                    </span>
                </div>
                <h3 class="project-title" style="margin-top: 0.5rem;">${item.school}</h3>
                <span class="project-category" style="display: block; margin-bottom: 0.5rem;">${item.major}</span>
                ${item.cgpa ? `<p class="project-description">CGPA: <strong>${item.cgpa}</strong></p>` : ''}
            </div>
        </article>
    `).join('');
}

function renderAchievements(items) {
    if (!items || items.length === 0) return;
    const container = document.getElementById('achievements-grid');
    if (!container) return;
    container.innerHTML = items.map(item => `
        <div class="project-card" onclick='openDetails(${JSON.stringify(item).replace(/'/g, "&#39;")})' style="cursor: pointer;">
            ${item.imageurl ? `
                <div class="project-image">
                    <img src="${item.imageurl}" alt="${item.title}" loading="lazy" style="width:100%; height:100%; object-fit:contain; padding: 10px;">
                </div>
            ` : ''}
            <div class="project-content" style="padding: 2rem;">
                ${item.icon && !item.imageurl ? `<div style="margin-bottom: 1rem;">${item.icon}</div>` : ''}
                <span class="project-category">${item.category}</span>
                <h3 class="project-title">${item.title}</h3>
                ${item.date ? `<span style="font-size:0.8rem; opacity:0.7">${item.date}</span>` : ''}
            </div>
        </div>
    `).join('');
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el && text) el.innerText = text;
}

// Modal Logic - Exposed globally for onclick events in HTML
window.openDetails = (item) => {
    const modal = document.getElementById('details-modal');
    const body = document.getElementById('modal-body-content');

    // Choose Banner (Priority) or Thumbnail or Placeholder
    const bannerImg = item.bannerurl || item.imageurl;

    const getYouTubeEmbedUrl = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
    };
    const embedUrl = getYouTubeEmbedUrl(item.youtubeurl);

    const isEdu = item.school !== undefined;

    let contentHTML = '';

    if (embedUrl) {
        contentHTML += `
            <div class="video-container">
                <iframe src="${embedUrl}" allowfullscreen></iframe>
            </div>
        `;
    } else if (bannerImg) {
        contentHTML += `<img src="${bannerImg}" class="modal-banner" alt="Banner" loading="lazy">`;
    }


    contentHTML += `<div class="modal-header">`;

    if (isEdu) {
        contentHTML += `<span class="project-status">${item.start_year} - ${item.end_year}</span>`;
        contentHTML += `<h2 class="modal-title" style="margin-top: 10px;">${item.school}</h2>`;
        contentHTML += `<p class="modal-subtitle">${item.major}</p>`;
    } else {
        if (item.status) contentHTML += `<span class="project-status">${item.status}</span>`;
        contentHTML += `<h2 class="modal-title" style="margin-top: 10px;">${item.title}</h2>`;
        contentHTML += `<p class="modal-subtitle">${item.category || ''}</p>`;
    }

    contentHTML += `</div>`;
    contentHTML += `<div class="modal-info">`;

    if (item.description) {
        contentHTML += `<p>${item.description.replace(/\n/g, '<br>')}</p>`;
    }

    // Tech Stack
    if (item.techstack && item.techstack.length > 0) {
        contentHTML += `<div class="modal-tech">`;
        item.techstack.forEach(t => {
            contentHTML += `<span class="skill-pill">${t}</span>`;
        });
        contentHTML += `</div>`;
    }

    // Links
    if (item.link) {
        contentHTML += `<a href="${item.link}" target="_blank" class="btn btn-primary" style="margin-top: 1rem;">View Project</a>`;
    }

    contentHTML += `</div>`;

    body.innerHTML = contentHTML;
    modal.style.display = 'flex';
};

window.closeDetails = () => {
    document.getElementById('details-modal').style.display = 'none';
};

function applyProfileCrop(img, crop) {
    if (!img || !crop || !img.naturalWidth) return;

    // Calculate scale to fill container width/height (100%)
    const scale = 100 / (crop.width / img.naturalWidth * 100);

    img.style.width = '100%';
    img.style.height = 'auto';
    img.style.transformOrigin = '0 0';

    // Calculate translation percentages
    const transX = -(crop.x / img.naturalWidth * 100) * scale;
    const transY = -(crop.y / img.naturalHeight * 100) * (img.naturalHeight / img.naturalWidth) * scale;

    img.style.transform = `scale(${scale}) translate(${transX}%, ${transY}%)`;
    img.style.position = 'absolute';
    img.style.top = '0';
    img.style.left = '0';
    img.dataset.cropped = 'true';
}
