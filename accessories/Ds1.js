const {NooLiteRequest, NooLiteResponse} = require('../lib/serialClasses');
const AccessoryBase = require('./AccessoryBase');


class Ds1 extends AccessoryBase {
  static displayName() {
    return 'DS-1';
  }
  static description() {
    return 'датчик открытия/закрытия';
  }

  static getAccessoryCategory() {
    return 10;
  }

  initOrCreateServices() {
    super.initOrCreateServices();

    let service = this.getOrCreateService(this.platform.Service.ContactSensor);
    let contactState = service.getCharacteristic(this.platform.Characteristic.ContactSensorState);
    let lowBattery = service.getCharacteristic(this.platform.Characteristic.StatusLowBattery);
    
    // Обработка поступивших команд от MTRF
    this.platform.serialPort.nlParser.on(`nlres:${this.nlChannel}`, (nlCmd) => {
      this.log('read data by CHANNEL: ', nlCmd);
      
      // mode 1 - NooLite RX
      if (nlCmd.mode !== 1) {
        return;
      }

      switch (nlCmd.cmd) {
        case 0:
          contactState.setValue(false);
          break;
        case 2:
          contactState.setValue(true);
          break;
        case 20:
          lowBattery.setValue(true);
          break;
      }
    });
  }

  getAccessoryInformation() {
        return {
            'Manufacturer': 'NooLite',
            'Model': 'DS-1',
            'SerialNumber': '0.0.1'
        };
    }
}

module.exports = Ds1;
