const SrfRPositionBase = require('./SrfRPositionBase');


class SrfRWindow extends SrfRPositionBase {
  static displayName() {
    return 'SRF-1-1000-R Window';
  }
  static description() {
    return `Cиловой блок nooLite-F SRF-1-1000-R для управления окнами`;
  }

  initOrCreateServices() {
    super.initOrCreateServices();

    let windowService = this.getOrCreateService(this.platform.Service.Window);
    this.currentPosition = windowService.getCharacteristic(this.platform.Characteristic.CurrentPosition);
    this.targetPosition = windowService.getCharacteristic(this.platform.Characteristic.TargetPosition);

    this.targetPosition
      .on('set', this.setPositionDebounce.bind(this));

    this.currentPosition
      .on('get', this.getPosition.bind(this));
  }

}

module.exports = SrfRWindow;
