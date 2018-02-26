const {NooLiteRequest, NooLiteResponse} = require('../lib/serialClasses');
const AccessoryBase = require('./AccessoryBase');


class Slf extends AccessoryBase {
  static displayName() {
    return 'SLF';
  }
  static description() {
    return 'блок с протоколом nooLite-F';
  }

  getServices() {
    let result = super.getServices();

    let service = new this.platform.Service.Lightbulb("Test Light");
    service.getCharacteristic(this.platform.Characteristic.On);
    result.push(service);

    return result;
  }

  static setCharacteristicCallbacks(platform, accessory) {
    super.setCharacteristicCallbacks(platform, accessory);

    let nlService = accessory.getService(platform.Service.NooLiteService);
    let accessoryName = nlService.getCharacteristic(platform.Characteristic.Name).value;
    let nlChannel = nlService.getCharacteristic(platform.Characteristic.NooLiteChannel).value;
    let nlId = nlService.getCharacteristic(platform.Characteristic.NooLiteId).value;

    let onCharacteristic = accessory.getService(platform.Service.Lightbulb).getCharacteristic(platform.Characteristic.On);

    platform.serialPort.nlParser.on(`nlres:${nlId}`, function (nlCmd) {
      platform.log('SLF read data:', nlCmd);
      if (nlCmd.isState() && nlCmd.fmt === 0) {
        // fmt 0 - Информация о силовом блоке
        // d0 - Код типа устройства
        // d1 - Версия микропрограммы устройства
        // d2 - Состояние устройства:
        //      0 – выключено
        //      1 – включено
        //      2 – временное включение
        // d3 - Текущая яркость (0-255)

        let onValue = nlCmd.d2 > 0;
        onCharacteristic.updateValue(onValue);
      }
    });

    onCharacteristic
      .on('set', function(value, callback) {
        platform.log(accessoryName, "Light --> " + value);

        let command = new NooLiteRequest(
          nlChannel,
          (value ? 2 : 0),
          2,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          ...nlId.split(':')
        );

        platform.serialPort.nlParser.once(`nlres:${nlId}`, function (nlCmd) {
          platform.log('SLF once read data:', nlCmd);
          if (nlCmd.isError()) {
            callback(new Error('Error on write: ' + nlCmd));
            return;
          }
          callback();
        });

        platform.serialPort.write(command.toBytes(), null, function (err) {
          if (err) {
            platform.log('Error on write: ', err.message);
            callback(new Error('Error on write: ' + err.message));
            return;
          }
          platform.log('message written: ', command);
        });
      })
      .on('get', function(callback) {
        let acc = this;

        platform.log(accessoryName, "get value");

        let command = new NooLiteRequest(
          nlChannel,
          128,
          2,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          ...nlId.split(':')
        );

        platform.serialPort.nlParser.once(`nlres:${nlId}`, function (nlCmd) {
          platform.log('SLF once read data:', nlCmd);
          if (nlCmd.isError()) {
            callback(new Error('Error on write: ' + nlCmd));
            return;
          }

          let onValue = acc.value;

          if (nlCmd.isState() && nlCmd.fmt === 0) {
            onValue = nlCmd.d2 > 0;
          }

          callback(null, onValue);
        });

        platform.serialPort.write(command.toBytes(), null, function (err) {
          if (err) {
            return platform.log('Error on write: ', err.message);
          }
          platform.log('message written');
        });
      });
  }

  getAccessoryInformation() {
        return {
            'Manufacturer': 'NooLite',
            'Model': 'SLF',
            'SerialNumber': '0.0.1'
        };
    }
}

module.exports = Slf;
