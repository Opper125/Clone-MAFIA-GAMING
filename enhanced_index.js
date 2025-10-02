// Enhanced Gaming Store Frontend JavaScript
// Complete Product Management System with Page-Style Category Design

// Supabase Configuration
const SUPABASE_URL = 'https://spurpwnaeacgwojfpaem.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwdXJwd25hZWFjZ3dvamZwYWVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMjU2MDYsImV4cCI6MjA3MzkwMTYwNn0.VTKl3ZU6xVKcn3Ry1XTtY-Fpvm0cVqZiQcloJc33O-Y';

// Initialize Supabase Client
let supabase;
try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase initialized successfully');
} catch (error) {
    console.error('❌ Supabase initialization failed:', error);
}

// ========== GLOBAL STATE ==========
window.appState = {
    currentUser: null,
    websiteSettings: null,
    categories: [],
    allProducts: [],
    currentProducts: [],
    allPayments: [],
    contacts: [],
    currentButtonId: null,
    currentButtonName: '',
    currentCategoryName: '',
    selectedProduct: null,
    selectedPayment: null,
    currentTableData: {},
    currentTables: [],
    currentVideos: [],
    currentImageIndex: 0,
    currentImages: [],
    pageHistory: ['home']
};

// ========== ANIMATION STICKER SUPPORT ==========

function renderAnimatedContent(text) {
    if (!text) return '';
    
    const urlPattern = /(https?:\/\/[^\s]+\.(?:gif|png|jpg|jpeg|webp|mp4|webm)(\?[^\s]*)?)/gi;
    
    return text.replace(urlPattern, (url) => {
        const extension = url.split('.').pop().toLowerCase().split('?')[0];
        
        if (['mp4', 'webm'].includes(extension)) {
            return `<video class="inline-animation" autoplay loop muted playsinline><source src="${url}" type="video/${extension}"></video>`;
        }
        
        if (['gif', 'png', 'jpg', 'jpeg', 'webp'].includes(extension)) {
            return `<img class="inline-animation" src="${url}" alt="sticker">`;
        }
        
        return url;
    });
}

function applyAnimationRendering(element, text) {
    if (!element || !text) return;
    element.innerHTML = renderAnimatedContent(text);
}

function addAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .inline-animation {
            display: inline-block;
            width: 24px;
            height: 24px;
            object-fit: contain;
            vertical-align: middle;
            margin: 0 2px;
            border-radius: 4px;
        }
        
        .product-card .inline-animation,
        .product-detail-info .inline-animation {
            width: 20px;
            height: 20px;
        }
        
        .history-item .inline-animation,
        .contact-info .inline-animation {
            width: 18px;
            height: 18px;
        }
        
        .payment-info .inline-animation {
            width: 22px;
            height: 22px;
        }

        .order-summary .inline-animation {
            width: 22px;
            height: 22px;
        }
    `;
    document.head.appendChild(style);
}

// ========== INITIALIZATION ==========

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Enhanced Gaming Store initializing...');
    addAnimationStyles();
    await testDatabaseConnection();
    await loadWebsiteSettings();
    checkAuth();
    hideLoading();
});

// ========== DATABASE CONNECTION ==========

async function testDatabaseConnection() {
    const statusEl = document.getElementById('connectionStatus');
    const statusText = statusEl.querySelector('.status-text');
    const statusIcon = statusEl.querySelector('.status-icon');
    
    try {
        statusText.textContent = 'Testing database connection...';
        console.log('🔍 Testing database connection...');
        
        const { data, error } = await supabase
            .from('website_settings')
            .select('id')
            .limit(1);
        
        if (error) throw error;
        
        statusEl.classList.add('connected');
        statusIcon.textContent = '✅';
        statusText.textContent = 'Database connected successfully!';
        console.log('✅ Database connection successful');
        
        setTimeout(() => {
            statusEl.classList.add('hide');
            setTimeout(() => statusEl.style.display = 'none', 500);
        }, 3000);
        
    } catch (error) {
        statusEl.classList.add('error');
        statusIcon.textContent = '❌';
        statusText.textContent = 'Database connection failed!';
        console.error('❌ Database connection failed:', error);
        setTimeout(() => statusEl.classList.add('hide'), 10000);
    }
}

// ========== LOADING & AUTH ==========

function showLoading() {
    document.getElementById('loadingScreen').style.display = 'flex';
}

function hideLoading() {
    setTimeout(() => {
        document.getElementById('loadingScreen').style.display = 'none';
    }, 1000);
}

function checkAuth() {
    const user = localStorage.getItem('currentUser');
    if (user) {
        window.appState.currentUser = JSON.parse(user);
        showApp();
    } else {
        showAuth();
    }
}

function showAuth() {
    document.getElementById('authContainer').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
}

function showApp() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    loadAppData();
}

function showLogin() {
    document.getElementById('loginForm').classList.add('active');
    document.getElementById('signupForm').classList.remove('active');
}

function showSignup() {
    document.getElementById('signupForm').classList.add('active');
    document.getElementById('loginForm').classList.remove('active');
}

// ========== SIGNUP & LOGIN ==========

async function handleSignup() {
    const name = document.getElementById('signupName').value.trim();
    const username = document.getElementById('signupUsername').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const terms = document.getElementById('termsCheckbox').checked;
    const errorEl = document.getElementById('signupError');

    if (!name || !username || !email || !password) {
        showError(errorEl, 'Please fill in all fields');
        return;
    }

    if (!terms) {
        showError(errorEl, 'Please agree to the terms and conditions');
        return;
    }

    if (!validateEmail(email)) {
        showError(errorEl, 'Please enter a valid email address');
        return;
    }

    showLoading();

    try {
        const { data: usernameCheck } = await supabase
            .from('users')
            .select('username')
            .eq('username', username)
            .single();

        if (usernameCheck) {
            hideLoading();
            showError(errorEl, 'Username already exists');
            return;
        }

        const { data: emailCheck } = await supabase
            .from('users')
            .select('email')
            .eq('email', email)
            .single();

        if (emailCheck) {
            hideLoading();
            showError(errorEl, 'Email already exists');
            return;
        }

        const { data, error } = await supabase
            .from('users')
            .insert([{
                name: name,
                username: username,
                email: email,
                password: password,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;

        hideLoading();
        window.appState.currentUser = data;
        localStorage.setItem('currentUser', JSON.stringify(data));
        showApp();

    } catch (error) {
        hideLoading();
        showError(errorEl, 'An error occurred during signup');
        console.error('❌ Signup error:', error);
    }
}

async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');

    if (!email || !password) {
        showError(errorEl, 'Please fill in all fields');
        return;
    }

    showLoading();

    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !data) {
            hideLoading();
            showError(errorEl, 'No account found with this email');
            return;
        }

        if (data.password !== password) {
            hideLoading();
            showError(errorEl, 'Incorrect password');
            return;
        }

        hideLoading();
        window.appState.currentUser = data;
        localStorage.setItem('currentUser', JSON.stringify(data));
        showApp();

    } catch (error) {
        hideLoading();
        showError(errorEl, 'An error occurred during login');
        console.error('❌ Login error:', error);
    }
}

function handleLogout() {
    localStorage.removeItem('currentUser');
    window.appState.currentUser = null;
    location.reload();
}

// ========== WEBSITE SETTINGS ==========

async function loadWebsiteSettings() {
    try {
        const { data, error } = await supabase
            .from('website_settings')
            .select('*')
            .single();

        if (data) {
            window.appState.websiteSettings = data;
            applyWebsiteSettings();
        }
    } catch (error) {
        console.error('❌ Error loading settings:', error);
    }
}

function applyWebsiteSettings() {
    const settings = window.appState.websiteSettings;
    if (!settings) return;

    const logos = document.querySelectorAll('#authLogo, #appLogo');
    logos.forEach(logo => {
        if (settings.logo_url) {
            logo.src = settings.logo_url;
            logo.style.display = 'block';
        }
    });

    const names = document.querySelectorAll('#authWebsiteName, #appWebsiteName');
    names.forEach(name => {
        if (settings.website_name) {
            name.textContent = settings.website_name;
        }
    });

    if (settings.background_url) {
        const bgElement = document.getElementById('dynamicBackground');
        if (bgElement) {
            bgElement.style.backgroundImage = `url(${settings.background_url})`;
        }
    }

    if (settings.loading_animation_url) {
        applyLoadingAnimation(settings.loading_animation_url);
    }
}

function applyLoadingAnimation(animationUrl) {
    const loadingContainer = document.getElementById('loadingAnimation');
    if (!loadingContainer) return;

    const fileExt = animationUrl.split('.').pop().toLowerCase();
    const spinner = loadingContainer.querySelector('.spinner');
    if (spinner) spinner.remove();

    if (['gif', 'png', 'jpg', 'jpeg', 'json'].includes(fileExt)) {
        loadingContainer.innerHTML = `
            <img src="${animationUrl}" alt="Loading" style="max-width: 200px; max-height: 200px;">
            <p style="margin-top: 15px; color: white;">Loading...</p>
        `;
    } else if (['webm', 'mp4'].includes(fileExt)) {
        loadingContainer.innerHTML = `
            <video autoplay loop muted style="max-width: 200px; max-height: 200px;">
                <source src="${animationUrl}" type="video/${fileExt}">
            </video>
            <p style="margin-top: 15px; color: white;">Loading...</p>
        `;
    }
}

// ========== LOAD APP DATA ==========

async function loadAppData() {
    await Promise.all([
        loadBanners(),
        loadCategories(),
        loadAllPayments(),
        loadContacts(),
        loadProfile(),
        loadOrderHistory()
    ]);
}

// ========== BANNERS ==========

async function loadBanners() {
    try {
        const { data, error } = await supabase
            .from('banners')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
            displayBanners(data);
        }
    } catch (error) {
        console.error('❌ Error loading banners:', error);
    }
}

function displayBanners(banners) {
    const container = document.getElementById('bannerContainer');
    container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'banner-wrapper';

    banners.forEach(banner => {
        const item = document.createElement('div');
        item.className = 'banner-item';
        item.innerHTML = `<img src="${banner.image_url}" alt="Banner">`;
        wrapper.appendChild(item);
    });

    container.appendChild(wrapper);

    if (banners.length > 1) {
        let currentIndex = 0;
        setInterval(() => {
            currentIndex = (currentIndex + 1) % banners.length;
            wrapper.style.transform = `translateX(-${currentIndex * 100}%)`;
        }, 5000);
    }
}

// ========== CATEGORIES ==========

async function loadCategories() {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
            for (const category of data) {
                const { data: buttons } = await supabase
                    .from('category_buttons')
                    .select('*')
                    .eq('category_id', category.id)
                    .order('created_at', { ascending: true });
                
                category.category_buttons = buttons || [];
            }
            
            window.appState.categories = data;
            displayCategories(data);
        }
    } catch (error) {
        console.error('❌ Error loading categories:', error);
    }
}

function displayCategories(categories) {
    const container = document.getElementById('categoriesContainer');
    container.innerHTML = '';

    categories.forEach(category => {
        if (category.category_buttons && category.category_buttons.length > 0) {
            const section = document.createElement('div');
            section.className = 'category-section';

            const titleDiv = document.createElement('h3');
            titleDiv.className = 'category-title';
            applyAnimationRendering(titleDiv, category.title);

            section.appendChild(titleDiv);
            
            const buttonsDiv = document.createElement('div');
            buttonsDiv.className = 'category-buttons';
            buttonsDiv.id = `category-${category.id}`;
            section.appendChild(buttonsDiv);

            container.appendChild(section);
            displayCategoryButtons(category.id, category.category_buttons, category.title);
        }
    });
}

function displayCategoryButtons(categoryId, buttons, categoryTitle) {
    const container = document.getElementById(`category-${categoryId}`);
    if (!container) return;

    buttons.forEach(button => {
        const btnEl = document.createElement('div');
        btnEl.className = 'category-button';
        btnEl.innerHTML = `
            <img src="${button.icon_url}" alt="${button.name}">
            <span></span>
        `;
        
        const nameSpan = btnEl.querySelector('span');
        applyAnimationRendering(nameSpan, button.name);
        
        btnEl.addEventListener('click', () => openCategoryProductsPage(categoryId, button.id, button.name, categoryTitle));
        container.appendChild(btnEl);
    });
}

// ========== ✨ NEW: CATEGORY PRODUCTS PAGE ==========

async function openCategoryProductsPage(categoryId, buttonId, buttonName, categoryTitle) {
    console.log('\n🛍️ ========== OPENING CATEGORY PRODUCTS PAGE ==========');
    console.log('Category ID:', categoryId);
    console.log('Button ID:', buttonId);
    console.log('Button Name:', buttonName);
    console.log('Category Title:', categoryTitle);
    
    showLoading();

    try {
        // Store current state
        window.appState.currentButtonId = buttonId;
        window.appState.currentButtonName = buttonName;
        window.appState.currentCategoryName = categoryTitle;
        
        // Load data for this button/page
        const [productsResult, tablesResult, videosResult] = await Promise.all([
            supabase.from('products').select('*').eq('button_id', buttonId).eq('is_active', true).order('created_at', { ascending: false }),
            supabase.from('input_tables').select('*').eq('button_id', buttonId).order('created_at', { ascending: true }),
            supabase.from('youtube_videos').select('*').eq('button_id', buttonId).order('created_at', { ascending: true })
        ]);

        if (productsResult.error) throw productsResult.error;
        if (tablesResult.error) throw tablesResult.error;
        if (videosResult.error) throw videosResult.error;

        const products = productsResult.data || [];
        const tables = tablesResult.data || [];
        const videos = videosResult.data || [];

        // Store in global state
        window.appState.allProducts = products;
        window.appState.currentProducts = products;
        window.appState.currentTables = tables;
        window.appState.currentVideos = videos;

        console.log('✅ Loaded data:');
        console.log('  - Products:', products.length);
        console.log('  - Tables:', tables.length);
        console.log('  - Videos:', videos.length);

        hideLoading();

        // Show category page
        showCategoryProductsPage();

    } catch (error) {
        hideLoading();
        console.error('❌ Error loading category data:', error);
        alert('Error loading products. Please try again.');
    }
}

function showCategoryProductsPage() {
    console.log('📄 Showing category products page');
    
    // Update page title and subtitle
    const titleEl = document.getElementById('categoryPageTitle');
    const subtitleEl = document.getElementById('categoryPageSubtitle');
    
    if (titleEl) {
        applyAnimationRendering(titleEl, window.appState.currentButtonName);
    }
    if (subtitleEl) {
        subtitleEl.textContent = `Browse ${window.appState.currentCategoryName} products`;
    }
    
    // Display products
    displayProducts(window.appState.currentProducts);
    
    // Display videos if available
    if (window.appState.currentVideos.length > 0) {
        displayVideoTutorials(window.appState.currentVideos);
        document.getElementById('videoTutorials').style.display = 'block';
    } else {
        document.getElementById('videoTutorials').style.display = 'none';
    }
    
    // Switch to category page
    switchPage('category');
    
    // Add to history and show back button
    window.appState.pageHistory.push('category');
    document.getElementById('backButton').style.display = 'block';
}

function displayProducts(products) {
    const container = document.getElementById('productsGrid');
    container.innerHTML = '';

    if (products.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <h3>No Products Available</h3>
                <p>No products found for this category. Please check back later!</p>
            </div>
        `;
        return;
    }

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => showProductDetails(product);
        
        // Parse images and payment methods
        const images = JSON.parse(product.product_images || '[]');
        const paymentIds = JSON.parse(product.selected_payment_methods || '[]');
        
        card.innerHTML = `
            <div class="product-header">
                <div>
                    <div class="product-title"></div>
                    <div class="product-type-badge">${product.product_type}</div>
                </div>
            </div>
            
            ${images.length > 0 ? `
                <div class="product-images">
                    ${images.slice(0, 4).map(img => `<img src="${img}" alt="Product" class="product-image-thumb" onclick="event.stopPropagation(); openImageViewer(${JSON.stringify(images).replace(/"/g, '&quot;')}, 0)">`).join('')}
                    ${images.length > 4 ? `<div style="display:flex;align-items:center;justify-content:center;width:80px;height:80px;background:rgba(255,255,255,0.1);border-radius:12px;font-size:12px;color:var(--text-secondary);">+${images.length - 4}</div>` : ''}
                </div>
            ` : ''}
            
            <div class="product-description"></div>
            
            <div class="product-info">
                <p><strong>Category:</strong> <span class="product-category"></span></p>
                ${product.game_name ? `<p><strong>Game:</strong> <span class="product-game"></span></p>` : ''}
                ${product.quality ? `<p><strong>Quality:</strong> <span class="product-quality"></span></p>` : ''}
                <p><strong>Available:</strong> ${product.available_quantity}</p>
            </div>
            
            <div class="product-price">${product.price.toLocaleString()} MMK</div>
            
            <div class="product-actions">
                <button onclick="event.stopPropagation(); buyProduct(${product.id})" class="btn-buy">🛒 Buy Now</button>
                <button onclick="event.stopPropagation(); contactSeller(${product.id})" class="btn-contact">📞 Contact</button>
            </div>
        `;

        // Apply animation rendering after DOM is ready
        setTimeout(() => {
            const titleEl = card.querySelector('.product-title');
            const categoryEl = card.querySelector('.product-category');
            const gameEl = card.querySelector('.product-game');
            const qualityEl = card.querySelector('.product-quality');
            const descEl = card.querySelector('.product-description');
            
            if (titleEl) applyAnimationRendering(titleEl, product.name);
            if (categoryEl) applyAnimationRendering(categoryEl, product.category);
            if (gameEl) applyAnimationRendering(gameEl, product.game_name);
            if (qualityEl) applyAnimationRendering(qualityEl, product.quality);
            if (descEl) applyAnimationRendering(descEl, product.description);
        }, 50);

        container.appendChild(card);
    });
}

function displayVideoTutorials(videos) {
    const container = document.getElementById('videosGrid');
    container.innerHTML = '';

    videos.forEach(video => {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.addEventListener('click', () => window.open(video.video_url, '_blank'));
        
        card.innerHTML = `
            <img src="${video.banner_url}" alt="Video Thumbnail">
            <p class="video-description"></p>
        `;

        // Apply animation rendering
        setTimeout(() => {
            const descEl = card.querySelector('.video-description');
            if (descEl) applyAnimationRendering(descEl, video.description);
        }, 50);

        container.appendChild(card);
    });
}

// ========== PRODUCT FILTERING & SORTING ==========

function filterProducts() {
    const searchTerm = document.getElementById('productSearch').value.toLowerCase();
    const typeFilter = document.getElementById('typeFilter').value;
    
    let filteredProducts = window.appState.allProducts;
    
    // Apply search filter
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            (product.game_name && product.game_name.toLowerCase().includes(searchTerm)) ||
            product.category.toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply type filter
    if (typeFilter) {
        filteredProducts = filteredProducts.filter(product => product.product_type === typeFilter);
    }
    
    window.appState.currentProducts = filteredProducts;
    displayProducts(filteredProducts);
}

function sortProducts() {
    const sortBy = document.getElementById('sortFilter').value;
    let sortedProducts = [...window.appState.currentProducts];
    
    switch (sortBy) {
        case 'newest':
            sortedProducts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
        case 'oldest':
            sortedProducts.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            break;
        case 'price_low':
            sortedProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price_high':
            sortedProducts.sort((a, b) => b.price - a.price);
            break;
        case 'name':
            sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
    }
    
    window.appState.currentProducts = sortedProducts;
    displayProducts(sortedProducts);
}

// ========== ✨ NEW: ENHANCED PRODUCT DETAILS ==========

function showProductDetails(product) {
    console.log('🔍 Showing product details:', product.name);
    
    const modal = document.getElementById('productModal');
    const modalBody = document.getElementById('productModalBody');
    
    // Parse images and payment methods
    const images = JSON.parse(product.product_images || '[]');
    const paymentIds = JSON.parse(product.selected_payment_methods || '[]');
    const productPayments = window.appState.allPayments.filter(p => paymentIds.includes(p.id));
    
    modalBody.innerHTML = `
        <div class="product-detail-left">
            ${images.length > 0 ? `
                <div class="product-detail-images">
                    ${images.map((img, index) => `
                        <img src="${img}" alt="Product Image" 
                             class="product-detail-image"
                             onclick="openImageViewer(${JSON.stringify(images).replace(/"/g, '&quot;')}, ${index})">
                    `).join('')}
                </div>
            ` : '<div class="no-images">No images available</div>'}
            
            <div class="product-contact-info">
                <h4>📞 Contact Seller</h4>
                <div style="display: flex; align-items: center; gap: 10px; margin-top: 10px;">
                    <strong class="contact-platform"></strong>
                    <a href="${product.social_media_link}" target="_blank" class="btn-contact" style="padding: 8px 16px; text-decoration: none; display: inline-block;">
                        Contact Now
                    </a>
                </div>
            </div>
        </div>
        
        <div class="product-detail-right">
            <div class="product-detail-info">
                <h3 class="product-detail-title"></h3>
                <div class="product-detail-price">${product.price.toLocaleString()} MMK</div>
                
                <div class="product-detail-description"></div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
                    <div>
                        <strong>Category:</strong><br>
                        <span class="detail-category" style="color: var(--text-secondary);"></span>
                    </div>
                    <div>
                        <strong>Type:</strong><br>
                        <span style="color: var(--text-secondary);">${product.product_type}</span>
                    </div>
                    ${product.game_name ? `
                        <div>
                            <strong>Game:</strong><br>
                            <span class="detail-game" style="color: var(--text-secondary);"></span>
                        </div>
                    ` : ''}
                    ${product.quality ? `
                        <div>
                            <strong>Quality:</strong><br>
                            <span class="detail-quality" style="color: var(--text-secondary);"></span>
                        </div>
                    ` : ''}
                    <div>
                        <strong>Available:</strong><br>
                        <span style="color: var(--text-secondary);">${product.available_quantity}</span>
                    </div>
                </div>
                
                ${productPayments.length > 0 ? `
                    <div>
                        <h4 style="margin-bottom: 15px;">💳 Payment Methods</h4>
                        <div class="product-payment-methods">
                            ${productPayments.map(payment => `
                                <div class="payment-method-mini">
                                    <img src="${payment.icon_url}" alt="${payment.name}">
                                    <span class="payment-method-name" data-payment-id="${payment.id}"></span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : '<p style="color: var(--warning-color);">No payment methods available for this product</p>'}
                
                <div style="margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <button onclick="buyProduct(${product.id})" class="btn-buy" style="padding: 15px; font-size: 16px;">
                        🛒 Buy Now
                    </button>
                    <button onclick="contactSeller(${product.id})" class="btn-contact" style="padding: 15px; font-size: 16px;">
                        📞 Contact Seller
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Apply animation rendering after DOM is ready
    setTimeout(() => {
        const titleEl = modalBody.querySelector('.product-detail-title');
        const descEl = modalBody.querySelector('.product-detail-description');
        const categoryEl = modalBody.querySelector('.detail-category');
        const gameEl = modalBody.querySelector('.detail-game');
        const qualityEl = modalBody.querySelector('.detail-quality');
        const contactEl = modalBody.querySelector('.contact-platform');
        
        if (titleEl) applyAnimationRendering(titleEl, product.name);
        if (descEl) applyAnimationRendering(descEl, product.description);
        if (categoryEl) applyAnimationRendering(categoryEl, product.category);
        if (gameEl) applyAnimationRendering(gameEl, product.game_name);
        if (qualityEl) applyAnimationRendering(qualityEl, product.quality);
        if (contactEl) applyAnimationRendering(contactEl, product.social_media_name);
        
        // Render payment method names
        productPayments.forEach(payment => {
            const paymentNameEl = modalBody.querySelector(`[data-payment-id="${payment.id}"]`);
            if (paymentNameEl) applyAnimationRendering(paymentNameEl, payment.name);
        });
    }, 50);
    
    modal.classList.add('active');
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
}

// ========== IMAGE VIEWER ==========

function openImageViewer(images, startIndex = 0) {
    console.log('🖼️ Opening image viewer', { images, startIndex });
    
    window.appState.currentImages = images;
    window.appState.currentImageIndex = startIndex;
    
    const modal = document.getElementById('imageViewerModal');
    const img = document.getElementById('viewerImage');
    const counter = document.getElementById('imageCounter');
    
    img.src = images[startIndex];
    counter.textContent = `${startIndex + 1} / ${images.length}`;
    
    // Show/hide navigation arrows
    const prevBtn = modal.querySelector('.nav-prev');
    const nextBtn = modal.querySelector('.nav-next');
    
    prevBtn.style.display = images.length > 1 ? 'block' : 'none';
    nextBtn.style.display = images.length > 1 ? 'block' : 'none';
    
    modal.classList.add('active');
}

function closeImageViewer() {
    document.getElementById('imageViewerModal').classList.remove('active');
}

function prevImage() {
    const images = window.appState.currentImages;
    const currentIndex = window.appState.currentImageIndex;
    
    const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    openImageViewer(images, newIndex);
}

function nextImage() {
    const images = window.appState.currentImages;
    const currentIndex = window.appState.currentImageIndex;
    
    const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    openImageViewer(images, newIndex);
}

// ========== PURCHASE FLOW ==========

async function buyProduct(productId) {
    console.log('\n🛒 ========== STARTING PURCHASE FLOW ==========');
    console.log('Product ID:', productId);
    
    // Find product
    const product = window.appState.allProducts.find(p => p.id === productId);
    if (!product) {
        console.error('❌ Product not found');
        alert('Product not found. Please try again.');
        return;
    }
    
    console.log('✅ Product found:', product.name);
    window.appState.selectedProduct = product;
    
    // Check if we need input tables first
    if (window.appState.currentTables.length > 0) {
        console.log('📝 Showing purchase form with input tables');
        showPurchaseForm();
    } else {
        console.log('💳 Going directly to payment');
        showPaymentForm();
    }
}

function showPurchaseForm() {
    const modal = document.getElementById('purchaseModal');
    const content = document.getElementById('purchaseContent');
    const product = window.appState.selectedProduct;
    const tables = window.appState.currentTables;
    
    let html = '<div class="purchase-form">';
    
    // Product summary
    html += `
        <div class="order-summary">
            <h3 class="product-summary-name"></h3>
            <p class="product-summary-description"></p>
            <div class="product-summary-price">${product.price.toLocaleString()} MMK</div>
        </div>
    `;
    
    // Input tables
    if (tables.length > 0) {
        html += '<h3 style="margin: 20px 0 15px 0;">📝 Required Information</h3>';
        tables.forEach(table => {
            html += `
                <div class="form-group">
                    <label data-table-label="${table.id}"></label>
                    <input type="text" 
                           id="table-${table.id}" 
                           data-table-id="${table.id}"
                           placeholder="${table.instruction || ''}"
                           required>
                </div>
            `;
        });
    }
    
    html += `<button class="btn-primary" onclick="proceedToPayment()" style="margin-top: 20px; width: 100%;">Continue to Payment</button>`;
    html += '</div>';
    
    content.innerHTML = html;
    modal.classList.add('active');
    
    // Apply animation rendering
    setTimeout(() => {
        const nameEl = content.querySelector('.product-summary-name');
        const descEl = content.querySelector('.product-summary-description');
        if (nameEl) applyAnimationRendering(nameEl, product.name);
        if (descEl) applyAnimationRendering(descEl, product.description);
        
        tables.forEach(table => {
            const labelEl = content.querySelector(`[data-table-label="${table.id}"]`);
            if (labelEl) applyAnimationRendering(labelEl, table.name);
        });
    }, 50);
}

function closePurchaseModal() {
    document.getElementById('purchaseModal').classList.remove('active');
}

function proceedToPayment() {
    console.log('➡️ Proceeding to payment...');
    
    // Collect table data if needed
    if (window.appState.currentTables.length > 0) {
        const tableData = {};
        let allFilled = true;
        
        window.appState.currentTables.forEach(table => {
            const inputEl = document.querySelector(`[data-table-id="${table.id}"]`);
            if (inputEl) {
                const value = inputEl.value.trim();
                if (!value) {
                    allFilled = false;
                }
                tableData[table.name] = value;
            }
        });
        
        if (!allFilled) {
            alert('Please fill in all required fields');
            return;
        }
        
        window.appState.currentTableData = tableData;
        console.log('✅ Table data collected:', tableData);
    }
    
    closePurchaseModal();
    showPaymentForm();
}

// ========== PAYMENT METHODS ==========

async function loadAllPayments() {
    try {
        const { data, error } = await supabase
            .from('payment_methods')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;

        window.appState.allPayments = data || [];
        console.log(`✅ Loaded ${data?.length || 0} payment methods`);
        return data || [];
    } catch (error) {
        console.error('❌ Error loading payments:', error);
        window.appState.allPayments = [];
        return [];
    }
}

function showPaymentForm() {
    console.log('\n💳 ========== SHOWING PAYMENT FORM ==========');
    
    const product = window.appState.selectedProduct;
    if (!product) {
        console.error('❌ No product selected');
        alert('Error: No product selected. Please try again.');
        return;
    }
    
    // Get product-specific payment methods
    const paymentIds = JSON.parse(product.selected_payment_methods || '[]');
    const availablePayments = window.appState.allPayments.filter(p => paymentIds.includes(p.id));
    
    console.log('💳 Product payment methods:', paymentIds);
    console.log('💳 Available payments:', availablePayments.length);
    
    const modal = document.getElementById('paymentModal');
    const content = document.getElementById('paymentContent');
    
    let html = '<div class="payment-form">';
    
    // Order summary
    html += `
        <div class="order-summary">
            <h3 class="order-product-name"></h3>
            <p class="order-product-description"></p>
            <div class="order-price">${product.price.toLocaleString()} MMK</div>
        </div>
    `;
    
    html += '<h3 style="margin: 20px 0 15px 0;">💳 Select Payment Method</h3>';
    
    // Payment methods
    if (availablePayments.length === 0) {
        html += '<p style="text-align: center; color: var(--warning-color); padding: 20px; background: rgba(245, 158, 11, 0.1); border-radius: 12px;">⚠️ No payment methods available for this product</p>';
    } else {
        html += '<div class="payment-methods">';
        availablePayments.forEach(payment => {
            html += `
                <div class="payment-method" data-payment-id="${payment.id}" onclick="selectPayment(${payment.id})">
                    <img src="${payment.icon_url}" alt="${payment.name}">
                    <span data-payment-name="${payment.id}"></span>
                </div>
            `;
        });
        html += '</div>';
    }
    
    html += '<div id="paymentDetails" style="display:none;"></div>';
    html += `<button class="btn-primary" id="submitOrderBtn" onclick="submitOrder()" style="margin-top: 20px; width: 100%;">Submit Order</button>`;
    html += '</div>';
    
    content.innerHTML = html;
    modal.classList.add('active');
    
    // Apply animation rendering
    setTimeout(() => {
        const nameEl = content.querySelector('.order-product-name');
        const descEl = content.querySelector('.order-product-description');
        if (nameEl) applyAnimationRendering(nameEl, product.name);
        if (descEl) applyAnimationRendering(descEl, product.description);
        
        availablePayments.forEach(payment => {
            const paymentNameEl = content.querySelector(`[data-payment-name="${payment.id}"]`);
            if (paymentNameEl) applyAnimationRendering(paymentNameEl, payment.name);
        });
    }, 50);
}

async function selectPayment(paymentId) {
    console.log('💳 Payment method selected:', paymentId);
    
    window.appState.selectedPayment = paymentId;
    
    // Update UI
    document.querySelectorAll('.payment-method').forEach(pm => {
        pm.classList.remove('selected');
    });
    
    const selectedEl = document.querySelector(`[data-payment-id="${paymentId}"]`);
    if (selectedEl) {
        selectedEl.classList.add('selected');
    }
    
    // Load payment details
    try {
        const { data: payment, error } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('id', paymentId)
            .single();

        if (error) throw error;

        const detailsDiv = document.getElementById('paymentDetails');
        if (detailsDiv && payment) {
            detailsDiv.style.display = 'block';
            detailsDiv.innerHTML = `
                <div class="payment-info">
                    <h4 data-payment-detail-name></h4>
                    <p data-payment-detail-instruction></p>
                    <p><strong>Address:</strong> <span data-payment-detail-address></span></p>
                    <div class="form-group" style="margin-top: 15px;">
                        <label>Last 6 digits of transaction ID</label>
                        <input type="text" id="transactionCode" maxlength="6" placeholder="Enter last 6 digits" required>
                    </div>
                </div>
            `;

            // Render with animations
            setTimeout(() => {
                const nameEl = detailsDiv.querySelector('[data-payment-detail-name]');
                const instructionEl = detailsDiv.querySelector('[data-payment-detail-instruction]');
                const addressEl = detailsDiv.querySelector('[data-payment-detail-address]');
                
                if (nameEl) applyAnimationRendering(nameEl, payment.name);
                if (instructionEl) applyAnimationRendering(instructionEl, payment.instructions || 'Please complete payment and enter transaction details.');
                if (addressEl) applyAnimationRendering(addressEl, payment.address);
            }, 50);
        }
    } catch (error) {
        console.error('❌ Error loading payment details:', error);
        alert('Error loading payment details');
    }
}

function closePaymentModal() {
    document.getElementById('paymentModal').classList.remove('active');
}

async function submitOrder() {
    console.log('\n📤 ========== SUBMITTING ORDER ==========');
    
    const product = window.appState.selectedProduct;
    const paymentId = window.appState.selectedPayment;
    const transactionCode = document.getElementById('transactionCode')?.value;
    
    // Validation
    if (!product) {
        alert('Error: No product selected');
        return;
    }
    
    if (!paymentId) {
        alert('Please select a payment method');
        return;
    }
    
    if (!transactionCode || transactionCode.trim().length !== 6) {
        alert('Please enter last 6 digits of transaction ID');
        return;
    }
    
    showLoading();
    
    try {
        const orderData = {
            user_id: parseInt(window.appState.currentUser.id),
            product_id: parseInt(product.id),
            button_id: parseInt(window.appState.currentButtonId),
            payment_method_id: parseInt(paymentId),
            table_data: window.appState.currentTableData,
            transaction_code: transactionCode.trim(),
            quantity: 1,
            total_price: product.price,
            status: 'pending'
        };
        
        console.log('📦 Order data prepared:', orderData);
        
        const { data, error } = await supabase
            .from('orders')
            .insert([orderData])
            .select()
            .single();

        if (error) throw error;
        
        console.log('✅ Order submitted successfully:', data);

        hideLoading();
        closePaymentModal();
        
        alert(`✅ Order Placed Successfully!\n\nOrder ID: #${data.id}\nProduct: ${product.name}\nPrice: ${product.price} MMK\n\nYour order will be processed within 30 minutes.\nPlease check your order history.`);

        // Reset state
        window.appState.selectedProduct = null;
        window.appState.selectedPayment = null;
        window.appState.currentTableData = {};
        
        // Reload history and switch to history page
        await loadOrderHistory();
        switchPage('history');

    } catch (error) {
        hideLoading();
        console.error('❌ Order submission failed:', error);
        alert('Error submitting order: ' + error.message);
    }
}

// ========== CONTACT SELLER ==========

function contactSeller(productId) {
    const product = window.appState.allProducts.find(p => p.id === productId);
    if (!product) {
        alert('Product not found');
        return;
    }
    
    const modal = document.getElementById('contactModal');
    const modalBody = document.getElementById('contactModalBody');
    
    modalBody.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <h3 class="contact-product-name" style="margin-bottom: 15px;"></h3>
            <p style="margin-bottom: 20px; color: var(--text-secondary);">Contact the seller directly through their preferred platform:</p>
            
            <div style="background: var(--bg-card); padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid rgba(0, 212, 255, 0.2);">
                <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 15px;">
                    <strong style="font-size: 18px;" class="contact-platform-name"></strong>
                </div>
                <a href="${product.social_media_link}" target="_blank" class="btn-primary" style="display: inline-block; padding: 15px 30px; text-decoration: none; font-size: 16px;">
                    📞 Contact Now
                </a>
            </div>
            
            <p style="font-size: 14px; color: var(--text-secondary);">
                Make sure to mention the product name when contacting the seller.
            </p>
        </div>
    `;
    
    // Apply animation rendering
    setTimeout(() => {
        const nameEl = modalBody.querySelector('.contact-product-name');
        const platformEl = modalBody.querySelector('.contact-platform-name');
        if (nameEl) applyAnimationRendering(nameEl, product.name);
        if (platformEl) applyAnimationRendering(platformEl, product.social_media_name);
    }, 50);
    
    modal.classList.add('active');
}

function closeContactModal() {
    document.getElementById('contactModal').classList.remove('active');
}

// ========== ORDER HISTORY ==========

async function loadOrderHistory() {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                products (name, price),
                payment_methods (name)
            `)
            .eq('user_id', window.appState.currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        displayOrderHistory(data || []);
    } catch (error) {
        console.error('❌ Error loading orders:', error);
    }
}

function displayOrderHistory(orders) {
    const container = document.getElementById('historyContainer');
    
    if (orders.length === 0) {
        container.innerHTML = '<div class="empty-state"><h3>No Orders Yet</h3><p>Your order history will appear here once you make a purchase.</p></div>';
        return;
    }

    container.innerHTML = '';

    orders.forEach(order => {
        const item = document.createElement('div');
        item.className = 'history-item';

        let statusClass = 'pending';
        if (order.status === 'approved') statusClass = 'approved';
        if (order.status === 'rejected') statusClass = 'rejected';

        item.innerHTML = `
            <div class="history-status ${statusClass}">${order.status.toUpperCase()}</div>
            <h3 data-order-name="${order.id}"></h3>
            <p><strong>Price:</strong> ${order.total_price || order.products?.price || 0} MMK</p>
            <p><strong>Payment:</strong> <span data-order-payment="${order.id}"></span></p>
            <p><strong>Order ID:</strong> #${order.id}</p>
            <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
            ${order.admin_message ? `<p style="margin-top:10px;padding:10px;background:rgba(251,191,36,0.1);border-radius:8px;border:1px solid #fbbf24;" data-order-message="${order.id}"></p>` : ''}
        `;

        container.appendChild(item);

        setTimeout(() => {
            const nameEl = item.querySelector(`[data-order-name="${order.id}"]`);
            const paymentEl = item.querySelector(`[data-order-payment="${order.id}"]`);
            const messageEl = item.querySelector(`[data-order-message="${order.id}"]`);

            if (nameEl) applyAnimationRendering(nameEl, order.products?.name || 'Unknown Product');
            if (paymentEl) applyAnimationRendering(paymentEl, order.payment_methods?.name || 'N/A');
            if (messageEl) applyAnimationRendering(messageEl, `<strong>Message:</strong> ${order.admin_message}`);
        }, 50);
    });
}

// ========== CONTACTS ==========

async function loadContacts() {
    try {
        const { data, error } = await supabase
            .from('contacts')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;

        displayContacts(data || []);
    } catch (error) {
        console.error('❌ Error loading contacts:', error);
    }
}

function displayContacts(contacts) {
    const container = document.getElementById('contactsContainer');
    
    if (contacts.length === 0) {
        container.innerHTML = '<div class="empty-state"><h3>No Contacts</h3><p>Contact information will be available here.</p></div>';
        return;
    }

    container.innerHTML = '';

    contacts.forEach(contact => {
        const item = document.createElement('div');
        item.className = 'contact-item';

        if (contact.link) {
            item.style.cursor = 'pointer';
            item.addEventListener('click', () => window.open(contact.link, '_blank'));
        }

        item.innerHTML = `
            <img src="${contact.icon_url}" class="contact-icon" alt="${contact.name}">
            <div class="contact-info">
                <h3 data-contact-name="${contact.id}"></h3>
                <p data-contact-desc="${contact.id}"></p>
                ${!contact.link && contact.address ? `<p data-contact-address="${contact.id}"></p>` : ''}
            </div>
        `;

        container.appendChild(item);

        setTimeout(() => {
            const nameEl = item.querySelector(`[data-contact-name="${contact.id}"]`);
            const descEl = item.querySelector(`[data-contact-desc="${contact.id}"]`);
            const addressEl = item.querySelector(`[data-contact-address="${contact.id}"]`);

            if (nameEl) applyAnimationRendering(nameEl, contact.name);
            if (descEl) applyAnimationRendering(descEl, contact.description || '');
            if (addressEl) applyAnimationRendering(addressEl, contact.address || '');
        }, 50);
    });
}

// ========== PROFILE ==========

function loadProfile() {
    const user = window.appState.currentUser;
    document.getElementById('profileName').value = user.name;
    document.getElementById('profileUsername').value = user.username;
    document.getElementById('profileEmail').value = user.email;

    const avatar = document.getElementById('profileAvatar');
    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    avatar.textContent = initials;

    const hue = (user.id * 137) % 360;
    avatar.style.background = `linear-gradient(135deg, hsl(${hue}, 70%, 60%), hsl(${hue + 60}, 70%, 60%))`;
}

async function updateProfile() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const errorEl = document.getElementById('profileError');
    const successEl = document.getElementById('profileSuccess');

    if (!newPassword) {
        showError(errorEl, 'Please enter a new password');
        return;
    }

    if (currentPassword !== window.appState.currentUser.password) {
        showError(errorEl, 'Current password is incorrect');
        return;
    }

    showLoading();

    try {
        const { data, error } = await supabase
            .from('users')
            .update({ password: newPassword })
            .eq('id', window.appState.currentUser.id)
            .select()
            .single();

        if (error) throw error;

        hideLoading();
        window.appState.currentUser = data;
        localStorage.setItem('currentUser', JSON.stringify(data));
        
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        
        showSuccess(successEl, 'Password updated successfully!');

    } catch (error) {
        hideLoading();
        showError(errorEl, 'Error updating password');
        console.error('❌ Update error:', error);
    }
}

// ========== NAVIGATION ==========

function switchPage(pageName) {
    console.log('📄 Switching to page:', pageName);
    
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    document.getElementById(pageName + 'Page').classList.add('active');

    // Update nav buttons (only for main pages)
    if (['home', 'history', 'contacts', 'mi'].includes(pageName)) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNav = document.querySelector(`[data-page="${pageName}"]`);
        if (activeNav) activeNav.classList.add('active');
        
        // Hide back button for main pages
        document.getElementById('backButton').style.display = 'none';
        
        // Reset page history for main pages
        window.appState.pageHistory = [pageName];
    }
}

function goBack() {
    console.log('⬅️ Going back');
    console.log('Current page history:', window.appState.pageHistory);
    
    if (window.appState.pageHistory.length > 1) {
        // Remove current page
        window.appState.pageHistory.pop();
        
        // Get previous page
        const previousPage = window.appState.pageHistory[window.appState.pageHistory.length - 1];
        
        console.log('Going back to:', previousPage);
        switchPage(previousPage);
        
        // Hide back button if we're back to home
        if (previousPage === 'home') {
            document.getElementById('backButton').style.display = 'none';
        }
    } else {
        // Fallback to home
        switchPage('home');
    }
}

// ========== UTILITY FUNCTIONS ==========

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showError(element, message) {
    element.textContent = message;
    element.classList.add('show');
    setTimeout(() => element.classList.remove('show'), 5000);
}

function showSuccess(element, message) {
    element.textContent = message;
    element.classList.add('show');
    setTimeout(() => element.classList.remove('show'), 5000);
}

// ========== KEYBOARD NAVIGATION ==========

document.addEventListener('keydown', (e) => {
    // Image viewer navigation
    const imageViewer = document.getElementById('imageViewerModal');
    if (imageViewer.classList.contains('active')) {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            prevImage();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            nextImage();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            closeImageViewer();
        }
    }
    
    // Modal close with Escape
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal.active');
        modals.forEach(modal => {
            modal.classList.remove('active');
        });
    }
});

console.log('✅ Enhanced Gaming Store JavaScript loaded successfully!');
