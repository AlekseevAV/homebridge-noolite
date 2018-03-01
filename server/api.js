const SSE = require("sse-node");
const express = require('express');

router = express.Router();

module.exports = function(nooLitePlatform){
  router.get('/hk/acc', function (req, res) {
    res.json({status: 'ok', accList: nooLitePlatform.accessories});
  });

  router.post('/hk/acc', function (req, res) {
    let acc = req.body;
    let newAcc = nooLitePlatform.addAccessory(acc.name, acc.type, acc.channel, acc.id);

    res.json({status: 'ok', acc: newAcc});
  });

  router.get('/hk/acc/:accUUID', function (req, res) {
      res.json({status: 'ok', acc: nooLitePlatform.AccessoryUtil.getByUUID(req.params.accUUID)});
  });

  router.delete('/hk/acc/:accUUID', function (req, res) {
    nooLitePlatform.removeAccessory(req.params.accUUID);

    res.json({status: 'ok'});
  });

  router.get('/hk/acc/:accUUID/services/:sUUID', function (req, res) {
    res.json({status: 'ok', services: nooLitePlatform.AccessoryUtil.getAccService(req.params.accUUID, req.params.sUUID)});
  });

  router.get('/hk/acc/:accUUID/services/:sUUID/characteristics/:cUUID', function (req, res) {
    res.json({
        status: 'ok',
        characteristic: nooLitePlatform.AccessoryUtil.getAccSerciceCharacteristic(req.params.accUUID, req.params.sUUID, req.params.cUUID)
    });
  });

  router.patch('/hk/acc/:accUUID/services/:sUUID/characteristics/:cUUID', function (req, res) {
    let characteristic = nooLitePlatform.AccessoryUtil.getAccSerciceCharacteristic(req.params.accUUID, req.params.sUUID, req.params.cUUID);

    if (characteristic && req.query.value) {
      let newValue = JSON.parse(req.query.value);

      characteristic.setValue(newValue, (err) => {
        if (!err) {
          res.json({status: 'ok', characteristic: characteristic});
          return;
        }

        res.json({status: 'fail'});
      });
    }
  });

  router.delete('/channels/:ch/', function (req, res) {
    // Очистить канал
    nooLitePlatform.sendCommand(new NooLiteRequest(req.params.ch, 0, 2, 5));
    res.json({status: 'ok'});
  });

  router.post('/channels/:ch/acc/', function (req, res) {
    // Привязать устройство
    nooLitePlatform.sendCommand(new NooLiteRequest(req.params.ch, 15, 2));
    res.json({status: 'ok'});
  });

  router.get('/channels/:ch/acc/', function (req, res) {
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

  router.get('/nl-res-log/', function (req, res) {
      const client = SSE(req, res);

      let nlResHandler = function (nlRes) {
          client.send(nlRes, 'nlres');
      };

      // Вешаем обработчик команд
      nooLitePlatform.serialPort.nlParser.on('nlres', nlResHandler);

      // Удаляем обработчик, когда клиент отключился
      client.onClose(() => nooLitePlatform.serialPort.nlParser.removeListener('nlres', nlResHandler));
  });

  return router;
}