const {NooLiteRequest} = require('../lib/serialClasses');
const SrfRPositionBase = require('./SrfRPositionBase');


class SrfRDoor extends SrfRPositionBase {
  static displayName() {
    return 'SRF-1-1000-R Door';
  }
  static description() {
    return `Cиловой блок nooLite-F SRF-1-1000-R для управления дверями`;
  }

  initOrCreateServices() {
    super.initOrCreateServices();

    let doorService = this.getOrCreateService(this.platform.Service.Door);
    this.currentPosition = doorService.getCharacteristic(this.platform.Characteristic.CurrentPosition);
    this.targetPosition = doorService.getCharacteristic(this.platform.Characteristic.TargetPosition);

    this.targetPosition
      .on('set', this.setPositionDebounce.bind(this));

    this.currentPosition
      .on('get', this.getPosition.bind(this));
  }

}

module.exports = SrfRDoor;
