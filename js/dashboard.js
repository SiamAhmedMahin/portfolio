// Check if Supabase initialized
if (typeof supabaseClient === 'undefined') {
    alert("Supabase not initialized! Check config.");
}

// UI Helpers
const show = (id) => document.getElementById(id).classList.remove('hidden');
const hide = (id) => document.getElementById(id).classList.add('hidden');
const toggleLoader = (loading) => loading ? show('loader') : hide('loader');

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
async function loadGeneral() {
    const { data, error } = await supabaseClient.from('config').select('*').eq('key', 'global').single();
    if (data && data.value) {
        const val = data.value;
        document.getElementById('heroName').value = val.heroName || '';
        document.getElementById('heroSubtitle').value = val.heroSubtitle || '';
        document.getElementById('aboutText').value = val.aboutText || '';
        document.getElementById('resumeUrl').value = val.resumeUrl || '';
        document.getElementById('linkedinUrl').value = val.socials?.linkedin || '';
        document.getElementById('githubUrl').value = val.socials?.github || '';
        document.getElementById('emailContact').value = val.socials?.email || '';

        if (val.profileImage) {
            document.getElementById('profileImageUrl').value = val.profileImage;
            document.getElementById('profilePreview').src = val.profileImage;
        }
    }
}

document.getElementById('general-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    toggleLoader(true);

    // Handle Image Upload
    const fileInput = document.getElementById('profileImageInput');
    let imageUrl = document.getElementById('profileImageUrl').value;

    if (fileInput.files[0]) {
        imageUrl = await uploadFile(fileInput.files[0], 'profile');
    }

    const payload = {
        heroName: document.getElementById('heroName').value,
        heroSubtitle: document.getElementById('heroSubtitle').value,
        aboutText: document.getElementById('aboutText').value,
        resumeUrl: document.getElementById('resumeUrl').value,
        profileImage: imageUrl,
        socials: {
            linkedin: document.getElementById('linkedinUrl').value,
            github: document.getElementById('githubUrl').value,
            email: document.getElementById('emailContact').value
        }
    };

    const { error } = await supabaseClient.from('config').upsert({ key: 'global', value: payload });
    toggleLoader(false);
    if (error) alert('Error: ' + error.message);
    else alert('Saved!');
});

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
        <div>
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
        <div>
            <strong>${item.title}</strong>
        </div>
        <div class="actions">
            <button class="btn-edit" onclick="editItem('achievements', '${item.id}')">Edit</button>
            <button class="btn-delete" onclick="deleteItem('achievements', '${item.id}')">Delete</button>
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
        { name: 'imageurl', label: 'Project Image', type: 'file' }
    ],
    achievements: [
        { name: 'title', label: 'Title', type: 'text' },
        { name: 'category', label: 'Category', type: 'text' },
        { name: 'icon', label: 'Icon (SVG String)', type: 'textarea' }
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
    loadCollection('achievements', 'achievements-list', renderAchievementItem);
    loadSkills();
}
