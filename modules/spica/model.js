((global, $) => {
    
    const PICA = require("./pica.js");
    
    const Section = require("./section.js");
    
    const Texture = require("./texture.js");
    const Shader = require("./shader.js");
    const Motion = require("./motion.js");
    
    const THREE = require("../three/main.js");
    
    global.THREE = THREE;
    
    const Model = function Model(reader) {
        
        let looper;
        
        this.magic = reader.readUint32();
        
        const unitCount = reader.readUint32();
        
        reader.skipPadding(0x10, 0);
        
        const section = new Section(reader, "gfmodel");
        const offset = reader.index;
        
        let shaderPacks = new Model.HashNameTable(reader);
        let textureNames = new Model.HashNameTable(reader);
        let materialNames = new Model.HashNameTable(reader);
        let meshNames = new Model.HashNameTable(reader);
        
        if (unitCount !== materialNames.length + meshNames.length + 1) {
            throw new Error("Invalid resource unit count " + unitCount);
        }
        
        this.boundingBox = {
            "min": new Model.Vector(reader, 4),
            "max": new Model.Vector(reader, 4),
        };
        this.transform = new Model.Matrix(reader, 4);
        
        // TODO: check why empty data
        const emptyDataLength = reader.readUint32();
        const emptyDataOffset = reader.readUint32();
        
        if (reader.readUint32() !== 0) { throw new Error("Invalid padding, expected 0"); }
        if (reader.readUint32() !== 0) { throw new Error("Invalid padding, expected 0"); }
        
        reader.skip(emptyDataOffset + emptyDataLength, 0);
        
        const boneCount = reader.readUint32();
        reader.skip(0xc, 0);
        
        this.bones = [];
        looper = 0;
        while (looper < boneCount) {
            this.bones.push(new Model.Bone(reader));
            ++looper;
        }
        
        reader.skipPadding(0x10, 0);
        
        const lightingLUTCount = reader.readUint32();
        const lightingLUTLength = reader.readUint32();
        
        reader.skipPadding(0x10, 0);
        
        this.lightingLUTs = [];
        looper = 0;
        while (looper < lightingLUTCount) {
            this.lightingLUTs.push(new Model.LightingLUT(reader, lightingLUTLength));
            ++looper;
        }
        if (offset + section.length !== reader.index) {
            throw new Error("Incorrect section");
        }
        
        this.materials = [];
        looper = 0;
        while (looper < materialNames.length) {
            let material = new Model.Material(reader);
            if (shaderPacks.indexOf(material.shaderPack) === -1) {
                throw new Error("Unrecord shader pack found: " + material.shaderPack);
            }
            this.materials.push(material);
            ++looper;
        }
        
        this.meshes = [];
        looper = 0;
        while (looper < meshNames.length) {
            this.meshes.push(new Model.Mesh(reader));
            ++looper;
        }
        
        // removed the first two byte of hashes for JS 32 bit compatibility
        let hash = function (text) {
            
            const prime = 16777619;
            
            let value = prime & hash.mask;
            
            let looper = 0;
            while (looper < text.length) {
                value = value * prime;
                value = value ^ text.charCodeAt(looper);
                value = value & hash.mask;
                ++looper;
            }
            
            return value;
            
        };
        hash.mask = 0xffffff;
        
        this.lightingLUTs.forEach((lightingLUT) => {
            let name = textureNames.filter((texture) => {
                return hash(texture) === (lightingLUT.hashID & hash.mask);
            })[0];
            lightingLUT.name = name;
        });
        
    };    
   
    const HashNameTable = function HashTable(reader) {
        
        let count = reader.readUint32();
        let values = [];
        let looper = 0;
        while (looper < count) {
            
            values.push({
                "hash": reader.readUint32(),
                "name": reader.readString(0x40)
            });
            
            ++looper;
        }
        
        let result = values.map(value => value.name);
        
        result.hashes = values.map(value => value.hash);
        
        return result;
        
    };
    
    const Vector = function Vector(reader, dimension) {
        
        let values = [];
        
        let looper = 0;
        while (looper < dimension) {
            values.push(reader.readFloat32());
            ++looper;
        }
        
        return values;
        
    };
    
    const Matrix = function Matrix(reader, dimension) {
        
        let values = [];
        
        let looper = 0;
        while (looper < dimension) {
            new Vector(reader, dimension).forEach((value) => {
                values.push(value);
            });
            ++looper;
        }
        
        return values;
    };
    
    const Bone = function Bone(reader) {
        
        this.name = reader.readString(reader.readUint8());
        
        this.parent = reader.readString(reader.readUint8());
        
        let flags = reader.readUint8();
        
        this.flags = flags;
        
        this.stable = (flags & Bone.STABLE) !== 0;
        this.animatable = (flags & Bone.ANIMATABLE) !== 0;
        
        this.scale = new Vector(reader, 3);
        this.rotation = new Vector(reader, 3);
        this.translation = new Vector(reader, 3);
        
    };
    
    Bone.ANIMATABLE = 1 << 0;
    Bone.STABLE = 1 << 1;
    
    const LightingLUT = function LightingLUT(reader, length) {
        
        this.hashID = reader.readUint32();
        
        reader.skip(0xc, 0); 
       
        this.pica = new PICA(reader, length);
       
    };
    
    LightingLUT.prototype.toImageURL = function (height) {
         
        var canvas = document.createElement("canvas");
        
        canvas.width = this.pica.lightingLUTs.data.length;
        canvas.height = height ? height : Math.round(canvas.width / 5);
        canvas.name = this.name ? this.name : "LUT_" + this.hashID + ".tga";
    
        var context = canvas.getContext("2d");
        
        var imageData = context.createImageData(canvas.width, canvas.height);
        
        let x = 0;
        while (x < canvas.width) {
            let y = 0;
            while (y < canvas.height) {
                imageData.data[4 * (y * canvas.width + x)] = Math.round(this.pica.lightingLUTs.data[x] * 255);
                imageData.data[4 * (y * canvas.width + x) + 1] = Math.round(this.pica.lightingLUTs.data[x] * 255);
                imageData.data[4 * (y * canvas.width + x) + 2] = Math.round(this.pica.lightingLUTs.data[x] * 255);
                imageData.data[4 * (y * canvas.width + x) + 3] = 255;
                ++y;
            }
            ++x;
        }
        
        context.putImageData(imageData, 0, 0);
        
        return canvas.toDataURL();
    };
    
    LightingLUT.prototype.toImage = function () {
        
        const dom = new Image();
        
        dom.src = this.toImageURL();
        
        return dom;
        
    };
    
    LightingLUT.DIST_0 = 0;
    LightingLUT.DIST_1 = 1;
    LightingLUT.FRESNEL = 3;
    LightingLUT.REFLECT_R = 4;
    LightingLUT.REFLECT_G = 5;
    LightingLUT.REFLECT_B = 6;
    LightingLUT.SPECULAR_0 = 8;
    LightingLUT.SPECULAR_1 = 9;
    LightingLUT.SPECULAR_2 = 10;
    LightingLUT.SPECULAR_3 = 11;
    LightingLUT.SPECULAR_4 = 12;
    LightingLUT.SPECULAR_5 = 13;
    LightingLUT.SPECULAR_6 = 14;
    LightingLUT.SPECULAR_7 = 15;
    LightingLUT.DIST_ATTRIBUTE_0 = 16;
    LightingLUT.DIST_ATTRIBUTE_1 = 17;
    LightingLUT.DIST_ATTRIBUTE_2 = 18;
    LightingLUT.DIST_ATTRIBUTE_3 = 19;
    LightingLUT.DIST_ATTRIBUTE_4 = 20;
    LightingLUT.DIST_ATTRIBUTE_5 = 21;
    LightingLUT.DIST_ATTRIBUTE_6 = 22;
    LightingLUT.DIST_ATTRIBUTE_7 = 23;
    
    const Material = function Material(reader) {
        
        let looper;
        
        const section = new Section(reader, "material");
        
        let offset = reader.index;
        
        this.name = ({
            "hash": reader.readUint32(),
            "value": reader.readString(reader.readUint8())
        }).value;
        this.shaderPack = ({
            "hash": reader.readUint32(),
            "value": reader.readString(reader.readUint8())
        }).value;
        this.vertexShader = ({
            "hash": reader.readUint32(),
            "value": reader.readString(reader.readUint8())
        }).value;
        this.fragmentShader = ({
            "hash": reader.readUint32(),
            "value": reader.readString(reader.readUint8())
        }).value;
        
        this.lightingLUTs = [reader.readUint32(), reader.readUint32(), reader.readUint32()];
        if (reader.readUint32() !== 0) {
            throw new Error("Invalid padding, expected 0");
        }
        
        this.bumpTexture = reader.readInt8();
        
        this.constantAssignments = [ 
            reader.readUint8(), reader.readUint8(), reader.readUint8(),
            reader.readUint8(), reader.readUint8(), reader.readUint8()];
        if (reader.readUint8() !== 0) {
            throw new Error("Invalid padding, expected 0");
        }
        
        this.constantColors = [
            new PICA.Color(reader), new PICA.Color(reader), new PICA.Color(reader),
            new PICA.Color(reader), new PICA.Color(reader), new PICA.Color(reader)];
        this.specularColors = [ new PICA.Color(reader), new PICA.Color(reader)];
        this.blendColor = new PICA.Color(reader);
        this.emissionColor = new PICA.Color(reader);
        this.ambientColor = new PICA.Color(reader);
        this.diffuseColor = new PICA.Color(reader);
        
        this.edgeType = reader.readInt32();
        this.idEdgeEnabled = reader.readInt32();
        this.edgeID = reader.readInt32();
        
        this.projectionType = reader.readInt32();
        
        this.rimPower = reader.readFloat32();
        this.rimScale = reader.readFloat32();
        this.phongPower = reader.readFloat32();
        this.phongScale = reader.readFloat32();
        
        this.idEdgeOffsetEnabled = reader.readInt32(); 
        this.edgeMapAlphaMask = reader.readInt32();

        this.bakeTextures = [reader.readInt32(), reader.readInt32(), reader.readInt32()];
        this.bakeConstants = [
            reader.readInt32(), reader.readInt32(), reader.readInt32(),
            reader.readInt32(), reader.readInt32(), reader.readInt32()];
        
        this.shaderType = reader.readUint32();
        // if ((this.shaderType !== 1) && (this.shaderType !== 256)) {
        //     $.warn("Unsupported shader type " + this.shaderType);
        // }

        this.shaderParameters = [
            reader.readFloat32(), reader.readFloat32(),
            reader.readFloat32(), reader.readFloat32() ];

        let unitCount = reader.readUint32();
        this.textureCoordinates = [];
        looper = 0;
        while (looper < unitCount) {
            this.textureCoordinates[looper] = new Model.TextureCoordinate(reader);
            ++looper;
        }
        
        reader.skipPadding(0x10, 255);
        
        let commandsLength = reader.readUint32();

        this.renderPriority = reader.readInt32();
        reader.readUint32(); //Seems to be a 24 bits value.
        this.renderLayer = reader.readInt32();
        reader.readUint32(); //LUT 0 (Reflection R?) hash again?
        reader.readUint32(); //LUT 1 (Reflection G?) hash again?
        reader.readUint32(); //LUT 2 (Reflection B?) hash again?
        reader.readUint32(); //Another hash?
        
        this.pica = new PICA(reader, commandsLength);
            
        while (reader.index < offset + section.length) {
            if (reader.readUint8() !== 0) {
                throw new Error("Invalid padding, expected 0");
            }
        }
        
    };
    
    const Mesh = function Mesh(reader) {
        
        let looper;
        
        const section = new Section(reader, "mesh");
        let offset = reader.index;
        
        this.name = ({
            "hash": reader.readUint32(),
            "value": reader.readString(0x40)
        }).value;
        
        if (reader.readUint32() !== 0) {
            throw new Error("Invalid padding, expected 0");
        }
        
        this.boundingBox = {
            "min": new Model.Vector(reader, 4),
            "max": new Model.Vector(reader, 4),
        };
        
        const submeshCount = reader.readUint32();
        
        this.boneIndicesPerVertex = reader.readInt32();
        
        if (reader.readInt32() !== -1) { throw new Error("Invalid padding, expected -1"); }
        if (reader.readInt32() !== -1) { throw new Error("Invalid padding, expected -1"); }
        if (reader.readInt32() !== -1) { throw new Error("Invalid padding, expected -1"); }
        if (reader.readInt32() !== -1) { throw new Error("Invalid padding, expected -1"); }
       
        this.submeshes = [];
        // commands, info and data is splited
        
        looper = 0;
        while (looper < submeshCount) {
            this.submeshes.push(new Model.Submesh(reader, looper * 3, submeshCount * 3));
            ++looper;
        }
        
        this.submeshes.forEach((submesh) => submesh.loadInfo(reader));
        
        this.submeshes.forEach((submesh) => submesh.loadData(reader));
        
        while (reader.index - offset < section.length) {
            if (reader.readUint8() !== 0) {
                throw new Error("Invalid padding, expected -1");
            }
        }
        
    };
    
    const Submesh = function Submesh(reader, offset, submeshes) {
         
        this.picas = {};
        
        ["vertex", "geometry", "index"].forEach((key, index) => {
            
            let length = reader.readUint32();
            
            if (reader.readUint32() !== offset + index) { throw new Error("Invalid data, expected " + offset); }
            if (reader.readUint32() !== submeshes) { throw new Error("Invalid data, expected " + submeshes); }
            if (reader.readUint32() !== 0) { throw new Error("Invalid padding, expected 0"); }
     
            this.picas[key] = new PICA(reader, length);
            
        });
       
    };
    
    Submesh.prototype.loadInfo = function (reader) {
        
        this.hash = reader.readUint32();
        this.material = reader.readString(reader.readUint32());
        
        let boneIndicesCount = reader.readUint8();
        
        this.boneIndices = [];
        let looper = 0;
        while (looper < 0x1f) {
            let boneIndex = reader.readUint8();
            if (looper < boneIndicesCount) {
                this.boneIndices.push(boneIndex);
            } else {
                if (boneIndex !== 0) {
                    throw new Error("Bones out of range");
                }
            }
            ++looper;
        }
        
        let verticesCount = reader.readInt32();
        let indicesCount = reader.readInt32();
        let verticesLength = reader.readInt32();
        let indicesLength = reader.readInt32();
        this.vertices = {
            "attributes": [],
            "count": verticesCount,
            "length": verticesLength,
            "data": []
        };
        this.vertexIndices = {
            "count": indicesCount,
            "length": indicesLength,
            "data": []
        };
        
        looper = 0;
        while (looper < this.picas.vertex.shader.vertex.attributes.count) {
           
            if (this.picas.vertex.attributes.formats[looper].fixed) {
                 
                let name = new PICA.AttributeName(this.picas.vertex.shader.vertex.attributes.permutations[looper]);
                
                this.vertices.attributes[looper] = {
                    "name": name,
                    "fixed": true,
                    "value": this.picas.vertex.attributes.fixeds.data[looper],
                    "format": this.picas.vertex.attributes.formats[looper]
                };
            } else {
                
                let permutation = this.picas.vertex.attributes.buffer.mapping[looper];
                
                let name = new PICA.AttributeName(this.picas.vertex.shader.vertex.attributes.permutations[permutation]);
                
                this.vertices.attributes[looper] = {
                    "name": name,
                    "fixed": false,
                    "format": this.picas.vertex.attributes.formats[permutation]
                };
                
            }
            
            ++looper;
        }

    };
    
    Submesh.prototype.loadData = function (reader) {
        
        let looper;
        let index;
        
        index = reader.index;
        looper = 0;
        while (looper < this.vertices.count) {
            
            let vertex = {};
            
            let offset = reader.index;
            
            let looper2 = 0;
            while (looper2 < this.vertices.attributes.length) {
                
                let attribute = this.vertices.attributes[looper2];
                if (!attribute.fixed) {
                    
                    let vector = {};
                    
                    let read = null;
                    switch (attribute.format.type.code) {
                        case PICA.AttributeFormat.INT_8: { read = "readInt8"; break; }
                        case PICA.AttributeFormat.UINT_8: { read = "readUint8"; break; }
                        case PICA.AttributeFormat.INT_16: { read = "readInt16"; break; }
                        case PICA.AttributeFormat.FLOAT_32: { read = "readFloat32"; break; }
                        default: { throw new Error("Invalid vertex format"); }
                    }
                    vector.x = reader[read]();
                    if (attribute.format.size > 1) {
                        vector.y = reader[read]();
                    }
                    if (attribute.format.size > 2) {
                        vector.z = reader[read]();
                    }
                    if (attribute.format.size > 3) {
                        vector.w = reader[read]();
                    }
                
                    switch (attribute.name.code) {
                        case PICA.AttributeName.POSITION: {
                            vertex.position = [vector.x, vector.y, vector.z]; break;
                        }
                        case PICA.AttributeName.NORMAL: {
                            vertex.normal = [vector.x, vector.y, vector.z]; break;
                        }
                        case PICA.AttributeName.TANGENT: {
                            vertex.tangent = [vector.x, vector.y, vector.z]; break;
                        }
                        case PICA.AttributeName.COLOR: {
                            let r = vector.x, g = vector.y, b = vector.z, a = vector.w;
                            vertex.color = [a, r, g, b];
                            break;
                        }
                        case PICA.AttributeName.TEXTURE_COORDINATE_0: {
                            if (!vertex.textures) { vertex.textures = []; }
                            vertex.textures[0] = [vector.x, vector.y]; break;
                        }
                        case PICA.AttributeName.TEXTURE_COORDINATE_1: {
                            if (!vertex.textures) { vertex.textures = []; }
                            vertex.textures[1] = [vector.x, vector.y]; break;
                        }
                        case PICA.AttributeName.TEXTURE_COORDINATE_2: {
                            if (!vertex.textures) { vertex.textures = []; }
                            vertex.textures[2] = [vector.x, vector.y]; break;
                        }
                        case PICA.AttributeName.BONE_INDEX: {
                            if (!vertex.boneIndices) { vertex.boneIndices = []; }
                            let add = (value) => {
                                if (value !== 0xff) {
                                    vertex.boneIndices.push(value);
                                }
                            };
                            add(vector.x);
                            if (attribute.format.size > 1) { add(vector.y); }
                            if (attribute.format.size > 2) { add(vector.z); }
                            if (attribute.format.size > 3) { add(vector.w); }
                            break;
                        }
                        case PICA.AttributeName.BONE_WEIGHT: {
                            if (!vertex.boneWeights) { vertex.boneWeights = []; }
                            vertex.boneWeights[0] = vector.x;
                            if (attribute.format.size > 1) { vertex.boneWeights[1] = vector.y; }
                            if (attribute.format.size > 2) { vertex.boneWeights[2] = vector.z; }
                            if (attribute.format.size > 3) { vertex.boneWeights[3] = vector.w; }
                            break;
                        }
                        default: {
                            throw new Error("Invalid attribute format " + attribute.name.code);
                        }
                    }
                    
                }
                
                ++looper2;
            }
            
            while (reader.index < offset + this.picas.vertex.attributes.buffer.unitSize) {
                if (reader.readUint8() !== 0) {
                    throw new Error("Invalid padding, expected 0");
                }
            }
                
            this.vertices.data[looper] = vertex;
            
            ++looper;
        }
        while (reader.index < index + this.vertices.length) {
            if (reader.readUint8() !== 0) {
                throw new Error("Invalid padding, expected 0");
            }
        }
       
        index = reader.index;
        looper = 0;
        while (looper < this.vertexIndices.count) {
            if (this.picas.index.attributes.indices.is16Bit) {
                this.vertexIndices.data[looper] = reader.readUint16();
            } else {
                this.vertexIndices.data[looper] = reader.readUint8();
            }
            ++looper;
        }
        while (reader.index < index + this.vertexIndices.length) {
            if (reader.readUint8() !== 0) {
                throw new Error("Invalid padding, expected 0");
            }
        }
        
    };
    
    const TextureCoordinate = function TextureCoordinate(reader) {
        
        this.hashID = reader.readUint32();
        
        this.name = reader.readString(reader.readUint8());

        this.index = reader.readUint8();

        this.mappingType = new Model.TextureMappingType(reader.readUint8());

        this.scale = new Vector(reader, 2);
        this.rotation = reader.readFloat32();
        this.translation = new Vector(reader, 2);

        this.wrap = [new PICA.TextureWrap(reader.readUint32()), new PICA.TextureWrap(reader.readUint32())];

        this.magFilter = new Model.TextureMagnificationFilter(reader.readUint32());
        this.minFilter = new Model.TextureMinificationFilter(reader.readUint32());

        this.minLOD = reader.readUint32();
        
    };
    
    const TextureMappingType = function TextureMappingType(code) {
        this.code = code;
        this.label = Object.keys(arguments.callee).filter((key) => arguments.callee[key] === code)[0];
    };
    
    TextureMappingType.UV = 0;
    TextureMappingType.CAMERA_CUBE = 1;
    TextureMappingType.CAMERA_SPHERE = 2;
    TextureMappingType.PROJECTION = 3;
    TextureMappingType.SHADOW = 4;
    TextureMappingType.SHADOW_BOX = 5;
    
    const TextureMagnificationFilter = function TextureMagnificationFilter(code) {
        this.code = code;
        this.label = Object.keys(arguments.callee).filter((key) => arguments.callee[key] === code)[0];
    };
    
    TextureMagnificationFilter.NEAREST = 0;
    TextureMagnificationFilter.LINEAR = 1;
    
    const TextureMinificationFilter = function TextureMinificationFilter(code) {
        this.code = code;
        this.label = Object.keys(arguments.callee).filter((key) => arguments.callee[key] === code)[0];
    };
    
    TextureMinificationFilter.LINEAR = 0;
    TextureMinificationFilter.LINEAR_MIPMAP_LINEAR = 1;
    TextureMinificationFilter.NEAREST = 2;
    TextureMinificationFilter.LINEAR_MIPMAP_NEAREST = 3;
    TextureMinificationFilter.NEAREST_MIPMAP_NEAREST = 4;
    TextureMinificationFilter.NEAREST_MIPMAP_LINEAR = 5;
    
    Model.HashNameTable = HashNameTable;
    
    Model.Bone = Bone;
    Model.LightingLUT = LightingLUT;
    Model.Material = Material;
    Model.Mesh = Mesh;
    Model.Submesh = Submesh;
    
    Model.Matrix = Matrix;
    Model.Vector = Vector;
    
    Model.TextureCoordinate = TextureCoordinate;
    Model.TextureMappingType = TextureMappingType;
    Model.TextureMagnificationFilter = TextureMagnificationFilter;
    Model.TextureMinificationFilter = TextureMinificationFilter;
    
    module.exports = Model;
    
})(this, this.$);
