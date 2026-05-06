let dashboardData = null;
let currentYear = "2024";
let currentCity = "MG";

const COLORS = ['#4f46e5', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#8b5cf6'];
const AGE_GROUPS = [
    '<10', '10-14', '15-19', '20-24', '25-29', '30-34', '35-39', 
    '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', 
    '70-74', '75-79', '80+'
];
const ETHNICITY_GROUPS = [
    { key: 'branco', label: 'Branca', icon: 'user' },
    { key: 'pardo', label: 'Parda', icon: 'user' },
    { key: 'preto', label: 'Preta', icon: 'user' },
    { key: 'amarelo', label: 'Amarela', icon: 'user' },
    { key: 'indigena', label: 'Indígena', icon: 'user' }
];

async function init() {
    try {
        const response = await fetch('data/diabetes_dashboard.json');
        dashboardData = await response.json();
        
        const years = Object.keys(dashboardData.Ano).sort();
        currentYear = years[years.length - 1];
        
        setupYearSelector(years);
        setupEventListeners();
        updateDashboard();
        
    } catch (error) {
        console.error("Error loading dashboard data:", error);
    }
}

function setupYearSelector(years) {
    const selector = document.getElementById('yearSelect');
    selector.innerHTML = '';
    [...years].reverse().forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === currentYear) option.selected = true;
        selector.appendChild(option);
    });
}

function setupEventListeners() {
    document.getElementById('yearSelect').addEventListener('change', (e) => {
        currentYear = e.target.value;
        updateDashboard();
    });

    document.getElementById('cityToggle').addEventListener('change', (e) => {
        currentCity = e.target.value;
        updateDashboard();
    });

    document.getElementById('refreshData').addEventListener('click', () => location.reload());
}

function updateDashboard() {
    const yearData = dashboardData.Ano[currentYear];
    if (!yearData) return;

    const data = {};
    Object.keys(yearData).forEach(cat => {
        data[cat] = yearData[cat][currentCity] || { Valor: 0, Porcentagem: "0.0%" };
    });

    // Update Top KPIs
    document.getElementById('val-total').textContent = data['Total obitos'].Valor.toLocaleString();
    
    document.getElementById('val-male').textContent = data['Total masculino'].Valor.toLocaleString();
    document.getElementById('pct-male').textContent = data['Total masculino'].Porcentagem;
    
    document.getElementById('val-female').textContent = data['Total feminino'].Valor.toLocaleString();
    document.getElementById('pct-female').textContent = data['Total feminino'].Porcentagem;
    
    // Sum young age groups (10-19)
    const youngTotal = data['Total 10-14'].Valor + data['Total 15-19'].Valor;
    const totalDeaths = data['Total obitos'].Valor || 1;
    const youngPct = ((youngTotal / totalDeaths) * 100).toFixed(1) + "%";
    document.getElementById('val-young').textContent = youngTotal.toLocaleString();
    document.getElementById('pct-young').textContent = youngPct;

    // Render Ethnicity Section
    renderEthnicityGrid(data);
    
    // Render Age Groups Section
    renderAgeGrid(data);

    // Re-create icons
    lucide.createIcons();
}

function renderEthnicityGrid(data) {
    const grid = document.getElementById('ethnicity-grid');
    grid.innerHTML = '';
    
    ETHNICITY_GROUPS.forEach((group, index) => {
        const key = `Total ${group.key}`;
        const item = data[key] || { Valor: 0, Porcentagem: "0.0%" };
        
        const card = document.createElement('div');
        card.className = 'kpi-card glass sub-kpi';
        card.innerHTML = `
            <div class="kpi-icon-wrapper blue" style="background: ${getAlphaColor(COLORS[index], 0.1)}; color: ${COLORS[index]}">
                <i data-lucide="${group.icon}"></i>
            </div>
            <div class="kpi-info">
                <span class="kpi-label">${group.label}</span>
                <h2 class="kpi-value">${item.Valor.toLocaleString()}</h2>
                <span class="kpi-percentage">${item.Porcentagem}</span>
            </div>
        `;
        grid.appendChild(card);
    });
}

function renderAgeGrid(data) {
    const grid = document.getElementById('age-grid');
    grid.innerHTML = '';
    
    AGE_GROUPS.forEach((age, index) => {
        const key = `Total ${age}`;
        const item = data[key] || { Valor: 0, Porcentagem: "0.0%" };
        
        const card = document.createElement('div');
        card.className = 'kpi-card glass sub-kpi';
        card.innerHTML = `
            <div class="kpi-icon-wrapper" style="background: rgba(0,0,0,0.05); color: var(--text-muted)">
                <span style="font-weight: 700; font-size: 0.8rem">${age}</span>
            </div>
            <div class="kpi-info">
                <span class="kpi-label">Idade ${age}</span>
                <h2 class="kpi-value">${item.Valor.toLocaleString()}</h2>
                <span class="kpi-percentage">${item.Porcentagem}</span>
            </div>
        `;
        grid.appendChild(card);
    });
}

function getAlphaColor(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

document.addEventListener('DOMContentLoaded', init);
