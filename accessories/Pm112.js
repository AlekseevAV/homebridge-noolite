const {NooLiteRequest, NooLiteResponse} = require('../lib/serialClasses');
const AccessoryBase = require('./AccessoryBase');


class Pm112 extends AccessoryBase {
  static displayName() {
    return 'PM112';
  }
  static description() {
    return 'датчик движения';
  }

  static getAccessoryCategory() {
    return 10;
  }

  initOrCreateServices() {
    super.initOrCreateServices();

    let service = this.getOrCreateService(this.platform.Service.MotionSensor);
    let motionDetected = service.getCharacteristic(this.platform.Characteristic.MotionDetected);
    let lowBattery = service.getCharacteristic(this.platform.Characteristic.StatusLowBattery);
    
    // Обработка поступивших команд от MTRF
    this.platform.serialPort.nlParser.on(`nlres:${this.nlChannel}`, (nlCmd) => {
      this.log('read data by CHANNEL: ', nlCmd);
      
      // mode 1 - NooLite RX
      if (nlCmd.mode !== 1) {
        return;
      }

      switch (nlCmd.cmd) {
        case 25:
          motionDetected.setValue(true);

          // После 5 секунд сбрасываем состояние на false
          setInterval(() => {
            motionDetected.setValue(false);
          }, 5000)
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
            'Model': 'PM112',
            'SerialNumber': '0.0.1'
        };
    }
}

module.exports = Pm112;
