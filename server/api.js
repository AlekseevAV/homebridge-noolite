const SSE = require("sse-node");
const express = require('express');

router = express.Router();

module.exports = function(nooLitePlatform){
  router.route('/hk/acc')
    // Список всех созданных HK аксессуаров
    .get((req, res) => res.json({status: 'ok', accList: nooLitePlatform.accessories}))
    // Создание нового HK аксессуара
    .post((req, res) => {
      let acc = req.body;
      let newAcc = nooLitePlatform.addAccessory(acc.name, acc.type, acc.channel, acc.id);

      res.json({status: 'ok', acc: newAcc});
    });

  // Аксессуар
  router.route('/hk/acc/:accUUID')
    // Получить аксессуар по UUID
    .get((req, res) => res.json({status: 'ok', acc: nooLitePlatform.AccessoryUtil.getByUUID(req.params.accUUID)}))
    // Удалить аксессуар по UUID
    .delete((req, res) => {
      nooLitePlatform.removeAccessory(req.params.accUUID);
      res.json({status: 'ok'});
    });

  // Сервис
  router.get('/hk/acc/:accUUID/services/:sUUID', function (req, res) {
    res.json({status: 'ok', services: nooLitePlatform.AccessoryUtil.getAccService(req.params.accUUID, req.params.sUUID)});
  });

  // Характеристика
  router.route('/hk/acc/:accUUID/services/:sUUID/characteristics/:cUUID')
    .get((req, res) => {
      res.json({
          status: 'ok',
          characteristic: nooLitePlatform.AccessoryUtil.getAccSerciceCharacteristic(req.params.accUUID, req.params.sUUID, req.params.cUUID)
      });
    })
    .patch((req, res) => {
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

  // NooLite канал
  router.route('/channels/:ch/')
    // Очистить канал
    .delete((req, res) => {
      nooLitePlatform.sendCommand(new NooLiteRequest(req.params.ch, 0, 2, 5));
      res.json({status: 'ok'});
    });

  // NooLite устройство на канале
  router.route('/channels/:ch/acc/')
    // Привязать устройство
    .post((req, res) => {
      nooLitePlatform.sendCommand(new NooLiteRequest(req.params.ch, 15, 2));
      res.json({status: 'ok'});
    })
    // Получить состояние
    .get((req, res) => {
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

  // Server side events для вывода лога noolite команд
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