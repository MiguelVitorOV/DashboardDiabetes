let dashboardData = null;
let currentYear = "";
let currentCity = "MG";
let currentCid = "Total";

// Chart instances
let timeChartInst = null;
let topCitiesChartInst = null;
let demographicsChartInst = null;
let educationChartInst = null;

const COLORS = {
    primary: '#005c97',
    secondary: '#00b4db',
    accent: '#ff6b6b',
    purple: '#8b5cf6',
    orange: '#f59e0b',
    gray: '#cbd5e1'
};

const EDU_KEYS = [
    'Sem Escolaridade', 'Fundamental I', 'Fundamental II', 
    'Ensino Médio', 'Ensino Superior', 'Ignorado/Branco'
];
const AGE_GROUPS = [
    '<10', '10-14', '15-19', '20-24', '25-29', '30-34', '35-39', 
    '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', 
    '70-74', '75-79', '80+'
];

async function init() {
    try {
        const response = await fetch('data/diabetes_dashboard.json');
        dashboardData = await response.json();
        
        // Hide loader
        document.getElementById('loading').style.opacity = '0';
        setTimeout(() => document.getElementById('loading').style.display = 'none', 500);

        // Populate Years
        const years = Object.keys(dashboardData.Ano).sort();
        currentYear = years[years.length - 1];
        const yearSelect = document.getElementById('yearSelect');
        [...years].reverse().forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            if (year === currentYear) option.selected = true;
            yearSelect.appendChild(option);
        });

        // Populate Cities (using latest year)
        const cities = Object.keys(dashboardData.Ano[currentYear]).sort();
        const citySelect = document.getElementById('citySelect');
        cities.forEach(city => {
            if(city === "MG") return; // MG is already hardcoded at top
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            citySelect.appendChild(option);
        });

        setupEventListeners();
        updateDashboard();
        
    } catch (error) {
        console.error("Error loading dashboard data:", error);
        document.getElementById('loading').innerHTML = '<h3 style="color:red">Erro ao carregar dados. Verifique se o JSON existe.</h3>';
    }
}

function setupEventListeners() {
    document.getElementById('yearSelect').addEventListener('change', (e) => {
        currentYear = e.target.value;
        updateDashboard();
    });
    document.getElementById('citySelect').addEventListener('change', (e) => {
        currentCity = e.target.value;
        updateDashboard();
    });
    document.getElementById('cidSelect').addEventListener('change', (e) => {
        currentCid = e.target.value;
        updateDashboard();
    });
}

function updateDashboard() {
    if (!dashboardData || !dashboardData.Ano[currentYear]) return;

    // Fallbacks if city/cid doesn't exist for the selected year
    const cityDataRaw = dashboardData.Ano[currentYear][currentCity];
    if(!cityDataRaw) {
        showNoData();
        return;
    }
    
    const data = cityDataRaw[currentCid];
    if(!data) {
        showNoData();
        return;
    }

    updateKPIs(data);
    updateSummaryText(data);
    
    // Update Charts
    renderTimeChart();
    renderTopCitiesChart();
    renderDemographicsChart(data);
    renderEducationChart(data);
}

function showNoData() {
    document.getElementById('kpiTotal').textContent = "0";
    document.getElementById('kpiYoy').textContent = "-";
    document.getElementById('kpiAge').textContent = "-";
    document.getElementById('kpiEdu').textContent = "-";
    document.getElementById('summaryText').innerHTML = "Sem dados para esta combinação de filtros.";
    
    [timeChartInst, topCitiesChartInst, demographicsChartInst, educationChartInst].forEach(c => {
        if(c) { c.data.datasets.forEach(d => d.data = []); c.update(); }
    });
}

function updateKPIs(data) {
    const obitos = data['Obitos']?.Valor || 0;
    document.getElementById('kpiTotal').textContent = obitos.toLocaleString('pt-BR');
    
    // YoY
    const varAno = data['Variacao_Ano_Anterior'];
    const yoyAbs = varAno ? varAno.Absoluta : 0;
    const yoyPct = varAno ? varAno.Porcentagem : "0%";
    
    const yoyEl = document.getElementById('kpiYoy');
    if (varAno === undefined) {
        yoyEl.textContent = "N/A";
        yoyEl.style.color = varColor('--text-muted');
    } else if (yoyAbs > 0) {
        yoyEl.textContent = yoyPct;
        yoyEl.style.color = varColor('--accent');
    } else if (yoyAbs < 0) {
        yoyEl.textContent = yoyPct;
        yoyEl.style.color = varColor('--secondary');
    } else {
        yoyEl.textContent = "0%";
        yoyEl.style.color = varColor('--text-muted');
    }

    // Max Age Group
    let maxAgeVal = -1, maxAgeKey = "-";
    AGE_GROUPS.forEach(age => {
        if(data[age] && data[age].Valor > maxAgeVal) {
            maxAgeVal = data[age].Valor;
            maxAgeKey = age;
        }
    });
    document.getElementById('kpiAge').textContent = maxAgeKey + " anos";

    // Max Edu
    let maxEduVal = -1, maxEduKey = "-";
    EDU_KEYS.forEach(edu => {
        if(data[edu] && data[edu].Valor > maxEduVal) {
            maxEduVal = data[edu].Valor;
            maxEduKey = edu;
        }
    });
    document.getElementById('kpiEdu').textContent = maxEduKey;
}

function updateSummaryText(data) {
    const total = data['Obitos']?.Valor || 0;
    const cidName = document.getElementById('cidSelect').options[document.getElementById('cidSelect').selectedIndex].text;
    
    const varAno = data['Variacao_Ano_Anterior'];
    const yoyAbs = varAno ? varAno.Absoluta : 0;
    const yoyPct = varAno ? varAno.Porcentagem : "0%";
    
    let trendText;
    if (varAno === undefined) {
        trendText = "<strong>dados iniciais sem base de comparação anterior</strong>";
    } else if (yoyAbs > 0) {
        trendText = `um <strong>aumento de ${yoyPct.replace('+','')}</strong>`;
    } else if (yoyAbs < 0) {
        trendText = `uma <strong>redução de ${yoyPct.replace('-','')}</strong>`;
    } else {
        trendText = "<strong>estabilidade</strong>";
    }

    const html = `Em ${currentYear}, <strong>${currentCity}</strong> registrou <strong>${total.toLocaleString('pt-BR')} óbitos</strong> 
                  por ${cidName}, representando ${trendText} em relação ao ano anterior. 
                  A prevenção focada em populações mais vulneráveis é essencial.`;
                  
    document.getElementById('summaryText').innerHTML = html;
}

// ========================
// CHARTS
// ========================

function renderTimeChart() {
    const years = Object.keys(dashboardData.Ano).sort();
    const values = years.map(y => {
        const cData = dashboardData.Ano[y][currentCity];
        if(!cData) return 0;
        const cidData = cData[currentCid];
        return cidData ? (cidData['Obitos']?.Valor || 0) : 0;
    });

    const ctx = document.getElementById('timeChart').getContext('2d');
    
    if (timeChartInst) timeChartInst.destroy();
    timeChartInst = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [{
                label: 'Óbitos',
                data: values,
                borderColor: COLORS.primary,
                backgroundColor: 'rgba(0, 92, 151, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#fff',
                pointBorderColor: COLORS.primary,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { borderDash: [4, 4] } },
                x: { grid: { display: false } }
            }
        }
    });
}

function renderTopCitiesChart() {
    // Calculate top 10 on the fly
    const citiesObj = dashboardData.Ano[currentYear];
    const citiesList = [];
    
    for(const city in citiesObj) {
        if(city === "MG") continue;
        const val = citiesObj[city][currentCid]?.['Obitos']?.Valor || 0;
        if(val > 0) citiesList.push({ city, val });
    }
    
    citiesList.sort((a,b) => b.val - a.val);
    const top10 = citiesList.slice(0, 10);

    const ctx = document.getElementById('topCitiesChart').getContext('2d');
    if (topCitiesChartInst) topCitiesChartInst.destroy();
    
    topCitiesChartInst = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: top10.map(d => d.city),
            datasets: [{
                label: 'Óbitos',
                data: top10.map(d => d.val),
                backgroundColor: COLORS.secondary,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y', // Horizontal bar chart
            plugins: { legend: { display: false } },
            scales: {
                x: { beginAtZero: true, grid: { borderDash: [4, 4] } },
                y: { grid: { display: false } }
            }
        }
    });
}

function renderDemographicsChart(data) {
    const masc = data['Masculino']?.Valor || 0;
    const fem = data['Feminino']?.Valor || 0;

    const ctx = document.getElementById('demographicsChart').getContext('2d');
    if (demographicsChartInst) demographicsChartInst.destroy();
    
    demographicsChartInst = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Masculino', 'Feminino'],
            datasets: [{
                data: [masc, fem],
                backgroundColor: [COLORS.primary, COLORS.secondary],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            cutout: '70%',
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function renderEducationChart(data) {
    const labels = [];
    const values = [];
    
    EDU_KEYS.forEach(k => {
        const val = data[k]?.Valor;
        if(val !== undefined && val > 0) {
            labels.push(k);
            values.push(val);
        }
    });

    const ctx = document.getElementById('educationChart').getContext('2d');
    if (educationChartInst) educationChartInst.destroy();
    
    educationChartInst = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Óbitos por Escolaridade',
                data: values,
                backgroundColor: COLORS.primary,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { borderDash: [4, 4] } },
                x: { grid: { display: false }, ticks: { autoSkip: false, maxRotation: 45, minRotation: 45 } }
            }
        }
    });
}

// Helpers
function varColor(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

document.addEventListener('DOMContentLoaded', init);
