'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const helmet = require('helmet');
const noCache = require('nocache');

const apiRoutes = require('./routes/api.js');
const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner');

const app = express();

app.use(noCache());
app.use(helmet.hidePoweredBy({ setTo: 'PHP 4.2.O' }));
app.use(helmet.xssFilter());

app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({ origin: '*' })); //USED FOR FCC TESTING PURPOSES ONLY!

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Index page (static HTML)
app.route('/').get(function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

//For FCC testing purposes
fccTestingRoutes(app);

MongoClient.connect(
  process.env.MONGO_URI,
  { useUnifiedTopology: true },
  (err, client) => {
    assert.equal(null, err);

    const dbName = 'test';
    const db = client.db(dbName);

    //Routing for API
    apiRoutes(app, db);

    //404 Not Found Middleware
    app.use(function (req, res, next) {
      next({ status: 404, message: 'Not Found' });
    });

    // Error handling
    app.use((err, req, res, next) => {
      const errCode = err.status || 500;
      const errMessage = err.message || 'Internal Server Error';
      res.status(errCode).type('text').send(errMessage);
    });

    const PORT = process.env.PORT || 3000;

    //Start our server and tests!
    app.listen(PORT, function () {
      console.log('Listening on port ' + PORT);
      if (process.env.NODE_ENV === 'test') {
        console.log('Running Tests...');
        setTimeout(function () {
          try {
            runner.run();
          } catch (e) {
            const error = e;
            console.log('Tests are not valid:');
            console.log(error);
          }
        }, 3500);
      }
      app.emit('ready');
    });
  }
);

module.exports = app; //for unit/functional testing
