const path = require('path');
var bodyParser = require('body-parser');
const nunjucks = require('nunjucks');
const express = require('express');
const {NooLiteRequest, NooLiteResponse} = require('../lib/serialClasses');
const apiRouter = require('./api');
const app = express();


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '/static')));
app.set('views', path.join(__dirname, '/templates'));
app.set('view engine', 'html');

nunjucks.configure(path.join(__dirname, '/templates'), {
    express: app,
    autoescape: true
});

module.exports = function (nooLitePlatform) {
  // Set commot templates vars
  app.locals.pkgVersion = nooLitePlatform.pjson.version;

  app.get('/', function (req, res) {
    res.render('request_manager', {
      url: req.originalUrl,
      title: 'NooLite - Запросы',
    });
  });

  app.get('/acc', function (req, res) {
    let availableAccTypes = [];

    for (let typeCode in nooLitePlatform.AccessoryUtil.availableAccessories) {
      if(nooLitePlatform.AccessoryUtil.availableAccessories.hasOwnProperty(typeCode)) {
        let type = nooLitePlatform.AccessoryUtil.availableAccessories[typeCode];
        availableAccTypes.push({code: typeCode, name: type.displayName(), description: type.description()});
      }
    }

    res.render('acc', {
      url: req.originalUrl,
      title: 'NooLite - аксессуары',
      channels: [...Array(64).keys()],
      accTypes: availableAccTypes
    });
  });

  // Add api endpoints to server
  app.use('/api', apiRouter(nooLitePlatform));

  // NooLite raw API implementation
  app.get('/api.htm', function (req, res) {
    let command = new NooLiteRequest(
      req.query.ch,
      req.query.cmd,
      req.query.mode || 2,
      req.query.ctr || 0,
      req.query.res || 0,
      req.query.fmt || 0,
      req.query.d0 || 0,
      req.query.d1 || 0,
      req.query.d2 || 0,
      req.query.d3 || 0,
      req.query.id0 || 0,
      req.query.id1 || 0,
      req.query.id2 || 0,
      req.query.id3 || 0
    );
    nooLitePlatform.sendCommand(command);
    res.json({status: 'ok'});
  });

  app.get('/speedtest', (req, res) => {
    let command = new NooLiteRequest(
      req.query.ch || 0,
      req.query.cmd || 0,
      req.query.mode || 2,
      req.query.ctr || 0,
      req.query.res || 0,
      req.query.fmt || 0,
      req.query.d0 || 0,
      req.query.d1 || 0,
      req.query.d2 || 0,
      req.query.d3 || 0,
      req.query.id0 || 0,
      req.query.id1 || 0,
      req.query.id2 || 0,
      req.query.id3 || 0
    );

    const commandsCount = parseInt(req.query.count) || 1

    for (let i in [...Array(commandsCount).keys()]) {
      nooLitePlatform.sendCommand(command);
    }
    res.json({status: 'ok'});
  });

  return app;
};
