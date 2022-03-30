const {NooLiteRequest} = require('../lib/serialClasses');
const AccessoryBase = require('./AccessoryBase');


class SufDoor extends AccessoryBase {
  static displayName() {
    return 'SUF Door Temporary On';
  }
  static description() {
    return 'Силовой блок nooLite-F SUF для управления дверью через Temporary_On команду (cmd=25)';
  }

  static getAccessoryCategory() {
    return 4;
  }

  initOrCreateServices() {
    super.initOrCreateServices();

    let door = this.getOrCreateService(this.platform.Service.Door);
    this.targetPosition = door.getCharacteristic(this.platform.Characteristic.TargetPosition);

    this.targetPosition
      .on('set', (value, callback) => {
        this.log("Set TargetPosition characteristic to " + value);

        if (value === 0) {
          callback()
          return
        }

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

          if (this.accessory.lastTimerId !== null) {
            clearTimeout(this.accessory.lastTimerId);
          }

          this.accessory.lastTimerId = setTimeout(function() {
            this.targetPosition.setValue(0);
            this.accessory.lastTimerId = null;
          }.bind(this), 1500);

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

module.exports = SufDoor;
