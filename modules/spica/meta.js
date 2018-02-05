((/* global, $ */) => {
    
    const Meta = function Meta(reader) {
        
        let ended = false;
        while (reader.index + 0x20 < reader.end) {
            let name = reader.readString(0x20);
            name = name.trim();
            if (name) {
                let position = [reader.readFloat32(), reader.readFloat32(), reader.readFloat32()];
                let flags = reader.readUint32();
                if (flags) {
                    this[name] = {
                        "position": position,
                        "flags": flags
                    };
                } else {
                    // Strange data
                }
            } else {
                ended = true;
            }
        }
        
        while (reader.index < reader.end) {
            if (reader.readUint8() !== 0) {
                throw new Error("Invalid padding, expected 0");
            }
        }
        
    };
    
    module.exports = Meta;
    
})(this, this.$);
