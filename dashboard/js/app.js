let dashboardData = null;
let currentYear = "";
let currentCity = "MG";
let currentCid = "Total";

// Chart instances
let timeChartInst = null;
let topCitiesChartInst = null;
let demographicsChartInst = null;
let educationChartInst = null;
let ethnicityChartInst = null;
let cidChartInst = null;

const COMMON_TOOLTIP_CALLBACKS = {
    label: function(context) {
        let value = context.raw || 0;
        let sum = context.dataset.data.reduce((a, b) => a + b, 0);
        let percentage = sum > 0 ? ((value / sum) * 100).toFixed(1) + '%' : '0%';
        
        let label = context.dataset.label || '';
        if (context.chart.config.type === 'pie' || context.chart.config.type === 'doughnut') {
            label = context.label || '';
        }
        
        if (label) {
            label += ': ';
        }
        return `${label}${value.toLocaleString('pt-BR')} (${percentage})`;
    }
};

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
const ETHNICITY_KEYS = ['Branco', 'Pardo', 'Preto', 'Amarelo', 'Indígena', 'Ignorado'];
const CID_KEYS = ['E10', 'E11', 'E12', 'E13', 'E14'];

function generateAllYearsData() {
    const todos = {};
    const years = Object.keys(dashboardData.Ano);
    
    years.forEach(year => {
        const yearData = dashboardData.Ano[year];
        for (const city in yearData) {
            if (!todos[city]) todos[city] = {};
            for (const cid in yearData[city]) {
                if (!todos[city][cid]) todos[city][cid] = {};
                
                const metrics = yearData[city][cid];
                for (const key in metrics) {
                    if (key === 'Variacao_Ano_Anterior') continue;
                    
                    if (!todos[city][cid][key]) {
                        todos[city][cid][key] = { Valor: 0, Porcentagem: "0.0%" };
                    }
                    todos[city][cid][key].Valor += (metrics[key].Valor || 0);
                }
            }
        }
    });

    for (const city in todos) {
        for (const cid in todos[city]) {
            const totalObitos = todos[city][cid]['Obitos']?.Valor || 0;
            for (const key in todos[city][cid]) {
                if (key !== 'Obitos' && key !== 'Variacao_Ano_Anterior') {
                    const val = todos[city][cid][key].Valor;
                    todos[city][cid][key].Porcentagem = totalObitos > 0 ? (val / totalObitos * 100).toFixed(1) + "%" : "0.0%";
                }
            }
        }
    }
    
    dashboardData.Ano['Todos'] = todos;
}

async function init() {
    try {
        const response = await fetch('data/diabetes_dashboard.json');
        dashboardData = await response.json();
        
        // Hide loader
        document.getElementById('loading').style.opacity = '0';
        setTimeout(() => document.getElementById('loading').style.display = 'none', 500);

        generateAllYearsData();

        // Populate Years
        const years = Object.keys(dashboardData.Ano).filter(y => y !== 'Todos').sort();
        currentYear = 'Todos';
        const yearSelect = document.getElementById('yearSelect');
        
        const todosOption = document.createElement('option');
        todosOption.value = 'Todos';
        todosOption.textContent = 'Todos os Anos';
        todosOption.selected = true;
        yearSelect.appendChild(todosOption);

        [...years].reverse().forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        });

        // Populate Cities (using 'Todos')
        const cities = Object.keys(dashboardData.Ano['Todos']).sort();
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
    
    // Toggle YoY KPI visibility
    const kpiYoyCard = document.getElementById('kpiYoyCard');
    if (kpiYoyCard) {
        kpiYoyCard.style.display = currentYear === 'Todos' ? 'none' : 'flex';
    }

    updateSummaryText(data);
    
    // Update Charts
    renderTimeChart();
    renderTopCitiesChart();
    renderDemographicsChart(data);
    renderEducationChart(data);
    renderEthnicityChart(data);
    renderCidChart(cityDataRaw);
}

function showNoData() {
    document.getElementById('kpiTotal').textContent = "0";
    document.getElementById('kpiYoy').textContent = "-";
    document.getElementById('kpiAge').textContent = "-";
    document.getElementById('kpiEdu').textContent = "-";
    document.getElementById('summaryText').innerHTML = "Sem dados para esta combinação de filtros.";
    
    [timeChartInst, topCitiesChartInst, demographicsChartInst, educationChartInst, ethnicityChartInst, cidChartInst].forEach(c => {
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
    
    let periodText = currentYear === 'Todos' ? "No período completo" : `Em ${currentYear}`;
    let trendHtml = "";
    
    if (currentYear !== 'Todos') {
        if (varAno === undefined) {
            trendHtml = ", representando <strong>dados iniciais sem base de comparação anterior</strong>";
        } else if (yoyAbs > 0) {
            trendHtml = `, representando um <strong>aumento de ${yoyPct.replace('+','')}</strong> em relação ao ano anterior`;
        } else if (yoyAbs < 0) {
            trendHtml = `, representando uma <strong>redução de ${yoyPct.replace('-','')}</strong> em relação ao ano anterior`;
        } else {
            trendHtml = ", representando <strong>estabilidade</strong> em relação ao ano anterior";
        }
    }

    const html = `${periodText}, <strong>${currentCity}</strong> registrou <strong>${total.toLocaleString('pt-BR')} óbitos</strong> por ${cidName}${trendHtml}. A prevenção focada em populações mais vulneráveis é essencial.`;
                  
    document.getElementById('summaryText').innerHTML = html;
}

// ========================
// CHARTS
// ========================

function renderTimeChart() {
    const years = Object.keys(dashboardData.Ano).filter(y => y !== 'Todos').sort();
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
            plugins: { 
                legend: { display: false },
                tooltip: { callbacks: COMMON_TOOLTIP_CALLBACKS }
            },
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
            plugins: { 
                legend: { display: false },
                tooltip: { callbacks: COMMON_TOOLTIP_CALLBACKS }
            },
            scales: {
                x: { beginAtZero: true, grid: { borderDash: [4, 4] } },
                y: { grid: { display: false }, ticks: { autoSkip: false } }
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
                legend: { position: 'bottom' },
                tooltip: { callbacks: COMMON_TOOLTIP_CALLBACKS }
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
            plugins: { 
                legend: { display: false },
                tooltip: { callbacks: COMMON_TOOLTIP_CALLBACKS }
            },
            scales: {
                y: { beginAtZero: true, grid: { borderDash: [4, 4] } },
                x: { grid: { display: false }, ticks: { autoSkip: false, maxRotation: 45, minRotation: 45 } }
            }
        }
    });
}

function renderEthnicityChart(data) {
    const labels = [];
    const values = [];
    
    ETHNICITY_KEYS.forEach(k => {
        const val = data[k]?.Valor;
        if(val !== undefined && val > 0) {
            labels.push(k);
            values.push(val);
        }
    });

    const ctx = document.getElementById('ethnicityChart').getContext('2d');
    if (ethnicityChartInst) ethnicityChartInst.destroy();
    
    ethnicityChartInst = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.purple, COLORS.orange, COLORS.gray],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'right' },
                tooltip: { callbacks: COMMON_TOOLTIP_CALLBACKS }
            }
        }
    });
}

function renderCidChart(cityDataRaw) {
    const labels = [];
    const values = [];
    
    CID_KEYS.forEach(k => {
        const val = cityDataRaw[k]?.['Obitos']?.Valor;
        if(val !== undefined && val > 0) {
            labels.push(k);
            values.push(val);
        }
    });

    const ctx = document.getElementById('cidChart').getContext('2d');
    if (cidChartInst) cidChartInst.destroy();
    
    cidChartInst = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Óbitos por CID',
                data: values,
                backgroundColor: COLORS.purple,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            const cid = tooltipItems[0].label;
                            const desc = {
                                'E10': 'Diabetes Tipo 1',
                                'E11': 'Diabetes Tipo 2',
                                'E12': 'Relacionado à desnutrição',
                                'E13': 'Outros tipos',
                                'E14': 'Não especificado'
                            };
                            return cid + ' - ' + (desc[cid] || 'Desconhecido');
                        },
                        label: COMMON_TOOLTIP_CALLBACKS.label
                    }
                }
            },
            scales: {
                y: { beginAtZero: true, grid: { borderDash: [4, 4] } },
                x: { grid: { display: false } }
            }
        }
    });
}

// Helpers
function varColor(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// Modal functions
function openReportModal() {
    document.getElementById('reportModal').style.display = 'flex';
}

function closeReportModal() {
    document.getElementById('reportModal').style.display = 'none';
}

async function generateReport() {
    const btn = document.querySelector('.modal-footer .btn-primary');
    const oldText = btn.innerHTML;
    btn.innerHTML = '<div class="spinner" style="width: 16px; height: 16px; border-width: 2px; margin: 0;"></div> Gerando...';
    btn.disabled = true;

    try {
        const title = document.getElementById('reportTitle').value;
        const container = document.getElementById('pdfContainer');
        const cidName = document.getElementById('cidSelect').options[document.getElementById('cidSelect').selectedIndex].text;
        const CID_DESC = { 'E10': 'Diabetes Tipo 1', 'E11': 'Diabetes Tipo 2', 'E12': 'Relacionado à desnutrição', 'E13': 'Outros tipos', 'E14': 'Não especificado' };
        
        let pdfHtml = `
            <div class="pdf-template">
                <div class="pdf-header">
                    <div class="pdf-header-left">
                        <h1>${title}</h1>
                        <p>Parâmetros: Município: ${currentCity} | Ano: ${currentYear} | CID: ${cidName}</p>
                    </div>
                    <div class="pdf-logo">
                        <span>DataHealth</span><span style="color:#00b4db">MG</span>
                    </div>
                </div>
        `;

        if (document.getElementById('chkVisaoGeral').checked) {
            const data = dashboardData.Ano[currentYear][currentCity][currentCid];
            const total = data['Obitos']?.Valor || 0;
            const varAno = data['Variacao_Ano_Anterior'];
            const yoyAbs = varAno ? varAno.Absoluta : 0;
            const yoyPct = varAno ? varAno.Porcentagem : "0%";
            
            let periodText = currentYear === 'Todos' ? "No período completo" : `No ano de ${currentYear}`;
            let trendText = "";
            if (currentYear !== 'Todos') {
                if (varAno === undefined) {
                    trendText = ", sem base de comparação anterior";
                } else if (yoyAbs > 0) {
                    trendText = `, representando um aumento de ${yoyPct.replace('+','')} em relação ao ano anterior`;
                } else if (yoyAbs < 0) {
                    trendText = `, representando uma redução de ${yoyPct.replace('-','')} em relação ao ano anterior`;
                } else {
                    trendText = ", mantendo estabilidade em relação ao ano anterior";
                }
            }

            let pdfSummaryText = `Este relatório consolida a análise epidemiológica para ${currentCity}. ${periodText}, foram registrados ${total.toLocaleString('pt-BR')} óbitos por ${cidName}${trendText}. `;

            let maxAgeVal = -1, maxAgeKey = "-";
            AGE_GROUPS.forEach(age => {
                if(data[age] && data[age].Valor > maxAgeVal) {
                    maxAgeVal = data[age].Valor;
                    maxAgeKey = age;
                }
            });
            const agePct = total > 0 ? ((maxAgeVal / total) * 100).toFixed(1) + '%' : '0%';

            let maxEtniaVal = -1, maxEtniaKey = "-";
            ETHNICITY_KEYS.forEach(etnia => {
                if(data[etnia] && data[etnia].Valor > maxEtniaVal) {
                    maxEtniaVal = data[etnia].Valor;
                    maxEtniaKey = etnia;
                }
            });
            const etniaPct = total > 0 ? ((maxEtniaVal / total) * 100).toFixed(1) + '%' : '0%';
            
            const cityDataRaw = dashboardData.Ano[currentYear][currentCity];
            let maxCidVal = -1, maxCidKey = "-";
            CID_KEYS.forEach(cidKey => {
                const val = cityDataRaw[cidKey]?.['Obitos']?.Valor || 0;
                if(val > maxCidVal) {
                    maxCidVal = val;
                    maxCidKey = cidKey;
                }
            });
            // CID_DESC is defined at function level

            if (document.getElementById('chkCID').checked) {
                if (currentCid === 'Total') {
                    const cidNameFreq = CID_DESC[maxCidKey] || 'Desconhecido';
                    pdfSummaryText += `Dentre os tipos de diabetes, o CID mais frequente foi o ${maxCidKey} (${cidNameFreq}), com ${maxCidVal.toLocaleString('pt-BR')} casos. `;
                }
            }
            
            if (document.getElementById('chkEtnia').checked) {
                pdfSummaryText += `Em relação à etnia, a maior incidência ocorreu na população declarada como '${maxEtniaKey}' (${etniaPct}). `;
            }

            if (document.getElementById('chkDemografia').checked) {
                pdfSummaryText += `Observa-se que a maior incidência ocorre na faixa etária de ${maxAgeKey} anos, correspondendo a ${agePct} dos casos. `;
                const mascVal = data['Masculino']?.Valor || 0;
                const femVal = data['Feminino']?.Valor || 0;
                const mascPct = total > 0 ? ((mascVal / total) * 100).toFixed(1) + '%' : '0%';
                const femPct = total > 0 ? ((femVal / total) * 100).toFixed(1) + '%' : '0%';
                if (mascVal > femVal) {
                    pdfSummaryText += `De modo geral, a amostra possui predominância do sexo masculino (${mascPct}). `;
                } else if (femVal > mascVal) {
                    pdfSummaryText += `De modo geral, a amostra possui predominância do sexo feminino (${femPct}). `;
                } else {
                    pdfSummaryText += `A distribuição entre os sexos é igualitária. `;
                }
            }

            if (document.getElementById('chkEscolaridade').checked) {
                let maxEduVal = -1, maxEduKey = "-";
                EDU_KEYS.forEach(edu => {
                    if(data[edu] && data[edu].Valor > maxEduVal) {
                        maxEduVal = data[edu].Valor;
                        maxEduKey = edu;
                    }
                });
                const eduPct = total > 0 ? ((maxEduVal / total) * 100).toFixed(1) + '%' : '0%';
                pdfSummaryText += `Em relação ao perfil educacional, a maior concentração de registros encontra-se no grupo '${maxEduKey}' (${eduPct}). `;
            }

            const kpiTotal = document.getElementById('kpiTotal').innerText;
            const kpiYoy = document.getElementById('kpiYoy').innerText;
            const kpiAge = document.getElementById('kpiAge').innerText;
            const kpiEdu = document.getElementById('kpiEdu').innerText;
            
            let kpiBlock = `<div style="flex: 1; min-width: 130px; text-align: center;"><strong style="color:var(--primary); font-size:24px;">${kpiTotal}</strong><br><span style="font-size:12px; color:#666;">TOTAL DE ÓBITOS</span></div>`;
            if (currentYear !== 'Todos') {
                kpiBlock += `<div style="flex: 1; min-width: 130px; text-align: center;"><strong style="color:var(--primary); font-size:24px;">${kpiYoy}</strong><br><span style="font-size:12px; color:#666;">VARIAÇÃO (YOY)</span></div>`;
            }
            if (document.getElementById('chkDemografia').checked) {
                kpiBlock += `<div style="flex: 1; min-width: 130px; text-align: center;"><strong style="color:var(--primary); font-size:24px;">${kpiAge}</strong><br><span style="font-size:12px; color:#666;">MAIOR FAIXA ETÁRIA</span></div>`;
            }
            if (document.getElementById('chkEscolaridade').checked) {
                kpiBlock += `<div style="flex: 1; min-width: 130px; text-align: center;"><strong style="color:var(--primary); font-size:24px;">${kpiEdu}</strong><br><span style="font-size:12px; color:#666;">FOCO EDUCACIONAL</span></div>`;
            }
            
            pdfHtml += `
                <h2 class="pdf-section-title">01 - Visão Geral</h2>
                <p class="pdf-text">${pdfSummaryText}</p>
                <div style="display:flex; justify-content: center; align-items: center; gap: 20px; margin-bottom: 20px; padding: 20px; background: #f8fafc; border-radius: 8px; flex-wrap: wrap;">
                    ${kpiBlock}
                </div>
            `;
        }

        const addChart = document.getElementById('chkEvolucao').checked || 
                         document.getElementById('chkTopCidades').checked || 
                         document.getElementById('chkDemografia').checked || 
                         document.getElementById('chkEscolaridade').checked ||
                         document.getElementById('chkEtnia').checked ||
                         document.getElementById('chkCID').checked;

        if (addChart) {
            // Force a page break before charts if VisaoGeral is also checked to guarantee consistent pagination
            if (document.getElementById('chkVisaoGeral').checked) {
                pdfHtml += `<div style="page-break-before: always;"></div>`;
            }
            pdfHtml += `<h2 class="pdf-section-title" style="margin-top: 0;">02 - Tabelas de Dados</h2>`;
            
            if (document.getElementById('chkEvolucao').checked) {
                const timeChartCanvas = document.getElementById('timeChart');
                const timeChartImage = timeChartCanvas.toDataURL('image/png');
                
                pdfHtml += `
                    <div class="pdf-chart-row" style="margin-bottom: 20px;">
                        <div class="pdf-chart-box" style="width: 100%; text-align: center;">
                            <h3>Evolução Temporal</h3>
                            <img src="${timeChartImage}" style="max-width: 100%; height: auto; max-height: 300px; margin-top: 10px;" />
                        </div>
                    </div>
                `;
            }

            if (document.getElementById('chkTopCidades').checked) {
                const citiesObj = dashboardData.Ano[currentYear];
                const citiesList = [];
                for(const city in citiesObj) {
                    if(city === "MG") continue;
                    const val = citiesObj[city][currentCid]?.['Obitos']?.Valor || 0;
                    if(val > 0) citiesList.push({ city, val });
                }
                citiesList.sort((a,b) => b.val - a.val);
                const top10 = citiesList.slice(0, 10);

                let rows = '';
                top10.forEach(item => {
                    rows += `<tr><td style="padding: 8px; border: 1px solid #ddd;">${item.city}</td><td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${item.val.toLocaleString('pt-BR')}</td></tr>`;
                });

                pdfHtml += `
                    <div class="pdf-chart-row" style="margin-bottom: 20px;">
                        <div class="pdf-chart-box" style="width: 100%;">
                            <h3>Cidades Mais Afetadas</h3>
                            <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px;">
                                <thead>
                                    <tr style="background-color: #f8fafc;">
                                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Cidade</th>
                                        <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Óbitos</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${rows}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            }

            if (document.getElementById('chkDemografia').checked) {
                const data = dashboardData.Ano[currentYear][currentCity][currentCid];
                const masc = data['Masculino']?.Valor || 0;
                const fem = data['Feminino']?.Valor || 0;

                let rows = `
                    <tr><td style="padding: 8px; border: 1px solid #ddd;">Masculino</td><td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${masc.toLocaleString('pt-BR')}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #ddd;">Feminino</td><td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${fem.toLocaleString('pt-BR')}</td></tr>
                `;

                pdfHtml += `
                    <div class="pdf-chart-row" style="margin-bottom: 20px;">
                        <div class="pdf-chart-box" style="width: 100%;">
                            <h3>Perfil Demográfico</h3>
                            <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px;">
                                <thead>
                                    <tr style="background-color: #f8fafc;">
                                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Gênero</th>
                                        <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Óbitos</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${rows}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            }
            
            if (document.getElementById('chkEscolaridade').checked) {
                const data = dashboardData.Ano[currentYear][currentCity][currentCid];
                let rows = '';
                EDU_KEYS.forEach(k => {
                    const val = data[k]?.Valor;
                    if(val !== undefined && val > 0) {
                        rows += `<tr><td style="padding: 8px; border: 1px solid #ddd;">${k}</td><td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${val.toLocaleString('pt-BR')}</td></tr>`;
                    }
                });

                pdfHtml += `
                    <div class="pdf-chart-row" style="margin-bottom: 20px;">
                        <div class="pdf-chart-box" style="width: 100%;">
                            <h3>Nível de Escolaridade</h3>
                            <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px;">
                                <thead>
                                    <tr style="background-color: #f8fafc;">
                                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Escolaridade</th>
                                        <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Óbitos</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${rows}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            }
            
            if (document.getElementById('chkEtnia').checked) {
                const dataEtnia = dashboardData.Ano[currentYear][currentCity][currentCid];
                let rows = '';
                ETHNICITY_KEYS.forEach(k => {
                    const val = dataEtnia[k]?.Valor;
                    if(val !== undefined && val > 0) {
                        rows += `<tr><td style="padding: 8px; border: 1px solid #ddd;">${k}</td><td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${val.toLocaleString('pt-BR')}</td></tr>`;
                    }
                });

                pdfHtml += `
                    <div class="pdf-chart-row" style="margin-bottom: 20px;">
                        <div class="pdf-chart-box" style="width: 100%;">
                            <h3>Distribuição por Etnia</h3>
                            <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px;">
                                <thead>
                                    <tr style="background-color: #f8fafc;">
                                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Etnia</th>
                                        <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Óbitos</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${rows}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            }

            if (document.getElementById('chkCID').checked) {
                const cityDataRaw = dashboardData.Ano[currentYear][currentCity];
                let rows = '';
                CID_KEYS.forEach(k => {
                    if (k !== 'Total') {
                        const val = cityDataRaw[k]?.['Obitos']?.Valor;
                        if(val !== undefined && val > 0) {
                            const cidDescName = CID_DESC[k] || 'Desconhecido';
                            rows += `<tr><td style="padding: 8px; border: 1px solid #ddd;">${k} - ${cidDescName}</td><td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${val.toLocaleString('pt-BR')}</td></tr>`;
                        }
                    }
                });

                pdfHtml += `
                    <div class="pdf-chart-row" style="margin-bottom: 20px;">
                        <div class="pdf-chart-box" style="width: 100%;">
                            <h3>Distribuição por CID</h3>
                            <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px;">
                                <thead>
                                    <tr style="background-color: #f8fafc;">
                                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">CID</th>
                                        <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Óbitos</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${rows}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            }
        }

        pdfHtml += `</div>`;
        container.innerHTML = pdfHtml;

        const opt = {
            margin:       [10, 10, 10, 10], // 10mm margins
            filename:     'relatorio_datahealth.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, scrollX: 0, scrollY: 0 },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak:    { mode: ['css', 'legacy'], avoid: ['.pdf-chart-row', '.pdf-header', '.pdf-text'] }
        };

        await html2pdf().set(opt).from(container.querySelector('.pdf-template')).save();
        
    } catch(err) {
        console.error("Erro ao gerar PDF", err);
        alert("Houve um erro ao gerar o PDF.");
    } finally {
        btn.innerHTML = oldText;
        btn.disabled = false;
        closeReportModal();
    }
}

document.addEventListener('DOMContentLoaded', init);
