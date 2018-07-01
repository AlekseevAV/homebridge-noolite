class MTRFSerial {
  constructor(platform, serial) {
    this.platform = platform;
    this._serial = serial;
    this._queue = [];
    this.requestTtl = 1000;
    this._current = null;
    this.serialWriteDelayMs = 250;
    this.lastSerialWrite = Date.now();
    var device = this;
    
    serial.nlParser.on('nlres', function (nlRes) {
      if (!device._current)
        return;

      const task = device._current;
      
      if (task.nlReq.isEqual(nlRes)) {
        device._current = null;
        task.callback(null, nlRes);
      }
    });

    setInterval(() => {
      // переодически пробегаемся по всем таскам в очереди, и удаляем старые,
      // на которые так и не пришел ответ
      this._queue = this._queue.filter((task) => {
        if ((Date.now() - task.createdTime) < device.requestTtl) {
          return true;
        }
        else {
          this.platform.log(`Queued task TTL error`)
          return false;
        }
      });

    }, 2000);

    // запускаем обработчик очереди
    device.processQueue();
  }

  onTaskTtlError(task) {
    task.callback(new Error('Timeout to get response from MTRF'));
    this._serial.tryToOpenPort();
  }

  send(nlReq, callback) {
    this.platform.log(`Add nlReq to queue: `, nlReq)
    const newTask = {
      id: Math.floor((1 + Math.random()) * 0x10000),
      createdTime: Date.now(),
      nlReq,
      callback
    };
    this._queue.push(newTask);
  }

  processQueue() {
    if (this._queue.length && !this._current) {
      let next = this._queue.shift();

      this._current = next;

      const writeDelay = Date.now() - this.lastSerialWrite;
      const waitBeforeWriteMs = writeDelay > this.serialWriteDelayMs ? 0 : this.serialWriteDelayMs - writeDelay;

      this.platform.log.debug('Wait before write: ', waitBeforeWriteMs)

      setTimeout(() => {
        this._serial.write(next.nlReq.toBytes());
        this.lastSerialWrite = Date.now();

        // проверяем выполнение таска
        setTimeout(() => {
          if (this._current && next.id === this._current.id) {
            this.platform.log(`Current task TTL error`)
            this.onTaskTtlError(next);
            this._current = null;
          }
        }, this.requestTtl)

      }, waitBeforeWriteMs)
    }

    setTimeout(() => {this.processQueue()}, 10)
  }
}

module.exports = MTRFSerial;