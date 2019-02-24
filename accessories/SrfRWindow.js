const {NooLiteRequest, NooLiteResponse} = require('../lib/serialClasses');
const SrfRDoor = require('./SrfRDoor');


class SrfRWindow extends SrfRDoor {
  static displayName() {
    return 'SRF-1-1000-R Window';
  }
  static description() {
    return `Cиловой блок nooLite-F SRF-1-1000-R для управления окнами`;
  }

  initOrCreateServices() {
    super.initOrCreateServices();

    let windowService = this.getOrCreateService(this.platform.Service.Window);
    let currentPosition = windowService.getCharacteristic(this.platform.Characteristic.CurrentPosition);
    let targetPosition = windowService.getCharacteristic(this.platform.Characteristic.TargetPosition);

    targetPosition
      .on('set', this.setPosition.bind(this))
    
    currentPosition
      .on('get', this.getPosition.bind(this));
  }

}

module.exports = SrfRWindow;
