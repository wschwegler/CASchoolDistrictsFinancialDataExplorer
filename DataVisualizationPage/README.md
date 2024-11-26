# School District Data Visualization Documentation

## Developer Documentation

### Project Overview
This web application visualizes school district data across multiple years, allowing users to explore various educational and financial metrics. Built with vanilla JavaScript and D3.js, it provides an interactive interface for analyzing district-level data.

### Technical Stack
- HTML5
- CSS3
- JavaScript (ES6+)
- D3.js (v7.8.5)
- No additional framework dependencies

### Project Structure
```
project/
├── index.html          # Main HTML structure
├── styles.css          # All styling rules
├── script.js           # Application logic and D3 visualizations
└── data_cleaned.csv    # Data source
```

### Data Format Requirements
The CSV file must include these columns:
- `lea_id` or `leaid`: District identifier
- `lea_name`: District name
- `year`: Academic year
- Various metric columns (e.g., enrollment, revenue, expenditures)

Example CSV format:
```csv
lea_id,lea_name,year,enrollment,rev_total,...
12345,Springfield School District,2020,1500,10000000,...
```

### Key Components

#### 1. District Management
```javascript
function getMostRecentDistrictName(data, lea_id) {
    // Handles district name consistency across years
}

function selectDistrict(district) {
    // Manages district selection and updates
}
```

#### 2. Data Visualization
```javascript
function updateChart() {
    // Renders line chart with D3.js
}

function updateAttributesList() {
    // Updates attribute values display
}
```

#### 3. Search and Filter
```javascript
function handleSearch(e) {
    // Manages district search functionality
}
```

### Implementation Guidelines

1. Data Processing:
```javascript
// Group data by district ID
parsedData = d3.group(data, d => `${idToNameMap.get(d.lea_id)} (${d.lea_id})`);
```

2. Handling Missing Data:
```javascript
// Check for null or invalid values
d[attr] = d[attr] === "" || isNaN(d[attr]) || +d[attr] <= 0 ? null : +d[attr];
```

3. Visualization Updates:
```javascript
// Update chart when attribute changes
attributeSelect.addEventListener('change', updateChart);
```

### Adding New Features

1. Adding New Metrics:
   - Add metric definition to `terminology` object
   - Update relevant attribute filters
   - Handle any special formatting needs

2. Adding New Visualizations:
   - Create new container in HTML
   - Add corresponding CSS
   - Implement visualization function
   - Add to update cycle

### Error Handling
- Data validation in load phase
- Null checks for missing years
- Error states for visualization components
- User feedback for data issues

---

## User Manual

### Getting Started

#### System Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- Minimum screen resolution: 1024x768

#### Installation
1. Download all project files
2. Place files in a web server directory
3. Ensure data file is named `data_cleaned.csv`
4. Access through web server (not direct file access)

### Tutorial

#### Basic Navigation

1. Finding a District:
   - Use search bar to filter districts by name or ID
   - Or scroll through alphabetical list
   - Click district to select

2. Viewing Trends:
   - Select attribute from dropdown
   - Hover over points to see exact values
   - Red dots indicate missing data

3. Viewing All Attributes:
   - Select year from dropdown
   - Scroll through list of values
   - Red text indicates missing/invalid data

#### Advanced Features

1. Using the Terminology Box:
   - Click minimize/expand to toggle view
   - Scroll through definitions
   - Reference while analyzing data

2. Data Analysis Tips:
   - Compare trends across years
   - Check for data completeness
   - Use tooltips for precise values

### Troubleshooting Guide

#### Common Issues

1. Chart Not Displaying
   - Check if district is selected
   - Verify attribute selection
   - Refresh page if persists

2. Missing Data Points
   - Red dots are normal for missing data
   - Verify data in CSV file
   - Check year range coverage

3. Search Not Working
   - Ensure correct spelling
   - Try searching by ID instead
   - Clear search and try again

4. Display Issues
   - Try browser refresh
   - Check zoom level
   - Verify screen resolution

#### Data Issues

1. "No data available"
   - Normal for some years/metrics
   - Verify data completeness
   - Check for data format issues

2. Unexpected Values
   - Verify data in CSV
   - Check for formatting issues
   - Ensure consistent units

#### Browser Support

1. Chrome/Firefox
   - Recommended browsers
   - Keep updated to latest version

2. Safari/Edge
   - Supported but may have minor visual differences
   - Ensure latest version

3. Internet Explorer
   - Not supported
   - Use modern browser instead

### Best Practices

1. Data Analysis
   - Start with overview metrics
   - Compare related attributes
   - Note any data gaps

2. Performance
   - Limit active visualizations
   - Clear search when done
   - Regular page refreshes

3. Data Export
   - Use browser tools for screenshots
   - Save data points as needed
   - Document analysis steps

### Support

For technical issues:
- Check troubleshooting guide
- Verify data format
- Contact system administrator

For data questions:
- Refer to terminology box
- Check data sources
- Consult district records
