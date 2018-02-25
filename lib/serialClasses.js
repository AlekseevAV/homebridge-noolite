class NooLiteMessage {
  constructor(ch, cmd, mode, id0, id1, id2, id3) {
    this.ch = parseInt(ch);
    this.cmd = parseInt(cmd);
    this.mode = parseInt(mode);
    this.id0 = parseInt(id0);
    this.id1 = parseInt(id1);
    this.id2 = parseInt(id2);
    this.id3 = parseInt(id3);

    this.idBytes = [this.id0, this.id1, this.id2, this.id3];
  }

  pad(num, size) {
      let s = num+"";
      while (s.length < size) {
        s = "0" + s;
      }
      return s;
  }

  getStrId() {
    let result = [];

    for (let item of this.idBytes) {
      result.push(this.pad(item, 2));
    }

    return result.join(':');
  }

  isId() {

    for (let item of this.idBytes) {
      // if any of id bytes not equal 0
      if (item !== 0) {
        return true;
      }
    }
    return false;
  }

  isEqual(otherMessage) {
    return this.mode === otherMessage.mode &&
           this.ch === otherMessage.ch &&
           this.id0 === otherMessage.id0 &&
           this.id1 === otherMessage.id1 &&
           this.id2 === otherMessage.id2 &&
           this.id3 === otherMessage.id3;
  }

}


class NooLiteResponse extends NooLiteMessage {
  constructor(st, mode, ctr, togl, ch, cmd, fmt, d0, d1, d2, d3, id0, id1, id2, id3, crc, sp){
    super(ch, cmd, mode, id0, id1, id2, id3);
    this.st = parseInt(st);
    this.ctr = parseInt(ctr);
    this.togl = parseInt(togl);
    this.fmt = parseInt(fmt);
    this.d0 = parseInt(d0);
    this.d1 = parseInt(d1);
    this.d2 = parseInt(d2);
    this.d3 = parseInt(d3);
    this.crc = parseInt(crc);
    this.sp = parseInt(sp);
  }

  isError() {
    // Значение=0 – Команда выполнена
    // Значение=1 – Нет ответа от блока
    // Значение=2 – Ошибка во время выполнения
    // Значение=3 – Привязка выполнена
    let errors = [1, 2];
    return errors.includes(this.ctr);
  }

  isState() {
    // cmd 130 - Ответ от исполнительного устройства
    return !this.isError() && this.cmd === 130;
  }
}


class NooLiteRequest extends NooLiteMessage {
  constructor(ch, cmd, mode=0, ctr=0, res=0, fmt=0, d0=0, d1=0, d2=0, d3=0, id0=0, id1=0, id2=0, id3=0) {
    super(ch, cmd, mode, id0, id1, id2, id3);
    this.st = 171;
    this.ctr = parseInt(ctr);
    this.res = parseInt(res);
    this.fmt = parseInt(fmt);
    this.d0 = parseInt(d0);
    this.d1 = parseInt(d1);
    this.d2 = parseInt(d2);
    this.d3 = parseInt(d3);
    this.sp = 172;
  }

  get crc() {
    let bytes_array = [
      this.st,
      this.mode,
      this.ctr,
      this.res,
      this.ch,
      this.cmd,
      this.fmt,
      this.d0,
      this.d1,
      this.d2,
      this.d3,
      this.id0,
      this.id1,
      this.id2,
      this.id3,
    ];

    let sum = bytes_array.reduce(
       function(sum, current){
         return sum + current;
       }, 0
    );

    return ((sum < 256) ? sum : sum % 256);
  }

  toBytes() {
    return new Buffer([
      this.st,
      this.mode,
      this.ctr,
      this.res,
      this.ch,
      this.cmd,
      this.fmt,
      this.d0,
      this.d1,
      this.d2,
      this.d3,
      this.id0,
      this.id1,
      this.id2,
      this.id3,
      this.crc,
      this.sp
    ]);
  }

}


module.exports = {
  NooLiteResponse: NooLiteResponse,
  NooLiteRequest: NooLiteRequest
};
