//import dependencies
const express = require('express');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');

//create express application
const app = express ();

//create swagger options
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

//define swagger docs
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

//API
/**
 * @swagger
 * /api/raiseAlarm:
 *   get:
 *     tags:
 *       - Alarm list
 *     description: Add alarm to AlarmWatcher.
 *     parameters:
 *       - name: id 
 *         description: Unique identifier of the alarm (alarm name)
 *         in: query
 *         required: true
 *         type: string
 *       - name: class
 *         description: Class of the alarm (1 = Alarm - highest priority, 2 = Warning - medium priority, 3 = Event - lowest priority)
 *         in: query
 *         required: true
 *         type: integer
 *       - name: status
 *         description: Status of the alarm that is displayed (e.g. active, fault, error, open)
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
 *         description: OK
 *       400:
 *         description: Bad Request
 */
app.get('/api/raiseAlarm', (req, res) => {
    res.send("Test1")
});

/**
 * @swagger
 * /api/ackAlarm:
 *   get:
 *     tags:
 *       - Alarm list
 *     description: Acknowledge an alarm.
 *     parameters:
 *       - name: id 
 *         description: Unique identifier of the alarm (alarm name)
 *         in: query
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 */
app.get('/api/ackAlarm', (req, res) => {
    res.send("Test2")
});

/**
 * @swagger
 * /api/clearAlarm:
 *   get:
 *     tags:
 *       - Alarm list
 *     description: Delete an from AlarmWatcher.
 *     parameters:
 *       - name: id 
 *         description: Unique identifier of the alarm (alarm name)
 *         in: query
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 */
app.get('/api/clearAlarm', (req, res) => {
    res.send("Test3")
});

/**
 * @swagger
 * /api/getAlarms:
 *   get:
 *     tags:
 *       - Alarm list
 *     description: Get a list of alarms. Either all or filtered according to the following parameters.
 *     parameters:
 *       - name: id 
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
 *         description: OK
 *       400:
 *         description: Bad Request
 */
app.get('/api/getAlarms', (req, res) => {
    res.send("Test4")
});

//start express application
app.listen(80, () => console.log("listening on port 80"));



