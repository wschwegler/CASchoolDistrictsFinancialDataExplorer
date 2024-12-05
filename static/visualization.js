// Constants
const margin = {top: 20, right: 120, bottom: 50, left: 100};
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Global variables
let parsedData = {};
let currentDistrict = null;
let allYears = [];
let currentYear = null;
let primaryAttributeSelect;
let secondaryAttributeSelect;

// DOM elements
const searchInput = document.getElementById('searchInput');
const yearSelect = document.getElementById('yearSelect');
const districtList = document.getElementById('districtList');
const selectedDistrictDiv = document.getElementById('selectedDistrict');
const terminologyList = document.getElementById('terminologyList');
const terminologyBox = document.getElementById('terminologyBox');
const terminologyContent = document.getElementById('terminologyContent');
const minimizeButton = document.getElementById('minimizeButton');

// Tooltip
const tooltip = d3.select('body').append('div')
    .attr('class', 'tooltip');

// Create chart controls HTML
function addDualAxisControls() {
    return `
        <div class="chart-controls">
            <div class="control-group">
                <label for="primaryAttributeSelect">Primary Attribute (Left Axis): </label>
                <select id="primaryAttributeSelect"></select>
            </div>
            <div class="control-group">
                <label for="secondaryAttributeSelect">Secondary Attribute (Right Axis): </label>
                <select id="secondaryAttributeSelect">
                    <option value="">None (Single Axis)</option>
                </select>
            </div>
        </div>
    `;
}

// Terminology definitions
const terminology = {
    'Black Dot': 'Missing Data',
    'Rev_total': 'Total revenue received by the school district from all sources (federal, state, and local)',
    'Rev_fed_total': 'Total federal revenue, including grants and program-specific funding',
    'Rev_state_total': 'Total revenue received from state sources, including state education funding',
    'Rev_local_total': 'Total revenue from local sources, including property taxes and local contributions',
    'Exp_total': 'Total expenditures made by the district across all categories',
    'Exp_current_instruction_total': 'Total current spending specifically for instruction-related activities',
    'Outlay_capital_total': 'Total spending on capital improvements, such as buildings and equipment',
    'Number_of_schools': 'Total number of schools operating under this district',
    'Enrollment': 'Total number of students enrolled in the district',
    'Teachers_total_fte': 'Number of full-time equivalent teaching positions',
    'Salaries_instruction': 'Total salaries paid for instructional staff',
    'Benefits_employee_total': 'Total cost of employee benefits including healthcare, retirement, etc.',
    'Debt_interest': 'Interest payments on district debt',
    'Debt_longterm_outstand_end_fy': 'Long-term debt balance at the end of fiscal year',
    'Debt_shortterm_outstand_end_fy': 'Short-term debt balance at the end of fiscal year',
    'Assessed_value': 'Combined secured and unsecured net taxable property value in the district',
    'Adjusted_assessed_value': 'Assessed property value adjusted to 2023 dollars to account for inflation',
    'Payments_charter_schools': 'Total payments made to charter schools by the district',
    'Urban_centric_locale': "Classification of the district's urbanization level (urban, suburban, rural, etc.)"
};

function getMostRecentDistrictName(data, lea_id) {
    const districtData = data.filter(d => d.lea_id === lea_id);
    const mostRecent = districtData.reduce((prev, current) => 
        (prev.year > current.year) ? prev : current
    );
    return mostRecent.lea_name;
}

function initializeTerminology() {
    Object.entries(terminology).forEach(([term, definition]) => {
        const div = document.createElement('div');
        div.className = 'terminology-item';
        div.innerHTML = `
            <div class="terminology-term">${term}</div>
            <div class="terminology-definition">${definition}</div>
        `;
        terminologyList.appendChild(div);
    });
}

function initializeTerminologyBox() {
    let isMinimized = false;

    minimizeButton.addEventListener('click', () => {
        isMinimized = !isMinimized;
        terminologyBox.classList.toggle('minimized', isMinimized);
        terminologyContent.classList.toggle('hidden', isMinimized);
        
        const minimizeText = minimizeButton.querySelector('.minimize-text');
        const minimizeIcon = minimizeButton.querySelector('.minimize-icon');
        
        minimizeText.textContent = isMinimized ? 'expand' : 'minimize';
        minimizeIcon.textContent = isMinimized ? '▴' : '▾';
        minimizeIcon.classList.toggle('rotated', isMinimized);
    });
}

// Load and process data
d3.csv("/static/Data.csv").then(data => {
    const relevantAttributes = Object.keys(data[0]).filter(key => 
        !["year", "lea_id", "leaid", "phone", "lea_name", "urban_centric_locale", "fiscal year", 
        "debt_shortterm_outstand_end_fy","payments_charter_schools","name of school district",""].includes(key)
    );

    // Initialize chart controls
    const chartControlsDiv = document.getElementById('chartControls');
    chartControlsDiv.innerHTML = addDualAxisControls();
    
    // Get references to the select elements
    primaryAttributeSelect = document.getElementById('primaryAttributeSelect');
    secondaryAttributeSelect = document.getElementById('secondaryAttributeSelect');

    // Populate attribute dropdowns
    relevantAttributes.forEach((attr, index) => {
        // Primary attribute select
        const primaryOption = document.createElement('option');
        primaryOption.value = attr;
        primaryOption.textContent = attr;
        primaryAttributeSelect.appendChild(primaryOption);

        // Secondary attribute select
        const secondaryOption = document.createElement('option');
        secondaryOption.value = attr;
        secondaryOption.textContent = attr;
        secondaryAttributeSelect.appendChild(secondaryOption);
    });

    // Process data
    data.forEach(d => {
        d.year = +d.year;
        d.lea_id = d.lea_id || d.leaid;
        relevantAttributes.forEach(attr => {
            d[attr] = d[attr] === "" || isNaN(d[attr]) || +d[attr] <= 0 ? null : +d[attr];
        });
    });

    // Get unique lea_ids and their most recent names
    const uniqueIds = [...new Set(data.map(d => d.lea_id))];
    const idToNameMap = new Map(
        uniqueIds.map(id => [id, getMostRecentDistrictName(data, id)])
    );

    // Group data by lea_id
    parsedData = d3.group(data, d => `${idToNameMap.get(d.lea_id)} (${d.lea_id})`);

    // Get all unique years
    allYears = [...new Set(data.map(d => d.year))].sort();
    currentYear = allYears[allYears.length - 1];

    // Populate year dropdown
    yearSelect.innerHTML = '';
    allYears.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === currentYear) option.selected = true;
        yearSelect.appendChild(option);
    });

    // Populate district list
    const sortedDistricts = Array.from(parsedData.keys()).sort();
    districtList.innerHTML = '';
    sortedDistricts.forEach(district => {
        const div = document.createElement('div');
        div.className = 'district-list-item';
        div.textContent = district;
        div.addEventListener('click', () => selectDistrict(district));
        districtList.appendChild(div);
    });

    initializeTerminology();
    initializeTerminologyBox();
    setupEventListeners();
});

function setupEventListeners() {
    searchInput.addEventListener('input', handleSearch);
    primaryAttributeSelect.addEventListener('change', updateChart);
    secondaryAttributeSelect.addEventListener('change', updateChart);
    yearSelect.addEventListener('change', (e) => {
        currentYear = +e.target.value;
        updateAttributesList();
    });
}

function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    const districtItems = districtList.getElementsByClassName('district-list-item');
    
    Array.from(districtItems).forEach(item => {
        const match = item.textContent.toLowerCase().includes(query);
        item.style.display = match ? 'block' : 'none';
    });
}

function selectDistrict(district) {
    currentDistrict = district;
    
    const items = districtList.getElementsByClassName('district-list-item');
    Array.from(items).forEach(item => {
        item.classList.toggle('selected', item.textContent === district);
    });

    selectedDistrictDiv.textContent = district;
    selectedDistrictDiv.style.display = 'block';

    updateChart();
    updateAttributesList();
}
function updateChart() {
    const chartContainer = document.getElementById('chartContainer');
    const primaryAttribute = primaryAttributeSelect.value;
    const secondaryAttribute = secondaryAttributeSelect.value;

    if (!currentDistrict || !primaryAttribute) return;

    chartContainer.innerHTML = '';

    // Add summary section
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'chart-summary';
    summaryDiv.innerHTML = `
        <h3>Comparing:</h3>
        <div class="metric-summary">
            <div class="metric-item">
                <span class="dot" style="background: #3b82f6"></span>
                <span>${primaryAttribute}</span>
            </div>
            ${secondaryAttribute ? `
                <div class="metric-item">
                    <span class="dot" style="background: #ef4444"></span>
                    <span>${secondaryAttribute}</span>
                </div>
            ` : ''}
        </div>
    `;
    chartContainer.appendChild(summaryDiv);

    const svg = d3.select('#chartContainer')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Get district data
    const districtData = parsedData.get(currentDistrict);
    const allYearPoints = allYears.map(year => {
        const yearData = districtData.find(d => d.year === year);
        return {
            year: year,
            primary: yearData ? yearData[primaryAttribute] : null,
            secondary: yearData && secondaryAttribute ? yearData[secondaryAttribute] : null
        };
    });

    // Set up scales
    const x = d3.scaleLinear()
        .domain([d3.min(allYears), d3.max(allYears)])
        .range([0, width]);

    const y1 = d3.scaleLinear()
        .domain([0, d3.max(allYearPoints, d => d.primary)])
        .range([height, 0]);

    let y2;
    if (secondaryAttribute) {
        y2 = d3.scaleLinear()
            .domain([0, d3.max(allYearPoints, d => d.secondary)])
            .range([height, 0]);
    }

    // Add axes
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(allYears.length).tickFormat(d3.format('d')));

    // Left Y axis
    svg.append('g')
        .call(d3.axisLeft(y1)
            .tickFormat(d => {
                if (d >= 1000000) return (d/1000000) + 'M';
                if (d >= 1000) return (d/1000) + 'K';
                return d;
            }));

    // Right Y axis if secondary attribute selected
    if (secondaryAttribute) {
        svg.append('g')
            .attr('transform', `translate(${width},0)`)
            .call(d3.axisRight(y2)
                .tickFormat(d => {
                    if (d >= 1000000) return (d/1000000) + 'M';
                    if (d >= 1000) return (d/1000) + 'K';
                    return d;
                }));
    }

    // Add legend
    const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${width + 20}, 0)`);

    // Primary metric legend
    legend.append('line')
        .attr('x1', 0)
        .attr('x2', 20)
        .attr('y1', 10)
        .attr('y2', 10)
        .attr('stroke', '#3b82f6')
        .attr('stroke-width', 2);

    legend.append('text')
        .attr('x', 25)
        .attr('y', 13)
        .text(primaryAttribute);

    if (secondaryAttribute) {
        // Secondary metric legend
        legend.append('line')
            .attr('x1', 0)
            .attr('x2', 20)
            .attr('y1', 30)
            .attr('y2', 30)
            .attr('stroke', '#ef4444')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '5,5');

        legend.append('text')
            .attr('x', 25)
            .attr('y', 33)
            .text(secondaryAttribute);
    }

    // Add lines
    const primaryLine = d3.line()
        .x(d => x(d.year))
        .y(d => y1(d.primary))
        .defined(d => d.primary !== null);

    svg.append('path')
        .datum(allYearPoints.filter(d => d.primary !== null))
        .attr('fill', 'none')
        .attr('stroke', '#3b82f6')
        .attr('stroke-width', 2)
        .attr('d', primaryLine);

    if (secondaryAttribute) {
        const secondaryLine = d3.line()
            .x(d => x(d.year))
            .y(d => y2(d.secondary))
            .defined(d => d.secondary !== null);

        svg.append('path')
            .datum(allYearPoints.filter(d => d.secondary !== null))
            .attr('fill', 'none')
            .attr('stroke', '#ef4444')
            .attr('stroke-dasharray', '5,5')
            .attr('stroke-width', 2)
            .attr('d', secondaryLine);
    }

    // Add dots with enhanced tooltip
    allYearPoints.forEach(d => {
        if (d.primary === null) {
            svg.append('circle')
                .attr('cx', x(d.year))
                .attr('cy', height/2)
                .attr('r', 4)
                .attr('fill', '#000');
        } else {
            svg.append('circle')
                .attr('cx', x(d.year))
                .attr('cy', y1(d.primary))
                .attr('r', 4)
                .attr('fill', '#3b82f6')
                .on('mouseover', function(event) {
                    let tooltipContent = `
                        <div class="tooltip-row">
                            <span class="tooltip-label">Year:</span> ${d.year}
                        </div>
                        <div class="tooltip-row">
                            <span class="tooltip-label tooltip-primary">${primaryAttribute}:</span> ${d.primary}
                        </div>`;
                    
                    if (secondaryAttribute && d.secondary !== null) {
                        tooltipContent += `
                            <div class="tooltip-row">
                                <span class="tooltip-label tooltip-secondary">${secondaryAttribute}:</span> ${d.secondary}
                            </div>`;
                    }
                    
                    tooltip.style('display', 'block')
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 10) + 'px')
                        .html(tooltipContent);
                })
                .on('mouseout', () => tooltip.style('display', 'none'));
        }

        if (secondaryAttribute) {
            if (d.secondary === null) {
                svg.append('circle')
                    .attr('cx', x(d.year))
                    .attr('cy', height/2)
                    .attr('r', 4)
                    .attr('fill', '#000');
            } else {
                svg.append('circle')
                    .attr('cx', x(d.year))
                    .attr('cy', y2(d.secondary))
                    .attr('r', 4)
                    .attr('fill', '#ef4444');
            }
        }
    });

    // Add axis labels
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height/2)
        .attr('y', -margin.left + 30)
        .style('text-anchor', 'middle')
        .text(primaryAttribute);

    if (secondaryAttribute) {
        svg.append('text')
            .attr('transform', 'rotate(90)')
            .attr('x', height/2)
            .attr('y', -width - margin.right + 40)
            .style('text-anchor', 'middle')
            .text(secondaryAttribute);
    }

    svg.append('text')
        .attr('x', width/2)
        .attr('y', height + margin.bottom - 10)
        .style('text-anchor', 'middle')
        .text('Year');
}

function updateAttributesList() {
    if (!currentDistrict || !currentYear) return;

    const yearData = parsedData.get(currentDistrict).find(d => d.year === currentYear);
    attributesList.innerHTML = '';

    if (!yearData) {
        const div = document.createElement('div');
        div.className = 'attribute-item';
        div.style.gridColumn = '1 / -1';
        div.style.textAlign = 'center';
        div.style.color = 'red';
        div.textContent = 'No data available for this year';
        attributesList.appendChild(div);
        return;
    }

    const attributes = Object.keys(yearData).filter(key => 
        !["year", "lea_id", "leaid", "phone", "lea_name", "urban_centric_locale"].includes(key)
    );

    attributes.sort().forEach(attr => {
        const value = yearData[attr];
        const div = document.createElement('div');
        div.className = 'attribute-item';
        
        const labelDiv = document.createElement('div');
        labelDiv.className = 'attribute-label';
        labelDiv.textContent = attr;
        
        const valueDiv = document.createElement('div');
        valueDiv.className = 'attribute-value';
        if (value === null || value <= 0) {
            valueDiv.textContent = 'No data available';
            valueDiv.style.color = 'red';
        } else {
            valueDiv.textContent = typeof value === 'number' ? 
                value.toLocaleString(undefined, {maximumFractionDigits: 2}) : 
                value;
        }
        
        div.appendChild(labelDiv);
        div.appendChild(valueDiv);
        attributesList.appendChild(div);
    });
}