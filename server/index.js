const path = require('path');
const nunjucks = require('nunjucks');
const express = require('express');
const {NooLiteRequest, NooLiteResponse} = require('../lib/serialClasses');
const app = express();


app.use(express.static(path.join(__dirname, '/static')));
app.set('views', path.join(__dirname, '/templates'));
app.set('view engine', 'html');

nunjucks.configure(path.join(__dirname, '/templates'), {
    express: app,
    autoescape: true
});



module.exports = function (nooLitePlatform) {

  app.get('/', function (req, res) {
    res.render('request_manager', {
      url: req.originalUrl,
      title: 'NooLite - Запросы',
    });
  });

  app.get('/acc', function (req, res) {
    res.render('acc', {
      url: req.originalUrl,
      title: 'NooLite - Запросы',
      channels: [...Array(64).keys()]
    });
  });

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

  app.delete('/api/channels/:ch/', function (req, res) {
    // Очистить канал
    nooLitePlatform.sendCommand(new NooLiteRequest(req.params.ch, 0, 2, 5));
    res.json({status: 'ok'});
  });

  app.post('/api/channels/:ch/acc/', function (req, res) {
    // Привязать устройство
    nooLitePlatform.sendCommand(new NooLiteRequest(req.params.ch, 15, 2));
    res.json({status: 'ok'});
  });

  app.get('/api/channels/:ch/acc/', function (req, res) {
    let discoveredAcc = [];

    let listener = function (nlRes) {
      if (nlRes.isState()) {
        // Пришел ответ от блока
        // fmt 0 - Информация о силовом блоке
        if (nlRes.fmt === 0) {
          discoveredAcc.push({
            type: nlRes.d0,
            version: nlRes.d1,
            accessible: true,
            state: nlRes.d2,
            brightness: nlRes.d3,
            id: nlRes.getStrId()
          });
        }
      } else if (nlRes.isId() && nlRes.cmd === 128) {
        // Блок прописан, но не отвечает
        discoveredAcc.push({
          type: nlRes.d0,
          version: nlRes.d1,
          accessible: false,
          state: nlRes.d2,
          brightness: nlRes.d3,
          id: nlRes.getStrId()
        });
      }
    };

    nooLitePlatform.serialPort.nlParser.on(`nlres:${req.params.ch}`, listener);

    nooLitePlatform.sendCommand(new NooLiteRequest(req.params.ch, 128, 2));

    setTimeout(function () {
        nooLitePlatform.serialPort.nlParser.removeListener(`nlres:${req.params.ch}`, listener);
        res.json({status: 'ok', accList: discoveredAcc});
    }, 1000);

  });

  return app;
};
