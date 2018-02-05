((/* global, $ */) => {
    
    const Motion = require("./motion.js");
    
    const Package = function Package(reader) {
        
        this.offset = reader.index;
        
        this.length = reader.end - reader.index;
        
        let origin = reader.subreader();
        
        this.magic = reader.readUint32();
        
        let headerSections = reader.readUint32();
        
        let headers = [];
        let looper = 0;
        while (looper < headerSections) {
            headers.push({
                "type": reader.readUint32(),
                "length": reader.readUint32(),
                "offset": reader.readUint32(),
            });
            ++looper;
        }
        
        this.sections = headers.map((header) => {
            
            let data = {
                "header": header
            };
            
            let reader = origin.subreader(header.offset, header.length);
            
            if (header.type === 1) {
                
                data.part = {};
                
                let count = reader.readUint32();
                let looper = 0;
                while (looper < count) {
                    let name = reader.readString(0x40);
                    data.part[name] = {
                        "flags": reader.readUint32(),
                        "data": [
                            reader.readFloat32(), reader.readFloat32(),
                            reader.readFloat32(), reader.readFloat32(),
                            reader.readFloat32()]
                    };
                    
                    ++looper;
                }
                
                while (reader.index < reader.end) {
                    if (reader.readUint8() !== 0) {
                        throw new Error("Invalid padding, expected 0");
                    }
                }
                
            } else if (header.type === 2) {
                
                data.part = {};
                
                let count = reader.readUint32();
                let looper = 0;
                while (looper < count) {
                    let name = reader.readString(0x40);
                    data.part[name] = {
                        "data": [
                            reader.readFloat32(), reader.readFloat32(),
                            reader.readFloat32(), reader.readFloat32()]
                    };
                    
                    ++looper;
                }
                
                while (reader.index < reader.end) {
                    if (reader.readUint8() !== 0) {
                        throw new Error("Invalid padding, expected 0");
                    }
                }
               
            } else if (header.type === 4) {
                
                data.part = {};
                
                let count = reader.readUint32();
                let looper = 0;
                while (looper < count) {
                    let name = reader.readString(0x40);
                    let name2 = reader.readString(0x40);
                    data.part[name] = {
                        "data": [reader.readFloat32()]
                    };
                    data.part[name2] = data.part[name];
                    
                    ++looper;
                }
                
                while (reader.index < reader.end) {
                    if (reader.readUint8() !== 0) {
                        throw new Error("Invalid padding, expected 0");
                    }
                }
               
            } else if (header.type === 5) {
               
                let x = reader.readUint32();
                let y = reader.readUint32();
                
                data.xs = [];
                let looper = 0;
                while (looper < x) {
                    data.xs.push([reader.readUint8(), reader.readUint8(), reader.readUint8(), reader.readUint8()]);
                    ++looper;
                }
                
                data.ys = [];
                looper = 0;
                while (looper < y) {
                    data.ys.push([reader.readUint8(), reader.readUint8(), reader.readUint8(), reader.readUint8()]);
                    ++looper;
                }
                
                data.xys = [];
                looper = 0;
                while (looper < x * y) {
                    data.xys.push(reader.readUint8()); ++looper;
                }
                 
                while (reader.index < reader.end) {
                    if (reader.readUint8() !== 0xff) {
                        throw new Error("Invalid padding, expected 0xff");
                    }
                }
                
            }
            
            return data;
            
        });
        
        let rest = origin.subreader(headers[headers.length - 1].offset + headers[headers.length - 1].length);
        while (rest.index < rest.end) {
            if (rest.readUint8() !== 0) {
                throw new Error("Invalid padding, expected 0");
            }
        }
        
    };
    
    module.exports = Package;
    
})(this, this.$);
