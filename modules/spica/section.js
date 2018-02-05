((/* global, $ */) => {
    
    const Section = function Section(reader, expected) {
        
        this.magic = reader.readString(8);
        if (this.magic !== expected) {
            throw new Error("Invalid magic " + this.magic + ", expected: " + expected);
        }
        this.length = reader.readUint32();
        if (reader.readInt32() !== -1) {
            throw new Error("Invalid section padding, expected -1");
        }
        
    };
    
    module.exports = Section;
    
})(this, this.$);
