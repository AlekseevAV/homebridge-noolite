const path = require('path');
const nunjucks = require('nunjucks');
const express = require('express');
const {NooLiteRequest, NooLiteResponse} = require('../lib/serialClasses');
const app = express();


app.use(express.static(path.join(__dirname, '/static')));

app.set('views', path.join(__dirname, '/templates'));

nunjucks.configure(path.join(__dirname, '/templates'), {
    express: app,
    autoescape: true
});
app.set('view engine', 'html');



module.exports = function (nooLitePlatform) {

  app.get('/add', function (req, res) {
    nooLitePlatform.addAccessory('test', 'slf', 0, '00:00:02:112');
    res.end();
  });

  app.get('/reachability', function (req, res) {
    nooLitePlatform.updateAccessoriesReachability();
    res.end();
  });

  app.get('/remove', function (req, res) {
    nooLitePlatform.removeAccessory();
    res.end();
  });

  app.get('/', function (req, res) {
    res.render('request_manager');
  });

  app.get('/api.htm', function (req, res) {
    let command = new NooLiteRequest(
      req.query.ch,
      req.query.cmd,
      req.query.mode,
      req.query.ctr,
      req.query.res,
      req.query.fmt,
      req.query.d0,
      req.query.d1,
      req.query.d2,
      req.query.d3,
      req.query.id0,
      req.query.id1,
      req.query.id2,
      req.query.id3
    );
    nooLitePlatform.sendCommand(command);
    res.json({status: 'ok'});
  });

  return app;
};
