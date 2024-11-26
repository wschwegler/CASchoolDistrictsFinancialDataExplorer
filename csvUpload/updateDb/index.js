const express = require('express')
const bodyParser = require('body-parser')
const csv = require('fast-csv')
const fs = require('fs')
const path = require('path')
const mysql2 = require('mysql2')
const dotenv = require('dotenv')
dotenv.config()

const app = express()

const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())

const multer = require('multer')

let storage = multer.diskStorage({
    destination:(req,file,callback) => {
        callback(null,"./uploads/")
    },
    filename:(req,file,callback) => {
        callback(null,file.fieldname + "-" + Date.now() + path.extname(file.originalname))
    }
})

let upload = multer({
    storage:storage
})

const pool = mysql2.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
})

app.get('/',(req,res) => {
    res.sendFile(__dirname + "/index.html")
})

app.post('/import-csv', upload.single('csvFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded')
        }
        
        console.log('Processing file:', req.file.path)
        await uploadCsv(__dirname + "/uploads/" + req.file.filename)
        res.send("Records processed successfully")
    } catch (error) {
        console.error('Error during upload:', error)
        res.status(500).send(`Error processing records: ${error.toString()}`)
    }
})

async function uploadCsv(filePath) {
    return new Promise((resolve, reject) => {
        let stream = fs.createReadStream(filePath)
        let csvDataColl = []
        let headers = null
        
        let fileStream = csv
            .parse()
            .on('data', function(data) {
                if (!headers) {
                    headers = data
                    console.log('CSV Headers:', headers) 
                } else {
                    // Create an object mapping headers to values
                    let row = []
                    row.push(
                        data[headers.indexOf('leaid')],  
                        data[headers.indexOf('year')],
                        data[headers.indexOf('lea_name')],
                        data[headers.indexOf('phone')],
                        data[headers.indexOf('urban_centric_locale')],
                        data[headers.indexOf('number_of_schools')],
                        data[headers.indexOf('enrollment')],
                        data[headers.indexOf('teachers_total_fte')], 
                        data[headers.indexOf('rev_total')],
                        data[headers.indexOf('rev_fed_total')],
                        data[headers.indexOf('rev_state_total')],
                        data[headers.indexOf('rev_local_total')],
                        data[headers.indexOf('exp_total')],
                        data[headers.indexOf('exp_current_instruction_total')],
                        data[headers.indexOf('outlay_capital_total')],
                        data[headers.indexOf('payments_charter_schools')],
                        data[headers.indexOf('salaries_instruction')],
                        data[headers.indexOf('benefits_employee_total')],
                        data[headers.indexOf('debt_interest')],
                        data[headers.indexOf('debt_longterm_outstand_end_fy')],
                        data[headers.indexOf('debt_shortterm_outstand_end_fy')],
                        data[headers.indexOf('name of school district')],
                        data[headers.indexOf('secured_net taxable value')],
                        data[headers.indexOf('unsecured_net taxable value')],
                        data[headers.indexOf('assessed_value')],
                        data[headers.indexOf('adjusted_assessed_value')]
                    )
                    csvDataColl.push(row)
                }
            })
            .on('end', async function() {
                let connection = null
                try {
                    console.log(`Parsed ${csvDataColl.length} rows from CSV`)
                    
                    connection = await pool.promise().getConnection()
                    console.log('Database connection established')
                    
                    const [existingRows] = await connection.query(
                        'SELECT DISTINCT leaid, year FROM finance_data'
                    )
                    console.log(`Found ${existingRows.length} existing records`)
                    
                    const existingCombos = new Set(
                        existingRows.map(row => `${row.leaid}-${row.year}`)
                    )
                    
                    const newRows = csvDataColl.filter(row => {
                        const combo = `${row[0]}-${row[1]}`
                        return !existingCombos.has(combo)
                    })
                    
                    console.log(`Found ${newRows.length} new records to insert`)
                    
                    if (newRows.length > 0) {
                        const query = `
                            INSERT INTO finance_data (
                                \`leaid\`, \`year\`, \`lea_name\`,\`phone\`, \`urban_centric_locale\`, \`number_of_schools\`,
                                \`enrollment\`, \`teachers_total_fte\`, \`rev_total\`, \`rev_fed_total\`,
                                \`rev_state_total\`, \`rev_local_total\`, \`exp_total\`,
                                \`exp_current_instruction_total\`, \`outlay_capital_total\`,
                                \`payments_charter_schools\`, \`salaries_instruction\`,
                                \`benefits_employee_total\`, \`debt_interest\`,
                                \`debt_longterm_outstand_end_fy\`, \`debt_shortterm_outstand_end_fy\`,
                                \`name of school district\`, \`secured_net taxable value\`,
                                \`unsecured_net taxable value\`,\`assessed_value\`,\`adjusted_assessed_value\`
                            ) VALUES ?
                        `
                        await connection.query(query, [newRows])
                        console.log('Insert query executed successfully')
                    }
                    
                    try {
                        fs.unlinkSync(filePath)
                        console.log('Temporary file cleaned up')
                    } catch (cleanupError) {
                        console.error('Error cleaning up file:', cleanupError)
                    }
                    
                    if (connection) {
                        connection.release()
                        console.log('Database connection released')
                    }
                    
                    resolve()
                    
                } catch (error) {
                    console.error('Error in uploadCsv:', error)
                    if (connection) {
                        connection.release()
                    }
                    reject(error)
                }
            })
            .on('error', function(error) {
                console.error('CSV parsing error:', error)
                reject(error)
            })

        stream.pipe(fileStream)
    })
}

const uploadDir = './uploads'
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir)
    console.log('Created uploads directory')
}

app.get('/update-data-viz', async (req, res) => {
    let connection;
    try {
        const exportPath = path.join(process.cwd(),'..', 'newDataViz', 'Data.csv')

        connection = await pool.promise().getConnection()

        const [rows] = await connection.query('SELECT * FROM finance_data')

        const ws = fs.createWriteStream(exportPath)

        csv.write(rows, { headers: true })
           .pipe(ws)
           .on('finish', () => {
               connection.release()
               res.json({ 
                   message: 'CSV exported successfully', 
                   path: exportPath 
               })
           })

    } catch (error) {
        console.error('Export error:', error)
        if (connection) connection.release()
        res.status(500).send('Error exporting CSV')
    }
})


app.listen(PORT,() => {
    console.log("App is listening on port ${PORT}")
})