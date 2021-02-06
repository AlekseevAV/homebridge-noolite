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
