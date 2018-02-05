((global, $) => {
    
    const TextDecoder = global.TextDecoder;
    
    const PC = require("./pc.js");
    
    const Loader = function Loader() {
        
        if ((arguments.length === 1) && ($.is(arguments[0], Array))) {
            this.files = arguments[0].slice(0);
        } else {
            this.files = Array.prototype.slice.call(arguments, 0);
        }
        
        this.resources = new Map();
        
    };
    
    Loader.prototype.load = function (pc) {
        
        if (!pc) {
            pc = new PC(this);
        }
        
        return $.async.all(this.files, function (file) {
            
            $.async(function () {
                
                $.request(file, {
                    "responseDataType": "binary"
                }, this.test);
                
            }).then(function (result) {
                
                pc.load(new Loader.Reader(new DataView(result))).pipe(this);
                
            }).pipe(this);
            
        }).resolve(pc);
        
    };
    
    const Reader = function Reader(buffer, offset, length) {
        
        this.buffer = buffer;
        this.begin = offset;
        if (!this.begin) {
            this.begin = 0;
        }
        this.end = this.buffer.byteLength;
        if ((length !== undefined) && (length !== null) && (this.begin + length < this.end)) {
            this.end = this.begin + length;
        }
        
        this.index = this.begin;
        
    };
    
    Reader.prototype.getString = function (length) {
        
        if (this.index >= this.end) {
            throw new Error("Reader has reach the end of buffer");
        }
        
        if ($.is.nil(length)) {
            length = 0;
            while ((this.index + length < this.end) &&
                   (this.buffer.getUint8(this.index + length) !== 0) && 
                   (this.index + length < this.buffer.byteLength)) {
                ++length;
            }
        }
        
        let string = new TextDecoder().decode(new Uint8Array(this.buffer.buffer, this.buffer.byteOffset + this.index, length));
        
        let looper = 0;
        while ((string.charCodeAt(looper) !== 0) && (looper < string.length)) {
            ++looper;
        }
        string = string.slice(0, looper);
        
        return string;
        
    };
    
    Reader.prototype.readString = function (length) {
        
        let string = this.getString(length);
        if (!$.is.nil(length)) {
            this.index += length;
        } else {
            this.index += string.length + 1;
        }
        
        return string;
        
    };
     
    Reader.prototype.getUint8 = function () {
        if (this.index >= this.end) {
            throw new Error("Reader has reach the end of buffer");
        }
        return this.buffer.getUint8(this.index);
    };
     
    Reader.prototype.getUint16 = function () {
        if (this.index + 1 >= this.end) {
            throw new Error("Reader has reach the end of buffer");
        }
        return this.buffer.getUint16(this.index, true);
    };
    
    Reader.prototype.getUint32 = function () {
        if (this.index + 3 >= this.end) {
            throw new Error("Reader has reach the end of buffer");
        }
        return this.buffer.getUint32(this.index, true);
    };
     
    Reader.prototype.getInt8 = function () {
        if (this.index >= this.end) {
            throw new Error("Reader has reach the end of buffer");
        }
        return this.buffer.getInt8(this.index);
    };
     
    Reader.prototype.getInt16 = function () {
        if (this.index + 1 >= this.end) {
            throw new Error("Reader has reach the end of buffer");
        }
        return this.buffer.getInt16(this.index, true);
    };
    
    Reader.prototype.getInt32 = function () {
        if (this.index + 3 >= this.end) {
            throw new Error("Reader has reach the end of buffer");
        }
        return this.buffer.getInt32(this.index, true);
    };
      
    Reader.prototype.readUint8 = function () {
        let uint8 = this.getUint8();
        ++this.index;
        return uint8;
    };
     
    Reader.prototype.readUint16 = function () {
        let uint16 = this.getUint16();
        this.index += 2;
        return uint16;
    };
    
    Reader.prototype.readUint32 = function () {
        let uint32 = this.getUint32();
        this.index += 4;
        return uint32;
    };
    
    Reader.prototype.readInt8 = function () {
        let int8 = this.getInt8();
        ++this.index;
        return int8;
    };
     
    Reader.prototype.readInt16 = function () {
        let int16 = this.getInt16();
        this.index += 2;
        return int16;
    };
    
    Reader.prototype.readInt32 = function () {
        let int32 = this.getInt32();
        this.index += 4;
        return int32;
    };
    
    Reader.prototype.getFloat32 = function () {
        if (this.index + 3 >= this.end) {
            throw new Error("Reader has reach the end of buffer");
        }
        return this.buffer.getFloat32(this.index, true);
    };
     
    Reader.prototype.readFloat32 = function () {
        let float32 = this.getFloat32();
        this.index += 4;
        return float32;
    };
    
    Reader.prototype.subreader = function (offset, length) {
        if (!offset) {
            offset = 0;
        }
        if ($.is.nil(length)) {
            length = this.end - this.index - offset;
        }
        if (length > 0) {
            if (this.index >= this.end) {
                throw new Error("Reader has reach the end of buffer");
            }
            if (this.index + offset >= this.end) {
                throw new Error("The offset is out of the range of the buffer");
            }
            if (this.index + offset + length > this.end) {
                throw new Error("The end of the slice is out of the range of the buffer");
            }
        }
        return new Reader(this.buffer, this.index + offset, length);
    };
    
    Reader.prototype.skipPadding = function (base, expected) {
        
        if ($.is(expected, Number)) {
            expected = [expected];
        }
        
        while ((this.index - this.begin) % base) {
            let value = this.readUint8();
            if ((!$.is.nil(expected)) && (expected.indexOf(value) === -1)) {
                throw new Error("Expected " + expected + ", but got " + value);
            }
        }
        
    };
    
    Reader.prototype.skip = function (offset, expected) {
         
        if ($.is(expected, Number)) {
            expected = [expected];
        }
        
        let looper = 0;
        while (looper < offset) {
            let value = this.readUint8();
            if ((!$.is.nil(expected)) && (expected.indexOf(value) === -1)) {
                throw new Error("Expected " + expected + ", but got " + value);
            }
            ++looper;
        }
        
    };
    
    Object.defineProperty(Reader.prototype, "available", {
        "get": function () {
            return this.end - this.index;
        }
    });
    
    Loader.Reader = Reader;
    
    module.exports = Loader;

})(this, this.$);
