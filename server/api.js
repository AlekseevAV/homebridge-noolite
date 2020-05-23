const SSE = require("sse-node");
const express = require('express');
const {NooLiteRequest, NooLiteResponse} = require('../lib/serialClasses');

router = express.Router();

module.exports = function(nooLitePlatform){
  router.route('/hk/acc')
    // Список всех созданных HK аксессуаров
    .get((req, res) => {
      // приведение к json массива nooLitePlatform.accessories 
      // приводит к ошибке "Converting circular structure to JSON"
      // Поэтому собираем для ответа только некоторые из полей, не все
      // Если на фронте понадобятся какие-то данные, то тут их можно добавить в ответ
      let accessoriesArray = [];
      for (let accessory of nooLitePlatform.accessories) {
        accessoriesArray.push({
          context: accessory.context,
          services: accessory.services,
          UUID: accessory.UUID,
          displayName: accessory.displayName,
        })
      }
      res.json({status: 'ok', accList: accessoriesArray})
    })
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

      if (characteristic == null) {
        res.json({status: 'fail', description: `Characteristic not found by params: ${JSON.stringify(req.params)}`});
        return;
      }

      if (req.body.value == undefined) {
        res.json({status: 'fail', description: `Request body must contains "value" param. Got "${JSON.stringify(req.body)}" instead.`});
        return;
      }

      let newValue = req.body.value;

      characteristic.setValue(newValue, (err) => {
        if (!err) {
          res.json({status: 'ok', characteristic: characteristic});
          return;
        }

        res.json({status: 'fail', description: `Error on change characteristic value: ${err}`});
        return;
      });

    });

  // NooLite канал
  router.route('/channels/:ch/')
    // Отправить команду на канал
    .post((req, res) => {
      let command = new NooLiteRequest(
        req.params.ch,
        req.body.cmd || 0,
        req.body.mode || 2,
        req.body.ctr || 0,
        req.body.res || 0,
        req.body.fmt || 0,
        req.body.d0 || 0,
        req.body.d1 || 0,
        req.body.d2 || 0,
        req.body.d3 || 0,
        req.body.id0 || 0,
        req.body.id1 || 0,
        req.body.id2 || 0,
        req.body.id3 || 0
      );
      nooLitePlatform.sendCommand(command);
      res.json({status: 'ok'});
    })
    // Очистить канал
    .delete((req, res) => {
      nooLitePlatform.sendCommand(new NooLiteRequest(req.params.ch, 0, 2, 5));
      res.json({status: 'ok'});
    });

  // NooLite устройство на канале
  router.route('/channels/:ch/acc/')
    // Привязать устройство
    .post((req, res) => {
      nooLitePlatform.sendCommand(new NooLiteRequest(req.params.ch, 15, req.body.mode));
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