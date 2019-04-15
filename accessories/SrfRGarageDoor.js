const {NooLiteRequest} = require('../lib/serialClasses');
const AccessoryBase = require('./AccessoryBase');


class SrfRGarageDoor extends AccessoryBase {
  static displayName() {
    return 'SRF-1-1000-R Garage Door';
  }
  static description() {
    return `Cиловой блок nooLite-F SRF-1-1000-R для управления гаражными воротами`;
  }

  static getAccessoryCategory() {
    return 4;
  }

  createPeriodicTasks() {
    super.initOrCreateServices();
    if (this.platform.periodicAccessoryUpdate) {
      setInterval(() => {
        this.log('send periodically update command');
        let command = new NooLiteRequest(this.nlChannel, 128, 2, 0, 0, 0, 0, 0, 0, 0, ...this.nlId.split(':'));
        this.platform.sendCommand(command, (err, nlRes) => {})
      }, this.platform.periodicAccessoryUpdate * 1000);
    }
  }

  initOrCreateServices() {
    super.initOrCreateServices();

    let garageDoor = this.getOrCreateService(this.platform.Service.GarageDoorOpener);
    this.currentState = garageDoor.getCharacteristic(this.platform.Characteristic.CurrentDoorState);
    this.targetState = garageDoor.getCharacteristic(this.platform.Characteristic.TargetDoorState);

    this.targetState
      .on('set', (value, callback) => {
        this.log("Set state characteristic to " + value);

        // State может быть только в одном состоянии OPEN или CLOSED
        let cmd;

        if (this.currentState.value == this.platform.Characteristic.CurrentDoorState.OPENING) {
          cmd = this.platform.Characteristic.TargetDoorState.OPEN;
        } else if (this.currentState.value == this.platform.Characteristic.CurrentDoorState.CLOSING) {
          cmd = this.platform.Characteristic.TargetDoorState.CLOSE;
        } else {
          cmd = value == this.platform.Characteristic.TargetDoorState.OPEN ? 2 : 0;
        }

        let command = new NooLiteRequest(this.nlChannel, cmd, 2, 0, 0, 0, 0, 0, 0, 0, ...this.nlId.split(':'));

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
    
    this.currentState
      .on('get', this.getState.bind(this));
  }

  getState(callback) {
    this.log("get state value");
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

      let currentStateResponse = acc.value || 0;
      acc.lastCurrentState = acc.lastCurrentState ? acc.lastCurrentState : 0;

      if (nlRes.isState() && nlRes.fmt === 0) {
        // У NooLite тут какая-то инверсия с командами открыть (2), закрыть (0) и яркостью, которая
        // устанавливается у блока. Когда блоку передаем команду открытия (cmd = 2), то блок
        // ПОНИЖАЕТ яркость от 255 до 0, а когда команду закрыть (cmd = 0), то наоборот, ПОВЫШАЕТ
        // То есть логика работает не так как со светом, кода ВКЛ ставит яркость на 255, а ВЫКЛ на 0
        if (nlRes.d3 == 255) {
          currentStateResponse = this.platform.Characteristic.CurrentDoorState.CLOSED;
        } else if (nlRes.d3 == 0) {
          currentStateResponse = this.platform.Characteristic.CurrentDoorState.OPEN;
        } else if (nlRes.d3 == acc.lastCurrentState) {
          currentStateResponse = this.platform.Characteristic.CurrentDoorState.STOPPED;
        } else if (nlRes.d3 >= acc.lastCurrentState) {
          currentStateResponse = this.platform.Characteristic.CurrentDoorState.OPENING;
        } else if (nlRes.d3 <= acc.lastCurrentState) {
          currentStateResponse = this.platform.Characteristic.CurrentDoorState.CLOSING;
        }

        acc.lastCurrentState = nlRes.d3;
      }

      callback(null, currentStateResponse);
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

module.exports = SrfRGarageDoor;
