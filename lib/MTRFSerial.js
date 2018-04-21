function MTRFSerial (serial) {
  this._serial = serial;
  this._queue = [];
  this.requestTtl = 2000;
  this._busy = false;
  this._current = null;
  var device = this;
  serialPort.nlParser.on('nlres', function (nlRes) {
      if (!device._current) return;

      const [nlReq, callback, ...other] = device._current;

      if (nlReq.isEqual(nlRes)) {
        device._current[1](null, nlRes);
      }
      device.processQueue();
  });

  // переодически пробегаемся по всем таскам в очереди, и удаляем старые,
  // на которые так и не пришел ответ
  setInterval(() => {
    this._queue = this._queue.filter((task) => {
      const [nlReq, callback, createdTime] = task;
      if ((Date.now() - createdTime) < this.requestTtl) {
        return true;
      } else {
        callback(new Error('Timeout to get response from MTRF'))
        return false;
      }
    })
  }, 5000)
}

MTRFSerial.prototype.send = function (nlReq, callback) {
    this._queue.push([nlReq, callback, Date.now()]);
    if (this._busy) return;
    this._busy = true;
    this.processQueue();
};

MTRFSerial.prototype.processQueue = function () {
    var next = this._queue.shift();

    if (!next) {
        this._busy = false;
        return;
    }

    this._current = next;
    this._serial.write(next[0].toBytes());
};

export default MTRFSerial;