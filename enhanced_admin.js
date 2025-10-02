// Enhanced Admin Dashboard JavaScript for Gaming Store
// Complete Product Management System with Payment Selection

// Supabase Configuration
const SUPABASE_URL = 'https://spurpwnaeacgwojfpaem.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwdXJwd25hZWFjZ3dvamZwYWVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMjU2MDYsImV4cCI6MjA3MzkwMTYwNn0.VTKl3ZU6xVKcn3Ry1XTtY-Fpvm0cVqZiQcloJc33O-Y';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwdXJwd25hZWFjZ3dvamZwYWVtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODMyNTYwNiwiZXhwIjoyMDczOTAxNjA2fQ.qh776GiajyHVQECbhBAYLrQASVBx21K7dzAvsiL8Fy8';

// Admin Password
const ADMIN_PASSWORD = 'clone188';

// Initialize Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global State
let currentFilter = 'all';
let websiteSettings = null;
let allAnimations = [];
let currentEmojiTarget = null;
let allPaymentMethods = [];
let selectedProductImages = [];

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Enhanced Admin Panel initializing...');
    checkAdminAuth();
    hideLoading();
});

// ==================== LOADING & AUTHENTICATION ====================

function showLoading() {
    document.getElementById('loadingScreen').style.display = 'flex';
}

function hideLoading() {
    setTimeout(() => {
        document.getElementById('loadingScreen').style.display = 'none';
    }, 800);
}

function checkAdminAuth() {
    const isAdmin = localStorage.getItem('isAdmin');
    if (isAdmin === 'true') {
        showDashboard();
    } else {
        showLogin();
    }
}

function showLogin() {
    document.getElementById('adminLogin').style.display = 'flex';
    document.getElementById('adminDashboard').style.display = 'none';
}

function showDashboard() {
    document.getElementById('adminLogin').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'flex';
    loadAllData();
}

function adminLogin() {
    const password = document.getElementById('adminPassword').value;
    const errorEl = document.getElementById('loginError');

    if (password === ADMIN_PASSWORD) {
        localStorage.setItem('isAdmin', 'true');
        showDashboard();
    } else {
        showError(errorEl, 'Incorrect password!');
    }
}

function adminLogout() {
    localStorage.removeItem('isAdmin');
    location.reload();
}

// ==================== SECTION SWITCHING ====================

function switchSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionName).classList.add('active');

    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

    // Load section-specific data
    loadSectionData(sectionName);
}

function loadSectionData(section) {
    switch(section) {
        case 'website-settings':
            loadWebsiteSettings();
            break;
        case 'banners':
            loadBanners();
            break;
        case 'categories':
            loadCategories();
            break;
        case 'buttons':
            loadCategoryButtons();
            loadCategoriesForSelect();
            break;
        case 'tables':
            loadInputTables();
            loadCategoriesForSelect();
            break;
        case 'products':
            loadProducts();
            loadCategoriesForSelect();
            loadPaymentMethodsForSelection();
            break;
        case 'payments':
            loadPaymentMethods();
            break;
        case 'contacts':
            loadContacts();
            break;
        case 'videos':
            loadVideos();
            loadCategoriesForSelect();
            break;
        case 'animations':
            loadAnimations();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'users':
            loadUsers();
            break;
    }
}

// ==================== LOAD ALL DATA ====================

async function loadAllData() {
    console.log('📥 Loading all admin data...');
    await Promise.all([
        loadWebsiteSettings(),
        loadCategories(),
        loadBanners(),
        loadAnimations(),
        loadPaymentMethods()
    ]);
    console.log('✅ All admin data loaded');
}

// ==================== FILE UPLOAD HELPER ====================

async function uploadFile(file, folder) {
    try {
        console.log(`📤 Uploading file to ${folder}:`, file.name, `(${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data, error } = await supabase.storage
            .from('website-assets')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('website-assets')
            .getPublicUrl(fileName);

        console.log('✅ File uploaded successfully:', publicUrl);
        return publicUrl;
    } catch (error) {
        console.error('❌ Upload error:', error);
        return null;
    }
}

// ==================== ANIMATIONS/EMOJI SYSTEM ====================

async function loadAnimations() {
    try {
        console.log('🎭 Loading animations...');
        const { data, error } = await supabase
            .from('animations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        allAnimations = data || [];
        console.log(`✅ Loaded ${allAnimations.length} animations`);
        
        displayAnimations(allAnimations);
    } catch (error) {
        console.error('❌ Error loading animations:', error);
        allAnimations = [];
    }
}

function displayAnimations(animations) {
    const container = document.getElementById('animationsContainer');
    if (!container) return;

    container.innerHTML = '';

    if (animations.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:40px;">No animations yet. Upload your first animation!</p>';
        return;
    }

    animations.forEach(anim => {
        const item = document.createElement('div');
        item.className = 'animation-item';
        
        let preview = '';
        if (anim.file_type === 'gif' || anim.file_type === 'png' || anim.file_type === 'jpg' || anim.file_type === 'jpeg') {
            preview = `<img src="${anim.file_url}" alt="${anim.name}">`;
        } else if (anim.file_type === 'video' || anim.file_type === 'webm' || anim.file_type === 'mp4') {
            preview = `<video autoplay loop muted><source src="${anim.file_url}" type="video/${anim.file_type}"></video>`;
        } else if (anim.file_type === 'json') {
            preview = `<img src="${anim.file_url}" alt="${anim.name}">`;
        }

        item.innerHTML = `
            <div class="animation-preview">${preview}</div>
            <div class="animation-name">${anim.name}</div>
            <div class="animation-type">${anim.file_type.toUpperCase()}</div>
            <button class="animation-delete" onclick="deleteAnimation(${anim.id})"></button>
        `;

        container.appendChild(item);
    });
}

async function uploadAnimation() {
    const name = document.getElementById('animationName').value.trim();
    const file = document.getElementById('animationFile').files[0];

    if (!name || !file) {
        alert('Please enter name and select file');
        return;
    }

    showLoading();

    try {
        const fileUrl = await uploadFile(file, 'animations');
        
        if (!fileUrl) {
            throw new Error('File upload failed');
        }

        const fileExt = file.name.split('.').pop().toLowerCase();
        
        const { data, error } = await supabase
            .from('animations')
            .insert([{
                name: name,
                file_url: fileUrl,
                file_type: fileExt,
                file_size: file.size,
                width: null,
                height: null
            }])
            .select()
            .single();

        if (error) throw error;

        hideLoading();
        alert('✅ Animation uploaded successfully!');
        
        // Reset form
        document.getElementById('animationName').value = '';
        document.getElementById('animationFile').value = '';
        document.getElementById('animationFileInfo').innerHTML = '';
        
        await loadAnimations();

    } catch (error) {
        hideLoading();
        console.error('❌ Upload error:', error);
        alert('Error uploading animation: ' + error.message);
    }
}

async function deleteAnimation(id) {
    if (!confirm('Delete this animation?')) return;

    showLoading();

    try {
        const { error } = await supabase
            .from('animations')
            .delete()
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        alert('✅ Animation deleted!');
        await loadAnimations();

    } catch (error) {
        hideLoading();
        console.error('❌ Delete error:', error);
        alert('Error deleting animation');
    }
}

// ==================== EMOJI PICKER ====================

function openEmojiPicker(inputId) {
    currentEmojiTarget = document.getElementById(inputId);
    if (!currentEmojiTarget) return;

    const modal = document.getElementById('emojiPickerModal');
    const grid = document.getElementById('emojiGrid');
    
    grid.innerHTML = '';
    
    if (allAnimations.length === 0) {
        grid.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:40px;">No animations available. Upload some first!</p>';
    } else {
        allAnimations.forEach(anim => {
            const item = document.createElement('div');
            item.className = 'emoji-item';
            item.onclick = () => insertEmoji(anim);
            
            let preview = '';
            if (anim.file_type === 'gif' || anim.file_type === 'png' || anim.file_type === 'jpg' || anim.file_type === 'jpeg') {
                preview = `<img src="${anim.file_url}" alt="${anim.name}">`;
            } else if (anim.file_type === 'video' || anim.file_type === 'webm' || anim.file_type === 'mp4') {
                preview = `<video autoplay loop muted><source src="${anim.file_url}" type="video/${anim.file_type}"></video>`;
            } else {
                preview = `<img src="${anim.file_url}" alt="${anim.name}">`;
            }
            
            item.innerHTML = `
                ${preview}
                <div class="emoji-item-name">${anim.name}</div>
            `;
            
            grid.appendChild(item);
        });
    }
    
    modal.classList.add('active');
}

function openEmojiPickerForClass(button, className) {
    const inputGroup = button.closest('.table-input-group, .menu-input-group, .form-section');
    if (inputGroup) {
        currentEmojiTarget = inputGroup.querySelector('.' + className) || inputGroup.querySelector('#' + className);
    } else {
        currentEmojiTarget = button.previousElementSibling;
    }
    
    if (!currentEmojiTarget) return;

    const modal = document.getElementById('emojiPickerModal');
    const grid = document.getElementById('emojiGrid');
    
    grid.innerHTML = '';
    
    if (allAnimations.length === 0) {
        grid.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:40px;">No animations available</p>';
    } else {
        allAnimations.forEach(anim => {
            const item = document.createElement('div');
            item.className = 'emoji-item';
            item.onclick = () => insertEmoji(anim);
            
            let preview = '';
            if (anim.file_type === 'gif' || anim.file_type === 'png' || anim.file_type === 'jpg' || anim.file_type === 'jpeg') {
                preview = `<img src="${anim.file_url}" alt="${anim.name}">`;
            } else if (anim.file_type === 'video' || anim.file_type === 'webm' || anim.file_type === 'mp4') {
                preview = `<video autoplay loop muted><source src="${anim.file_url}" type="video/${anim.file_type}"></video>`;
            } else {
                preview = `<img src="${anim.file_url}" alt="${anim.name}">`;
            }
            
            item.innerHTML = `
                ${preview}
                <div class="emoji-item-name">${anim.name}</div>
            `;
            
            grid.appendChild(item);
        });
    }
    
    modal.classList.add('active');
}

function insertEmoji(animation) {
    if (!currentEmojiTarget) return;

    const cursorPos = currentEmojiTarget.selectionStart || currentEmojiTarget.value.length;
    const textBefore = currentEmojiTarget.value.substring(0, cursorPos);
    const textAfter = currentEmojiTarget.value.substring(cursorPos);
    
    const emojiCode = `{anim:${animation.id}:${animation.file_url}:${animation.file_type}}`;
    
    currentEmojiTarget.value = textBefore + emojiCode + textAfter;
    
    const newPos = cursorPos + emojiCode.length;
    currentEmojiTarget.setSelectionRange(newPos, newPos);
    currentEmojiTarget.focus();
    
    closeEmojiPicker();
}

function closeEmojiPicker() {
    document.getElementById('emojiPickerModal').classList.remove('active');
    currentEmojiTarget = null;
}

function filterEmojis() {
    const searchTerm = document.getElementById('emojiSearch').value.toLowerCase();
    const items = document.querySelectorAll('.emoji-item');
    
    items.forEach(item => {
        const name = item.querySelector('.emoji-item-name').textContent.toLowerCase();
        if (name.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function renderAnimatedText(text) {
    if (!text) return text;
    
    return text.replace(/\{anim:(\d+):([^:]+):([^}]+)\}/g, (match, id, url, type) => {
        if (type === 'gif' || type === 'png' || type === 'jpg' || type === 'jpeg') {
            return `<span class="animated-emoji"><img src="${url}" alt="emoji"></span>`;
        } else if (type === 'video' || type === 'webm' || type === 'mp4') {
            return `<span class="animated-emoji"><video autoplay loop muted><source src="${url}" type="video/${type}"></video></span>`;
        } else {
            return `<span class="animated-emoji"><img src="${url}" alt="emoji"></span>`;
        }
    });
}

// ==================== WEBSITE SETTINGS ====================

async function loadWebsiteSettings() {
    try {
        const { data, error } = await supabase
            .from('website_settings')
            .select('*')
            .single();

        if (data) {
            websiteSettings = data;
            document.getElementById('websiteName').value = data.website_name || '';
            
            if (data.logo_url) {
                document.getElementById('logoPreview').innerHTML = `<img src="${data.logo_url}">`;
            }
            if (data.background_url) {
                document.getElementById('bgPreview').innerHTML = `<img src="${data.background_url}">`;
            }
            if (data.loading_animation_url) {
                document.getElementById('loadingPreview').innerHTML = `<img src="${data.loading_animation_url}">`;
            }
            if (data.button_style_url) {
                document.getElementById('buttonPreview').innerHTML = `<img src="${data.button_style_url}">`;
            }
        } else {
            await supabase.from('website_settings').insert([{
                website_name: 'Gaming Store'
            }]);
            loadWebsiteSettings();
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

async function updateWebsiteName() {
    const name = document.getElementById('websiteName').value;
    showLoading();

    try {
        const { error } = await supabase
            .from('website_settings')
            .update({ website_name: name })
            .eq('id', websiteSettings.id);

        if (error) throw error;

        hideLoading();
        alert('Website name updated!');
        loadWebsiteSettings();
    } catch (error) {
        hideLoading();
        alert('Error updating');
        console.error(error);
    }
}

function previewLogo() {
    const file = document.getElementById('logoFile').files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('logoPreview').innerHTML = `<img src="${e.target.result}">`;
        };
        reader.readAsDataURL(file);
    }
}

async function uploadLogo() {
    const file = document.getElementById('logoFile').files[0];
    if (!file) {
        alert('Please select a file');
        return;
    }

    showLoading();
    const url = await uploadFile(file, 'logos');
    
    if (url) {
        await updateSettings({ logo_url: url });
        hideLoading();
        alert('Logo uploaded!');
    } else {
        hideLoading();
        alert('Error uploading');
    }
}

function previewBackground() {
    const file = document.getElementById('bgFile').files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('bgPreview').innerHTML = `<img src="${e.target.result}">`;
        };
        reader.readAsDataURL(file);
    }
}

async function uploadBackground() {
    const file = document.getElementById('bgFile').files[0];
    if (!file) {
        alert('Please select a file');
        return;
    }

    showLoading();
    const url = await uploadFile(file, 'backgrounds');
    
    if (url) {
        await updateSettings({ background_url: url });
        hideLoading();
        alert('Background uploaded!');
    } else {
        hideLoading();
        alert('Error uploading');
    }
}

async function uploadLoadingAnimation() {
    const file = document.getElementById('loadingFile').files[0];
    if (!file) {
        alert('Please select a file');
        return;
    }

    showLoading();
    const url = await uploadFile(file, 'animations');
    
    if (url) {
        await updateSettings({ loading_animation_url: url });
        hideLoading();
        alert('Loading animation uploaded!');
    } else {
        hideLoading();
        alert('Error uploading');
    }
}

async function uploadButtonStyle() {
    const file = document.getElementById('buttonFile').files[0];
    if (!file) {
        alert('Please select a file');
        return;
    }

    showLoading();
    const url = await uploadFile(file, 'buttons');
    
    if (url) {
        await updateSettings({ button_style_url: url });
        hideLoading();
        alert('Button style uploaded!');
    } else {
        hideLoading();
        alert('Error uploading');
    }
}

async function updateSettings(updates) {
    try {
        const { error } = await supabase
            .from('website_settings')
            .update(updates)
            .eq('id', websiteSettings.id);

        if (error) throw error;
        loadWebsiteSettings();
    } catch (error) {
        console.error('Error updating settings:', error);
    }
}

// ==================== BANNERS ====================

async function loadBanners() {
    try {
        const { data, error } = await supabase
            .from('banners')
            .select('*')
            .order('created_at', { ascending: false });

        const container = document.getElementById('bannersContainer');
        container.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(banner => {
                container.innerHTML += `
                    <div class="item-card">
                        <img src="${banner.image_url}" alt="Banner">
                        <div class="item-actions">
                            <button class="btn-danger" onclick="deleteBanner(${banner.id})">Delete</button>
                        </div>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<p>No banners yet</p>';
        }
    } catch (error) {
        console.error('Error loading banners:', error);
    }
}

async function addBanner() {
    const file = document.getElementById('bannerFile').files[0];
    if (!file) {
        alert('Please select a banner image');
        return;
    }

    showLoading();
    const url = await uploadFile(file, 'banners');
    
    if (url) {
        try {
            const { error } = await supabase
                .from('banners')
                .insert([{ image_url: url }]);

            if (error) throw error;

            hideLoading();
            alert('Banner added!');
            document.getElementById('bannerFile').value = '';
            loadBanners();
        } catch (error) {
            hideLoading();
            alert('Error adding banner');
            console.error(error);
        }
    } else {
        hideLoading();
        alert('Error uploading');
    }
}

async function deleteBanner(id) {
    if (!confirm('Delete this banner?')) return;

    showLoading();
    try {
        const { error } = await supabase
            .from('banners')
            .delete()
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        alert('Banner deleted!');
        loadBanners();
    } catch (error) {
        hideLoading();
        alert('Error deleting');
        console.error(error);
    }
}

// ==================== CATEGORIES ====================

async function loadCategories() {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('created_at', { ascending: true });

        const container = document.getElementById('categoriesContainer');
        container.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(category => {
                const titleHtml = renderAnimatedText(category.title);
                container.innerHTML += `
                    <div class="item-card">
                        <h4>${titleHtml}</h4>
                        <p>Created: ${new Date(category.created_at).toLocaleDateString()}</p>
                        <div class="item-actions">
                            <button class="btn-secondary" onclick="editCategory(${category.id}, '${category.title.replace(/'/g, "\\'")}')">Edit</button>
                            <button class="btn-danger" onclick="deleteCategory(${category.id})">Delete</button>
                        </div>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<p>No categories yet</p>';
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function loadCategoriesForSelect() {
    try {
        const { data } = await supabase
            .from('categories')
            .select('*')
            .order('created_at', { ascending: true });

        const selects = [
            'buttonCategorySelect',
            'tableCategorySelect',
            'productCategorySelect',
            'videoCategorySelect'
        ];

        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                select.innerHTML = '<option value="">Select Category</option>';
                if (data) {
                    data.forEach(cat => {
                        const titleText = cat.title.replace(/\{anim:[^}]+\}/g, '');
                        select.innerHTML += `<option value="${cat.id}">${titleText}</option>`;
                    });
                }
            }
        });
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function addCategory() {
    const title = document.getElementById('categoryTitle').value.trim();
    if (!title) {
        alert('Please enter a category title');
        return;
    }

    showLoading();
    try {
        const { error } = await supabase
            .from('categories')
            .insert([{ title: title }]);

        if (error) throw error;

        hideLoading();
        alert('Category added!');
        document.getElementById('categoryTitle').value = '';
        loadCategories();
        loadCategoriesForSelect();
    } catch (error) {
        hideLoading();
        alert('Error adding category');
        console.error(error);
    }
}

async function editCategory(id, currentTitle) {
    const newTitle = prompt('Enter new category title:', currentTitle);
    if (!newTitle || newTitle === currentTitle) return;

    showLoading();
    try {
        const { error } = await supabase
            .from('categories')
            .update({ title: newTitle })
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        alert('Category updated!');
        loadCategories();
    } catch (error) {
        hideLoading();
        alert('Error updating');
        console.error(error);
    }
}

async function deleteCategory(id) {
    if (!confirm('Delete this category? All related data will be deleted!')) return;

    showLoading();
    try {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        alert('Category deleted!');
        loadCategories();
    } catch (error) {
        hideLoading();
        alert('Error deleting');
        console.error(error);
    }
}

// ==================== CATEGORY BUTTONS ====================

async function loadCategoryButtons() {
    try {
        const { data, error } = await supabase
            .from('category_buttons')
            .select(`
                *,
                categories (title)
            `)
            .order('created_at', { ascending: true });

        const container = document.getElementById('buttonsContainer');
        container.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(button => {
                const nameHtml = renderAnimatedText(button.name);
                const categoryHtml = renderAnimatedText(button.categories.title);
                container.innerHTML += `
                    <div class="item-card">
                        <img src="${button.icon_url}" alt="${button.name}">
                        <h4>${nameHtml}</h4>
                        <p>Category: ${categoryHtml}</p>
                        <div class="item-actions">
                            <button class="btn-secondary" onclick="editButton(${button.id})">Edit</button>
                            <button class="btn-danger" onclick="deleteButton(${button.id})">Delete</button>
                        </div>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<p>No buttons yet</p>';
        }
    } catch (error) {
        console.error('Error loading buttons:', error);
    }
}

async function addCategoryButton() {
    const categoryId = document.getElementById('buttonCategorySelect').value;
    const name = document.getElementById('buttonName').value.trim();
    const file = document.getElementById('buttonIconFile').files[0];

    if (!categoryId || !name || !file) {
        alert('Please fill all fields and select an icon');
        return;
    }

    showLoading();
    const url = await uploadFile(file, 'category-icons');
    
    if (url) {
        try {
            const { error } = await supabase
                .from('category_buttons')
                .insert([{
                    category_id: categoryId,
                    name: name,
                    icon_url: url
                }]);

            if (error) throw error;

            hideLoading();
            alert('Button added!');
            document.getElementById('buttonName').value = '';
            document.getElementById('buttonIconFile').value = '';
            loadCategoryButtons();
        } catch (error) {
            hideLoading();
            alert('Error adding button');
            console.error(error);
        }
    } else {
        hideLoading();
        alert('Error uploading icon');
    }
}

async function editButton(id) {
    const { data: button } = await supabase
        .from('category_buttons')
        .select('*')
        .eq('id', id)
        .single();

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="form-group">
            <label>Name</label>
            <div class="input-with-emoji">
                <input type="text" id="editButtonName" value="${button.name}">
                <button class="emoji-picker-btn" onclick="openEmojiPicker('editButtonName')">😀</button>
            </div>
        </div>
        <button class="btn-primary" onclick="updateButton(${id})">Save Changes</button>
    `;

    document.getElementById('editModal').classList.add('active');
}

async function updateButton(id) {
    const name = document.getElementById('editButtonName').value.trim();

    if (!name) {
        alert('Please enter a name');
        return;
    }

    showLoading();
    try {
        const { error } = await supabase
            .from('category_buttons')
            .update({ name: name })
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        closeEditModal();
        alert('Button updated!');
        loadCategoryButtons();
    } catch (error) {
        hideLoading();
        alert('Error updating');
        console.error(error);
    }
}

async function deleteButton(id) {
    if (!confirm('Delete this button? All related data will be deleted!')) return;

    showLoading();
    try {
        const { error } = await supabase
            .from('category_buttons')
            .delete()
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        alert('Button deleted!');
        loadCategoryButtons();
    } catch (error) {
        hideLoading();
        alert('Error deleting');
        console.error(error);
    }
}

// ==================== INPUT TABLES ====================

async function loadButtonsForTables() {
    const categoryId = document.getElementById('tableCategorySelect').value;
    if (!categoryId) {
        document.getElementById('tableButtonSelect').innerHTML = '<option value="">Select Button</option>';
        return;
    }

    try {
        const { data } = await supabase
            .from('category_buttons')
            .select('*')
            .eq('category_id', categoryId);

        const select = document.getElementById('tableButtonSelect');
        select.innerHTML = '<option value="">Select Button</option>';
        
        if (data) {
            data.forEach(btn => {
                const nameText = btn.name.replace(/\{anim:[^}]+\}/g, '');
                select.innerHTML += `<option value="${btn.id}">${nameText}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading buttons:', error);
    }
}

function addTableInput() {
    const container = document.getElementById('tablesInputContainer');
    const newInput = document.createElement('div');
    newInput.className = 'table-input-group';
    newInput.innerHTML = `
        <button class="remove-input" onclick="this.parentElement.remove()"></button>
        <div class="input-with-emoji">
            <input type="text" class="table-name" placeholder="Table Name">
            <button class="emoji-picker-btn" onclick="openEmojiPickerForClass(this, 'table-name')">😀</button>
        </div>
        <div class="input-with-emoji">
            <input type="text" class="table-instruction" placeholder="Instruction">
            <button class="emoji-picker-btn" onclick="openEmojiPickerForClass(this, 'table-instruction')">😀</button>
        </div>
    `;
    container.appendChild(newInput);
}

async function saveTables() {
    const buttonId = document.getElementById('tableButtonSelect').value;
    if (!buttonId) {
        alert('Please select a button');
        return;
    }

    const tables = [];
    document.querySelectorAll('.table-input-group').forEach(group => {
        const name = group.querySelector('.table-name').value.trim();
        const instruction = group.querySelector('.table-instruction').value.trim();
        if (name && instruction) {
            tables.push({
                button_id: buttonId,
                name: name,
                instruction: instruction
            });
        }
    });

    if (tables.length === 0) {
        alert('Please add at least one table');
        return;
    }

    showLoading();
    try {
        const { error } = await supabase
            .from('input_tables')
            .insert(tables);

        if (error) throw error;

        hideLoading();
        alert('Tables saved!');
        document.getElementById('tablesInputContainer').innerHTML = `
            <div class="table-input-group">
                <div class="input-with-emoji">
                    <input type="text" class="table-name" placeholder="Table Name">
                    <button class="emoji-picker-btn" onclick="openEmojiPickerForClass(this, 'table-name')">😀</button>
                </div>
                <div class="input-with-emoji">
                    <input type="text" class="table-instruction" placeholder="Instruction">
                    <button class="emoji-picker-btn" onclick="openEmojiPickerForClass(this, 'table-instruction')">😀</button>
                </div>
            </div>
        `;
        loadInputTables();
    } catch (error) {
        hideLoading();
        alert('Error saving tables');
        console.error(error);
    }
}

async function loadInputTables() {
    try {
        const { data, error } = await supabase
            .from('input_tables')
            .select(`
                *,
                category_buttons (name, categories (title))
            `)
            .order('created_at', { ascending: true });

        const container = document.getElementById('tablesContainer');
        container.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(table => {
                const nameHtml = renderAnimatedText(table.name);
                const instructionHtml = renderAnimatedText(table.instruction);
                const buttonNameHtml = renderAnimatedText(table.category_buttons.name);
                const categoryHtml = renderAnimatedText(table.category_buttons.categories.title);
                
                container.innerHTML += `
                    <div class="item-card">
                        <h4>${nameHtml}</h4>
                        <p>Button: ${buttonNameHtml}</p>
                        <p>Category: ${categoryHtml}</p>
                        <p>Instruction: ${instructionHtml}</p>
                        <div class="item-actions">
                            <button class="btn-danger" onclick="deleteTable(${table.id})">Delete</button>
                        </div>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<p>No tables yet</p>';
        }
    } catch (error) {
        console.error('Error loading tables:', error);
    }
}

async function deleteTable(id) {
    if (!confirm('Delete?')) return;

    showLoading();
    try {
        const { error } = await supabase
            .from('input_tables')
            .delete()
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        alert('Table deleted!');
        loadInputTables();
    } catch (error) {
        hideLoading();
        alert('Error deleting');
        console.error(error);
    }
}

// ==================== ✨ ENHANCED PRODUCTS MANAGEMENT ====================

async function loadButtonsForProducts() {
    const categoryId = document.getElementById('productCategorySelect').value;
    if (!categoryId) {
        document.getElementById('productButtonSelect').innerHTML = '<option value="">Select Button (Page Location)</option>';
        return;
    }

    try {
        const { data } = await supabase
            .from('category_buttons')
            .select('*')
            .eq('category_id', categoryId);

        const select = document.getElementById('productButtonSelect');
        select.innerHTML = '<option value="">Select Button (Page Location)</option>';
        
        if (data) {
            data.forEach(btn => {
                const nameText = btn.name.replace(/\{anim:[^}]+\}/g, '');
                select.innerHTML += `<option value="${btn.id}">${nameText}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading buttons:', error);
    }
}

async function loadPaymentMethodsForSelection() {
    try {
        console.log('💳 Loading payment methods for product selection...');
        const { data, error } = await supabase
            .from('payment_methods')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;

        allPaymentMethods = data || [];
        console.log(`✅ Loaded ${allPaymentMethods.length} payment methods`);
        
        displayPaymentMethodsSelection();
    } catch (error) {
        console.error('❌ Error loading payment methods:', error);
        allPaymentMethods = [];
    }
}

function displayPaymentMethodsSelection() {
    const container = document.getElementById('paymentMethodsSelection');
    if (!container) return;

    container.innerHTML = '';

    if (allPaymentMethods.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:20px;">No payment methods available. Please add payment methods first.</p>';
        return;
    }

    allPaymentMethods.forEach(payment => {
        const item = document.createElement('div');
        item.className = 'payment-method-option';
        item.setAttribute('data-payment-id', payment.id);
        
        item.innerHTML = `
            <input type="checkbox" id="payment_${payment.id}" value="${payment.id}">
            <img src="${payment.icon_url}" alt="${payment.name}">
            <span>${payment.name}</span>
        `;

        // Add click handler for the whole item
        item.addEventListener('click', function(e) {
            if (e.target.tagName !== 'INPUT') {
                const checkbox = this.querySelector('input[type="checkbox"]');
                checkbox.checked = !checkbox.checked;
            }
            this.classList.toggle('selected', this.querySelector('input[type="checkbox"]').checked);
        });

        // Add change handler for the checkbox
        const checkbox = item.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', function() {
            item.classList.toggle('selected', this.checked);
        });

        container.appendChild(item);
    });
}

function previewProductImages() {
    const files = document.getElementById('productImages').files;
    const container = document.getElementById('productImagesPreview');
    const infoDiv = document.getElementById('uploadProgressInfo');
    
    container.innerHTML = '';
    selectedProductImages = [];
    
    if (files.length === 0) {
        infoDiv.innerHTML = '';
        return;
    }

    let totalSize = 0;
    const maxFileSize = 10 * 1024 * 1024; // 10MB per file
    const maxTotalSize = 50 * 1024 * 1024; // 50MB total
    
    Array.from(files).forEach((file, index) => {
        totalSize += file.size;
        
        if (file.size > maxFileSize) {
            alert(`File "${file.name}" is too large. Maximum file size is 10MB.`);
            return;
        }
        
        selectedProductImages.push(file);
        
        const item = document.createElement('div');
        item.className = 'image-preview-item';
        
        const reader = new FileReader();
        reader.onload = (e) => {
            item.innerHTML = `
                <img src="${e.target.result}" alt="${file.name}">
                <div class="file-name">${file.name}</div>
                <button class="remove-btn" onclick="removeProductImage(${index})">×</button>
            `;
        };
        reader.readAsDataURL(file);
        
        container.appendChild(item);
    });
    
    // Update info
    const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
    const maxSizeMB = (maxTotalSize / 1024 / 1024).toFixed(0);
    
    if (totalSize > maxTotalSize) {
        infoDiv.innerHTML = `
            <strong style="color: var(--error);">⚠️ Total size too large!</strong><br>
            Total: ${totalSizeMB}MB / ${maxSizeMB}MB<br>
            Please remove some images or compress them.
        `;
        infoDiv.style.borderColor = 'var(--error)';
        infoDiv.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
    } else {
        infoDiv.innerHTML = `
            <strong>📊 Upload Summary:</strong><br>
            Files: ${files.length} images<br>
            Total Size: ${totalSizeMB}MB / ${maxSizeMB}MB<br>
            Status: Ready to upload ✅
        `;
        infoDiv.style.borderColor = 'var(--success)';
        infoDiv.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
    }
}

function removeProductImage(index) {
    const files = document.getElementById('productImages').files;
    const dataTransfer = new DataTransfer();
    
    Array.from(files).forEach((file, i) => {
        if (i !== index) {
            dataTransfer.items.add(file);
        }
    });
    
    document.getElementById('productImages').files = dataTransfer.files;
    previewProductImages();
}

async function saveProduct() {
    console.log('🛍️ Starting product creation process...');
    
    // Validate form data
    const buttonId = document.getElementById('productButtonSelect').value;
    const name = document.getElementById('productName').value.trim();
    const description = document.getElementById('productDescription').value.trim();
    const category = document.getElementById('productCategory').value.trim();
    const quality = document.getElementById('productQuality').value.trim();
    const productType = document.getElementById('productType').value;
    const gameName = document.getElementById('gameName').value.trim();
    const availableQuantity = parseInt(document.getElementById('availableQuantity').value) || 1;
    const price = parseInt(document.getElementById('productPrice').value);
    const socialMediaName = document.getElementById('socialMediaName').value.trim();
    const socialMediaLink = document.getElementById('socialMediaLink').value.trim();
    
    // Validation
    if (!buttonId || !name || !description || !category || !productType || !price || !socialMediaName || !socialMediaLink) {
        alert('Please fill in all required fields');
        return;
    }
    
    if (price <= 0) {
        alert('Price must be greater than 0');
        return;
    }
    
    if (availableQuantity < 0) {
        alert('Available quantity cannot be negative');
        return;
    }
    
    // Get selected payment methods
    const selectedPayments = [];
    document.querySelectorAll('#paymentMethodsSelection input[type="checkbox"]:checked').forEach(checkbox => {
        selectedPayments.push(parseInt(checkbox.value));
    });
    
    if (selectedPayments.length === 0) {
        alert('Please select at least one payment method');
        return;
    }

    showLoading();

    try {
        // Upload product images
        const imageUrls = [];
        const files = document.getElementById('productImages').files;
        
        console.log(`📤 Uploading ${files.length} product images...`);
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            console.log(`📤 Uploading image ${i + 1}/${files.length}: ${file.name}`);
            
            const imageUrl = await uploadFile(file, 'product-images');
            if (imageUrl) {
                imageUrls.push(imageUrl);
                console.log(`✅ Image ${i + 1} uploaded successfully`);
            } else {
                console.error(`❌ Failed to upload image ${i + 1}`);
            }
        }
        
        console.log(`✅ Successfully uploaded ${imageUrls.length}/${files.length} images`);
        
        // Create product data
        const productData = {
            button_id: parseInt(buttonId),
            name: name,
            description: description,
            category: category,
            quality: quality || null,
            product_type: productType,
            game_name: gameName || null,
            available_quantity: availableQuantity,
            price: price,
            social_media_name: socialMediaName,
            social_media_link: socialMediaLink,
            product_images: JSON.stringify(imageUrls),
            selected_payment_methods: JSON.stringify(selectedPayments),
            is_active: true
        };
        
        console.log('🎯 Creating product with data:', productData);
        
        // Insert product
        const { data, error } = await supabase
            .from('products')
            .insert([productData])
            .select()
            .single();

        if (error) throw error;
        
        console.log('✅ Product created successfully:', data);

        hideLoading();
        alert('🎉 Product created successfully!');
        
        // Reset form
        resetProductForm();
        
        // Reload products
        await loadProducts();

    } catch (error) {
        hideLoading();
        console.error('❌ Error creating product:', error);
        alert('Error creating product: ' + error.message);
    }
}

function resetProductForm() {
    console.log('🔄 Resetting product form...');
    
    // Reset all form fields
    const formFields = [
        'productCategorySelect', 'productButtonSelect', 'productName', 
        'productDescription', 'productCategory', 'productQuality',
        'productType', 'gameName', 'availableQuantity', 'productPrice',
        'socialMediaName', 'socialMediaLink', 'productImages'
    ];
    
    formFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            if (field.type === 'file') {
                field.value = '';
            } else if (field.tagName === 'SELECT') {
                field.selectedIndex = 0;
            } else if (field.tagName === 'TEXTAREA') {
                field.value = '';
            } else {
                field.value = fieldId === 'availableQuantity' ? '1' : '';
            }
        }
    });
    
    // Reset payment method selections
    document.querySelectorAll('#paymentMethodsSelection input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
        checkbox.closest('.payment-method-option').classList.remove('selected');
    });
    
    // Clear image previews
    document.getElementById('productImagesPreview').innerHTML = '';
    document.getElementById('uploadProgressInfo').innerHTML = '';
    selectedProductImages = [];
    
    console.log('✅ Product form reset complete');
}

async function loadProducts() {
    try {
        console.log('🛍️ Loading products...');
        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                category_buttons (name, categories (title))
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        console.log(`✅ Loaded ${data?.length || 0} products`);
        displayProducts(data || []);
    } catch (error) {
        console.error('❌ Error loading products:', error);
    }
}

function displayProducts(products) {
    const container = document.getElementById('productsContainer');
    container.innerHTML = '';

    if (products.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:40px;grid-column:1/-1;">No products yet. Create your first product!</p>';
        return;
    }

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => showProductDetails(product);
        
        // Parse images and payments
        const images = JSON.parse(product.product_images || '[]');
        const paymentIds = JSON.parse(product.selected_payment_methods || '[]');
        
        // Get payment methods for this product
        const productPayments = allPaymentMethods.filter(p => paymentIds.includes(p.id));
        
        card.innerHTML = `
            <div class="product-card-header">
                <div>
                    <div class="product-title">${renderAnimatedText(product.name)}</div>
                    <div class="product-type">${product.product_type}</div>
                </div>
                <div class="product-status ${product.is_active ? 'active' : 'inactive'}">
                    ${product.is_active ? 'Active' : 'Inactive'}
                </div>
            </div>
            
            ${images.length > 0 ? `
                <div class="product-images-mini">
                    ${images.slice(0, 4).map(img => `<img src="${img}" alt="Product">`).join('')}
                    ${images.length > 4 ? `<div style="display:flex;align-items:center;justify-content:center;width:60px;height:60px;background:rgba(255,255,255,0.1);border-radius:8px;font-size:12px;">+${images.length - 4}</div>` : ''}
                </div>
            ` : ''}
            
            <div class="product-info">
                <p><strong>Category:</strong> ${renderAnimatedText(product.category)}</p>
                ${product.game_name ? `<p><strong>Game:</strong> ${renderAnimatedText(product.game_name)}</p>` : ''}
                ${product.quality ? `<p><strong>Quality:</strong> ${renderAnimatedText(product.quality)}</p>` : ''}
                <p><strong>Available:</strong> ${product.available_quantity}</p>
                <p><strong>Location:</strong> ${renderAnimatedText(product.category_buttons.categories.title)} → ${renderAnimatedText(product.category_buttons.name)}</p>
            </div>
            
            <div class="product-price">${product.price.toLocaleString()} MMK</div>
            
            ${productPayments.length > 0 ? `
                <div style="margin-bottom: 15px;">
                    <strong style="font-size: 14px; color: var(--text-secondary);">Payment Methods:</strong>
                    <div style="display: flex; gap: 5px; margin-top: 5px; flex-wrap: wrap;">
                        ${productPayments.slice(0, 3).map(p => `
                            <img src="${p.icon_url}" alt="${p.name}" title="${p.name}" 
                                 style="width: 24px; height: 24px; object-fit: contain; border-radius: 4px;">
                        `).join('')}
                        ${productPayments.length > 3 ? `<span style="font-size: 12px; color: var(--text-secondary);">+${productPayments.length - 3}</span>` : ''}
                    </div>
                </div>
            ` : ''}
            
            <div class="product-actions">
                <button onclick="event.stopPropagation(); editProduct(${product.id})" class="btn-secondary">Edit</button>
                <button onclick="event.stopPropagation(); toggleProductStatus(${product.id}, ${product.is_active})" class="btn-warning">
                    ${product.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button onclick="event.stopPropagation(); deleteProduct(${product.id})" class="btn-danger">Delete</button>
            </div>
        `;

        container.appendChild(card);
    });
}

function showProductDetails(product) {
    const modal = document.getElementById('productModal');
    const modalBody = document.getElementById('productModalBody');
    
    // Parse images and payments
    const images = JSON.parse(product.product_images || '[]');
    const paymentIds = JSON.parse(product.selected_payment_methods || '[]');
    const productPayments = allPaymentMethods.filter(p => paymentIds.includes(p.id));
    
    modalBody.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
            <div>
                <h3 style="margin-bottom: 20px; color: var(--primary-solid);">📝 Product Information</h3>
                <div style="background: rgba(255,255,255,0.02); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                    <h4 style="font-size: 24px; margin-bottom: 10px;">${renderAnimatedText(product.name)}</h4>
                    <p style="margin-bottom: 15px; line-height: 1.6;">${renderAnimatedText(product.description)}</p>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">
                        <div>
                            <strong>Category:</strong><br>
                            <span style="color: var(--text-secondary);">${renderAnimatedText(product.category)}</span>
                        </div>
                        <div>
                            <strong>Type:</strong><br>
                            <span style="color: var(--text-secondary);">${product.product_type}</span>
                        </div>
                        ${product.game_name ? `
                            <div>
                                <strong>Game:</strong><br>
                                <span style="color: var(--text-secondary);">${renderAnimatedText(product.game_name)}</span>
                            </div>
                        ` : ''}
                        ${product.quality ? `
                            <div>
                                <strong>Quality:</strong><br>
                                <span style="color: var(--text-secondary);">${renderAnimatedText(product.quality)}</span>
                            </div>
                        ` : ''}
                        <div>
                            <strong>Available:</strong><br>
                            <span style="color: var(--text-secondary);">${product.available_quantity}</span>
                        </div>
                        <div>
                            <strong>Price:</strong><br>
                            <span style="color: var(--success); font-size: 18px; font-weight: 600;">${product.price.toLocaleString()} MMK</span>
                        </div>
                    </div>
                </div>
                
                <h3 style="margin-bottom: 15px; color: var(--primary-solid);">📞 Contact Information</h3>
                <div style="background: rgba(255,255,255,0.02); padding: 20px; border-radius: 12px;">
                    <p><strong>Platform:</strong> ${renderAnimatedText(product.social_media_name)}</p>
                    <p><strong>Link:</strong> <a href="${product.social_media_link}" target="_blank" style="color: var(--primary-solid);">${product.social_media_link}</a></p>
                </div>
            </div>
            
            <div>
                ${images.length > 0 ? `
                    <h3 style="margin-bottom: 15px; color: var(--primary-solid);">📸 Product Images</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 30px;">
                        ${images.map(img => `
                            <img src="${img}" alt="Product" 
                                 style="width: 100%; height: 150px; object-fit: cover; border-radius: 12px; border: 2px solid var(--border); cursor: pointer;"
                                 onclick="window.open('${img}', '_blank')">
                        `).join('')}
                    </div>
                ` : ''}
                
                <h3 style="margin-bottom: 15px; color: var(--primary-solid);">💳 Available Payment Methods</h3>
                <div style="background: rgba(255,255,255,0.02); padding: 20px; border-radius: 12px;">
                    ${productPayments.length > 0 ? `
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                            ${productPayments.map(payment => `
                                <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                                    <img src="${payment.icon_url}" alt="${payment.name}" style="width: 30px; height: 30px; object-fit: contain;">
                                    <span>${renderAnimatedText(payment.name)}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p style="color: var(--text-secondary);">No payment methods selected</p>'}
                </div>
                
                <div style="margin-top: 30px;">
                    <h3 style="margin-bottom: 15px; color: var(--primary-solid);">📍 Location</h3>
                    <div style="background: rgba(255,255,255,0.02); padding: 20px; border-radius: 12px;">
                        <p><strong>Category:</strong> ${renderAnimatedText(product.category_buttons.categories.title)}</p>
                        <p><strong>Page:</strong> ${renderAnimatedText(product.category_buttons.name)}</p>
                        <p style="margin-top: 10px; color: var(--text-secondary); font-size: 14px;">
                            This product appears on the "${renderAnimatedText(product.category_buttons.name)}" page under "${renderAnimatedText(product.category_buttons.categories.title)}" category.
                        </p>
                    </div>
                </div>
            </div>
        </div>
        
        <div style="margin-top: 30px; text-align: center; padding-top: 20px; border-top: 1px solid var(--border);">
            <button onclick="editProduct(${product.id})" class="btn-secondary" style="margin-right: 10px;">Edit Product</button>
            <button onclick="toggleProductStatus(${product.id}, ${product.is_active})" class="btn-warning" style="margin-right: 10px;">
                ${product.is_active ? 'Deactivate' : 'Activate'}
            </button>
            <button onclick="deleteProduct(${product.id})" class="btn-danger">Delete Product</button>
        </div>
    `;
    
    modal.classList.add('active');
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
}

async function editProduct(id) {
    // This would open an edit form similar to the create form
    // For now, we'll just show an alert
    alert('Edit functionality coming soon! For now, you can delete and recreate the product.');
}

async function toggleProductStatus(id, currentStatus) {
    const newStatus = !currentStatus;
    const action = newStatus ? 'activate' : 'deactivate';
    
    if (!confirm(`Are you sure you want to ${action} this product?`)) return;

    showLoading();
    try {
        const { error } = await supabase
            .from('products')
            .update({ is_active: newStatus })
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        alert(`Product ${action}d successfully!`);
        await loadProducts();
        closeProductModal();
    } catch (error) {
        hideLoading();
        console.error('Error updating product status:', error);
        alert('Error updating product status');
    }
}

async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone!')) return;

    showLoading();
    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        alert('Product deleted successfully!');
        await loadProducts();
        closeProductModal();
    } catch (error) {
        hideLoading();
        console.error('Error deleting product:', error);
        alert('Error deleting product');
    }
}

// ==================== PAYMENT METHODS ====================

async function loadPaymentMethods() {
    try {
        const { data, error } = await supabase
            .from('payment_methods')
            .select('*')
            .order('created_at', { ascending: true });

        const container = document.getElementById('paymentsContainer');
        container.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(payment => {
                const nameHtml = renderAnimatedText(payment.name);
                const instructionsHtml = renderAnimatedText(payment.instructions || '');
                
                container.innerHTML += `
                    <div class="item-card">
                        <img src="${payment.icon_url}" alt="${payment.name}">
                        <h4>${nameHtml}</h4>
                        <p>${payment.address}</p>
                        <p>${instructionsHtml}</p>
                        <div class="item-actions">
                            <button class="btn-secondary" onclick="editPayment(${payment.id})">Edit</button>
                            <button class="btn-danger" onclick="deletePayment(${payment.id})">Delete</button>
                        </div>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<p>No payment methods yet</p>';
        }
        
        // Also update global state for product form
        allPaymentMethods = data || [];
        displayPaymentMethodsSelection();
    } catch (error) {
        console.error('Error loading payments:', error);
    }
}

async function addPaymentMethod() {
    const name = document.getElementById('paymentName').value.trim();
    const address = document.getElementById('paymentAddress').value.trim();
    const instructions = document.getElementById('paymentInstructions').value.trim();
    const file = document.getElementById('paymentIconFile').files[0];

    if (!name || !address || !file) {
        alert('Please fill all required fields');
        return;
    }

    showLoading();
    const url = await uploadFile(file, 'payment-icons');
    
    if (url) {
        try {
            const { error } = await supabase
                .from('payment_methods')
                .insert([{
                    name: name,
                    address: address,
                    instructions: instructions,
                    icon_url: url
                }]);

            if (error) throw error;

            hideLoading();
            alert('Payment method added!');
            document.getElementById('paymentName').value = '';
            document.getElementById('paymentAddress').value = '';
            document.getElementById('paymentInstructions').value = '';
            document.getElementById('paymentIconFile').value = '';
            loadPaymentMethods();
        } catch (error) {
            hideLoading();
            alert('Error adding payment method');
            console.error(error);
        }
    } else {
        hideLoading();
        alert('Error uploading icon');
    }
}

async function editPayment(id) {
    const { data: payment } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('id', id)
        .single();

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="form-group">
            <label>Name</label>
            <div class="input-with-emoji">
                <input type="text" id="editPaymentName" value="${payment.name}">
                <button class="emoji-picker-btn" onclick="openEmojiPicker('editPaymentName')">😀</button>
            </div>
        </div>
        <div class="form-group">
            <label>Address</label>
            <input type="text" id="editPaymentAddress" value="${payment.address}">
        </div>
        <div class="form-group">
            <label>Instructions</label>
            <div class="textarea-with-emoji">
                <textarea id="editPaymentInstructions" rows="3">${payment.instructions || ''}</textarea>
                <button class="emoji-picker-btn" onclick="openEmojiPicker('editPaymentInstructions')">😀</button>
            </div>
        </div>
        <button class="btn-primary" onclick="updatePayment(${id})">Save Changes</button>
    `;

    document.getElementById('editModal').classList.add('active');
}

async function updatePayment(id) {
    const name = document.getElementById('editPaymentName').value.trim();
    const address = document.getElementById('editPaymentAddress').value.trim();
    const instructions = document.getElementById('editPaymentInstructions').value.trim();

    if (!name || !address) {
        alert('Please fill all required fields');
        return;
    }

    showLoading();
    try {
        const { error } = await supabase
            .from('payment_methods')
            .update({
                name: name,
                address: address,
                instructions: instructions
            })
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        closeEditModal();
        alert('Payment method updated!');
        loadPaymentMethods();
    } catch (error) {
        hideLoading();
        alert('Error updating');
        console.error(error);
    }
}

async function deletePayment(id) {
    if (!confirm('Delete this payment method?')) return;

    showLoading();
    try {
        const { error } = await supabase
            .from('payment_methods')
            .delete()
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        alert('Payment method deleted!');
        loadPaymentMethods();
    } catch (error) {
        hideLoading();
        alert('Error deleting');
        console.error(error);
    }
}

// ==================== CONTACTS ====================

async function loadContacts() {
    try {
        const { data, error } = await supabase
            .from('contacts')
            .select('*')
            .order('created_at', { ascending: true });

        const container = document.getElementById('contactsContainer');
        container.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(contact => {
                const nameHtml = renderAnimatedText(contact.name);
                const descHtml = renderAnimatedText(contact.description || '');
                
                container.innerHTML += `
                    <div class="item-card">
                        <img src="${contact.icon_url}" alt="${contact.name}">
                        <h4>${nameHtml}</h4>
                        <p>${descHtml}</p>
                        ${contact.link ? `<p><a href="${contact.link}" target="_blank">Visit Link</a></p>` : ''}
                        ${contact.address ? `<p>${contact.address}</p>` : ''}
                        <div class="item-actions">
                            <button class="btn-secondary" onclick="editContact(${contact.id})">Edit</button>
                            <button class="btn-danger" onclick="deleteContact(${contact.id})">Delete</button>
                        </div>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<p>No contacts yet</p>';
        }
    } catch (error) {
        console.error('Error loading contacts:', error);
    }
}

async function addContact() {
    const name = document.getElementById('contactName').value.trim();
    const description = document.getElementById('contactDescription').value.trim();
    const link = document.getElementById('contactLink').value.trim();
    const address = document.getElementById('contactAddress').value.trim();
    const file = document.getElementById('contactIconFile').files[0];

    if (!name || !file) {
        alert('Please fill required fields');
        return;
    }

    showLoading();
    const url = await uploadFile(file, 'contact-icons');
    
    if (url) {
        try {
            const { error } = await supabase
                .from('contacts')
                .insert([{
                    name: name,
                    description: description,
                    link: link,
                    address: address,
                    icon_url: url
                }]);

            if (error) throw error;

            hideLoading();
            alert('Contact added!');
            document.getElementById('contactName').value = '';
            document.getElementById('contactDescription').value = '';
            document.getElementById('contactLink').value = '';
            document.getElementById('contactAddress').value = '';
            document.getElementById('contactIconFile').value = '';
            loadContacts();
        } catch (error) {
            hideLoading();
            alert('Error adding contact');
            console.error(error);
        }
    } else {
        hideLoading();
        alert('Error uploading icon');
    }
}

async function editContact(id) {
    const { data: contact } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single();

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="form-group">
            <label>Name</label>
            <div class="input-with-emoji">
                <input type="text" id="editContactName" value="${contact.name}">
                <button class="emoji-picker-btn" onclick="openEmojiPicker('editContactName')">😀</button>
            </div>
        </div>
        <div class="form-group">
            <label>Description</label>
            <div class="textarea-with-emoji">
                <textarea id="editContactDescription" rows="2">${contact.description || ''}</textarea>
                <button class="emoji-picker-btn" onclick="openEmojiPicker('editContactDescription')">😀</button>
            </div>
        </div>
        <div class="form-group">
            <label>Link</label>
            <input type="text" id="editContactLink" value="${contact.link || ''}">
        </div>
        <div class="form-group">
            <label>Address</label>
            <input type="text" id="editContactAddress" value="${contact.address || ''}">
        </div>
        <button class="btn-primary" onclick="updateContact(${id})">Save Changes</button>
    `;

    document.getElementById('editModal').classList.add('active');
}

async function updateContact(id) {
    const name = document.getElementById('editContactName').value.trim();
    const description = document.getElementById('editContactDescription').value.trim();
    const link = document.getElementById('editContactLink').value.trim();
    const address = document.getElementById('editContactAddress').value.trim();

    if (!name) {
        alert('Please enter a name');
        return;
    }

    showLoading();
    try {
        const { error } = await supabase
            .from('contacts')
            .update({
                name: name,
                description: description,
                link: link,
                address: address
            })
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        closeEditModal();
        alert('Contact updated!');
        loadContacts();
    } catch (error) {
        hideLoading();
        alert('Error updating');
        console.error(error);
    }
}

async function deleteContact(id) {
    if (!confirm('Delete this contact?')) return;

    showLoading();
    try {
        const { error } = await supabase
            .from('contacts')
            .delete()
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        alert('Contact deleted!');
        loadContacts();
    } catch (error) {
        hideLoading();
        alert('Error deleting');
        console.error(error);
    }
}

// ==================== VIDEOS ====================

async function loadButtonsForVideos() {
    const categoryId = document.getElementById('videoCategorySelect').value;
    if (!categoryId) {
        document.getElementById('videoButtonSelect').innerHTML = '<option value="">Select Button</option>';
        return;
    }

    try {
        const { data } = await supabase
            .from('category_buttons')
            .select('*')
            .eq('category_id', categoryId);

        const select = document.getElementById('videoButtonSelect');
        select.innerHTML = '<option value="">Select Button</option>';
        
        if (data) {
            data.forEach(btn => {
                const nameText = btn.name.replace(/\{anim:[^}]+\}/g, '');
                select.innerHTML += `<option value="${btn.id}">${nameText}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading buttons:', error);
    }
}

async function loadVideos() {
    try {
        const { data, error } = await supabase
            .from('youtube_videos')
            .select(`
                *,
                category_buttons (name, categories (title))
            `)
            .order('created_at', { ascending: true });

        const container = document.getElementById('videosContainer');
        container.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(video => {
                const descHtml = renderAnimatedText(video.description);
                const buttonNameHtml = renderAnimatedText(video.category_buttons.name);
                
                container.innerHTML += `
                    <div class="item-card">
                        <img src="${video.banner_url}" alt="Video Banner" onclick="window.open('${video.video_url}', '_blank')">
                        <h4>${descHtml}</h4>
                        <p>Button: ${buttonNameHtml}</p>
                        <p><a href="${video.video_url}" target="_blank">Watch Video</a></p>
                        <div class="item-actions">
                            <button class="btn-secondary" onclick="editVideo(${video.id})">Edit</button>
                            <button class="btn-danger" onclick="deleteVideo(${video.id})">Delete</button>
                        </div>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<p>No videos yet</p>';
        }
    } catch (error) {
        console.error('Error loading videos:', error);
    }
}

async function addVideo() {
    const buttonId = document.getElementById('videoButtonSelect').value;
    const videoUrl = document.getElementById('videoUrl').value.trim();
    const description = document.getElementById('videoDescription').value.trim();
    const file = document.getElementById('videoBannerFile').files[0];

    if (!buttonId || !videoUrl || !description || !file) {
        alert('Please fill all fields');
        return;
    }

    showLoading();
    const bannerUrl = await uploadFile(file, 'video-banners');
    
    if (bannerUrl) {
        try {
            const { error } = await supabase
                .from('youtube_videos')
                .insert([{
                    button_id: buttonId,
                    banner_url: bannerUrl,
                    video_url: videoUrl,
                    description: description
                }]);

            if (error) throw error;

            hideLoading();
            alert('Video added!');
            document.getElementById('videoUrl').value = '';
            document.getElementById('videoDescription').value = '';
            document.getElementById('videoBannerFile').value = '';
            loadVideos();
        } catch (error) {
            hideLoading();
            alert('Error adding video');
            console.error(error);
        }
    } else {
        hideLoading();
        alert('Error uploading banner');
    }
}

async function editVideo(id) {
    const { data: video } = await supabase
        .from('youtube_videos')
        .select('*')
        .eq('id', id)
        .single();

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="form-group">
            <label>Video URL</label>
            <input type="text" id="editVideoUrl" value="${video.video_url}">
        </div>
        <div class="form-group">
            <label>Description</label>
            <div class="textarea-with-emoji">
                <textarea id="editVideoDescription" rows="2">${video.description}</textarea>
                <button class="emoji-picker-btn" onclick="openEmojiPicker('editVideoDescription')">😀</button>
            </div>
        </div>
        <button class="btn-primary" onclick="updateVideo(${id})">Save Changes</button>
    `;

    document.getElementById('editModal').classList.add('active');
}

async function updateVideo(id) {
    const videoUrl = document.getElementById('editVideoUrl').value.trim();
    const description = document.getElementById('editVideoDescription').value.trim();

    if (!videoUrl || !description) {
        alert('Please fill all fields');
        return;
    }

    showLoading();
    try {
        const { error } = await supabase
            .from('youtube_videos')
            .update({
                video_url: videoUrl,
                description: description
            })
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        closeEditModal();
        alert('Video updated!');
        loadVideos();
    } catch (error) {
        hideLoading();
        alert('Error updating');
        console.error(error);
    }
}

async function deleteVideo(id) {
    if (!confirm('Delete this video?')) return;

    showLoading();
    try {
        const { error } = await supabase
            .from('youtube_videos')
            .delete()
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        alert('Video deleted!');
        loadVideos();
    } catch (error) {
        hideLoading();
        alert('Error deleting');
        console.error(error);
    }
}

// ==================== ORDERS ====================

async function loadOrders() {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                users (name, email),
                products (name, price),
                payment_methods (name)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        displayOrders(data || []);
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

function displayOrders(orders) {
    const container = document.getElementById('ordersContainer');
    container.innerHTML = '';

    if (orders.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:40px;">No orders yet</p>';
        return;
    }

    orders.forEach(order => {
        const item = document.createElement('div');
        item.className = 'order-item';

        let statusClass = 'pending';
        if (order.status === 'approved') statusClass = 'approved';
        if (order.status === 'rejected') statusClass = 'rejected';

        item.innerHTML = `
            <div class="order-header">
                <h4>Order #${order.id}</h4>
                <div class="order-status ${statusClass}">${order.status.toUpperCase()}</div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                    <p><strong>Customer:</strong> ${order.users?.name || 'Unknown'}</p>
                    <p><strong>Email:</strong> ${order.users?.email || 'Unknown'}</p>
                    <p><strong>Product:</strong> ${renderAnimatedText(order.products?.name || 'Unknown')}</p>
                    <p><strong>Price:</strong> ${order.total_price || order.products?.price || 0} MMK</p>
                </div>
                <div>
                    <p><strong>Payment:</strong> ${renderAnimatedText(order.payment_methods?.name || 'Unknown')}</p>
                    <p><strong>Transaction:</strong> ${order.transaction_code}</p>
                    <p><strong>Quantity:</strong> ${order.quantity || 1}</p>
                    <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
                </div>
            </div>
            ${order.table_data ? `
                <div style="margin-top: 15px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                    <strong>Additional Info:</strong><br>
                    ${Object.entries(order.table_data).map(([key, value]) => `<span style="color: var(--text-secondary);">${key}: ${value}</span>`).join('<br>')}
                </div>
            ` : ''}
            ${order.admin_message ? `
                <div style="margin-top: 15px; padding: 15px; background: rgba(251,191,36,0.1); border-radius: 8px; border: 1px solid #fbbf24;">
                    <strong>Admin Message:</strong><br>
                    <span style="color: var(--text-secondary);">${renderAnimatedText(order.admin_message)}</span>
                </div>
            ` : ''}
            <div style="margin-top: 15px; display: flex; gap: 10px;">
                <button onclick="updateOrderStatus(${order.id}, 'approved')" class="btn-primary" style="flex: 1;">Approve</button>
                <button onclick="updateOrderStatus(${order.id}, 'rejected')" class="btn-danger" style="flex: 1;">Reject</button>
                <button onclick="addOrderMessage(${order.id})" class="btn-secondary" style="flex: 1;">Add Message</button>
            </div>
        `;

        container.appendChild(item);
    });
}

async function updateOrderStatus(orderId, status) {
    const action = status === 'approved' ? 'approve' : 'reject';
    if (!confirm(`Are you sure you want to ${action} this order?`)) return;

    showLoading();
    try {
        const { error } = await supabase
            .from('orders')
            .update({ status: status })
            .eq('id', orderId);

        if (error) throw error;

        hideLoading();
        alert(`Order ${action}d successfully!`);
        loadOrders();
    } catch (error) {
        hideLoading();
        console.error('Error updating order:', error);
        alert('Error updating order status');
    }
}

async function addOrderMessage(orderId) {
    const message = prompt('Enter message for customer:');
    if (!message) return;

    showLoading();
    try {
        const { error } = await supabase
            .from('orders')
            .update({ admin_message: message })
            .eq('id', orderId);

        if (error) throw error;

        hideLoading();
        alert('Message added successfully!');
        loadOrders();
    } catch (error) {
        hideLoading();
        console.error('Error adding message:', error);
        alert('Error adding message');
    }
}

function filterOrders(status) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    const orderItems = document.querySelectorAll('.order-item');
    orderItems.forEach(item => {
        const orderStatus = item.querySelector('.order-status').textContent.toLowerCase();
        if (status === 'all' || orderStatus === status) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// ==================== USERS ====================

async function loadUsers() {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        displayUsers(data || []);
        updateUserStats(data || []);
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function displayUsers(users) {
    const container = document.getElementById('usersContainer');
    container.innerHTML = '';

    if (users.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:40px;">No users yet</p>';
        return;
    }

    users.forEach(user => {
        const item = document.createElement('div');
        item.className = 'item-card';

        item.innerHTML = `
            <h4>${user.name}</h4>
            <p><strong>Username:</strong> ${user.username}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Joined:</strong> ${new Date(user.created_at).toLocaleDateString()}</p>
            <div class="item-actions">
                <button class="btn-danger" onclick="deleteUser(${user.id})">Delete</button>
            </div>
        `;

        container.appendChild(item);
    });
}

function updateUserStats(users) {
    const total = users.length;
    const today = new Date().toDateString();
    const todayUsers = users.filter(user => new Date(user.created_at).toDateString() === today).length;

    document.getElementById('totalUsers').textContent = total;
    document.getElementById('todayUsers').textContent = todayUsers;
}

async function deleteUser(id) {
    if (!confirm('Delete this user? All their orders will also be deleted!')) return;

    showLoading();
    try {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) throw error;

        hideLoading();
        alert('User deleted!');
        loadUsers();
    } catch (error) {
        hideLoading();
        console.error('Error deleting user:', error);
        alert('Error deleting user');
    }
}

// ==================== MODAL FUNCTIONS ====================

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
}

function closeOrderModal() {
    document.getElementById('orderModal').classList.remove('active');
}

// ==================== UTILITY FUNCTIONS ====================

function showError(element, message) {
    element.textContent = message;
    element.classList.add('show');
    setTimeout(() => element.classList.remove('show'), 5000);
}

// ==================== FILE INPUT EVENT LISTENERS ====================

document.addEventListener('DOMContentLoaded', () => {
    // Animation file info
    const animFileInput = document.getElementById('animationFile');
    if (animFileInput) {
        animFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            const infoDiv = document.getElementById('animationFileInfo');
            
            if (file) {
                const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
                infoDiv.innerHTML = `
                    <strong>File:</strong> ${file.name}<br>
                    <strong>Type:</strong> ${file.type}<br>
                    <strong>Size:</strong> ${sizeMB} MB
                `;
            } else {
                infoDiv.innerHTML = '';
            }
        });
    }
});

console.log('✅ Enhanced Admin Panel JavaScript loaded successfully!')
