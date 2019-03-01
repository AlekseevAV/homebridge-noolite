const {NooLiteRequest, NooLiteResponse} = require('../lib/serialClasses');
const AccessoryBase = require('./AccessoryBase');


class SrfRDoor extends AccessoryBase {
  static displayName() {
    return 'SRF-1-1000-R Door';
  }
  static description() {
    return `Cиловой блок nooLite-F SRF-1-1000-R для управления дверями`;
  }

  static getAccessoryCategory() {
    return 4;
  }

  initOrCreateServices() {
    super.initOrCreateServices();

    let doorService = this.getOrCreateService(this.platform.Service.Door);
    let currentPosition = doorService.getCharacteristic(this.platform.Characteristic.CurrentPosition);
    let targetPosition = doorService.getCharacteristic(this.platform.Characteristic.TargetPosition);

    targetPosition
      .on('set', (value, callback) => {
        this.log("Set position characteristic to " + value);
    
        // Управление позицией открытия/закрытия осуществляется в NooLite через задание соответствующей яркости
        // от 0 до 100
        let command = new NooLiteRequest(this.nlChannel, 6, 2, 0, 0, 0, value, 0, 0, 0, ...this.nlId.split(':'));
    
        this.platform.sendCommand(command, (err, nlRes) => {
          if (err) {
            this.log('Error on write: ', err.message);
            callback(new Error('Error on write'));
            return;
          } else if (nlRes.isError()) {
            this.log('Error on response: ', nlRes);
            callback(new Error('Error on response'));
            return;
          }
    
          callback();

          // проверяем статус изменения состояния две минуты
          let endCheckingTimestamp = new Date().getTime() + 2 * 60 * 1000;

          setTimeout(function check(retry=3) {
            this.getPosition((err, newValue) => {
              if (err) {
                if (retry > 3) {
                  setTimeout(check.bind(this), 2000, retry - 1);
                }
              }
              let timeToCheckIsOver = new Date().getTime() > endCheckingTimestamp;

              if (newValue == value) {
                currentPosition.setValue(value)
              } else if (!timeToCheckIsOver) {
                setTimeout(check.bind(this), 2000, 3)
              }

            })
          }.bind(this), 2000);

        })
        
      })
    
    currentPosition
      .on('get', this.getPosition.bind(this));
  }

  getPosition(callback) {
    this.log("get position value");
    let acc = this.accessory;

    let command = new NooLiteRequest(this.nlChannel, 128, 2, 0, 0, 0, 0, 0, 0, 0, ...this.nlId.split(':'));

    this.platform.sendCommand(command, (err, nlRes) => {
      if (err) {
        this.log('Error on write: ', err.message);
        callback(new Error('Error on write'));
        return;
      } else if (nlRes.isError()) {
        this.log('Error on response: ', nlRes);
        callback(new Error('Error on response'));
        return;
      }

      let brightnessValue = acc.value || 0;

      if (nlRes.isState() && nlRes.fmt === 0) {
        // А в ответе блока яркость приходит уже от 0 до 255. То есть управлять нужно 0-100,
        // а получать ответ 0-255. Странно, но как есть.
        brightnessValue = Math.ceil(nlRes.d3 / 2.55);
      }

      callback(null, brightnessValue);
    })
  }

  getAccessoryInformation() {
      return {
          'Manufacturer': 'NooLite',
          'Model': 'SRF-1-1000-R',
          'SerialNumber': '0.0.1'
      };
  }
}

module.exports = SrfRDoor;
