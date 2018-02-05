((/* global, $ */) => {
    
    const MotionHeader = 0;
    const MotionSkeletal = 1;
    const MotionMaterial = 3;
    const MotionConstant = 5;
    const MotionVisibility = 6;
    const MotionAction = 7;
    
    const BoneTransformOrders = [
        "scaleX", "scaleY", "scaleZ", 
        "rotationX", "rotationY", "rotationZ", 
        "translationX", "translationY", "translationZ"
    ];
    
    const TextureTransformOrders = [
        "scaleX", "scaleY",
        "rotation",
        "translationX", "translationY"
    ];
    
    const ConstantValueOrders = ["r", "g", "b", "a"];
    
    const Motion = function Motion(reader) {
        
        const origin = reader.subreader();
        
        this.magic = reader.readUint32();
        
        const sectionCount = reader.readUint32();

        const sections = [];
        let looper = 0;
        while (looper < sectionCount) {
            sections.push({
                "type": reader.readUint32(),
                "length": reader.readUint32(),
                "offset": reader.readUint32()
            });
            ++looper;
        }
        
        sections.forEach((section) => {
 
            let reader = origin.subreader(section.offset, section.length);
           
            switch (section.type) {
                case MotionHeader: {
                    
                    this.frames = reader.readUint32();
                    this.flags = [reader.readUint16(), reader.readUint16()];
                    this.loop = (this.flags[0] & 0x1) !== 0;
                    this.blended = (this.flags[1] & 0x1) !== 0; // not sure
                    this.animationRegion = {
                        "min": [reader.readFloat32(), reader.readFloat32(), reader.readFloat32()],
                        "max": [reader.readFloat32(), reader.readFloat32(), reader.readFloat32()],
                    };
                    this.hash = reader.readUint32();
                    break;
                }
                case MotionSkeletal: { this.skeletal = new Motion.Skeletal(reader, this.frames); break; }
                case MotionMaterial: { this.material = new Motion.Material(reader, this.frames); break; }
                case MotionVisibility: { this.visibility = new Motion.Visibility(reader, this.frames); break; }
                case MotionConstant: { this.constant = new Motion.Constant(reader, this.frames); break; }
                case MotionAction: { this.action = new Motion.Action(reader, this.frames); break; }
                default: { break; }
            }
            
        });
        
    };
    
    Motion.FPS = 24;
    
    Motion.interpolate = function (left, right, time) {
        
        if (!right) {
            return left.value;
        }
        if (left.frame === right.frame) {
            return left.value;
        }
        if (left.frame === time) {
            return left.value;
        }
        if (right.frame === time) {
            return right.value;
        }
        
        let frames = time - left.frame;
        
        let weight = frames / (right.frame - left.frame);
        
        let result = left.value + (left.value - right.value) * (2 * weight - 3) * weight * weight;
        
        result += (frames * (weight - 1)) * (left.slope * (weight - 1) + right.slope * weight);
        
        return result;
        
    };
    
    Motion.readKeyFrames = function (reader, flags, frames) {
        
        let keyFrames = [];
        
        let axisVariable = (flags & 0x4) !== 0;
        let axisConstant = (flags & 0x2) !== 0;
        let axisFloat = (flags & 0x1) !== 0;
        
        if (axisConstant && axisVariable) {
            throw new Error("Invalid axis");
        }
        
        if (axisVariable) {
            
            let keyFramesCount = reader.readUint32();
            
            let frameIndices = [];
            
            let looper2 = 0;
            while (looper2 < keyFramesCount) {
                if (frames > 0xff) {
                    frameIndices.push(reader.readUint16());
                } else {
                    frameIndices.push(reader.readUint8());
                }
                ++looper2;
            }
            
            reader.skipPadding(0x4, [0, 0xff]);
            
            if (axisFloat) {
                looper2 = 0;
                while (looper2 < keyFramesCount) {
                    keyFrames.push({
                        "frame": frameIndices[looper2],
                        "value": reader.readFloat32(),
                        "slope": reader.readFloat32()
                    });
                    ++looper2;
                }
                keyFrames.isConstant = false;
            } else {
                let valueScale = reader.readFloat32();
                let valueOffset = reader.readFloat32();
                let slopeScale = reader.readFloat32();
                let slopeOffset = reader.readFloat32();
                looper2 = 0;
                while (looper2 < keyFramesCount) {
                    let value = reader.readUint16();
                    let slope = reader.readUint16();
                    keyFrames.push({
                        "frame": frameIndices[looper2],
                        "value": (value / 0xffff) * valueScale + valueOffset,
                        "slope": (slope / 0xffff) * slopeScale + slopeOffset
                    });
                    ++looper2;
                }
                keyFrames.isConstant = false;
            }

        } else {
            
            if (axisConstant) {
                if (axisFloat) {
                    keyFrames.isConstant = true;
                    keyFrames.push({ "frame": 0, "value": reader.readFloat32(), "slope": 0 });
                } else {
                    // It seems always 1 for not float constants
                    keyFrames.isConstant = true;
                    keyFrames.push({ "frame": 0, "value": 1, "slope": 0 });
                }
            } else {
                if (axisFloat) {
                    keyFrames.isConstant = true;
                    keyFrames.push({ "frame": 0, "value": 0, "slope": 0 });
                }
            }
            
        }
        
        return keyFrames;
        
    };
    
    const Skeletal = function Skeletal(reader, frames) {
        
        const nameCount = reader.readInt32();
        
        const namesLength = reader.readUint32();
        
        const origin = reader.subreader();

        const names = [];
        
        let looper = 0;
        while (looper < nameCount) {
            names.push(reader.readString(reader.readUint8()));
            ++looper;
        }
        
        let boneReader = origin.subreader(namesLength);
        
        this.transforms = names.map((name) => {
            return new Motion.BoneTransform(boneReader, name, frames);
        });
        
    };
    
    Motion.Skeletal = Skeletal;
    
    const BoneTransform = function BoneTransform(reader, name, frames) {
        
        this.bone = name;

        let flags = reader.readUint32();
        const length = reader.readUint32();
        
        let offset = reader.index;
        
        this.axisAngle = ((flags >> 31) & 0x1) === 0;
        flags = flags & 0x7fffffff;
        
        let looper = 0;
        while (looper < 9) {
            this[BoneTransformOrders[looper]] = Motion.readKeyFrames(reader, flags & 0x7, frames);
            flags = flags >> 3;
            ++looper;
        }
         
        if (reader.index - offset !== length) {
            throw new Error("Incorrect data length in skeletal motion");
        }

    };
    
    Motion.BoneTransform = BoneTransform;
    
    const Material = function Material(reader, frames) {
        
        let nameCount = reader.readInt32();
        let namesLength = reader.readUint32();

        let units = [];
        let looper = 0;
        while (looper < nameCount) {
            units.push({
                "count": reader.readUint32()
            });
            ++looper;
        }
        
        let origin = reader.subreader();
        
        looper = 0;
        while (looper < nameCount) {
            units[looper].material = reader.readString(reader.readUint8());
            ++looper;
        }
        
        let newReader = origin.subreader(namesLength);
        
        this.transforms = [];
        units.forEach((unit) => {
            let looper = 0;
            while (looper < unit.count) {
                this.transforms.push(new Motion.TextureTransform(newReader, unit.material, frames));
                ++looper;
            }
        });
        
    };
    
    Motion.Material = Material;
    
    const TextureTransform = function TextureTransform(reader, name, frames) {
        
        this.material = name;
        
        this.textureIndex = reader.readUint32();

        let flags = reader.readUint32();
        const length = reader.readUint32();
        
        let looper = 0;
        while (looper < 5) {
            this[TextureTransformOrders[looper]] = Motion.readKeyFrames(reader, flags & 0x7, frames);
            flags = flags >> 3;
            ++looper;
        }
        
    };
    
    Motion.TextureTransform = TextureTransform;
    
    const Visibility = function Visibility(reader, frames) {
        
        let nameCount = reader.readInt32();
        let namesLength = reader.readUint32();

        let origin = reader.subreader();
        
        let meshes = []
        let looper = 0;
        while (looper < nameCount) {
            meshes[looper] = reader.readString(reader.readUint8());
            ++looper;
        }

        let newReader = origin.subreader(namesLength);
        
        this.transforms = meshes.map((mesh) => {
            return new Motion.MeshTransform(newReader, mesh, frames);
        });
        
    };
    
    Motion.Visibility = Visibility;
    
    const MeshTransform = function MeshTransform(reader, name, frames) {
        
        this.mesh = name;
        
        this.visibility = [];

        let value = 0;
        let looper = 0;
        while (looper <= frames) {
            
            let bit = looper & 0x7;
            if (bit === 0) {
                value = reader.readUint8();
            }
            
            this.visibility.push({
                "frame": looper,
                "value": (value & (1 << bit)) !== 0,
                "slope": 0
            });
            
            ++looper;
        }
        
        this.visibility.isConstant = false;
        if (this.visibility.filter((state) => state.value).length === 0) {
            this.visibility.isConstant = true;
        }
        if (this.visibility.filter((state) => !state.value).length === 0) {
            this.visibility.isConstant = true;
        }
        
    };
    
    Motion.MeshTransform = MeshTransform;
     
    const Constant = function Constant(reader, frames) {
        
        let nameCount = reader.readInt32();
        let namesLength = reader.readUint32();
        
        let units = [];
        let looper = 0;
        while (looper < nameCount) {
            units.push({
                "count": reader.readUint32()
            });
            ++looper;
        }
        
        let origin = reader.subreader();
        
        units.forEach((unit) => {
            unit.mesh = reader.readString(reader.readUint8());
        });
        
        let newReader = origin.subreader(namesLength);
        
        this.values = [];
        units.forEach((unit) => {
            let looper = 0;
            while (looper < unit.count) {
                this.values.push(new Motion.ConstantChange(newReader, unit.mesh, frames));
                ++looper;
            } 
        });
        
        this.post = [];
        while (newReader.index < newReader.end) {
            this.post.push(newReader.readUint8());
        }
        
    };
    
    Motion.Constant = Constant;
    
    const ConstantChange = function ConstantChange(reader, material, frames) {
         
        this.material = material;
        
        this.constantIndex = reader.readUint32();
    
        let flags = reader.readUint32();
        const length = reader.readUint32();
        
        let offset = reader.index;
        
        flags = flags & 0x7fffffff;
        
        let looper = 0;
        while (looper < 4) {
            this[ConstantValueOrders[looper]] = Motion.readKeyFrames(reader, flags & 0x7, frames);
            flags = flags >> 3;
            ++looper;
        }
         
        if (reader.index - offset !== length) {
            throw new Error("Incorrect data length in constant changes");
        }
        
    };
    
    Motion.ConstantChange = ConstantChange;
    
    const Action = function Action(reader) {
        
        return;
        
        // let count = reader.readUint32();
        
        // let calls = [];
        
        // let looper = 0;
        // while (looper < count) {
        //     let name = reader.readString(reader.readUint8());
        //     let count = reader.readUint32();
        //     let frame = reader.readUint32();
        //     let parameters = [];
        //     let looper2 = 0;
        //     while (looper2 < count) {
        //         parameters.push(reader.readFloat32());
        //         ++looper2;
        //     }
        //     calls.push({
        //         "name": name,
        //         "count": count,
        //         "frame": frame,
        //         "parameters": parameters
        //     });
        //     console.log(calls);
        //     ++looper;
        // }
        // this.calls = calls;
        
    };
    
    Motion.Action = Action;
    
    module.exports = Motion;
    
})(this, this.$);
