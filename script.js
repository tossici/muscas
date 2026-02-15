// --- DATA LAYER ---
let messages = JSON.parse(localStorage.getItem('muscas_messages')) || [];
let posts = JSON.parse(localStorage.getItem('muscas_posts')) || [
    { 
        id: 1, 
        title: "Gestire l'ansia quotidiana", 
        img: "https://images.unsplash.com/photo-1518063319789-7217e6706b04?auto=format&fit=crop&w=800", 
        content: "L'ansia è un'emozione naturale...\n\nIn questo articolo esploreremo come la respirazione possa aiutarci." 
    }
];

window.onload = () => { 
    trackVisits();
    renderPublicBlog(); 
    updateStats(); 
};

// --- VISIT TRACKER ---
function trackVisits() {
    let totalVisits = parseInt(localStorage.getItem('site_total_visits')) || 0;
    if (!sessionStorage.getItem('visit_counted')) {
        totalVisits++;
        localStorage.setItem('site_total_visits', totalVisits);
        sessionStorage.setItem('visit_counted', 'true');
    }
    return totalVisits;
}

// --- UTILS ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast`;
    toast.style.borderLeft = type === 'error' ? '5px solid #e74c3c' : '5px solid #4e7d6b';
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { 
        toast.style.opacity = '0'; 
        setTimeout(() => toast.remove(), 500); 
    }, 3000);
}

function updateStats() {
    document.getElementById('count-msgs').innerText = messages.length;
    document.getElementById('count-posts').innerText = posts.length;
    const realVisits = localStorage.getItem('site_total_visits') || 0;
    document.getElementById('count-visits').innerText = Number(realVisits).toLocaleString();
}

function switchTab(tab) {
    document.querySelectorAll('.dashboard-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.sidebar li').forEach(l => l.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    document.getElementById('nav-' + (tab === 'home' ? 'home' : tab)).classList.add('active');
    if(tab === 'blog') { resetBlogForm(); renderAdminBlog(); }
    if(tab === 'msgs') renderAdminMsgs();
}

// --- IMAGE HANDLING ---
function handleImageUpload(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const imgElement = new Image();
        imgElement.src = e.target.result;

        imgElement.onload = function() {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const scaleSize = MAX_WIDTH / imgElement.width;
            canvas.width = MAX_WIDTH;
            canvas.height = imgElement.height * scaleSize;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);

            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            document.getElementById('post-img-data').value = compressedBase64;
            
            const preview = document.getElementById('image-preview');
            preview.src = compressedBase64;
            preview.style.display = 'block';
            document.getElementById('file-label-text').innerText = "Foto caricata correttamente ✓";
        };
    };
    reader.readAsDataURL(file);
}

// --- BLOG LOGIC ---
function renderPublicBlog() {
    const grid = document.getElementById('public-blog-grid');
    grid.innerHTML = posts.map(p => `
        <div class="blog-card">
            <img src="${p.img}">
            <div class="blog-card-body">
                <div>
                    <h3>${p.title}</h3>
                    <p style="color:#666; margin: 15px 0; font-size: 0.9rem;">${p.content.substring(0, 100)}...</p>
                </div>
                <button class="btn btn-primary" style="font-size:0.7rem; align-self: flex-start;" onclick="openPost(${p.id})">Leggi tutto</button>
            </div>
        </div>
    `).join('');
}

function renderAdminBlog() {
    const list = document.getElementById('admin-blog-list');
    list.innerHTML = posts.map(p => `
        <div class="glass-panel" style="display:flex; justify-content:space-between; align-items:center; padding: 15px; margin-bottom:10px;">
            <span style="font-weight:bold; font-size:0.9rem;">📝 ${p.title}</span>
            <div style="display:flex; gap:8px;">
                <button class="dash-btn btn-view" onclick="prepareEditPost(${p.id})"><i class="fas fa-edit"></i></button>
                <button class="dash-btn btn-delete" onclick="deletePost(${p.id})"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function prepareEditPost(id) {
    const p = posts.find(post => post.id === id);
    if (!p) return;
    document.getElementById('post-title').value = p.title;
    document.getElementById('post-img-data').value = p.img;
    document.getElementById('post-content').value = p.content;
    
    const preview = document.getElementById('image-preview');
    preview.src = p.img;
    preview.style.display = 'block';
    
    const publishBtn = document.getElementById('publishBtn');
    publishBtn.innerHTML = "💾 Salva Modifiche";
    publishBtn.setAttribute('data-editing-id', id);
    document.getElementById('cancelEditBtn').style.display = 'block';
    document.getElementById('blog-editor-title').innerText = "Modifica Articolo ✏️";
    document.querySelector('.dashboard-main').scrollTop = 0;
}

function resetBlogForm() {
    document.getElementById('post-title').value = '';
    document.getElementById('post-img-data').value = '';
    document.getElementById('post-content').value = '';
    document.getElementById('post-file').value = '';
    document.getElementById('image-preview').style.display = 'none';
    document.getElementById('file-label-text').innerText = "Clicca per caricare una foto dal file";
    
    const publishBtn = document.getElementById('publishBtn');
    publishBtn.innerHTML = "🚀 Pubblica";
    publishBtn.removeAttribute('data-editing-id');
    document.getElementById('cancelEditBtn').style.display = 'none';
    document.getElementById('blog-editor-title').innerText = "Gestione Blog 📑";
}

function addPost() {
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;
    const img = document.getElementById('post-img-data').value || "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800";
    
    if(!title || !content) return showToast("Compila i campi", "error");
    
    const publishBtn = document.getElementById('publishBtn');
    const editingId = publishBtn.getAttribute('data-editing-id');
    
    if (editingId) {
        const index = posts.findIndex(p => p.id == editingId);
        if (index !== -1) {
            posts[index] = { ...posts[index], title, img, content };
            showToast("Articolo aggiornato!");
        }
    } else {
        posts.unshift({ id: Date.now(), title, img, content });
        showToast("Articolo pubblicato! 🚀");
    }
    
    localStorage.setItem('muscas_posts', JSON.stringify(posts));
    resetBlogForm();
    renderAdminBlog(); 
    renderPublicBlog(); 
    updateStats();
}

function deletePost(id) {
    if(confirm("Eliminare definitivamente?")) {
        posts = posts.filter(p => p.id !== id);
        localStorage.setItem('muscas_posts', JSON.stringify(posts));
        renderAdminBlog(); renderPublicBlog(); updateStats();
        showToast("Articolo rimosso", "error");
    }
}

// --- MESSAGES LOGIC ---
function renderAdminMsgs() {
    const list = document.getElementById('messages-list');
    if (messages.length === 0) {
        list.innerHTML = "<tr><td colspan='3' style='text-align:center; padding:20px;'>Nessuna prenotazione 🧊</td></tr>";
        return;
    }
    list.innerHTML = messages.map(m => `
        <tr>
            <td><strong>👤 ${m.name}</strong><br><small>🗓️ ${m.date}</small></td>
            <td><span class="btn-view" style="padding:4px 10px; border-radius:6px; font-size:0.7rem;">${m.type === 'Online' ? '💻' : '🏥'} ${m.type}</span></td>
            <td><button class="dash-btn btn-view" onclick="readMsg(${m.id})">👁️ Dettagli</button></td>
        </tr>
    `).join('');
}

function readMsg(id) {
    const m = messages.find(msg => msg.id === id);
    document.getElementById('modal-content').innerHTML = `
        <h2>Richiesta da: ${m.name} 👤</h2>
        <div style="margin:20px 0; background:#f9f9f9; padding:25px; border-radius:20px; line-height:2;">
            <p><strong>📧 Email:</strong> ${m.email}</p>
            <p><strong>📞 Telefono:</strong> ${m.phone}</p>
            <p><strong>📍 Modalità:</strong> ${m.type}</p>
            <hr style="margin:15px 0; border:0; border-top:1px solid #ddd;">
            <p><strong>💬 Messaggio:</strong><br>${m.msg || 'Nessun messaggio.'}</p>
        </div>
        <button class="btn btn-primary" onclick="closeModal()">Chiudi ✅</button>
    `;
    document.getElementById('universal-modal').style.display = 'block';
}

function submitForm() {
    const name = document.getElementById('c_name').value;
    const email = document.getElementById('c_email').value;
    const phone = document.getElementById('c_phone').value;
    const type = document.getElementById('c_type').value;
    const msg = document.getElementById('c_msg').value;
    if(!name || !email || !phone || !type) return showToast("Compila i campi obbligatori ⚠️", "error");
    messages.unshift({ 
        id: Date.now(), name, email, phone, type, msg, 
        date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    });
    localStorage.setItem('muscas_messages', JSON.stringify(messages));
    showToast("Richiesta inviata! ✨");
    document.querySelectorAll('#prenota input, #prenota textarea, #prenota select').forEach(i => i.value = '');
    updateStats();
}

// --- MODAL & AUTH ---
function openPost(id) {
    const p = posts.find(post => post.id === id);
    document.getElementById('modal-content').innerHTML = `
        <img src="${p.img}" style="width:100%; border-radius:20px; margin-bottom:20px; max-height:400px; object-fit:cover;">
        <h1>${p.title}</h1>
        <p style="white-space: pre-wrap; font-size: 1.1rem; color: #444; line-height: 1.8; margin-top:20px;">${p.content}</p>
    `;
    document.getElementById('universal-modal').style.display = 'block';
}

function closeModal() { document.getElementById('universal-modal').style.display = 'none'; }
function openAuth() { document.getElementById('admin-auth-overlay').style.display = 'flex'; }
function closeAuth() { document.getElementById('admin-auth-overlay').style.display = 'none'; }

function checkPassword() {
    if(document.getElementById('adminPass').value === 'psico2026') {
        closeAuth(); 
        document.getElementById('admin-dashboard').style.display = 'grid'; 
        switchTab('home');
    } else {
        showToast("Password errata ❌", "error");
    }
}
