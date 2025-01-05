/** 
 * +----------------------------------------------
 * | AlarmWatcher
 * | johhny-de
 * | https://github.com/johnny-de/alarmwatcher/
 * +----------------------------------------------
*/ 

const version = 'v1.3.1';

/** 
 * +----------------------------------------------
 * | IMPORTING MODULES
 * +----------------------------------------------
*/ 

const express = require('express');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const selfsigned = require('selfsigned');
const fs = require('fs');
const https = require('https');
const webPush = require('web-push');
const bodyParser = require('body-parser');
const { exec } = require('child_process');

/** 
 * +----------------------------------------------
 * | LOAD SETTINGS
 * +----------------------------------------------
*/ 

const settingsPath = path.join(__dirname, 'data', 'settings.json');

// Define default JSON content
const defaultSettings = {
    ports: {
        http_port: 3777,
        https_port: 3778,
    },
    https: {
        allow_http: true,
        common_name: "localhost",
        alternative_names: "example.com, 93.184.215.14",
    },
    design: {
        dark_mode: "system",
        hide_events: false
    }
};

// Function to compare the structure of two objects (only keys and types, not values)
function compareStructure(obj1, obj2) {
    // If the types differ, return false
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) {
        return false;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    // If the number of keys differ, the structure is different
    if (keys1.length !== keys2.length) {
        return false;
    }

    // Recursively compare the structure of each key
    for (let key of keys1) {
        if (!keys2.includes(key) || typeof obj1[key] !== typeof obj2[key]) {
            return false;
        }
        if (typeof obj1[key] === 'object') {
            if (!compareStructure(obj1[key], obj2[key])) {
                return false;
            }
        }
    }

    return true;
}

// Function to load or create settings.json
function loadOrCreateSettings() {
    // Check if the file exists
    if (fs.existsSync(settingsPath)) {
        // If file exists, read and parse it
        const data = fs.readFileSync(settingsPath, 'utf-8');
        try {
            const settings = JSON.parse(data);
            console.log("Loaded settings from file.");

            // Compare the structure of the settings with the default structure (ignore values)
            if (!compareStructure(settings, defaultSettings)) {
                console.log("Structure mismatch detected. Overwriting settings file.");
                fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2));
                return defaultSettings;
            }

            return settings;
        } catch (err) {
            console.error("Error parsing settings.json:", err);
            return null;
        }
    } else {
        // If file does not exist, create it with default settings
        fs.mkdirSync(path.dirname(settingsPath), { recursive: true }); // Create directory if needed
        fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2));
        console.log("Created settings file with default settings.");
        return defaultSettings;
    }
}

// Load settings once at the start
const settings = loadOrCreateSettings();

/** 
 * +----------------------------------------------
 * | HTTPS HANDLING
 * +----------------------------------------------
*/ 

let httpsOptions;

// Define path and folder where SSL certificates will be stored
const certFolder = path.join(__dirname, 'data');
const privateKeyPath = path.join(certFolder, 'server-key.pem');
const certPath = path.join(certFolder, 'server-cert.pem');
const certDerPath = path.join(certFolder, 'server-cert.der'); // DER path

// Import a regular expression to check for IP addresses
const isIpAddress = (value) => /^(\d{1,3}\.){3}\d{1,3}$/.test(value);

// Function to convert PEM to DER format
function convertPemToDer(pemFilePath, derFilePath) {
    const pemData = fs.readFileSync(pemFilePath, 'utf8');
    const derData = Buffer.from(pemData.replace(/-----BEGIN CERTIFICATE-----/g, '')
        .replace(/-----END CERTIFICATE-----/g, '')
        .replace(/\n/g, ''), 'base64');
    fs.writeFileSync(derFilePath, derData);
}

// Generate self-signed certificates
function generateSelfSignedCertificates() {
    // Define CN from settings
    const commonName = settings.https.common_name;

    // Initialize altNames array with CN as the first SAN entry
    const altNames = [];

    // Check if the commonName is an IP address or a DNS name
    if (isIpAddress(commonName)) {
        altNames.push({ type: 7, ip: commonName });  // IP type for IP address CN
    } else {
        altNames.push({ type: 2, value: commonName }); // DNS type for domain CN
    }

    // If alternative names are provided and not empty, parse and add them to altNames
    if (settings.https.alternative_names) {
        const additionalNames = settings.https.alternative_names.split(',').map(name => {
            const trimmedName = name.trim();
            // Check if the entry is an IP address or DNS name
            if (isIpAddress(trimmedName)) {
                return { type: 7, ip: trimmedName };  // IP type for IP addresses
            } else {
                return { type: 2, value: trimmedName }; // DNS type for DNS names
            }
        });
        altNames.push(...additionalNames); // Add additional SANs to altNames
    }
    
    // Define attributes for the certificate
    const attrs = [
        { name: 'commonName', value: commonName }
    ];

    // Define the options for the certificate generation
    const options = {
        keySize: 2048,                                  // Increase key size to 2048 bits
        days: 3650,                                     // Valid for 10 years
        algorithm: 'sha256',                            // Use SHA-256 instead of SHA-1
        extensions: [
            {
                name: 'basicConstraints',               // Add Basic Constraints
                cA: true,                               // Indicate this is a CA
            },
            {
                name: 'subjectAltName',                 // Add Subject Alternative Name (SAN)
                altNames: altNames                      // Use the parsed altNames array
            },
            {
                name: 'extKeyUsage',                    // Specify Extended Key Usage (EKU)
                serverAuth: true                        // TLS Web Server Authentication
            }
        ]
    };

    // Generate self-signed certificate with updated options
    const pems = selfsigned.generate(attrs, options);

    // Write the generated private key and certificate to the specified paths
    fs.writeFileSync(privateKeyPath, pems.private);
    fs.writeFileSync(certPath, pems.cert);

    // Convert the PEM certificate to DER format
    convertPemToDer(certPath, certDerPath);

    // Set certificates
    httpsOptions = {
        key: pems.private,
        cert: pems.cert
    };

    console.log('Self-signed HTTPS certificates created successfully, valid for days:', options.days);
}

// Function to check if certificates exist and generate new ones if necessary
function checkAndGenerateCertificates() {
    // Ensure the data folder exists
    if (!fs.existsSync(certFolder)) {
        fs.mkdirSync(certFolder, { recursive: true }); // Create data folder
        console.log('data folder created.');
    }
    // If the private key or certificate files don't exist, generate new certificates
    if (!fs.existsSync(privateKeyPath) || !fs.existsSync(certPath) || !fs.existsSync(certDerPath)) {
        console.log('HTTPS Certificates not found, generating new ones.');
        generateSelfSignedCertificates();
    } else {
        // If the certificates already exist, log a message
        console.log('HTTPS Certificates already exist.');

        // Load certificates
        httpsOptions = {
            key: fs.readFileSync(privateKeyPath),
            cert: fs.readFileSync(certPath)
        };
    }
}

// Call the function to check for and generate certificates if needed
checkAndGenerateCertificates();

/** 
 * +----------------------------------------------
 * | EXPRESS DEFINITION
 * +----------------------------------------------
*/ 

// Create express application
const app = express();

// Serve static files from public folder (CSS, JS, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));

/** 
 * +----------------------------------------------
 * | SWAGGER DEFINITION
 * +----------------------------------------------
*/ 

// Create swagger options
const swaggerOptions = {
    swaggerDefinition: {
        info: {
            title: "AlarmWatcher API",
            version: "1.1.0",
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

/** 
 * +----------------------------------------------
 * | DB HANDLING
 * +----------------------------------------------
*/ 

// Define path and folder for the database
const dbFolder = path.join(__dirname, 'data');
const dbPath = path.join(dbFolder, 'alarms.db');

// Ensure the db folder exists
function ensureDbFolderExists() {
    if (!fs.existsSync(dbFolder)) {
        fs.mkdirSync(dbFolder, { recursive: true });
        console.log('DB folder created.');
    }
}

// Ensure the db folder exists before connecting to the database
ensureDbFolderExists();

// Create and connect to an SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error opening database: " + err.message);
    } else {
        console.log("Connected to the SQLite database.");

        // Define the expected number of columns for the alarms table
        const expectedColumnCount = 12;

        // Function to check if the table structure matches the expected column count
        function checkTableStructure() {
            db.all("PRAGMA table_info(alarms);", (err, columns) => {
                if (err) {
                    console.error("Error fetching table schema: " + err.message);
                    return;
                }

                // If table doesn't exist, create it
                if (columns.length === 0) {
                    console.log("Table doesn't exist, creating a new one.");
                    createAlarmsTable();
                    return;
                }

                // Check if the number of columns matches the expected count
                if (columns.length !== expectedColumnCount) {
                    console.log("Column count does not match. Dropping the old table and creating a new one.");
                    db.run("DROP TABLE IF EXISTS alarms;", (err) => {
                        if (err) {
                            console.error("Error dropping table: " + err.message);
                        } else {
                            console.log("Old alarms table dropped.");
                            createAlarmsTable();
                        }
                    });
                } else {
                    console.log("Table schema is correct.");
                }
            });
        }

        // Function to create the alarms table with the correct schema
        function createAlarmsTable() {
            db.run(`CREATE TABLE IF NOT EXISTS alarms (
                alarm_id TEXT PRIMARY KEY NOT NULL,
                alarm_class INTEGER NOT NULL,
                alarm_state TEXT NOT NULL,
                raised_time INTEGER NOT NULL,
                require_ack BOOLEAN NOT NULL,
                delete_time INTEGER,
                class_1_time INTEGER,
                class_2_time INTEGER,
                class_3_time INTEGER,
                time_after_ack INTEGER,
                class_after_ack INTEGER,
                state_after_ack TEXT
            )`, (err) => {
                if (err) {
                    console.log("Error creating table: " + err.message);
                } else {
                    console.log("Alarms table in database created successfully.");
                }
            });
        }

        // Check the table structure on connection
        checkTableStructure();
    }
});

/** 
 * +----------------------------------------------
 * | FRONTEND
 * +----------------------------------------------
*/ 

app.get('/', (req, res) => {
    // Return index.html
    return res.status(200).sendFile(__dirname + '/frontend/index.html');
});

app.get('/settings', (req, res) => {
    // Return settings.html
    return res.status(200).sendFile(__dirname + '/frontend/settings.html');
});

app.get('/features', (req, res) => {
    // Return features.html
    return res.status(200).sendFile(__dirname + '/frontend/features.html');
});

/** 
 * +----------------------------------------------
 * | ALARM HANDLING
 * +----------------------------------------------
*/ 

// Handling for adding or changing an alarm
function addOrChangeAlarm(db, alarmDetails) {
    return new Promise((resolve, reject) => {
        db.get(
            `SELECT * FROM alarms WHERE alarm_id = ?`,
            [alarmDetails.alarm_id],
            (err, existingAlarm) => {
                if (err) {
                    reject("Error fetching alarm: " + err.message);
                } else if (!existingAlarm) {
                    // No existing alarm, insert a new one
                    db.run(
                        `INSERT INTO alarms 
                        (alarm_id, alarm_class, alarm_state, raised_time, require_ack, delete_time, class_1_time, class_2_time, class_3_time) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            alarmDetails.alarm_id,
                            alarmDetails.alarm_class,
                            alarmDetails.alarm_state,
                            alarmDetails.raised_time,
                            alarmDetails.require_ack,
                            alarmDetails.delete_time,
                            alarmDetails.class_1_time,
                            alarmDetails.class_2_time,
                            alarmDetails.class_3_time
                        ],
                        function (err) {
                            if (err) {
                                reject("Error inserting alarm: " + err.message);
                            } else {
                                resolve("Alarm inserted successfully!");
                            }
                        }
                    );
                } else {
                    // Existing alarm, update based on req_ack and alarm_class comparison
                    if (existingAlarm.require_ack) {
                        // If no reset, continue with current delay
                        if (alarmDetails.alarm_class < existingAlarm.alarm_class) {
                            // Higher alarm_class: update main columns (except req_ack)
                            db.run(
                                `UPDATE alarms SET 
                                alarm_class = ?, alarm_state = ?, delete_time = ?
                                WHERE alarm_id = ?`,
                                [
                                    alarmDetails.alarm_class,
                                    alarmDetails.alarm_state,
                                    alarmDetails.delete_time,
                                    alarmDetails.alarm_id
                                ],
                                function (err) {
                                    if (err) {
                                        reject("Error updating alarm: " + err.message);
                                    } else {
                                        resolve("Alarm updated to higher class successfully!");
                                    }
                                }
                            );
                        } else if (alarmDetails.alarm_class > existingAlarm.alarm_class) {
                            // Lower alarm_class: save to after_ack columns
                            db.run(
                                `UPDATE alarms SET 
                                time_after_ack = ?, class_after_ack = ?, state_after_ack = ?, 
                                delete_time = ?
                                WHERE alarm_id = ?`,
                                [
                                    alarmDetails.raised_time,
                                    alarmDetails.alarm_class,
                                    alarmDetails.alarm_state,
                                    alarmDetails.delete_time,
                                    alarmDetails.alarm_id
                                ],
                                function (err) {
                                    if (err) {
                                        reject("Error updating alarm with lower class: " + err.message);
                                    } else {
                                        resolve("Alarm updated with lower class saved to after_ack columns.");
                                    }
                                }
                            );
                        } else {
                            // Same alarm_class: update main columns (except req_ack)
                            db.run(
                                `UPDATE alarms SET 
                                alarm_state = ?, delete_time = ?
                                WHERE alarm_id = ?`,
                                [
                                    alarmDetails.alarm_state,
                                    alarmDetails.delete_time,
                                    alarmDetails.alarm_id
                                ],
                                function (err) {
                                    if (err) {
                                        reject("Error updating alarm with same class: " + err.message);
                                    } else {
                                        resolve("Alarm updated with same class successfully!");
                                    }
                                }
                            );
                        }
                    } else {
                        // req_ack = false, simply overwrite the alarm
                        db.run(
                            `UPDATE alarms SET 
                            alarm_class = ?, alarm_state = ?, raised_time = ?, require_ack = ?, delete_time = ?
                            WHERE alarm_id = ?`,
                            [
                                alarmDetails.alarm_class,
                                alarmDetails.alarm_state,
                                alarmDetails.raised_time,
                                alarmDetails.require_ack,
                                alarmDetails.delete_time,
                                alarmDetails.alarm_id
                            ],
                            function (err) {
                                if (err) {
                                    reject("Error overwriting alarm: " + err.message);
                                } else {
                                    resolve("Alarm overwritten successfully!");
                                }
                            }
                        );
                    };

                    // Set class_1_time if currently not set or reset if class_1_time is null
                    if (!existingAlarm.class_1_time || !alarmDetails.class_1_time) {
                        db.run(
                            `UPDATE alarms SET 
                            class_1_time = ?
                            WHERE alarm_id = ?`,
                            [
                                alarmDetails.class_1_time,
                                alarmDetails.alarm_id
                            ],
                            function (err) {
                                if (err) {
                                    reject("Error overwriting alarm: " + err.message);
                                } else {
                                    resolve("Class 1 delay overwritten successfully!");
                                }
                            }
                        );
                    }

                    // Set class_2_time if currently not set or reset if class_2_time is null
                    if (!existingAlarm.class_2_time || !alarmDetails.class_2_time) {
                        db.run(
                            `UPDATE alarms SET 
                            class_2_time = ?
                            WHERE alarm_id = ?`,
                            [
                                alarmDetails.class_2_time,
                                alarmDetails.alarm_id
                            ],
                            function (err) {
                                if (err) {
                                    reject("Error overwriting alarm: " + err.message);
                                } else {
                                    resolve("Class 2 delay overwritten successfully!");
                                }
                            }
                        );
                    }

                    // Set class_3_time if currently not set or reset if class_3_time is null
                    if (!existingAlarm.class_3_time || !alarmDetails.class_3_time) {
                        db.run(
                            `UPDATE alarms SET 
                            class_3_time = ?
                            WHERE alarm_id = ?`,
                            [
                                alarmDetails.class_3_time,
                                alarmDetails.alarm_id
                            ],
                            function (err) {
                                if (err) {
                                    reject("Error overwriting alarm: " + err.message);
                                } else {
                                    resolve("Class 2 delay overwritten successfully!");
                                }
                            }
                        );
                    }
                }
            }
        );
    });
}

/** 
 * +----------------------------------------------
 * | API
 * +----------------------------------------------
*/ 

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
 *       - name: delay_class_1
 *         description: Seconds after which the alarm will transition to class 1 (0 = no transition)
 *         in: query
 *         required: false
 *         type: integer
 *         default: 0
 *       - name: delay_class_2
 *         description: Seconds after which the alarm will transition to class 2 (0 = no transition)
 *         in: query
 *         required: false
 *         type: integer
 *         default: 0
 *       - name: delay_class_3
 *         description: Seconds after which the alarm will transition to class 3 (0 = no transition)
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
    let alarm_id = req.query.alarm_id;
    let alarm_class = Number(req.query.alarm_class);
    let alarm_state = req.query.alarm_state || "on";             // Default to "on" if not provided
    let raised_time = Math.floor(Date.now() / 1000);             // Current UNIX timestamp in seconds
    let require_ack = (req.query.req_ack || false) == "true";    // Default to false if not provided
    let delete_time = Number(req.query.duration) || null;        // Default to null if not provided
    let class_1_time = Number(req.query.delay_class_1) || null;  // Default to null if not provided
    let class_2_time = Number(req.query.delay_class_2) || null;  // Default to null if not provided
    let class_3_time = Number(req.query.delay_class_3) || null;  // Default to null if not provided

    // Calculate deletion time (if provided) from duration and current time
    if (delete_time) {
        delete_time += raised_time;
    }

    // Calculate delay time (if provided) from delay_time and current time
    if (class_1_time) {
        class_1_time += raised_time;
    }
    if (class_2_time) {
        class_2_time += raised_time;
    }
    if (class_3_time) {
        class_3_time += raised_time;
    }

    // Send notification if alarm with the same class and state existed not before
    db.get(`SELECT COUNT(*) AS count FROM alarms WHERE alarm_id = ? AND alarm_class = ? AND alarm_state = ?`, [alarm_id],[alarm_class],[alarm_state], (err, row) => {
        if (err) {
            return res.status(400).send("Error checking for existing alarm: " + err.message);
        }

        // If an existing alarm was found
        if (row.count > 0) {
            // Handle case where alarm already exists if needed
            return res.status(400).send("Alarm with the same ID and class already exists.");
        }

        // Send notification if new alarm is class 1 or 2
        if (alarm_class <= 2) {
            // Send notification
            sendNotification(alarm_id, alarm_state, alarm_class);
        }
    });

    // Add the alarm to the table
    addOrChangeAlarm(db, {
        alarm_id,
        alarm_class,
        alarm_state,
        raised_time,
        require_ack,
        delete_time,
        class_1_time,
        class_2_time,
        class_3_time
    })
    .then(message => res.status(200).send(message))
    .catch(error => res.status(400).send(error));
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
    const alarm_id = req.query.alarm_id;

    // Check if alarm_id is provided
    if (!alarm_id) {
        return res.status(400).send("Error: 'alarm_id' is required.");
    }

    db.get(
        `SELECT * FROM alarms WHERE alarm_id = ?`,
        [alarm_id],
        function(err, alarm) {
            if (err) {
                return res.status(400).send("Error fetching alarm: " + err.message);
            }

            // If alarm is not found, return success as no action is needed
            if (!alarm) {
                return res.status(200).send("Alarm acknowledged successfully if available!");
            }

            // If alarm requires acknowledgment
            if (alarm.require_ack) {
                // Handle `time_after_ack`, `class_after_ack`, and `state_after_ack` logic
                if (alarm.time_after_ack && alarm.class_after_ack && alarm.state_after_ack) {
                    db.run(
                        `UPDATE alarms SET 
                        require_ack = false, 
                        raised_time = time_after_ack, 
                        alarm_class = class_after_ack, 
                        alarm_state = state_after_ack, 
                        time_after_ack = NULL, 
                        class_after_ack = NULL, 
                        state_after_ack = NULL 
                        WHERE alarm_id = ?`,
                        [alarm_id],
                        function(err) {
                            if (err) {
                                return res.status(400).send("Error processing acknowledgment: " + err.message);
                            } else {
                                return res.status(200).send("Alarm acknowledged and after_ack data processed successfully.");
                            }
                        }
                    );
                }
                else {
                    db.run(
                        `UPDATE alarms SET 
                        require_ack = 0 
                        WHERE alarm_id = ?`,
                        [alarm_id],
                        function(err) {
                            if (err) {
                                return res.status(400).send("Error processing acknowledgment: " + err.message);
                            } else {
                                return res.status(200).send("Alarm acknowledged and after_ack data processed successfully.");
                            }
                        }
                    );
                }
            } else {
                // Alarm does not require acknowledgment
                res.status(200).send("Alarm acknowledged successfully.");
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
    const alarm_id = req.query.alarm_id;

    // Check if alarm_id is provided
    if (!alarm_id) {
        return res.status(400).send("Error clearing alarm: 'alarm_id' is required.");
    }

    // Fetch the alarm to check require_ack
    db.get(
        `SELECT require_ack FROM alarms WHERE alarm_id = ?`,
        [alarm_id],
        function (err, row) {
            if (err) {
                return res.status(400).send("Error fetching alarm: " + err.message);
            }

            if (!row) {
                return res.status(200).send("Alarm cleared successfully if available!");
            }

            // If acknowledgment is required, set delete_time instead of deleting
            if (row.require_ack == 1) {
                const currentTime = Math.floor(Date.now() / 1000); // Current UNIX timestamp
                db.run(
                    `UPDATE alarms SET delete_time = ? WHERE alarm_id = ?`,
                    [currentTime, alarm_id],
                    function (err) {
                        if (err) {
                            return res.status(400).send("Error updating delete_time: " + err.message);
                        }
                        res.status(200).send("Alarm marked for deletion.");
                    }
                );
            } else {
                // Delete the alarm if acknowledgment is not required
                db.run(
                    `DELETE FROM alarms WHERE alarm_id = ?`,
                    [alarm_id],
                    function (err) {
                        if (err) {
                            return res.status(400).send("Error clearing alarm: " + err.message);
                        }
                        res.status(200).send("Alarm cleared successfully!");
                    }
                );
            }
        }
    );
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

/** 
 * +----------------------------------------------
 * | NOTIFICATION HANDLING
 * +----------------------------------------------
*/ 

app.use(bodyParser.json());

// Path to the VAPID keys file
const dataPath = path.join(__dirname, 'data', 'vapid.json');
let vapidKeys;
 
// Function to load or generate VAPID keys
function loadOrGenerateVapidKeys() {
    try {
        // Check if the VAPID keys file exists
        if (fs.existsSync(dataPath)) {
            // Read and parse the VAPID keys from the JSON file
            const data = fs.readFileSync(dataPath, 'utf8');
            vapidKeys = JSON.parse(data);
            console.log('Loaded VAPID keys for notification handling from file.');
        } else {
            // Generate VAPID keys if the file does not exist
            vapidKeys = webPush.generateVAPIDKeys();
            fs.writeFileSync(dataPath, JSON.stringify(vapidKeys, null, 2));
            console.log('Generated new VAPID keys for notification handling and saved to file.');
        }
    } catch (error) {
        console.error('Error loading or generating VAPID keys:', error);
        process.exit(1); // Exit the application if keys can't be loaded or generated
    }
}

// Load or generate the VAPID keys
loadOrGenerateVapidKeys();

// Set VAPID details
webPush.setVapidDetails(
    'mailto:mail@mail.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

// Endpoint to serve the public VAPID key
app.get('/vapidPublicKey', (req, res) => {
    res.status(200).json({ publicKey: vapidKeys.publicKey });
});

// Initialize subscriptions array
let subscriptions = [];

// File path for storing subscriptions
const subscriptionsFilePath = path.join(__dirname, 'data', 'subscriptions.json');

// Load subscriptions from the file when the server starts
const loadSubscriptions = () => {
    if (fs.existsSync(subscriptionsFilePath)) {
        const data = fs.readFileSync(subscriptionsFilePath, 'utf-8');
        try {
            subscriptions = JSON.parse(data);
            console.log(`Loaded ${subscriptions.length} subscriptions from file.`);
        } catch (err) {
            console.error('Failed to load notification subscriptions:', err);
        }
    }
};

// Load subscriptions on server start
loadSubscriptions();

// Endpoint to receive and store subscription
app.post('/subscribe', (req, res) => {
    const subscription = req.body;

    // Check for duplicates based on the endpoint
    const isDuplicate = subscriptions.some(sub => sub.endpoint === subscription.endpoint);
    if (!isDuplicate) {
        // Store the subscription in the array
        subscriptions.push(subscription);
        // Save subscriptions to the file
        saveSubscriptions();
    }

    // Ensure subscriptions array never exceeds 1000 entries
    if (subscriptions.length > 1000) {
        subscriptions.shift(); // Remove the oldest subscription (first entry)
    }

    res.status(201).json({ message: 'Subscription received and stored.' });
});

// Save subscriptions to the file
const saveSubscriptions = () => {
    fs.writeFileSync(subscriptionsFilePath, JSON.stringify(subscriptions, null, 2), 'utf-8');
};

// Send notification
async function sendNotification(messageAlarm, messageState, messageClass) {
    try {
        // Count the number of rows with alarm_class == 1
        const countAlarms = await new Promise((resolve, reject) => {
            db.get(`SELECT COUNT(*) AS count FROM alarms WHERE alarm_class = 1`, [], (err, row) => {
                if (err) reject("Error counting alarms with class 1: " + err.message);
                resolve(row.count);
            });
        });

        // Count the number of rows with alarm_class == 2
        const countWarnings = await new Promise((resolve, reject) => {
            db.get(`SELECT COUNT(*) AS count FROM alarms WHERE alarm_class = 2`, [], (err, row) => {
                if (err) reject("Error counting alarms with class 2: " + err.message);
                resolve(row.count);
            });
        });

        // Define message content
        const notificationClass = messageClass === 1 ? 'alarm' : messageClass === 2 ? 'warning' : 'alarm';
        const notificationPayload = JSON.stringify({
            title: 'AlarmWatcher - New ' + notificationClass + '!',
            body: `${messageAlarm} is ${messageState}!\n> alarms: ${countAlarms}  > warnings: ${countWarnings}`,
        });

        // Log the notification details
        console.log(`Sending notification: ${notificationPayload}`);

        // Send notification to all stored subscriptions
        const promises = subscriptions.map(subscription => 
            webPush.sendNotification(subscription, notificationPayload)
//                .catch(error => console.error('Error sending notification:', error))
        );
        
        await Promise.all(promises);  // Wait for all notifications to be sent
    } catch (error) {
//        console.error("Error while sending notifications:", error);  // Log the error or handle it as needed
    }
}

/** 
 * +----------------------------------------------
 * | SETTINGS PAGE
 * +----------------------------------------------
*/ 

// Endpoint to get settings
app.get('/getSettings', (req, res) => {
    res.json(settings);
});

// Endpoint to receive settings
app.post('/setSettings', (req, res) => {
    res.status(201).json({ message: 'Settings received.' });

    // Ports
    const changePorts = req.body.ports.change_ports;
    const httpPort = req.body.ports.http_port;
    const httpsPort = req.body.ports.https_port;

    // HTTPS
    const disableHttp = req.body.https.disable_http;
    const allowHttp = req.body.https.allow_http;

    const generateCertificates = req.body.https.generate_certificates;
    const commonName = req.body.https.common_name;
    const alternativeName = req.body.https.alternative_name;
    
    const addCertificates = req.body.https.add_certificates;
    const serverCert = req.body.https.server_cert;
    const serverKey = req.body.https.server_key;

    // Design
    const changeDesign = req.body.design.change_design;
    const darkMode = req.body.design.dark_mode;

    const changeEvents = req.body.design.change_events;
    const hideEvents = req.body.design.hide_events;

    // Change ports
    if(changePorts){
        settings.ports.http_port = httpPort;
        settings.ports.https_port = httpsPort;
    }

    // Disable HTTP
    if(disableHttp){
        settings.https.allow_http = allowHttp;
    }

    // Generate new HTTPS certificates
    if(generateCertificates){
        settings.https.common_name = commonName;
        settings.https.alternative_names = alternativeName;

        // Generate new certificates
        generateSelfSignedCertificates()
    }

    // Change design
    if(changeDesign){
        settings.design.dark_mode = darkMode;
    }

    if(changeEvents){
        settings.design.hide_events = hideEvents;
    }

    // Add custom HTTPS certificates
    if(addCertificates && serverCert && serverKey){
        // Write the custom private key and certificate to the specified paths
        fs.writeFileSync(privateKeyPath, serverKey);
        fs.writeFileSync(certPath, serverCert);

        // Set certificates
        httpsOptions = {
            key: serverCert,
            cert: serverKey
        };

        console.log('Custom certificates written successfully.');
    }

    // Save changed settings to file
    try {
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
        console.log("New settings saved to file successfully.");
    } catch (err) {
        console.error("Error saving new settings to file:", err);
    }

    //Restart servers
    restartServers();
});

/** 
 * +----------------------------------------------
 * | ADDITIONAL ENDPOINTS
 * +----------------------------------------------
*/ 

// Endpoint to get version
app.get('/getVersion', (req, res) => {
    res.send(version);
});

// Endpoint to serve the PEM certificate content as text
app.get('/cert/getPEM', (req, res) => {
    const certPath = path.join(__dirname, 'data', 'server-cert.pem');

    // Read the certificate file
    fs.readFile(certPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading the certificate file:', err);
            return res.status(404).send('Certificate file not found');
        }
        
        // Send the content of the certificate file as plain text
        res.type('text/plain'); // Set the response content type to plain text
        res.send(data);
    });
});

// Endpoint to serve the CERT certificate file for download
app.get('/cert/getDER', (req, res) => {
    const certPath = path.join(__dirname, 'data', 'server-cert.der');
    
    // Send the certificate file as an attachment
    res.sendFile(certPath, { headers: { 'Content-Disposition': 'attachment; filename="server-cert.der"' } }, (err) => {
        if (err) {
            console.error('Error sending the certificate file:', err);
            res.status(err.status).send('Error sending the file');
        }
    });
});

/** 
 * +----------------------------------------------
 * | SARTING EXPRESS SERVER
 * +----------------------------------------------
*/ 

//Declare server
let httpServer;
let httpsServer;

//Function to start http and https server
function startServers() {
    // Start server only if allowed by the settings
    if(settings.https.allow_http){
        // Start HTTP server
        httpServer = app.listen(settings.ports.http_port, () => console.log("HTTP server startet on port:", settings.ports.http_port));    
    }

    // Start HTTPS server
    httpsServer = https.createServer(httpsOptions, app).listen(settings.ports.https_port, () => console.log('HTTPS server startet on port:', settings.ports.https_port));
}

// Call the function to start the servers
startServers();

//Function to restart http and https server
function restartServers() {
    // Close exsisitng servers
    if (httpServer) {
        httpServer.close(() => {
            console.log("HTTP server stopped.");
        });
    }

    if (httpsServer) {
        httpsServer.close(() => {
            console.log("HTTPS server stopped.");
        });
    }

    // Start new servers
    startServers();
}


/** 
 * +----------------------------------------------
 * | HANDLING AUTO DELETION AND CLASS TRANSITIONS
 * +----------------------------------------------
*/ 

// Function to delete alarms with past delete_time
function deleteExpiredAlarms() {
    date = Date.now();
    currentTime = Math.floor(date / 1000);  // Get current UNIX timestamp

    db.run(`DELETE FROM alarms WHERE delete_time IS NOT NULL AND require_ack = 0 AND delete_time <= ?`, [currentTime], function (err) {
        if (err) {
            console.error("Error deleting expired alarms: " + err.message);
        } else {
            if (this.changes > 0) {
                console.log("expired alarm(s) deleted successfully.");
            }
        }
    });
}

// Set an interval to check and delete expired alarms every second
setInterval(deleteExpiredAlarms, 1000);  // 1000ms = 1 second

// Function to update alarm class based on times
function updateAlarmClasses() {
    const currentTime = Math.floor(Date.now() / 1000); // Current UNIX timestamp

    db.all(
        `SELECT * FROM alarms WHERE 
        (class_1_time IS NOT NULL AND class_1_time <= ?) OR 
        (class_2_time IS NOT NULL AND class_2_time <= ?) OR 
        (class_3_time IS NOT NULL AND class_3_time <= ?)`,
        [currentTime, currentTime, currentTime],
        function (err, alarms) {
            if (err) {
                console.error("Error fetching alarms: " + err.message);
                return;
            }

            if (!alarms || alarms.length === 0) {
                return;
            }

            alarms.forEach((alarm) => {
                let newClass = null;
                let updatedDetails = { ...alarm };

                if (alarm.class_1_time && alarm.class_1_time <= currentTime) {
                    newClass = 1;
                    updatedDetails.class_1_time = null;
                } else if (alarm.class_2_time && alarm.class_2_time <= currentTime) {
                    newClass = 2;
                    updatedDetails.class_2_time = null;
                } else if (alarm.class_3_time && alarm.class_3_time <= currentTime) {
                    newClass = 3;
                    updatedDetails.class_3_time = null;
                }

                if (newClass !== null && newClass !== alarm.alarm_class) {
                    updatedDetails.alarm_class = newClass;

                    addOrChangeAlarm(db, updatedDetails)
                        .then(() => {
                            console.log(`Alarm ID ${alarm.alarm_id} updated to class ${newClass}.`);
                            sendNotification(alarm.alarm_id, updatedDetails.alarm_state, newClass);
                        })
                        .catch((err) => {
                            console.error(
                                `Error updating alarm ID ${alarm.alarm_id} to class ${newClass}: ${err}`
                            );
                        });
                }
            });
        }
    );
}

// Set an interval to check and update alarm classes every second
setInterval(updateAlarmClasses, 1000);  // 1000ms = 1 second

/** 
 * +----------------------------------------------
 * | GRACEFUL SHUTDOWN FOR DOCKER CONTAINER
 * +----------------------------------------------
*/ 

process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully.');
    db.close(() => {
        console.log('Closed the database connection.');
        process.exit(0); // Exit with code 0 to signal a clean exit
    });
});

process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully.');
    db.close(() => {
        console.log('Closed the database connection.');
        process.exit(0); // Exit with code 0 to signal a clean exit
    });
});