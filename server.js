const express = require('express');
const bodyParser = require('body-parser');
const logger = require('morgan');
const http = require('http');
const define = require('./define')
const handle = require('./handle');

const app = express();
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
const server = http.createServer(app);

app.get('/', (req, res) => {
    console.log('Have a traffic into server');
    res.send('Wellcome');
})

app.get('/webhook', (req, res) => {
    if (req.query['hub.verify_token'] == define.ACCESS_KEY) {
        console.log('Verify access key successful');
        res.send(req.query['hub.challenge']);
    } else {
        console.log('Verify access key error', req);
        res.send('Error');
    }
})

app.post('/webhook', (req, res) => {
    try {
        handle.handleWebHookPos(req, res);
        console.log('Post webhook successful');
    } catch (error) {
        console.error(error);
    }
    res.status(200).send('OK');
})

server.listen(process.env.PORT || define.PORT, () => { console.log(`Server running on ${define.IP}:${process.env.PORT || define.PORT}`); })