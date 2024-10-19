// Import required modules
const express = require('express');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const selfsigned = require('selfsigned');
const fs = require('fs');
const https = require('https');


// Define path and folder where SSL certificates will be stored
const certFolder = path.join(__dirname, 'certs');
const privateKeyPath = path.join(certFolder, 'server-key.pem');
const certPath = path.join(certFolder, 'server-cert.pem');

// Function to generate self-signed certificates
function generateSelfSignedCertificates() {
    // Define attributes for the certificate (in this case, the common name "localhost")
    const attrs = [{ name: 'commonName', value: 'localhost' }];
    
    // Generate self-signed certificates valid for 10 years (3650 days)
    const pems = selfsigned.generate(attrs, { days: 3650 });
    
    // Write the generated private key and certificate to the specified paths
    fs.writeFileSync(privateKeyPath, pems.private);
    fs.writeFileSync(certPath, pems.cert);

    console.log('Self-signed certificates created successfully.');
}

// Function to check if certificates exist and generate new ones if necessary
function checkAndGenerateCertificates() {
    // If the private key or certificate files don't exist, generate new certificates
    if (!fs.existsSync(privateKeyPath) || !fs.existsSync(certPath)) {
        console.log('Certificates not found, generating new ones...');
        generateSelfSignedCertificates();
    } else {
        // If the certificates already exist, log a message
        console.log('Certificates already exist.');
    }
}

// Call the function to check for and generate certificates if needed
checkAndGenerateCertificates();

// HTTPS options (certificates)
const httpsOptions = {
    key: fs.readFileSync(privateKeyPath),
    cert: fs.readFileSync(certPath)
};

// Create express application
const app = express();

// Serve static files from public folder (CSS, JS, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Create swagger options
const swaggerOptions = {
    swaggerDefinition: {
        info: {
            title: "AlarmWatcher API",
            version: "1.0.0",
            description: "API documentation for AlarmWatcher"
        }
    },
    apis: ['server.js'],
}

// Options to customize Swagger UI
const swaggerUiOptions = {
    customCss: '.swagger-ui .auth-wrapper { display: none !important; }'  // Custom CSS to hide the authorize button
};

// Define swagger docs
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs, swaggerUiOptions));

// Create and connect to an SQLite database
const db = new sqlite3.Database('./alarms.db', (err) => {
    if (err) {
        console.error("Error opening database: " + err.message);
    } else {
        console.log("Connected to the SQLite database.");

        // Create a new table for storing alarms
        db.run(`CREATE TABLE IF NOT EXISTS alarms (
            alarm_id TEXT PRIMARY KEY NOT NULL, -- Unique identifier for the alarm (string)
            alarm_class INTEGER NOT NULL,       -- Class of the alarm (integer: 1, 2, or 3)
            alarm_state TEXT NOT NULL,          -- State of the alarm (string)
            raised_time INTEGER NOT NULL,       -- Timestamp when the alarm was raised (integer, unix timestamp)
            require_ack BOOLEAN NOT NULL,       -- Whether the alarm needs to be acknowledged (boolean)
            ack_time INTEGER,                   -- Time when the alarm was acknowledged (integer, unix timestamp)
            delete_time INTEGER                 -- Time when the alarm was deleted (integer, unix timestamp)
        )`, (err) => {
            if (err) {
                console.log("Error creating table: " + err.message);
            } else {
                console.log("Alarms table created successfully.");
            }
        });
    }
});

// Frontend
app.get('/', (req, res) => {
    // Return index.html
    return res.status(200).sendFile(__dirname + '/index.html');
});

// API
/**
 * @swagger
 * /api/serverTime:
 *   get:
 *     tags:
 *       - Alarm list
 *     description: Get the current server time as a UNIX timestamp.
 *     responses:
 *       200:
 *         description: Server time as a UNIX timestamp (e.g. 1727206611)
 */
app.get('/api/serverTime', (req, res) => {
    // Return current UNIX timestamp in seconds
    return res.status(200).send(Math.floor(Date.now() / 1000).toString());
});

/**
 * @swagger
 * /api/raiseAlarm:
 *   get:
 *     tags:
 *       - Alarm list
 *     description: Add an alarm to AlarmWatcher.
 *     parameters:
 *       - name: alarm_id
 *         description: Unique identifier of the alarm (alarm name)
 *         in: query
 *         required: true
 *         type: string
 *       - name: alarm_class
 *         description: Class of the alarm (1 = Alarm - highest priority, 2 = Warning - medium priority, 3 = Event - lowest priority)
 *         in: query
 *         required: true
 *         type: integer
 *       - name: alarm_state
 *         description: State of the alarm that is displayed (e.g. active, fault, error, open)
 *         in: query
 *         required: false
 *         type: string
 *         default: on
 *       - name: req_ack
 *         description: Indication of whether the alarm must be acknowledged by the user
 *         in: query
 *         required: false
 *         type: boolean
 *         default: false
 *       - name: duration
 *         description: Seconds after which the alarm will be automatically deleted (0 = no deletion)
 *         in: query
 *         required: false
 *         type: integer
 *         default: 0
 *     responses:
 *       200:
 *         description: Alarm inserted successfully
 *       400:
 *         description: Error inserting alarm
 */
app.get('/api/raiseAlarm', (req, res) => {
    alarm_id = req.query.alarm_id;
    alarm_class = Number(req.query.alarm_class);
    alarm_state = req.query.alarm_state || "on";            // Default to "on" if not provided
    raised_time = Number(Math.floor(Date.now() / 1000));    // Current UNIX timestamp in seconds
    require_ack = ((req.query.req_ack ||false) == "true");  // Default to false if not provided
    delete_time = Number(req.query.duration) || null;       // Default to null if not provided

    // Calculate deletion time (if provided) from duration and current time
    if(delete_time){
        delete_time += raised_time;
    }

    // Add the alarm to the table
    db.run(
        `INSERT OR REPLACE INTO alarms (alarm_id, alarm_class, alarm_state, raised_time, require_ack, delete_time) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [alarm_id, alarm_class, alarm_state, raised_time, require_ack, delete_time],
        function(err) {
            if (err) {
                return res.status(400).send("Error inserting alarm: " + err.message);
            } else {
                res.status(200).send("Alarm inserted successfully!");
            }
        }
    );
});

/**
 * @swagger
 * /api/ackAlarm:
 *   get:
 *     tags:
 *       - Alarm list
 *     description: Acknowledge an alarm.
 *     parameters:
 *       - name: alarm_id
 *         description: Unique identifier of the alarm (alarm name)
 *         in: query
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Alarm acknowledged successfully if available
 *       400:
 *         description: Error fetching/acknowledging alarm
 */
app.get('/api/ackAlarm', (req, res) => {
    alarm_id = req.query.alarm_id;
    ack_time = Math.floor(Date.now() / 1000);  // Current UNIX timestamp in seconds

    // Check if alarm_id is provided
    if (!alarm_id) {
        return res.status(400).send("Error fetching alarm: 'alarm_id' is required.");
    }
    
    // Check if the alarm requires acknowledgment
    db.get(
        `SELECT require_ack FROM alarms WHERE alarm_id = ?`,
        [alarm_id],
        function(err, row) {
            if (err) {
                return res.status(400).send("Error fetching alarm: " + err.message);
            }
            if (row.require_ack == 1) {
                // Update the ack_time for this alarm
                db.run(
                    `UPDATE alarms SET ack_time = ? WHERE alarm_id = ?`,
                    [ack_time, alarm_id],
                    function(err) {
                        if (err) {
                            return res.status(400).send("Error acknowledging alarm: " + err.message);
                        } else {
                            res.status(200).send("Alarm acknowledged successfully if available!");
                        }
                    }
                );
            } else {
                res.status(200).send("Alarm acknowledged successfully if available!");
            }
        }
    );
});


/**
 * @swagger
 * /api/clearAlarm:
 *   get:
 *     tags:
 *       - Alarm list
 *     description: Delete an alarm from AlarmWatcher.
 *     parameters:
 *       - name: alarm_id
 *         description: Unique identifier of the alarm (alarm name)
 *         in: query
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Alarm cleared successfully if available
 *       400:
 *         description: Error clearing alarm
 */
app.get('/api/clearAlarm', (req, res) => {
    alarm_id = req.query.alarm_id;

    // Check if alarm_id is provided
    if (!alarm_id) {
        return res.status(400).send("Error clearing alarm: 'alarm_id' is required.");
    }

    // Delete the alarm from the table
    db.run(`DELETE FROM alarms WHERE alarm_id = ?`, [alarm_id], function (err) {
        if (err) {
            return res.status(400).send("Error clearing alarm: " + err.message);
        }
        res.status(200).send("Alarm cleared successfully if available!");
    });
});

/**
 * @swagger
 * /api/getAlarms:
 *   get:
 *     tags:
 *       - Alarm list
 *     description: Get a list of alarms sorted by the time the alarms where raised (most recent on top). Either all or filtered according to the following parameters.
 *     parameters:
 *       - name: alarm_id
 *         description: Returns the alarm uniquely found with the unique identifier of the alarm (alarm name)
 *         in: query
 *         required: false
 *         type: string
 *       - name: before
 *         description: Returns all alarms that were raised before the date (unix timtestamp, e.g. 1726953393)
 *         in: query
 *         required: false
 *         type: integer
 *       - name: after
 *         description: Returns all alarms that were raised after the date (unix timtestamp, e.g. 1726953393)
 *         in: query
 *         required: false
 *         type: integer
 *     responses:
 *       200:
 *         description: Result as a JSON array
 *       400:
 *         description: Error fetching alarms
 */
app.get('/api/getAlarms', (req, res) => {
    alarm_id = req.query.alarm_id;
    before = req.query.before;
    after = req.query.after;

    // Base SQL query to fetch alarms
    let sql = `SELECT * FROM alarms`;
    let params = [];
    let conditions = [];

    // If 'id' parameter is provided, filter by 'alarm_id'
    if (alarm_id) {
        conditions.push(`alarm_id = ?`);
        params.push(alarm_id);
    }

    // If 'before' parameter is provided, filter by alarms raised before the given timestamp
    if (before) {
        conditions.push(`raised_time <= ?`);
        params.push(before);
    }

    // If 'after' parameter is provided, filter by alarms raised after the given timestamp
    if (after) {
        conditions.push(`raised_time >= ?`);
        params.push(after);
    }

    // Append conditions to the SQL query if any are present
    if (conditions.length > 0) {
        sql += ` WHERE ` + conditions.join(' AND ');
    }

    // Add ORDER BY clause to sort by raised_time in descending order (newest alarms first)
    sql += ` ORDER BY raised_time DESC`;

    // Execute the SQL query
    db.all(sql, params, (err, rows) => {
        if (err) {
            return res.status(400).send("Error fetching alarms: " + err.message);
        }

        // Return the result as a JSON array
        res.status(200).json(rows);
    });
});


// Start HTTP server on port 3777 and HTTPS server on port 3778
app.listen(3777, () => console.log("HTTP server listening on port 3777."));
https.createServer(httpsOptions, app).listen(3778, () => console.log('HTTPS server listening on port 3778.'));

// Function to delete alarms with past delete_time
function deleteExpiredAlarms() {
    date = Date.now();
    currentTime = Math.floor(date / 1000);  // Get current UNIX timestamp

    db.run(`DELETE FROM alarms WHERE delete_time IS NOT NULL AND (require_ack = 0 OR (require_ack = 1 AND ack_time IS NOT NULL)) AND delete_time <= ?`, [currentTime], function (err) {
        if (err) {
            console.error("Error deleting expired alarms: " + err.message);
        } else {
            if (this.changes > 0) {
                console.log("alarm(s) deleted successfully at ${currentTime} (${new Date(date).toLocaleString()}).");
            }
        }
    });
}

// Set an interval to check and delete expired alarms every second
setInterval(deleteExpiredAlarms, 1000);  // 1000ms = 1 second

