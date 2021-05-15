const {NooLiteRequest, NooLiteResponse} = require('../lib/serialClasses');
const AccessoryBase = require('./AccessoryBase');


class Pbx1x extends AccessoryBase {
  static displayName() 
  {
    return 'PBX1X';
  }

  static description() 
  {
    return 'Кнопочный радиопульты PB-212 / PB-412 / PB-211 / PB-411';
  }

  static getAccessoryCategory() 
  {
    return 15;
  }

  initOrCreateServices() {
    super.initOrCreateServices();
    let service = this.getOrCreateService(this.platform.Service.StatelessProgrammableSwitch);
    let programmableSwitchEventCharacteristic = service.getCharacteristic(this.platform.Characteristic.ProgrammableSwitchEvent);
    let lowBattery = service.getCharacteristic(this.platform.Characteristic.StatusLowBattery);

    // Обработка поступивших команд от MTRF
    this.platform.serialPort.nlParser.on(`nlres:${this.nlChannel}`, (nlCmd) => {
      this.log('read data by CHANNEL: ', nlCmd);
      
      // mode 1 - NooLite RX
      if (nlCmd.mode !== 1) {
        return;
      }

      switch (nlCmd.cmd) {
        case 4:
           service.updateCharacteristic(this.platform.Characteristic.ProgrammableSwitchEvent, this.platform.Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS);
          break;
        case 10:
        	service.updateCharacteristic(this.platform.Characteristic.ProgrammableSwitchEvent, this.platform.Characteristic.ProgrammableSwitchEvent.LONG_PRESS);
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
            'Model': 'PB-212 / PB-412 / PB-211 / PB-411',
            'SerialNumber': '0.0.1'
        };
    }
}

module.exports = Pbx1x;
