const SrfRPositionBase = require('./SrfRPositionBase');


class SrfRWindowCovering extends SrfRPositionBase {
  static displayName() {
    return 'SRF-1-1000-R Window Covering';
  }
  static description() {
    return `Cиловой блок nooLite-F SRF-1-1000-R для управления шторами, жалюзи`;
  }

  initOrCreateServices() {
    super.initOrCreateServices();

    let windowCoveringService = this.getOrCreateService(this.platform.Service.WindowCovering);
    this.currentPosition = windowCoveringService.getCharacteristic(this.platform.Characteristic.CurrentPosition);
    this.targetPosition = windowCoveringService.getCharacteristic(this.platform.Characteristic.TargetPosition);

    this.targetPosition
      .on('set', this.setPositionDebounce.bind(this));

    this.currentPosition
      .on('get', this.getPosition.bind(this));
  }

}

module.exports = SrfRWindowCovering;
