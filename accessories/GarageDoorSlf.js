const {NooLiteRequest, NooLiteResponse} = require('../lib/serialClasses');
const AccessoryBase = require('./AccessoryBase');


class GarageDoorSlf extends AccessoryBase {
  static displayName() {
    return 'Garage Door SLF';
  }
  static description() {
    return `SLF блок, управляющий гаражными воротами. Отсылает команду 8 (Записать сценарий в память) на SLF блок, который включатся на 1,5 секунды, 
    что интерпритируется системой управления гаражными воротами как сигнал к открытию/закрытию.`;
  }

  static getAccessoryCategory() {
    return 4;
  }

  initOrCreateServices() {
    super.initOrCreateServices();

    let garageDoor = this.getOrCreateService(this.platform.Service.GarageDoorOpener);
    let currentState = garageDoor.getCharacteristic(this.platform.Characteristic.CurrentDoorState);
    let targetState = garageDoor.getCharacteristic(this.platform.Characteristic.TargetDoorState);
    let timeToOpenClose = garageDoor.getCharacteristic(this.platform.Characteristic.TimeToOpenClose);

    targetState
      .on('set', (value, callback) => {
        this.log("Set targetState characteristic to " + value);

        let command = new NooLiteRequest(this.nlChannel, 8, 2, 0, 0, 0, 0, 0, 0, 0, ...this.nlId.split(':'));

        this.platform.sendCommand(command, (err, nlRes) => {
          if (err) {
            this.log('Error on write: ', err.message);
            callback(new Error('Error on write: ' + err.message));
            return;
          } else if (nlRes.isError()) {
            callback(new Error('Error on write: ' + nlRes));
            return;
          }

          callback();
          setTimeout(() => {
            currentState.setValue(value);
          }, timeToOpenClose.value * 1000);
        })

      });
  }

  getAccessoryInformation() {
        return {
            'Manufacturer': 'NooLite',
            'Model': 'GarageDoorSlf',
            'SerialNumber': '0.0.1'
        };
    }
}

module.exports = GarageDoorSlf;
