((/* global, $ */) => {
    
    const Resource = function Resource(reader) {
        
        this.length = reader.end - reader.index;
        
        this.magic = reader.readUint32();
        
        this.data = [];
        
        while (reader.index < reader.end) {
            this.data.push(reader.readUint8());
        }
        
    };
    
    module.exports = Resource;
        
})(this, this.$);
