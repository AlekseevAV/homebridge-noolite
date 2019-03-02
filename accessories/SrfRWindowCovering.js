const SrfRDoor = require('./SrfRDoor');


class SrfRWindowCovering extends SrfRDoor {
  static displayName() {
    return 'SRF-1-1000-R Window Covering';
  }
  static description() {
    return `Cиловой блок nooLite-F SRF-1-1000-R для управления шторами, жалюзи`;
  }

  initOrCreateServices() {
    super.initOrCreateServices();

    let windowCoveringService = this.getOrCreateService(this.platform.Service.WindowCovering);
    let currentPosition = windowCoveringService.getCharacteristic(this.platform.Characteristic.CurrentPosition);
    let targetPosition = windowCoveringService.getCharacteristic(this.platform.Characteristic.TargetPosition);

    targetPosition
      .on('set', this.setPosition.bind(this));
    
    currentPosition
      .on('get', this.getPosition.bind(this));
  }

}

module.exports = SrfRWindowCovering;
