const {NooLiteRequest} = require('../lib/serialClasses');
const AccessoryBase = require('./AccessoryBase');


class SrfRGate extends AccessoryBase {
  static displayName() {
    return 'SRF-1-1000-R Gate';
  }
  static description() {
    return 'Силовой блок nooLite-F SRF-1-1000-R для управления гаражными воротами';
  }

  static getAccessoryCategory() {
    return 4;
  }

  initOrCreateServices() {
    super.initOrCreateServices();

    let garageDoor = this.getOrCreateService(this.platform.Service.GarageDoorOpener);
    this.currentState = garageDoor.getCharacteristic(this.platform.Characteristic.CurrentDoorState);
    this.targetState = garageDoor.getCharacteristic(this.platform.Characteristic.TargetDoorState);

    this.targetState
      .on('set', (value, callback) => {
        this.log("Set state characteristic to " + value);

        let command = new NooLiteRequest(this.nlChannel, 25, 2, 0, 0, 1, 150, 0, 0, 0, ...this.nlId.split(':'));

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
            this.getState((err, newValue) => {
              if (err) {
                if (retry > 3) {
                  setTimeout(check.bind(this), 2000, retry - 1);
                }
              }

              // ставим текущее состояние
              this.currentState.setValue(newValue)

              let timeToCheckIsOver = new Date().getTime() > endCheckingTimestamp;
              
              this.log(`Got value from block "${newValue}", target value "${this.targetState.value}"`);
              const isStopped = newValue == this.platform.Characteristic.CurrentDoorState.STOPPED;
              if (newValue == this.targetState.value || isStopped) {
                // Текущее состояние стало равно целевому или текущее состояние "Остановлено", выходим
                return
              } else if (!timeToCheckIsOver) {
                setTimeout(check.bind(this), 2000, 3)
              }

            })
          }.bind(this), 2000);

        })
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

module.exports = SrfRGate;
