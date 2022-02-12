const {NooLiteRequest, NooLiteResponse} = require('../lib/serialClasses');
const Su = require('./Su');


class Sb extends Su {
  static displayName() {
    return 'SB';
  }
  static description() {
    return 'диммируемый блок со старым протоколом nooLite';
  }

  minBrightness = 21;
  maxBrightness = 132;

  getAccessoryInformation() {
        return {
            'Manufacturer': 'NooLite',
            'Model': 'SB',
            'SerialNumber': '0.0.1'
        };
    }
}

module.exports = Sb;
