// Constants
const margin = {top: 20, right: 30, bottom: 50, left: 100};
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Global variables
let parsedData = {};
let currentDistrict = null;
let allYears = [];
let currentYear = null;

// DOM elements
const searchInput = document.getElementById('searchInput');
const attributeSelect = document.getElementById('attributeSelect');
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

// Terminology definitions
const terminology = {
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
d3.csv("data_cleaned.csv").then(data => {
    const relevantAttributes = Object.keys(data[0]).filter(key => 
        !["year", "lea_id", "leaid", "phone", "lea_name", "urban_centric_locale", "fiscal year", 
        "debt_shortterm_outstand_end_fy","payments_charter_schools","name of school district",""].includes(key)
    );

    // Populate attribute dropdown
    attributeSelect.innerHTML = '';
    relevantAttributes.forEach((attr, index) => {
        const option = document.createElement('option');
        option.value = attr;
        option.textContent = attr;
        attributeSelect.appendChild(option);
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
    attributeSelect.addEventListener('change', updateChart);
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
    
    // Update selected state in district list
    const items = districtList.getElementsByClassName('district-list-item');
    Array.from(items).forEach(item => {
        item.classList.toggle('selected', item.textContent === district);
    });

    // Update selected district display
    selectedDistrictDiv.textContent = district;
    selectedDistrictDiv.style.display = 'block';

    updateChart();
    updateAttributesList();
}

function updateChart() {
    const chartContainer = document.getElementById('chartContainer');
    const selectedAttribute = attributeSelect.value;

    if (!currentDistrict || !selectedAttribute) return;

    chartContainer.innerHTML = '';

    const svg = d3.select('#chartContainer')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Get the district's data and create a complete year range
    const districtData = parsedData.get(currentDistrict);
    const allYearPoints = allYears.map(year => {
        const yearData = districtData.find(d => d.year === year);
        return {
            year: year,
            value: yearData ? yearData[selectedAttribute] : null
        };
    });

    const x = d3.scaleLinear()
        .domain([d3.min(allYears), d3.max(allYears)])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(allYearPoints, d => d.value)])
        .range([height, 0]);

    // Add X axis and label
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x)
            .ticks(allYears.length)
            .tickFormat(d3.format('d')));
    
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + margin.bottom - 10)
        .style('text-anchor', 'middle')
        .text('Year');

    // Add Y axis and label with formatted ticks
    svg.append('g')
        .call(d3.axisLeft(y)
            .tickFormat(d => {
                if (d >= 1000000) {
                    return (d/1000000) + 'M';
                } else if (d >= 1000) {
                    return (d/1000) + 'K';
                }
                return d;
            }));
    
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -margin.left + 30)
        .style('text-anchor', 'middle')
        .text(selectedAttribute);

    // Add line connecting valid points
    const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.value))
        .defined(d => d.value !== null);

    svg.append('path')
        .datum(allYearPoints.filter(d => d.value !== null))
        .attr('fill', 'none')
        .attr('stroke', '#3b82f6')
        .attr('stroke-width', 2)
        .attr('d', line);

    // Add dots
    allYearPoints.forEach(d => {
        if (d.value === null) {
            // Red dot for missing or invalid data
            svg.append('circle')
                .attr('cx', x(d.year))
                .attr('cy', height/2)
                .attr('r', 4)
                .attr('fill', 'red');
            
            svg.append('text')
                .attr('x', x(d.year))
                .attr('y', (height/2) - 10)
                .attr('text-anchor', 'middle')
                .attr('class', 'missing-label')
                .text('Missing data');
        } else {
            // Normal dot for valid data
            svg.append('circle')
                .attr('cx', x(d.year))
                .attr('cy', y(d.value))
                .attr('r', 4)
                .attr('fill', '#3b82f6')
                .on('mouseover', function(event) {
                    tooltip.style('display', 'block')
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 10) + 'px')
                        .html(`Year: ${d.year}<br>${selectedAttribute}: ${d.value}`);
                })
                .on('mouseout', function() {
                    tooltip.style('display', 'none');
                });
        }
    });
}

function updateAttributesList() {
    if (!currentDistrict || !currentYear) return;

    const yearData = parsedData.get(currentDistrict).find(d => d.year === currentYear);
    attributesList.innerHTML = '';

    if (!yearData) {
        // Handle case where no data exists for the selected year
        const div = document.createElement('div');
        div.className = 'attribute-item';
        div.style.gridColumn = '1 / -1';
        div.style.textAlign = 'center';
        div.style.color = 'red';
        div.textContent = 'No data available for this year';
        attributesList.appendChild(div);
        return;
    }

    // Get relevant attributes
    const attributes = Object.keys(yearData).filter(key => 
        !["year", "lea_id", "leaid", "phone", "lea_name", "urban_centric_locale"].includes(key)
    );

    // Sort attributes alphabetically and create list
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