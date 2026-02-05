// Check if Supabase initialized
if (typeof supabaseClient === 'undefined') {
    alert("Supabase not initialized! Check config.");
}

// UI Helpers
const show = (id) => document.getElementById(id).classList.remove('hidden');
const hide = (id) => document.getElementById(id).classList.add('hidden');
const toggleLoader = (loading) => loading ? show('loader') : hide('loader');

// --- MOBILE NAVIGATION ---
window.toggleSidebar = () => {
    console.log("Toggle sidebar clicked");
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (!sidebar || !overlay) {
        console.error("Sidebar or Overlay not found");
        return;
    }

    sidebar.classList.toggle('active');

    if (sidebar.classList.contains('active')) {
        overlay.style.display = 'block';
        // Force reflow for transition
        overlay.offsetHeight;
        overlay.classList.add('active');
    } else {
        overlay.classList.remove('active');
        setTimeout(() => {
            if (!sidebar.classList.contains('active')) {
                overlay.style.display = 'none';
            }
        }, 300);
    }
};

window.closeSidebarMobile = () => {
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (sidebar) sidebar.classList.remove('active');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => overlay.style.display = 'none', 300);
        }
    }
};

// --- AUTH STATE ---
async function checkUser() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        hide('login-screen');
        show('dashboard-app');
        loadAllData();
    } else {
        show('login-screen');
        hide('dashboard-app');
    }
}
checkUser();

// Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log("Login button clicked");

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    console.log("Attempting login for:", email);

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            console.error("Login error:", error);
            document.getElementById('login-error').innerText = error.message;
        } else {
            console.log("Login successful:", data);
            checkUser();
        }
    } catch (err) {
        console.error("Unexpected error:", err);
        document.getElementById('login-error').innerText = "Unexpected error: " + err.message;
    }
});

async function logout() {
    await supabaseClient.auth.signOut();
    window.location.reload();
}

// Tab Navigation
window.showTab = (tabId) => {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-tabs button').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');

    // Highlight button
    const buttons = document.querySelectorAll('.nav-tabs button');
    buttons.forEach(btn => {
        if (btn.getAttribute('onclick') === `showTab('${tabId}')`) {
            btn.classList.add('active');
        }
    });
};


// --- DATA HANDLING ---

/* 1. General Config */
let globalConfig = {}; // Store full config

async function loadGeneral() {
    const { data, error } = await supabaseClient.from('config').select('*').eq('key', 'global').single();
    if (data && data.value) {
        globalConfig = data.value; // Keep reference
        const val = data.value;
        document.getElementById('heroName').value = val.heroName || '';
        document.getElementById('heroSubtitle').value = val.heroSubtitle || '';
        // Theme loaded in separate tab logic
        renderThemes(val.theme || 'default');
        applyThemeToDashboard(val.theme || 'default'); // Apply on load

        document.getElementById('aboutText').value = val.aboutText || '';
        document.getElementById('resumeUrl').value = val.resumeUrl || '';
        document.getElementById('linkedinUrl').value = val.socials?.linkedin || '';
        document.getElementById('githubUrl').value = val.socials?.github || '';
        document.getElementById('facebookUrl').value = val.socials?.facebook || '';
        document.getElementById('emailContact').value = val.socials?.email || '';

        if (val.profileImage) {
            document.getElementById('profileImageUrl').value = val.profileImage;
            document.getElementById('profilePreview').src = val.profileImage;
            document.getElementById('crop-controls').classList.remove('hidden');
        }

        renderPhotoStyles(val.heroPhotoStyle);
    }
}

window.resetGeneralTab = () => {
    if (confirm('Discard all unsaved changes in this tab?')) {
        loadGeneral();
    }
};



document.getElementById('general-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    toggleLoader(true);

    // Handle Image Upload
    const fileInput = document.getElementById('profileImageInput');
    let imageUrl = document.getElementById('profileImageUrl').value;

    if (fileInput.files[0]) {
        imageUrl = await uploadFile(fileInput.files[0], 'profile');
        document.getElementById('profileImageUrl').value = imageUrl;
        document.getElementById('profilePreview').src = imageUrl;
        document.getElementById('crop-controls').classList.remove('hidden');
        // Auto-open cropper for new uploads
        openCropModal();
    }


    // Update global config object
    globalConfig.heroName = document.getElementById('heroName').value;
    globalConfig.heroSubtitle = document.getElementById('heroSubtitle').value;
    globalConfig.aboutText = document.getElementById('aboutText').value;
    globalConfig.resumeUrl = document.getElementById('resumeUrl').value;
    globalConfig.profileImage = imageUrl;
    // Crop data is saved separately when "Apply Crop" is clicked or already in globalConfig

    globalConfig.heroPhotoStyle = document.getElementById('heroPhotoStyle').value;
    globalConfig.socials = {
        linkedin: document.getElementById('linkedinUrl').value,
        github: document.getElementById('githubUrl').value,
        facebook: document.getElementById('facebookUrl').value,
        email: document.getElementById('emailContact').value
    };

    const { error } = await supabaseClient.from('config').upsert({ key: 'global', value: globalConfig });
    toggleLoader(false);
    if (error) alert('Error: ' + error.message);
    else alert('Saved!');
});


window.resetProfileImage = () => {
    const defaultPath = 'assets/Khandaker%20Siam%20Ahmed.svg';
    document.getElementById('profileImageUrl').value = defaultPath;
    document.getElementById('profilePreview').src = defaultPath;
    document.getElementById('profileImageInput').value = ''; // Clear file selection
    alert("Profile image set to default. Remember to click 'Save Changes' to apply!");
};


/* Theme Logic */
const availableThemes = [
    { id: 'default', name: 'Dark Minimalist', bg: '#050505', sec: '#111111', txt: '#ffffff' },
    { id: 'titanium', name: 'Titanium Industrial', bg: '#0e0e0e', sec: '#141414', txt: '#e0e0e0' },
    { id: 'blueprint', name: 'Blueprint Technical', bg: '#0a192f', sec: '#112240', txt: '#e6f1ff' },
    { id: 'light', name: 'Professional Light', bg: '#ffffff', sec: '#f8f9fa', txt: '#333333' }
];

let selectedTheme = 'default';

function renderThemes(currentTheme) {
    selectedTheme = currentTheme;
    const container = document.getElementById('theme-grid');
    if (!container) return;
    container.innerHTML = availableThemes.map(t => `
        <div class="theme-card ${t.id === selectedTheme ? 'selected' : ''}" onclick="selectTheme('${t.id}')">
            <div class="theme-preview">
                <div class="theme-preview-main" style="--preview-bg: ${t.bg}"></div>
                <div class="theme-preview-sub" style="--preview-bg-sec: ${t.sec}">
                    <div class="theme-preview-text" style="--preview-text: ${t.txt}"></div>
                </div>
            </div>
            <div class="theme-info">
                <div class="theme-name">${t.name}</div>
            </div>
        </div>
    `).join('');
}

function applyThemeToDashboard(themeId) {
    const t = availableThemes.find(theme => theme.id === themeId);
    if (!t) return;
    document.documentElement.setAttribute('data-theme', themeId);
    document.documentElement.style.setProperty('--bg-primary', t.bg);
    document.documentElement.style.setProperty('--bg-card', t.sec);
    document.documentElement.style.setProperty('--text-primary', t.txt);
    document.body.style.backgroundColor = t.bg;
    document.body.style.color = t.txt;
    if (themeId === 'titanium') document.body.classList.add('grid-bg');
    else document.body.classList.remove('grid-bg');
}

window.selectTheme = (id) => {
    selectedTheme = id;
    renderThemes(id);
    applyThemeToDashboard(id);
}

/* Hero Framing Style Logic */
const heroPhotoStyles = [
    { id: 'frame-soft', name: 'Original Soft', preview: 'preview-soft' },
    { id: 'frame-circle', name: 'Industrial Circle', preview: 'preview-circle' },
    { id: 'frame-hexagon', name: 'Mech Hexagon', preview: 'preview-hexagon' },
    { id: 'frame-square', name: 'Squared Tech', preview: 'preview-square' },
    { id: 'frame-blueprint', name: 'Blueprint View', preview: 'preview-blueprint' }
];

let selectedPhotoStyle = 'frame-soft';

function renderPhotoStyles(currentStyle) {
    selectedPhotoStyle = currentStyle || 'frame-soft';
    const container = document.getElementById('photo-style-grid');
    if (!container) return;

    container.innerHTML = heroPhotoStyles.map(s => `
        <div class="photo-style-card ${s.id === selectedPhotoStyle ? 'active' : ''}" onclick="selectPhotoStyle('${s.id}')">
            <div class="photo-style-preview">
                <div class="photo-style-preview-inner ${s.preview}"></div>
            </div>
            <div class="style-name">${s.name}</div>
        </div>
    `).join('');
    document.getElementById('heroPhotoStyle').value = selectedPhotoStyle;
}

window.selectPhotoStyle = (id) => {
    selectedPhotoStyle = id;
    renderPhotoStyles(id);
};

window.saveThemeConfig = async () => {
    toggleLoader(true);
    globalConfig.theme = selectedTheme;
    const { error } = await supabaseClient.from('config').upsert({ key: 'global', value: globalConfig });
    toggleLoader(false);
    if (error) alert('Error: ' + error.message);
    else alert('Theme Applied!');
}

/* Cropper Instance */
let cropper = null;

window.openCropModal = () => {
    const imageUrl = document.getElementById('profileImageUrl').value;
    if (!imageUrl) return;

    const modal = document.getElementById('crop-modal');
    const image = document.getElementById('cropper-image');

    modal.classList.remove('hidden');
    image.src = imageUrl;

    if (cropper) {
        cropper.destroy();
    }

    cropper = new Cropper(image, {
        aspectRatio: 1, // Profile pictures usually 1:1
        viewMode: 1,
        dragMode: 'move',
        guides: true,
        center: true,
        highlight: false,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
        data: globalConfig.profileCrop || null // Load existing crop if available
    });
};

window.closeCropModal = () => {
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    document.getElementById('crop-modal').classList.add('hidden');
};

window.resetCrop = async () => {
    if (confirm('Permanently remove cropping and zoom configurations for this image?')) {
        delete globalConfig.profileCrop;

        toggleLoader(true);
        const { error } = await supabaseClient.from('config').upsert({ key: 'global', value: globalConfig });
        toggleLoader(false);

        if (error) {
            alert('Error resetting crop: ' + error.message);
        } else {
            closeCropModal();
            alert('Crop reset to original image.');
        }
    }
};


window.saveCrop = async () => {
    if (!cropper) return;

    const cropData = cropper.getData();
    globalConfig.profileCrop = {
        x: cropData.x,
        y: cropData.y,
        width: cropData.width,
        height: cropData.height,
        rotate: cropData.rotate,
        scaleX: cropData.scaleX,
        scaleY: cropData.scaleY
    };

    // Auto-save the config with crop data
    toggleLoader(true);
    const { error } = await supabaseClient.from('config').upsert({ key: 'global', value: globalConfig });
    toggleLoader(false);

    if (error) {
        alert('Error saving crop: ' + error.message);
    } else {
        closeCropModal();
        alert('Crop settings applied!');
    }
};


/* Helper: Upload File to Supabase Storage */
async function uploadFile(file, folder) {
    const fileName = `${folder}/${Date.now()}_${file.name.replace(/\s+/g, '-')}`;
    const { data, error } = await supabaseClient.storage.from('portfolio').upload(fileName, file);

    if (error) {
        alert("Upload Failed: " + error.message);
        return null;
    }

    // Get Public URL
    const { data: { publicUrl } } = supabaseClient.storage.from('portfolio').getPublicUrl(fileName);
    return publicUrl;
}

/* 2. Generic Fetcher */
async function loadCollection(table, containerId, renderFn) {
    // Supabase returns array
    const { data, error } = await supabaseClient.from(table).select('*').order('created_at', { ascending: false });
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (data) {
        data.forEach(item => {
            container.innerHTML += renderFn(item);
        });
    }
}

function renderExperienceItem(item) {
    return `
    <div class="list-item">
        <div>
            <strong>${item.role}</strong> at ${item.company}
        </div>
        <div class="actions">
            <button class="btn-edit" onclick="editItem('experience', '${item.id}')">Edit</button>
            <button class="btn-delete" onclick="deleteItem('experience', '${item.id}')">Delete</button>
        </div>
    </div>`;
}

function renderProjectItem(item) {
    return `
    <div class="list-item">
        <div style="display: flex; align-items: center; gap: 1rem;">
            ${item.imageurl
            ? `<img src="${item.imageurl}" alt="Project Image" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">`
            : `<div style="width: 50px; height: 50px; background: #333; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #555; font-size: 0.8rem;">No Img</div>`
        }
            <strong>${item.title}</strong>
        </div>
        <div class="actions">
            <button class="btn-edit" onclick="editItem('projects', '${item.id}')">Edit</button>
            <button class="btn-delete" onclick="deleteItem('projects', '${item.id}')">Delete</button>
        </div>
    </div>`;
}

function renderAchievementItem(item) {
    return `
    <div class="list-item">
        <div style="display: flex; align-items: center; gap: 1rem;">
            ${item.imageurl
            ? `<img src="${item.imageurl}" alt="Achievement Image" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">`
            : `<div style="width: 50px; height: 50px; background: #333; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #555; font-size: 0.8rem;">No Img</div>`
        }
            <strong>${item.title}</strong>
        </div>
        <div class="actions">
            <button class="btn-edit" onclick="editItem('achievements', '${item.id}')">Edit</button>
            <button class="btn-delete" onclick="deleteItem('achievements', '${item.id}')">Delete</button>
        </div>
    </div>`;
}

function renderEducationItem(item) {
    return `
    <div class="list-item">
        <div style="display: flex; align-items: center; gap: 1rem;">
            ${item.imageurl
            ? `<img src="${item.imageurl}" alt="Education Image" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">`
            : `<div style="width: 50px; height: 50px; background: #333; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #555; font-size: 0.8rem;">No Img</div>`
        }
            <div>
                <strong>${item.school}</strong>
                <div style="font-size: 0.85rem; color: #666;">
                    ${item.major} • ${item.start_year || ''}-${item.end_year || 'Present'}
                    ${item.cgpa ? ` • CGPA: ${item.cgpa}` : ''}
                </div>
            </div>
        </div>
        <div class="actions">
            <button class="btn-edit" onclick="editItem('education', '${item.id}')">Edit</button>
            <button class="btn-delete" onclick="deleteItem('education', '${item.id}')">Delete</button>
        </div>
    </div>`;
}

/* 3. Skills */
async function loadSkills() {
    const { data } = await supabaseClient.from('skills').select('*');
    const container = document.getElementById('skills-container');
    container.innerHTML = '';
    if (data) {
        data.forEach(item => {
            const el = document.createElement('div');
            el.className = 'skill-pill';
            el.style.background = '#e9ecef';
            el.style.padding = '5px 10px';
            el.style.borderRadius = '15px';
            el.style.display = 'flex';
            el.style.alignItems = 'center';
            el.style.gap = '5px';
            el.innerHTML = `
                ${item.name} 
                <span onclick="deleteItem('skills', '${item.id}')" style="cursor:pointer; color:red; font-weight:bold;">&times;</span>
            `;
            container.appendChild(el);
        });
    }
}

window.addSkill = async () => {
    const input = document.getElementById('newSkillInput');
    const val = input.value.trim();
    if (!val) return;
    toggleLoader(true);
    await supabaseClient.from('skills').insert({ name: val });
    input.value = '';
    await loadSkills();
    toggleLoader(false);
};

/* 4. Modals & Editing */
const schemas = {
    experience: [
        { name: 'role', label: 'Role', type: 'text' },
        { name: 'company', label: 'Company', type: 'text' },
        { name: 'date', label: 'Date Range', type: 'text' },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'order', label: 'Order', type: 'number' }
    ],
    projects: [
        { name: 'title', label: 'Title', type: 'text' },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'category', label: 'Category', type: 'text' },
        { name: 'status', label: 'Status', type: 'text' },
        { name: 'techstack', label: 'Tech Stack (comma separated)', type: 'text' },
        { name: 'link', label: 'Project Link', type: 'text' },
        { name: 'youtubeurl', label: 'YouTube Video URL (Optional)', type: 'text' },
        { name: 'imageurl', label: 'Thumbnail (Square Logo)', type: 'file' },
        { name: 'bannerurl', label: 'Detail Banner (Free Size)', type: 'file' }
    ],
    achievements: [
        { name: 'title', label: 'Title', type: 'text' },
        { name: 'category', label: 'Category', type: 'text' },
        { name: 'youtubeurl', label: 'YouTube Video URL (Optional)', type: 'text' },
        { name: 'icon', label: 'Icon (SVG String)', type: 'textarea' },
        { name: 'imageurl', label: 'Thumbnail (Square)', type: 'file' },
        { name: 'bannerurl', label: 'Detail Banner (Free Size)', type: 'file' }
    ],
    education: [
        { name: 'school', label: 'School / University', type: 'text' },
        { name: 'major', label: 'Major / Degree', type: 'text' },
        { name: 'start_year', label: 'Starting Year', type: 'text' },
        { name: 'end_year', label: 'Completion / Expected Year', type: 'text' },
        { name: 'cgpa', label: 'CGPA (Optional)', type: 'text' },
        { name: 'youtubeurl', label: 'YouTube Video URL (Optional)', type: 'text' },
        { name: 'imageurl', label: 'Logo (Square)', type: 'file' },
        { name: 'bannerurl', label: 'Campus/Detail Image (Free Size)', type: 'file' }
    ]
};

window.openModal = async (collection, id = null) => {
    // Map 'project' -> 'projects'
    const table = collection === 'project' ? 'projects' : (collection === 'achievement' ? 'achievements' : collection);

    document.getElementById('modal-collection').value = table;
    document.getElementById('modal-id').value = id || '';
    document.getElementById('modal-title').innerText = id ? `Edit ${table}` : `Add ${table}`;

    const fields = schemas[table];
    const container = document.getElementById('modal-fields');
    container.innerHTML = '';

    fields.forEach(field => {
        const div = document.createElement('div');
        div.className = 'form-group';
        div.innerHTML = `<label>${field.label}</label>`;

        if (field.type === 'textarea') {
            div.innerHTML += `<textarea id="field-${field.name}" rows="4"></textarea>`;
        } else if (field.type === 'file') {
            div.innerHTML += `
                <input type="file" id="field-file-${field.name}">
                <input type="hidden" id="field-${field.name}">
                <div id="preview-${field.name}" style="font-size:0.8rem; margin-top:5px;"></div>
            `;
        } else {
            div.innerHTML += `<input type="${field.type}" id="field-${field.name}">`;
        }
        container.appendChild(div);
    });

    // Fill data if editing
    if (id) {
        const { data } = await supabaseClient.from(table).select('*').eq('id', id).single();
        if (data) {
            fields.forEach(f => {
                if (f.type === 'file') {
                    document.getElementById(`field-${f.name}`).value = data[f.name] || '';
                    if (data[f.name]) document.getElementById(`preview-${f.name}`).innerText = "Current: " + data[f.name];
                } else if (f.name === 'techStack' && Array.isArray(data[f.name])) {
                    document.getElementById(`field-${f.name}`).value = data[f.name].join(', ');
                } else {
                    document.getElementById(`field-${f.name}`).value = data[f.name] || '';
                }
            });
        }
    }

    show('edit-modal');
};

window.closeModal = () => {
    hide('edit-modal');
    document.getElementById('modal-form').reset();
};

document.getElementById('modal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    toggleLoader(true);

    const table = document.getElementById('modal-collection').value;
    const id = document.getElementById('modal-id').value;
    const fields = schemas[table];
    const payload = {};

    for (const f of fields) {
        if (f.type === 'file') {
            const input = document.getElementById(`field-file-${f.name}`);
            let url = document.getElementById(`field-${f.name}`).value;
            if (input.files[0]) {
                url = await uploadFile(input.files[0], table);
            }
            payload[f.name] = url;
        } else if (f.name === 'techstack') {
            const val = document.getElementById(`field-${f.name}`).value;
            payload[f.name] = val.split(',').map(s => s.trim()).filter(s => s);
        } else {
            payload[f.name] = document.getElementById(`field-${f.name}`).value;
        }
    }

    if (id) {
        await supabaseClient.from(table).update(payload).eq('id', id);
    } else {
        await supabaseClient.from(table).insert(payload);
    }

    toggleLoader(false);
    closeModal();
    loadAllData();
});

window.editItem = (col, id) => openModal(col, id);

window.deleteItem = async (col, id) => {
    if (!confirm("Are you sure?")) return;
    toggleLoader(true);
    await supabaseClient.from(col).delete().eq('id', id);
    loadAllData();
    toggleLoader(false);
}

function loadAllData() {
    loadGeneral();
    loadCollection('experience', 'experience-list', renderExperienceItem);
    loadCollection('projects', 'projects-list', renderProjectItem);
    loadCollection('education', 'education-list', renderEducationItem);
    loadCollection('achievements', 'achievements-list', renderAchievementItem);
    loadSkills();
}
