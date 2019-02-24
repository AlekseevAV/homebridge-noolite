const {NooLiteRequest, NooLiteResponse} = require('../lib/serialClasses');
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

  initOrCreateServices() {
    super.initOrCreateServices();

    let garageDoor = this.getOrCreateService(this.platform.Service.GarageDoorOpener);
    let currentState = garageDoor.getCharacteristic(this.platform.Characteristic.CurrentDoorState);
    let targetState = garageDoor.getCharacteristic(this.platform.Characteristic.TargetDoorState);

    targetState
      .on('set', (value, callback) => {
        this.log("Set state characteristic to " + value);
    
        // State может быть только в одном состоянии 1 (OPEN) или 2 (CLOSED), а в NooLite мы управляем позицией через
        // задание яркости от 0 до 255
        const targetValue = value == this.platform.Characteristic.TargetDoorState.OPEN ? 255 : 0;
        let command = new NooLiteRequest(this.nlChannel, 6, 2, 0, 0, 1, targetValue, 0, 0, 0, ...this.nlId.split(':'));
    
        // this.platform.sendCommand(command, (err, nlRes) => {
        //   if (err) {
        //     this.log('Error on write: ', err.message);
        //     callback(new Error('Error on write'));
        //     return;
        //   } else if (nlRes.isError()) {
        //     this.log('Error on response: ', nlRes);
        //     callback(new Error('Error on response'));
        //     return;
        //   }
    
        //   callback();
        // })
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
            let timeToCheckIsOver = new Date().getTime() > endCheckingTimestamp;

            if (newValue == value) {
              currentState.setValue(value)
            } else if (!timeToCheckIsOver) {
              setTimeout(check.bind(this), 2000, 3)
            }

          })
        }.bind(this), 2000);

      })
    
    currentState
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
        if (nlRes.d3 == 0) {
          currentStateResponse = this.platform.Characteristic.CurrentDoorState.CLOSED;
        } else if (nlRes.d3 == 255) {
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
