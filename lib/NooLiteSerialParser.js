const SerialPort = require('serialport');
const {NooLiteRequest, NooLiteResponse} = require('./serialClasses');


class NooLiteSerialParser extends SerialPort.parsers.ByteLength {
  constructor(options) {
    const opts = Object.assign({
      length: 17
    }, options);
    super(opts);
  }

  _transform(chunk, encoding, cb) {
    let cursor = 0;
    while (cursor < chunk.length) {
      this.buffer[this.position] = chunk[cursor];
      cursor++;
      this.position++;
      if (this.position === this.length) {

        // Processed NooLite response
        let nlReaponse = new NooLiteResponse(...this.buffer);

        if (nlReaponse.isId()) {
          // Emit event by NooLite id
          this.emit(`nlres:${nlReaponse.getStrId()}`, nlReaponse);
        }

        // Emit event by NooLite channel
        this.emit(`nlres:${nlReaponse.ch}`, nlReaponse);
        this.emit('nlres', nlReaponse);
        this.push(this.buffer);
        this.buffer = Buffer.alloc(this.length);
        this.position = 0;
      }
    }
    cb();
  }
}

module.exports = NooLiteSerialParser;
