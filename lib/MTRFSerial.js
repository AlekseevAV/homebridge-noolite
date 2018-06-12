class MTRFSerial {
  constructor(platform, serial) {
    this.platform = platform;
    this._serial = serial;
    this._queue = [];
    this.requestTtl = 1000;
    this._busy = false;
    this._current = null;
    this.serialWriteDelayMs = 250;
    this.lastSerialWrite = Date.now();
    var device = this;
    
    serial.nlParser.on('nlres', function (nlRes) {
      if (!device._current)
        return;
      
      const task = device._current;
      
      if (task.nlReq.isEqual(nlRes)) {
        task.callback(null, nlRes);
        device.processQueue();
      }

      if ((Date.now() - task.createdTime) < this.requestTtl) {
        device._current = null;
        device.processQueue();
      }
    });

    // переодически пробегаемся по всем таскам в очереди, и удаляем старые,
    // на которые так и не пришел ответ
    setInterval(() => {
      this._queue = this._queue.filter((task) => {
        if ((Date.now() - task.createdTime) < device.requestTtl) {
          return true;
        }
        else {
          task.callback(new Error('Timeout to get response from MTRF'));
          if (device._current && device._current.id == task.id) {
            device._current = null;
          }
          return false;
        }
      });

      if (this._queue.length === 0) {
        this._busy = false;
      }
    }, 2000);
  }

  send(nlReq, callback) {
    const newTask = {
      id: Math.floor((1 + Math.random()) * 0x10000),
      createdTime: Date.now(),
      nlReq,
      callback
    };
    this._queue.push(newTask);
    
    if (this._busy)
      return;
    
    this._busy = true;
    this.processQueue();
  }

  processQueue() {
    var next = this._queue.shift();
    if (!next) {
      this._busy = false;
      this._current = null;
      return;
    }

    this._current = next;

    const writeDelay = Date.now() - this.lastSerialWrite;
    const waiBeforeWritetMs = writeDelay > this.serialWriteDelayMs ? 0 : this.serialWriteDelayMs - writeDelay;

    this.platform.log.debug('Wait before write: ', waiBeforeWritetMs)

    setTimeout(() => {
      this._serial.write(next.nlReq.toBytes());
      this.lastSerialWrite = Date.now();
    }, waiBeforeWritetMs)
  }
}

module.exports = MTRFSerial;