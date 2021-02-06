const {NooLiteRequest} = require('../lib/serialClasses');
const AccessoryBase = require('./AccessoryBase');


class SufGate extends AccessoryBase {
  static displayName() {
    return 'SUF Gate';
  }
  static description() {
    return 'Силовой блок nooLite-F SUF для управления гаражными воротами';
  }

  static getAccessoryCategory() {
    return 4;
  }

  initOrCreateServices() {
    super.initOrCreateServices();

    let garageDoor = this.getOrCreateService(this.platform.Service.GarageDoorOpener);
    this.currentState = garageDoor.getCharacteristic(this.platform.Characteristic.CurrentDoorState);
    this.targetState = garageDoor.getCharacteristic(this.platform.Characteristic.TargetDoorState);
    this.timeToOpenClose = garageDoor.getCharacteristic(this.platform.Characteristic.TimeToOpenClose);

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

          let newCurrentState;
          if (value == this.platform.Characteristic.TargetDoorState.OPEN) {
            this.currentState.setValue(this.platform.Characteristic.CurrentDoorState.OPENING)
            newCurrentState = this.platform.Characteristic.CurrentDoorState.OPEN;
          } else {
            this.currentState.setValue(this.platform.Characteristic.CurrentDoorState.CLOSING)
            newCurrentState = this.platform.Characteristic.CurrentDoorState.CLOSED;
          }

          if (this.accessory.lastTimerId !== null) {
            clearTimeout(this.accessory.lastTimerId);
          };

          this.accessory.lastTimerId = setTimeout(function() {
            // ставим текущее состояние
            this.currentState.setValue(newCurrentState);
            this.accessory.lastTimerId = null;
          }.bind(this), this.timeToOpenClose.value * 1000);

        })
      })
  }

  getAccessoryInformation() {
      return {
          'Manufacturer': 'NooLite',
          'Model': 'SUF',
          'SerialNumber': '0.0.1'
      };
  }
}

module.exports = SufGate;
