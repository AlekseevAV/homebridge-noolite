class MTRFSerial {
  constructor(serial) {
    this._serial = serial;
    this._queue = [];
    this.requestTtl = 2000;
    this._busy = false;
    this._current = null;
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
        if ((Date.now() - task.createdTime) < this.requestTtl) {
          return true;
        }
        else {
          callback(new Error('Timeout to get response from MTRF'));
          if (this._current && this._current.id == task.id) {
            this._current = null;
          }
          return false;
        }
      });
    }, 5000);
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
    this._serial.write(next.nlReq.toBytes());
  }
}

module.exports = MTRFSerial;