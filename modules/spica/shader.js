((global, $) => {
    
    const Section = require("./section.js");
    
    const PICA = require("./pica.js");
    
    const Shader = function Shader(reader) {
        
        this.magic = reader.readUint32();
        
        if (reader.readUint32() !== 1) {
            throw new Error("Invalid shader version, expected 1");
        }
        
        reader.skipPadding(0x10, 0);
        
        this.section = new Section(reader, "shader");
        
        let index = reader.index;
        
        this.name = reader.readString(0x40);
        
        /* let hash = */reader.readUint32();
        /* let count = */reader.readUint32();
        
        reader.skipPadding(0x10, 0);
      
        this.commands = {
            "length": reader.readUint32(),
            "count": reader.readUint32(),
            "hash": reader.readUint32(),
            "padding": reader.readUint32(),
            "data": []
        };

        this.fileName = reader.readString(0x40);
        
        let commands = [];
        let offset = reader.index;
        while (reader.index < offset + this.commands.length) {
            commands.push(reader.readUint32());
        }
        
        this.pica = new PICA(commands);
        
        while (reader.index < index + this.section.length) {
            if (reader.readUint8() !== 0) {
                throw new Error("Invalid padding, expected 0");
            }
        }
        
    };
    
    Shader.prototype.analyze = function () {
        
        let shader = this.pica.shader ? this.pica.shader.vertex : null;
        if ((!shader) || $.is.nil(shader.entryPoint)) {
            shader = this.pica.shader ? this.pica.shader.geometry : null;
        } else if ((!shader) || $.is.nil(shader.entryPoint)) {
            shader = null;
        }
        
        if (shader) {
                
            const instructions = shader.codes.data.map((command, index) => {
                return this.decode(command, index, shader);
            });
            
            const labels = {};
            
            if (!shader.entryPoint) {
                throw new Error("Entry point not found for shader codes");
            }
            
            const hex = (value) => {
                let result = value.toString(16);
                while (result.length < 3) { result = "0" + result; }
                return result;
            };
            
            let end = null;
            instructions.forEach((instruction) => {
                switch (instruction.name) {
                    case "call": case "callu": case "callc": {
                        let start = instruction.parameters.slice(-2)[0];
                        let end = instruction.parameters.slice(-2)[0] + instruction.parameters.slice(-1)[0] - 1;
                        if (!labels[start]) {
                            let predefined = {
                                "func_0x000": "generateQuaternionNormal",
                                "func_0x013": "blendVertexPN",
                                "func_0x01d": "blendVertexPNT",
                                "func_0x033": "generateView",
                                "func_0x041": "transformMatrixPNT",
                                "func_0x074": "transformMatrixPN",
                                "func_0x09c": "generateTextureCoordinate",
                                "func_0x0b7": "generateTextureCoordinate2",
                                "func_0x0cf": "generateTextureCoordinate3",
                                "func_0x0df": "getTextureCoordinateSource",
                                "func_0x0e7": "calculateTextureCoordinateReflection",
                                "func_0x0ee": "calculateTextureCoordinateSphereReflection",
                                "func_0x0f4": "generateColor"
                            };
                            labels[start] = {
                                "name": "func_0x" + hex(start),
                                "type": "call",
                                "end": end
                            };
                            if (predefined[labels[start].name]) {
                                labels[start].name = predefined[labels[start].name];
                            }
                        } else {
                            if ((labels[start].type !== "call") || (labels[start].end !== end)) {
                                throw new Error("Invalid call code range");
                            }
                        }   
                        break;
                    }
                    case "jmpu": case "jmpc": {
                        let start = instruction.line + 1;
                        let end = instruction.parameters[instruction.parameters.length - 2] - 1;
                        if (!labels[start]) {
                            labels[start] = {
                                "name": " jmp_0x" + hex(instruction.line),
                                "type": "jmp",
                                "end": end
                            };
                        } else {
                            if ((labels[start].type !== "jmp") || (labels[start].end !== end)) {
                                throw new Error("Invalid jmp code range");
                            }
                        }
                        break;
                    }
                    case "ifu": case "ifc": {
                        if (instruction.parameters[instruction.parameters.length - 2] - 1 - instruction.line > 0) {
                            let start = instruction.line + 1;
                            let end = instruction.parameters[instruction.parameters.length - 2] - 1;
                            if (!labels[start]) {
                                labels[start] = {
                                    "name": " ift_0x" + hex(instruction.line),
                                    "type": "ift",
                                    "end": end
                                };
                            } else {
                                if ((labels[start].type !== "ift") || (labels[start].end !== end)) {
                                    throw new Error("Invalid ift code ranges");
                                }
                            }
                        }
                        if (instruction.parameters[instruction.parameters.length - 1] > 0) {
                            let start = instruction.parameters[instruction.parameters.length - 2];
                            let end = instruction.parameters[instruction.parameters.length - 2] + instruction.parameters[instruction.parameters.length - 1] - 1;
                            if (!labels[start]) {
                                labels[start] = {
                                    "name": " iff_0x" + hex(instruction.line),
                                    "type": "iff",
                                    "end": end
                                };
                            } else {
                                if ((labels[start].type !== "iff") || (labels[start].end !== end)) {
                                    throw new Error("Invalid iff code ranges");
                                }
                            }
                        }
                        break;
                    }
                    case "loop": {
                        // TODO: finsih loop analysis
                        break;
                    }
                    case "end": {
                        end = instruction.line;
                        break;
                    }
                }
            });
            
            if ($.is.nil(end)) {
                throw new Error("End not found for shader codes");
            }
            
            labels[shader.entryPoint] = {
                "name": "main",
                "type": "prog",
                "end": end
            };
            
            let rootBlock = {
                "type": "code",
                "begin": 0,
                "end": instructions.length,
                "instructions": []
            };
            let currentBlock = rootBlock;
            let lastCallBlock = null;
            instructions.forEach((instruction, index) => {
                if (labels[index]) {
                    let newBlock = {
                        "label": labels[index].name,
                        "superblock": currentBlock,
                        "begin": index,
                        "end": labels[index].end,
                        "instructions": [],
                        "type": labels[index].type
                    };
                    if (labels[index].type === "call") {
                        lastCallBlock = newBlock; 
                        newBlock.srcs = {};
                        newBlock.dsts = {};
                        newBlock.movas = {};
                    }
                    currentBlock.instructions.push(newBlock);
                    currentBlock = newBlock;
                }
                if (instruction.name !== "mova") {
                    if (instruction.registers) {
                        Object.keys(instruction.registers).forEach((key) => {
                            let register = instruction.registers[key];
                            if (key === "dst") {
                                if (!lastCallBlock.dsts[register.name]) {
                                    lastCallBlock.dsts[register.name] = instruction.line;
                                }
                            } else {
                                if (!lastCallBlock.srcs[register.name]) {
                                    lastCallBlock.srcs[register.name] = instruction.line;
                                }
                            }
                        });
                    }
                } else {
                    lastCallBlock.movas[instruction.line] = instruction;
                    if (lastCallBlock.dsts[instruction.registers.src1.name]) {
                        throw new Error("Invalid mova instruction in calls, its parameters should be constant");
                    }
                    if (!lastCallBlock.srcs[instruction.registers.src1.name]) {
                        lastCallBlock.srcs[instruction.registers.src1.name] = instruction.line;
                    }
                }
                if ((currentBlock.type === "code") && (instruction.name !== "nop")) {
                    $.error("All non-nop codes should be inside of functions");
                    // throw new Error("All non-nop codes should be inside of functions");
                } else {
                    currentBlock.instructions.push(instruction);
                }
                if (currentBlock.end === index) {
                    currentBlock = currentBlock.superblock;
                }
            });
            
            return {
                "type": shader == this.pica.shader.vertex ? "vertex" : "geometry",
                "instructions": instructions,
                "labels": labels,
                "codes": rootBlock.instructions,
            };
            
        } else {
            return {
                "type": "fragment"
            };
        }
        
    };
    
    Shader.prototype.describe = function (glsl, material, lightingLUTs, outline) {
        
        this.offsetMap = {};
        
        let shader = this;
        let report = this.analyze();
        
        if (report.type === "geometry") {
            throw new Error("Geometry shader currently not supported");
        } else if (report.type === "vertex") {
            if (glsl) {
                
                let registers = {};
                let callRegisters = {};
                
                let describe = (instruction, indent, nexts) => {
                    if (instruction.hasOwnProperty("line")) {
                         
                        if (instruction.registers) {
                            Object.keys(instruction.registers).forEach((reg) => {
                                registers[instruction.registers[reg].name] = true;
                                callRegisters[instruction.registers[reg].name] = true;
                            });
                        }
                        
                        let line = ("00" + instruction.line.toString(16)).slice(-3);
                       
                        let code = "// 0x" + line + ": " + this.describeInstruction(instruction);
                        let template = instruction.glsl;
                        if ($.is.nil(template)) {
                            template = "/* Unknown GLSL codes */"
                        }
                        
                        let result = indent + $.format(template, $.merge.simple({
                            "indent": indent,
                            "code": code,
                            "name": instruction.name,
                            "line": instruction.line,
                            "parameters": instruction.parameters,
                            "report": report
                        }, instruction.registers), {
                            "functors": $.merge.simple(Shader.functors, {
                                "glmova": function (/*template, call, parameters, options*/) {
                                    
                                    let dst = instruction.registers.dst["@1"];
                                    let src = instruction.registers.src1["@1"];
                                    
                                    let variables = ["gpu_" + [src.name, src.components].join("_")];
                                    
                                    shader.offsetMap[dst.glsl] = variables[0];
                                    
                                    if (instruction.registers.dst.size > 1) {
                                        dst = instruction.registers.dst["@2"];
                                        src = instruction.registers.src1["@2"];
                                        variables.push("gpu_" + [src.name, src.components].join("_"));
                                        shader.offsetMap[dst.glsl] = variables[1];
                                    }
                                    
                                    return variables.map((variable) => {
                                        return "/* used " + variable + ", array offset constant */";
                                    }).join("\n");
                                    
                                },
                                "glend": function (/*template, call, parameters, options*/) {
                                    // Assume that one register only output one kind of vertex data
                                    let output = -1;
                                    shader.pica.shader.outputMap.forEach((map, index) => {
                                        if (map.x.register.code === PICA.ShaderOutputRegister.POSITION) {
                                            output = index;
                                        }
                                    });
                                    if (output !== -1) {
                                        return "fragNormal = normal; fragDistance = 1.0 / sqrt(distance(eyePosition, " + new Shader.Register("", "o" + output, "", "", shader).glsl + ".xyz) + 1.0); gl_Position = " + new Shader.Register("", "o" + output, "", "", shader).glsl;
                                    } else {
                                        throw new Error("No gl_Position output found");
                                    }
                                },
                                "glsl": function (template, call, parameters, options, list) {
                                    return list.map((item) => {
                                        if ($.is(item, Shader.Register)) {
                                            return item.glsl;
                                        } else if ($.is(item, Number)) {
                                            return "0x" + item.toString(16);
                                        } else {
                                            return item;
                                        }
                                    });
                                },
                                "glcall": function (template, call, parameters, options, target, length) {
                                    if (length === 0) {
                                        throw new Error("Functions without body is not allowed");
                                    } else if (parameters.report.labels.hasOwnProperty(target) &&
                                               (parameters.report.labels[target].end + 1 === target + length)) {
                                        let callName = parameters.report.labels[target].name.trim();
                                        let callDefinition = report.codes.filter((instruction) => instruction.label === callName)[0];
                                        let callArguments = [];
                                        Object.keys(callDefinition.movas).forEach((key) => {
                                            callArguments.push("int(" + callDefinition.movas[key].registers.src1["@1"].glsl + ")");
                                            if (callDefinition.movas[key].registers.dst.size > 1) {
                                                callArguments.push("int(" + callDefinition.movas[key].registers.src1["@2"].glsl + ")");
                                            }
                                        });
                                        return callName + "(" + callArguments.join(", ") + ")";
                                    } else {
                                        throw new Error("Call target not found");
                                    }
                                },
                                "glblock": function (template, call, parameters, options, offset) {
                                    return describe(nexts[offset], indent + "    ", nexts.slice(offset + 1));
                                }
                            })
                        });
                        
                        let margin = 80;
                        return result.split("\n").map((line, index) => {
                            if (index === 0) {
                                while (line.length < margin) {
                                    line += " ";
                                }
                                line += code;
                            }
                            return line;
                        }).join("\n");
                        
                    } else {
                           
                        switch (instruction.type) {
                            case "call": 
                            case "prog": {
                          
                                callRegisters = {};
                                
                                let block = instruction.instructions.filter((instruction) => {
                                    return instruction.hasOwnProperty("line");
                                }).map((newInstruction) => {
                                    return describe(newInstruction, indent + "    ", 
                                                    instruction.instructions.slice(instruction.instructions.indexOf(newInstruction) + 1));
                                }).join("\n");
                                     
                                let registers = Object.keys(callRegisters).sort($.comparator.natural).filter((register) => {
                                    if ((register[0] === "r") || (register[0] === "a") || (register === "cmp")) {
                                        return false;
                                    }
                                    return true;
                                }).map((register) => {
                                    let description = indent + "    /* used " + new Shader.Register("", register, "", "", this).glsl;
                                    if (register[0] === "b") {
                                        return "";
                                    } else if (register[0] === "o") {
                                        return "";
                                    } else if (register[0] === "v") {
                                        return "";
                                    } else if ((register[0] === "c") && (register !== "cmp")) {
                                        if (this.pica.shader.vertex.floats[register.slice(1)]) {
                                            return "";
                                        }
                                        let index = parseInt(register.slice(1));
                                        let id = Object.keys(Shader.floats).filter((key) => {
                                            return (Shader.floats[key].from <= index) && (Shader.floats[key].to >= index);
                                        })[0];
                                        if (!$.is.nil(id)) {
                                            description += ", " + Shader.floats[id].name.toLowerCase().replace(/_/g, " ");
                                            if (Shader.floats[id].from !== Shader.floats[id].to) {
                                                description += "[" + (index - Shader.floats[id].from) + "]";
                                            }
                                        }
                                    } else if (register === "a0") {
                                        return "";
                                    } else if (register === "al") {
                                        return "";
                                    } else if (register === "cmp") {
                                        return "";
                                    }
                                    return description + " */\n";
                                }).join("");
                               
                                let argumentDefinitions = [];
                                if (instruction.type === "call") {
                                    Object.keys(instruction.movas).forEach((key) => {
                                        let register = instruction.movas[key].registers.src1["@1"];
                                        argumentDefinitions.push("const int gpu_" + [register.name, register.components].join("_"));
                                        if (instruction.movas[key].registers.dst.size > 1) {
                                            register = instruction.movas[key].registers.src1["@2"];
                                            argumentDefinitions.push("const int gpu_" + [register.name, register.components].join("_"));
                                        }
                                    });
                                }
                                
                                return (
                                    indent + "void " + instruction.label + "(" + argumentDefinitions.join(", ") + ") {\n" +
                                        registers +
                                        indent + block + "\n" +
                                    indent + "}\n"
                                );
                            }
                            default: {
                                return instruction.instructions.filter((instruction) => {
                                    return instruction.hasOwnProperty("line");
                                }).map((newInstruction) => {
                                    return describe(newInstruction, indent, instruction.instructions.slice(instruction.instructions.indexOf(newInstruction) + 1));
                                }).join("\n");
                            }
                        }
                    }
                };
                
                let codes = report.codes.map((instruction, index) => {
                    return describe(instruction, "", report.codes.slice(index + 1));
                }).join("\n");
                
                return [
                    "// File: " + this.fileName,
                    "// Type: " + report.type[0].toUpperCase() + report.type.slice(1) + " Shader",
                    "// Shader Name: " + this.name,
                    "// Generated Date: " + $.format.date(new Date()),
                    "// Comment: This file is just auto-generated from the raw decoded Nintendo3DS shader instructions to simulate vertex shading via WebGL",
                    "",
                    Object.keys(registers).filter((key) => key[0] === "o").sort($.comparator.natural).map((register) => {
                        let code = `varying vec4 ${new Shader.Register("", register, "", "", this).glsl};`;
                        code = (code + "                                                                                ").slice(0, 80);
                        return code + `// gpu_${register}`;
                    }).join("\n"),
                    "varying vec4 fragNormal;",
                    "varying float fragDistance;",
                    "",
                    Object.keys(registers).filter((key) => key[0] === "v").sort($.comparator.natural).map((register) => {
                        let code = `attribute vec4 ${new Shader.Register("", register, "", "", this).glsl};`;
                        code = (code + "                                                                                ").slice(0, 80);
                        return code + `// gpu_${register}`;
                    }).join("\n"),
                    "",
                    Object.keys(registers).filter((key) => key[0] === "b").sort($.comparator.natural).map((register) => {
                        let code = `uniform bool ${new Shader.Register("", register, "", "", this).glsl};`;
                        code = (code + "                                                                                ").slice(0, 80);
                        return code + `// gpu_${register}`;
                    }).join("\n"),
                    "",
                    "uniform vec3 eyePosition;",
                    ("uniform vec4 " + new Shader.Register("", "c96", "", "", this).glsl + 
                     ";                                                                                ").slice(0, 80) + "// gpu_c[96]",
                    Object.keys(registers).filter((key) => {
                        if ((key === "cmp") || (key[0] !== "c")) {
                            return false;
                        }
                        if (this.pica.shader.vertex.floats[key.slice(1)]) {
                            return false;
                        }
                        return true;
                    }).sort($.comparator.natural).map((register) => {
                        let index = parseInt(register.slice(1));
                        let id = Object.keys(Shader.floats).filter((key) => {
                            return (Shader.floats[key].from <= index) && (Shader.floats[key].to >= index);
                        })[0];
                        let code = "/* " + new Shader.Register("", register, "", "", this).glsl + " used, ";
                        if (!$.is.nil(id)) {
                            code += Shader.floats[id].name.toLowerCase().replace(/_/g, " ");
                            if (Shader.floats[id].from !== Shader.floats[id].to) {
                                code += "[" + (index - Shader.floats[id].from) + "]";
                            }
                        } else {
                            code += "lack of detail usage information";
                            $.warn("Unknown vector usage " + register);
                        }
                        code += " */";
                        return code;
                    }).join("\n"),
                    "",
                    "vec4 gpu_r[16];",
                    "bvec2 gpu_cmp;",
                    "",
                    "float spicaLog2(float value);",
                    "float spicaExp2(float value);",
                    report.codes.filter((instruction) => $.is.nil(instruction.line)).map((instruction) => {
                        let argumentDefinitions = [];
                        if (instruction.type === "call") {
                            Object.keys(instruction.movas).forEach((key) => {
                                let register = instruction.movas[key].registers.src1["@1"];
                                argumentDefinitions.push("const int gpu_" + [register.name, register.components].join("_"));
                                if (instruction.movas[key].registers.dst.size > 1) {
                                    register = instruction.movas[key].registers.src1["@2"];
                                    argumentDefinitions.push("const int gpu_" + [register.name, register.components].join("_"));
                                }
                            });
                        }
                        return "void " + instruction.label + "(" + argumentDefinitions.join(", ") + ");";
                    }).join("\n"),
                    "",
                    "float spicaLog2(float value) {",
                    "    if (value == 0.0) {",
                    "        return -4294967296.0;",
                    "    } else {",
                    "        return log2(value);",
                    "    }",
                    "}",
                    "",
                    "float spicaExp2(float value) {",
                    "    if (value <= -4294967296.0) {",
                    "        return 0.0;",
                    "    } else {",
                    "        return exp2(value);",
                    "    }",
                    "}",
                    "",
                    codes,
                    ""
                ].join("\n");
                
            } else {
                
                let ends = [];
                
                let codes = report.instructions.map((instruction) => {
                    
                    const lineNumberWidth = 3;
                    const labelWidth = 16;
                    const descriptionMargin = 50;
                     
                    let line = instruction.line.toString(16);
                    while (line.length < lineNumberWidth) {
                        line = "0" + line;
                    }
                    
                    let description = this.describeInstruction(instruction);
                    
                    if (instruction.comment) {
                        while (description.length < descriptionMargin) {
                            description = description + " ";
                        }
                        description += "// " + $.format(instruction.comment, $.merge.simple({
                            "name": instruction.name,
                            "line": instruction.line,
                            "parameters": instruction.parameters,
                            "report": report
                        }, instruction.registers), {
                            "functors": Shader.functors
                        });
                    }
                   
                    let label = "";
                    if (report.labels[instruction.line]) {
                        label = report.labels[instruction.line].name + ":";
                        ends.push(report.labels[instruction.line]);
                    }
                    while (label.length < labelWidth) {
                        label += " ";
                    }
                    
                    let end = [];
                    while ((ends.length > 0) && 
                           (ends[ends.length - 1].end === instruction.line)) {
                        end.push("\n          <" + ends.pop().name.trim());
                    }
                    
                    return  "0x" + line + "  " + label + description + end.join("");
                    
                }).join("\n");
                
                return [
                    "File: " + this.fileName,
                    "Type: " + report.type[0].toUpperCase() + report.type.slice(1) + " Shader",
                    "Shader Name: " + this.name,
                    "Generated Date: " + $.format.date(new Date()),
                    "Comment: This file is just auto-generated from the raw decoded Nintendo 3DS vertex shader instructions for human readable",
                    "",
                    codes,
                    ""
                ].join("\n");
            }
        } else {
            
            let hasTextureColors = [false, false, false];
            let hasFragmentColors = false;

            let codes = [
                "// File: " + this.fileName,
                "// Type: " + report.type[0].toUpperCase() + report.type.slice(1) + " Shader",
                "// Shader Name: " + this.name,
                "// Generated Date: " + $.format.date(new Date()),
                "// Comment: This file is just auto-generated from the raw decoded Nintendo3DS GPU instructions to simulate fragment shading via WebGL",
                "",
                "precision mediump float;",
                "",
                "uniform vec3 emission;",
                "uniform vec3 ambient;",
                "uniform vec3 diffuse;",
                "uniform vec3 speculars[2];",
                "",
                "uniform vec4 constants[6];",
                "",
                "uniform sampler2D map;",
                "uniform sampler2D map2;",
                "uniform sampler2D map3;",
                "",
                "uniform vec4 uvVectors[10];",
                "",
                "uniform samplerCube textureCube;",
                "",
                "uniform sampler2D lutDist0;",
                "uniform sampler2D lutDist1;",
                "uniform sampler2D lutFresnel;",
                "uniform sampler2D lutReflectR;",
                "uniform sampler2D lutReflectG;",
                "uniform sampler2D lutReflectB;",
                "",
                "uniform vec4 environmentAmbient;",
                "",
                "uniform int lightsCount;",
                "uniform vec3 lightPositions[3];",
                "uniform vec3 lightDirections[3];",
                "uniform vec4 lightAmbients[3];",
                "uniform vec4 lightDiffuses[3];",
                "uniform vec4 lightSpeculars[6];",
                "uniform bool lightDirectionals[3];",
                "",
                "varying vec4 fragQuaternionNormal;",
                "varying vec4 fragColor;",
                "varying vec4 fragUV;",
                "varying vec4 fragUV2;",
                "varying vec4 fragUV3;",
                "varying vec4 fragView;",
                "varying vec4 fragNormal;",
                "",
                "varying float fragDistance;",
                "",
                "vec3 rotateQuaternion(vec4 q, vec3 v) {",
                "    return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);",
                "}",
                "",
                "void main() {",
                "",
                "    vec4 textures[3];",
                "    vec4 color;",
                "    vec4 previous;",
                `    vec4 buffer = vec4(${["r", "g", "b", "a"].map((x) => {
                    return Shader.float(this.pica.rendering.bufferColor[x] / 0xff);
                }).join(", ")});`,
                ""
            ];
            
            this.pica.rendering.stages.forEach((stage, index) => {
               
                let hasColor = !stage.isColorPassThrough;
                let hasAlpha = !stage.isAlphaPassThrough;
                
                let colorArguments = [];
                let alphaArguments = [];
                
                if (hasColor || hasAlpha) {
                    codes.push("    /* stage " + (index + 1) + " */");
                }
                
                // decode arguments
                let looper = 0;
                while (looper < 3) {
                    
                    // initial light colors
                    if ((!hasFragmentColors) &&
                        ((stage.source.color[looper].code === PICA.TextureCombinerSource.FRAGMENT_PRIMARY_COLOR) ||
                         (stage.source.alpha[looper].code === PICA.TextureCombinerSource.FRAGMENT_PRIMARY_COLOR) ||
                         (stage.source.color[looper].code === PICA.TextureCombinerSource.FRAGMENT_SECONDARY_COLOR) ||
                         (stage.source.alpha[looper].code === PICA.TextureCombinerSource.FRAGMENT_SECONDARY_COLOR))) {
                        codes.push(this.decodeFragmentColors(material, lightingLUTs, hasTextureColors).split("\n").map((line) => {
                            return "    " + line;
                        }).join("\n"));
                        hasFragmentColors = true;
                    }
                    
                    // initial texture colors
                    let looper2 = 0;
                    while (looper2 < 3) {
                        if ((!hasTextureColors[looper2]) &&
                            ((stage.source.color[looper].code === PICA.TextureCombinerSource.TEXTURE_0 + looper2) ||
                             (stage.source.alpha[looper].code === PICA.TextureCombinerSource.TEXTURE_0 + looper2))) {
                            codes.push("    " + this.decodeTextureColor(material, looper2, hasTextureColors));
                        }
                        ++looper2;
                    }
                   
                    let colorArgument = this.decodeCombinerSource(stage.source.color[looper], index);//material.constantAssignments[index]);
                    let alphaArgument = this.decodeCombinerSource(stage.source.alpha[looper], index);//material.constantAssignments[index]);
                     
                    switch (stage.operand.color[looper].code & (~1)) {
                        case PICA.TextureCombinerColor.COLOR: { colorArgument.components = "rgba"; break; }
                        case PICA.TextureCombinerColor.ALPHA: { colorArgument.components = "aaaa"; break; }
                        case PICA.TextureCombinerColor.RED: { colorArgument.components = "rrrr"; break; }
                        case PICA.TextureCombinerColor.GREEN: { colorArgument.components = "gggg"; break; }
                        case PICA.TextureCombinerColor.BLUE: { colorArgument.components = "bbbb"; break; }
                        default: { throw new Error("Invalid combiner color"); }
                    }
                    
                    switch (stage.operand.alpha[looper].code & (~1)) {
                        case PICA.TextureCombinerAlpha.ALPHA: { alphaArgument.components = "a"; break; }
                        case PICA.TextureCombinerAlpha.RED: { alphaArgument.components = "r"; break; }
                        case PICA.TextureCombinerAlpha.GREEN: { alphaArgument.components = "g"; break; }
                        case PICA.TextureCombinerAlpha.BLUE: { alphaArgument.components = "b"; break; }
                        default: { throw new Error("Invalid combiner alpha"); }
                    }
                 
                    if ((stage.operand.color[looper].code & 0x1) !== 0) {
                        colorArgument.sign = "1.0 - ";
                    }
                    
                    if ((stage.operand.alpha[looper].code & 0x1) !== 0) {
                        alphaArgument.sign = "1.0 - ";
                    }
                    
                    colorArguments.push(colorArgument);
                    alphaArguments.push(alphaArgument);
                    
                    ++looper;
                }
               
                if (hasColor) {
                    switch (stage.mode.color.code) {
                        case PICA.TextureCombinerMode.REPLACE: { 
                            codes.push(`    color.rgb = ${colorArguments[0][3]};`); break; }
                        case PICA.TextureCombinerMode.MODULATE: { 
                            codes.push(`    color.rgb = ${colorArguments[0][3]} * ${colorArguments[1][3]};`); break; }
                        case PICA.TextureCombinerMode.ADD: { 
                            codes.push(`    color.rgb = min(${colorArguments[0][3]} + ${colorArguments[1][3]}, 1.0);`); break; }
                        case PICA.TextureCombinerMode.ADD_SIGNED: { 
                            codes.push(`    color.rgb = clamp(${colorArguments[0][3]} + ${colorArguments[1][3]} - 0.5, 0.0, 1.0);`); break; }
                        case PICA.TextureCombinerMode.INTERPOLATE: { 
                            codes.push(`    color.rgb = mix(${colorArguments[1][3]}, ${colorArguments[0][3]}, ${colorArguments[2][3]});`); break; }
                        case PICA.TextureCombinerMode.SUBTRACT: {
                            codes.push(`    color.rgb = max(${colorArguments[0][3]} - ${colorArguments[1][3]}, 0.0);`); break; }
                        case PICA.TextureCombinerMode.DOT_PRODUCT_3_RGB: {
                            codes.push(`    color.rgb = vec3(min(dot(${colorArguments[0][3]} - 0.5, ${colorArguments[1][3]} - 0.5) * 4.0, 1.0));`); break; }
                        case PICA.TextureCombinerMode.DOT_PRODUCT_3_RGBA: {
                            codes.push(`    color.rgb = vec3(min(dot(${colorArguments[0]} - 0.5, ${colorArguments[1]} - 0.5) * 4.0, 1));`); break; }
                        case PICA.TextureCombinerMode.MUL_ADD: {
                            codes.push(`    color.rgb = min(${colorArguments[0][3]} * ${colorArguments[1][3]} + ${colorArguments[2][3]}, 1.0);`); break; }
                        case PICA.TextureCombinerMode.ADD_MUL: {
                            codes.push(`    color.rgb = min(${colorArguments[0][3]} + ${colorArguments[1][3]}, 1.0) * ${colorArguments[2][3]};`); break; }
                        default: { 
                            throw new Error("Invalid color combiner code"); }
                    }
                }
                
                if (hasAlpha) {
                    switch (stage.mode.alpha.code) {
                        case PICA.TextureCombinerMode.REPLACE: { 
                            codes.push(`    color.a = ${alphaArguments[0]};`); break; }
                        case PICA.TextureCombinerMode.MODULATE: { 
                            codes.push(`    color.a = ${alphaArguments[0]} * ${alphaArguments[1]};`); break; }
                        case PICA.TextureCombinerMode.ADD: { 
                            codes.push(`    color.a = min(${alphaArguments[0]} + ${alphaArguments[1]}, 1.0);`); break; }
                        case PICA.TextureCombinerMode.ADD_SIGNED: { 
                            codes.push(`    color.a = clamp(${alphaArguments[0]} + ${alphaArguments[1]} - 0.5, 0.0, 1.0);`); break; }
                        case PICA.TextureCombinerMode.INTERPOLATE: { 
                            codes.push(`    color.a = mix(${alphaArguments[1]}, ${alphaArguments[0]}, ${alphaArguments[2]});`); break; }
                        case PICA.TextureCombinerMode.SUBTRACT: {
                            codes.push(`    color.a = max(${alphaArguments[0]} - ${alphaArguments[1]}, 0.0);`); break; }
                        case PICA.TextureCombinerMode.DOT_PRODUCT_3_RGB: {
                            codes.push(`    color.a = min(dot(vec3(${alphaArguments[0]} - 0.5), vec3(${alphaArguments[1]} - 0.5)) * 4.0, 1.0);`); break; }
                        case PICA.TextureCombinerMode.DOT_PRODUCT_3_RGBA: {
                            codes.push(`    color.a = min(dot(vec4(${alphaArguments[0]} - 0.5), vec4(${alphaArguments[1]} - 0.5)) * 4.0, 1.0);`); break; }
                        case PICA.TextureCombinerMode.MUL_ADD: {
                            codes.push(`    color.a = min(${alphaArguments[0]} * ${alphaArguments[1]} + ${alphaArguments[2]}, 1.0);`); break; }
                        case PICA.TextureCombinerMode.ADD_MUL: {
                            codes.push(`    color.a = min(${alphaArguments[0]} + ${alphaArguments[1]}, 1.0) * ${alphaArguments[2]};`); break; }
                        default: { 
                            throw new Error("Invalid alpha combiner code"); }
                    }
                }
                
                let colorScale = 1 << stage.scale.color.code;
                let alphaScale = 1 << stage.scale.alpha.code;
                 
                if (colorScale !== 1) {
                    codes.push(`    color.rgb = min(color.rgb * ${Shader.float(colorScale)}, 1.0);`);
                }
                if (alphaScale !== 1) {
                    codes.push(`    color.a = min(color.a * ${Shader.float(alphaScale)}, 1.0);`);
                }
                 
                if (stage.buffers) {
                    
                    if (stage.buffers.color) {
                        codes.push("    buffer.rgb = color.rgb;");
                    }
                    
                    if (stage.buffers.alpha) {
                        codes.push("    buffer.a = color.a;");
                    }
                    
                }
                
                if ((index < 6) && (hasColor || hasAlpha)) {
                    codes.push("    previous = color;");
                }
                
                if (hasColor || hasAlpha) {
                    codes.push("");
                }
                
            });
            
            if (material.pica.rendering.alphaTest && material.pica.rendering.alphaTest.enabled) {
                let reference = Shader.float((material.pica.rendering.alphaTest.reference / 0xff));
                let operator = null;
                switch (material.pica.rendering.alphaTest.testFunction.code) {
                    case PICA.TestFunction.NEVER: { codes.push("    discard;");  break;  }
                    case PICA.TestFunction.EQUAL_TO: { operator = "!="; break; }
                    case PICA.TestFunction.NOT_EQUAL_TO: { operator = "=="; break; }
                    case PICA.TestFunction.LESS_THAN: { operator = ">="; break; }
                    case PICA.TestFunction.LESS_THAN_OR_EQUAL_TO: { operator = ">"; break; }
                    case PICA.TestFunction.GREATER_THAN: { operator = "<="; break; }
                    case PICA.TestFunction.GREATER_THAN_OR_EQUAL_TO: { operator = "<"; break; }
                    default: { throw new Error("Invalid test function"); }
                }
                if (operator) {
                    codes.push(
                    `    if (color.a ${operator} ${reference}) {`,
                    "        discard;",
                    "    }"); 
                }
            } else {
                codes.push("    color.a = 1.0;");
            }
            
            // premultiply alpha
            codes.push("    color.rgb *= color.a;");
            
            codes.push("    gl_FragColor = color;");
            codes.push("");
            codes.push("}");
            
            return codes.join("\n") + "\n";

        }
        
    };
    
    Shader.prototype.describeInstruction = function (instruction) {
        
        let parameters = instruction.parameters.map((parameter) => {
            if ($.is(parameter, Shader.Register)) {
                return parameter.toString();
            } else if ($.is(parameter, Number)) {
                return "0x" + parameter.toString(16);
            } else {
                return parameter;
            }
        });
       
        if (parameters.length > 0) {
            switch (instruction.name) {
                case "call": { return `${instruction.name} ${parameters.slice(-2).join(", ")};`; }
                case "cmp": { return `${instruction.name} ${parameters.slice(0, 3).join(" ")}${parameters.length > 3 ? ", " + parameters.slice(3).join(" ") : ""};`; }
                default: { return `${instruction.name} ${parameters.join(", ").trim()};`; }
            }
        } else {
            return `${instruction.name};`;
        }
        
    };
    
    Shader.prototype.decode = function (code, index, shader) {
        
        let opcode = (code >> 0x1a) & 0x3f;
        let rest = code & 0x3ffffff;
        
        let key = Object.keys(Shader.codes).filter((key) => {
            return ((Shader.codes[key].from <= opcode) && (Shader.codes[key].to >= opcode));
        })[0];
        
        if (!key) {
            throw new Error("Invalid opcode " + opcode);
        }
        
        const format = Shader.codes[key].format;
        
        let registers = null;
        let parameters = [];
        
        switch (format) {
            case "0": { break; }
            case "1": {
                let operand = this.decodeOperand((rest >> 0x0) & 0x7f, shader); // OPERAND
                let relativeAddressing = this.decodeRelativeAddressing((rest >> 0x13) & 0x3); // IDX_1
                registers = this.decodeRegisters({
                    "dst": (rest >> 0x15) & 0x1f,
                    "src1": [(rest >> 0xc) & 0x7f, relativeAddressing],
                    "src2": (rest >> 0x7) & 0x1f
                }, operand);
                if (Shader.codes[key].strip) {
                    if ($.is(Shader.codes[key].strip, Boolean)) {
                        registers.src1 = registers.src1[registers.dst.size];
                        registers.src2 = registers.src2[registers.dst.size];
                    } else {
                        registers.src1 = registers.src1[Shader.codes[key].strip];
                        registers.src2 = registers.src2[Shader.codes[key].strip];
                    }
                }
                parameters = [registers.dst, registers.src1, registers.src2];
                break;
            }
            case "1i": {
                let operand = this.decodeOperand((rest >> 0x0) & 0x7f, shader); // OPERAND
                let relativeAddressing = this.decodeRelativeAddressing((rest >> 0x13) & 0x3); // IDX_2
                registers = this.decodeRegisters({
                    "dst": (rest >> 0x15) & 0x1f,
                    "src1": (rest >> 0xe) & 0x1f,
                    "src2": [(rest >> 0x7) & 0x7f, relativeAddressing]
                }, operand);
                if (Shader.codes[key].strip) {
                    if ($.is(Shader.codes[key].strip, Boolean)) {
                        registers.src1 = registers.src1[registers.dst.size];
                        registers.src2 = registers.src2[registers.dst.size];
                    } else {
                        registers.src1 = registers.src1[Shader.codes[key].strip];
                        registers.src2 = registers.src2[Shader.codes[key].strip];
                    }
                }
                parameters = [registers.dst, registers.src1, registers.src2];
                break;
            }
            case "1u": {
                let operand = this.decodeOperand((rest >> 0x0) & 0x7f, shader); // OPERAND
                let relativeAddressing = this.decodeRelativeAddressing((rest >> 0x13) & 0x3); // IDX_1
                registers = this.decodeRegisters({
                    "dst": (rest >> 0x15) & 0x1f,
                    "src1": [(rest >> 0xc) & 0x7f, relativeAddressing]
                }, operand);
                if (key.toLowerCase() === "mova") {
                    registers.dst.name = "a0";
                }
                if (Shader.codes[key].strip) {
                    if ($.is(Shader.codes[key].strip, Boolean)) {
                        registers.src1 = registers.src1[registers.dst.size];
                    } else {
                        registers.src1 = registers.src1[Shader.codes[key].strip];
                    }
                }
                parameters = [registers.dst, registers.src1];
                break;
            }
            case "1c": {
                const relation = [ "==", "!=", "<", "<=", ">", ">=" ];
                let operand = this.decodeOperand((rest >> 0x0) & 0x7f, shader); // OPERAND
                let relativeAddressing = this.decodeRelativeAddressing((rest >> 0x13) & 0x3); // IDX_1
                let testX = relation[((code / 2) >> 0x17) & 0x7];
                let testY = relation[(rest >> 0x15) & 0x7];
                registers = this.decodeRegisters({
                    "src1": [(rest >> 0xc) & 0x7f, relativeAddressing],
                    "src2": (rest >> 0x7) & 0x1f
                }, operand);
                registers.dst = new Shader.Register("", "cmp", "", "xy", this);
                if (testX) { parameters.push(registers.src1["@1"], testX, registers.src2["@1"]); } 
                if (testY) { parameters.push(registers.src1["@2"], testY, registers.src2["@2"]); }
                break;
            }
            case "2": {
                
                let xReference = (rest >> 0x19) & 0x1;
                let yReference = (rest >> 0x18) & 0x1;
                
                let test = (rest >> 0x16) & 0x3;
                
                let x = new Shader.Register(xReference ? "" : "!", "cmp", "", "x", this);
                let y = new Shader.Register(yReference ? "" : "!", "cmp", "", "y", this);
                
                switch (test) {
                    case 0x0: { parameters.push(x, "||", y); break; }
                    case 0x1: { parameters.push(x, "&&", y); break; }
                    case 0x2: { parameters.push(x); break; }
                    case 0x3: { parameters.push(y); break; }
                    default: { throw new Error("Invalid state for cmp"); }
                }
                if (test < 2) {
                    registers = {
                        "cmp": new Shader.Register("", "cmp", "", "xy", this)
                    };
                } else {
                    registers = {
                        "cmp": new Shader.Register("", "cmp", "", test === 2 ? "x" : "y", this)
                    };
                }
                
                let destination = (rest >> 0xa) & 0xfff;
                let instructions = (rest >> 0x0) & 0xff;
                
                parameters.push(destination); // JUMP
                parameters.push(instructions); // INSTRUCTIONS
                
                break;
            }
            case "3": {
                
                let instructions = rest & 0xff;
                let destination = (rest >> 0xa) & 0xfff;
                let uniform = (rest >> 0x16) & 0xf;
                
                if (Shader.codes[key].reg) {
                    registers = {
                        "test": new Shader.Register("", Shader.codes[key].reg + uniform, "", "", this)
                    };
                    parameters.push(registers.test);
                } else {
                    throw new Error("Invalid uniform value");
                }
                
                parameters.push(destination); // JUMP
                parameters.push(instructions); // INSTRUCTIONS
                
                break;
            }
            case "4": {
                let vertexID = (rest >> 0x18) & 0x3;
                let primitive = ((rest >> 0x17) & 0x1) !== 0;
                let winding = ((rest >> 0x16) & 0x1) !== 0;
                parameters.push(vertexID);
                if (primitive) {
                    parameters.push("primitive")
                }
                if (winding) {
                    parameters.push("winding");
                }
                break;
            }
            case "5": {
                let operand = this.decodeOperand((rest >> 0x0) & 0x1f, shader); // OPERAND
                let relativeAddressing = this.decodeRelativeAddressing((rest >> 0x16) & 0x3); // IDX_2
                registers = this.decodeRegisters({
                    "dst": (code >> 0x18) & 0x1f,
                    "src1": (rest >> 0x11) & 0x1f,
                    "src2": [(rest >> 0xa) & 0x7f, relativeAddressing],
                    "src3": (rest >> 0x5) & 0x1f
                }, operand);
                if (Shader.codes[key].strip) {
                    if ($.is(Shader.codes[key].strip, Boolean)) {
                        registers.src1 = registers.src1[registers.dst.size];
                        registers.src2 = registers.src2[registers.dst.size];
                        registers.src3 = registers.src3[registers.dst.size];
                    } else {
                        registers.src1 = registers.src1[Shader.codes[key].strip];
                        registers.src2 = registers.src2[Shader.codes[key].strip];
                        registers.src3 = registers.src3[Shader.codes[key].strip];
                    }
                }
                parameters.push(registers.dst);
                parameters.push(registers.src1);
                parameters.push(registers.src2);
                parameters.push(registers.src3);
                break;
            }
            case "5i": {
                let operand = this.decodeOperand((rest >> 0x0) & 0x1f, shader); // OPERAND
                let relativeAddressing = this.decodeRelativeAddressing((rest >> 0x16) & 0x3); // IDX_2
                registers = this.decodeRegisters({
                    "dst": (code >> 0x18) & 0x1f,
                    "src1": (rest >> 0x11) & 0x1f,
                    "src2": (rest >> 0xc) & 0x1f,
                    "src3": [(rest >> 0x5) & 0x7f, relativeAddressing]
                }, operand);
                if (Shader.codes[key].strip) {
                    if ($.is(Shader.codes[key].strip, Boolean)) {
                        registers.src1 = registers.src1[registers.dst.size];
                        registers.src2 = registers.src2[registers.dst.size];
                        registers.src3 = registers.src3[registers.dst.size];
                    } else {
                        registers.src1 = registers.src1[Shader.codes[key].strip];
                        registers.src2 = registers.src2[Shader.codes[key].strip];
                        registers.src3 = registers.src3[Shader.codes[key].strip];
                    }
                }
                parameters.push(registers.dst);
                parameters.push(registers.src1);
                parameters.push(registers.src2);
                parameters.push(registers.src3);
                break;
            }
            default: { 
                throw new Error("Unknown command format");
            }
        }
    
        return {
            "line": index,
            "code": code,
            "name": key.toLowerCase(),
            "parameters": parameters,
            "registers": registers,
            "format": format,
            "glsl": Shader.codes[key].glsl,
            "comment": Shader.codes[key].comment
        };
        
    };
    
    Shader.prototype.decodeRegisters = function (values, operand) {
        
        let result = {};
        
        Object.keys(values).forEach((key) => {
            
            const isDST = (key === "dst");
            
            let code = values[key];
            let offset = "";
            if ($.is(code, Array)) {
                offset = code[1];
                code = code[0];
            }
             
            let sign = "";
            if (!isDST) {
                sign = operand["sign" + key[3]];
            }
            if (!sign) {
                sign = "";
            }
            
            const name = this.decodeRegisterName(isDST ? "dst" : "src", code);
            let components = operand[key];
            if (!components) {
                components = "";
            }
            
            result[key] = new Shader.Register(sign, name, offset, components, this);
           
        });
        
        return result;
        
    };
    
    Shader.prototype.decodeRegisterName = function (type, code) {
        if (type === "dst") {
            if ((0x0 <= code) && (code <= 0x6)) {
                return "o" + code;
            } else if ((0x10 <= code) && (code <= 0x1f)) {
                return "r" + (code % 0x10);
            } else {
                throw new Error("Invalid dst register");
            }
        } else if (type === "src") {
            if ((0x0 <= code) && (code <= 0xc)) {
                return "v" + code;
            } else if ((0x10 <= code) && (code <= 0x1f)) {
                return "r" + (code % 0x10);
            } else if ((0x20 <= code) && (code <= 0x7f)) {
                return "c" + (code - 0x20);
            } else {
                throw new Error("Invalid src register " + code);
            }
        } else {
            throw new Error("Invalid register type");
        }
    };
    
    Shader.prototype.decodeOperand = function (code, shader) {
        
        let operand = shader.opdescs.data[code];
        
        const getComponent = (operand) => {
            let hasX = (operand & 0x8) !== 0;
            let hasY = (operand & 0x4) !== 0;
            let hasZ = (operand & 0x2) !== 0;
            let hasW = (operand & 0x1) !== 0;
            return (hasX ? "x" : "") + (hasY ? "y" : "") + (hasZ ? "z" : "") + (hasW ? "w" : "");
        };
        
        let dst = getComponent(operand & 0xf);
         
        const getComponent2 = (operand) => {
            let result = [];
            let looper = 0;
            while (looper < 4) {
                switch ((operand >> (looper * 2)) & 0x3) {
                    case 0x0: { result.push("x"); break; }
                    case 0x1: { result.push("y"); break; }
                    case 0x2: { result.push("z"); break; }
                    case 0x3: { result.push("w"); break; }
                }
                ++looper;
            }
            return result.reverse().join("");
        };
        
        let src1 = getComponent2((operand >> 5) & 0xff);
        let src2 = getComponent2((operand >> 0xe) & 0xff);
        let src3 = getComponent2(Math.floor(operand / 0x800000) % 256);
        
        let result = {
            "dst": dst,
            "sign1": (((operand >> 4) & 0x1) !== 0) ? "-" : "",
            "src1": src1,
            "sign2": (((operand >> 0xd) & 0x1) !== 0) ? "-" : "",
            "src2": src2,
            "sign3": (((operand >> 0x16) & 0x1) !== 0) ? "-" : "",
            "src3": src3
        };
        
        return result;
        
    };
    
    Shader.prototype.decodeRelativeAddressing = function (code) {
        switch (code) {
            case 0: return "";
            case 1: return new Shader.Register("", "a0", "", "x", this);
            case 2: return new Shader.Register("", "a0", "", "y", this);
            case 3: return new Shader.Register("", "al", "", "", this);
            default: throw new Error("Invalid code for relative addressing");
        }
    };
    
    Shader.prototype.decodeCombinerSource = function (source, constant) {
        switch (source.code) {
            case PICA.TextureCombinerSource.PRIMARY_COLOR: { return new Shader.Register("", "fragColor", "", "", this); }
            case PICA.TextureCombinerSource.FRAGMENT_PRIMARY_COLOR: { return new Shader.Register("", "lutColor", "", "", this); }
            case PICA.TextureCombinerSource.FRAGMENT_SECONDARY_COLOR: { return new Shader.Register("", "lutColor2", "", "", this); }
            case PICA.TextureCombinerSource.TEXTURE_0: { return new Shader.Register("", "textures", "0", "", this); }
            case PICA.TextureCombinerSource.TEXTURE_1: { return new Shader.Register("", "textures", "1", "", this); }
            case PICA.TextureCombinerSource.TEXTURE_2: { return new Shader.Register("", "textures", "2", "", this); }
            case PICA.TextureCombinerSource.PREVIOUS_BUFFER: { return new Shader.Register("", "buffer", "", "", this); }
            case PICA.TextureCombinerSource.CONSTANT: { return new Shader.Register("", "constants", constant, "", "", this); }
            case PICA.TextureCombinerSource.PREVIOUS: { return new Shader.Register("", "previous", "", "", this); }
            default: { throw new Error("Invalid combiner source"); }
        }
    };
    
    Shader.prototype.decodeTextureColor = function (material, index, colors) {
        
        let textureCoordinate = material.textureCoordinates[index];
        if (!textureCoordinate) {
            $.warn("Invalid texture index " + index);
            textureCoordinate = {
                "index": index,
                "mappingType": {
                    "label": "UV",
                    "code": 3
                }
            };
        }
        
        let uv = (["fragUV", "fragUV2", "fragUV3"])[textureCoordinate.index];
        
        let textures = ["map", "map2", "map3"];
        
        let texture = null;
        switch (textureCoordinate.mappingType.label) {
            case "CAMERA_CUBE": { texture = `textureCube(textureCube, ${uv}.xyz)`; break; }
            case "PROJECTION": { texture = `texture2DProj(${textures[index]}, ${uv})`; break; }
            case "CAMERA_SPHERE":
            case "UV": 
            case "SHADOW": 
            case "SHADOW_BOX": {
                // strange things found in the decoded vertex shader
                // the calculation with UV will drop data of translation
                // so we add it here...
                texture = `texture2D(${textures[index]}, ${uv}.xy + vec2(uvVectors[${1 + index * 3}].w, uvVectors[${2 + index * 3}].w))`; break;
                // texture = `texture2D(${textures[index]}, ${uv}.xy)`; break;
            }
            default: { throw new Error("Unsupported mapping type"); }
        }
        colors[index] = true;
        return `textures[${index}] = ${texture};`;
    };
    
    Shader.prototype.decodeFragmentColors = function (material, features, colors) {
        
        let lightingLUTs = material.pica.lightingLUTs;
        let dist0 = this.getLightingLUTInput(lightingLUTs.inputSelection.dist0, lightingLUTs.inputScale.dist0, "lutDist0");
        let dist1 = this.getLightingLUTInput(lightingLUTs.inputSelection.dist1, lightingLUTs.inputScale.dist1, "lutDist1");
        let fresnel = this.getLightingLUTInput(lightingLUTs.inputSelection.fresnel, lightingLUTs.inputScale.fresnel, "lutFresnel");
        let reflectR = this.getLightingLUTInput(lightingLUTs.inputSelection.reflectR, lightingLUTs.inputScale.reflectR, "lutReflectR");
        let reflectG = this.getLightingLUTInput(lightingLUTs.inputSelection.reflectG, lightingLUTs.inputScale.reflectG, "lutReflectG");
        let reflectB = this.getLightingLUTInput(lightingLUTs.inputSelection.reflectB, lightingLUTs.inputScale.reflectB, "lutReflectB");

        let color = "emission + ambient * environmentAmbient.rgb * environmentAmbient.a";
        
        let codes = [
            `vec4 lutColor = vec4((${color}).rgb, 1.0);`,
            "vec4 lutColor2 = vec4(0.0, 0.0, 0.0, 1.0);"
        ];

        let bumpEnabled = ((material.bumpTexture >= 0) && (material.bumpTexture < 3));
        let bumpTangent = (material.bumpTexture === -1);
        if (bumpEnabled) {
            if (!colors[material.bumpTexture]) {
                codes.push(this.decodeTextureColor(material, material.bumpTexture, colors));
            }
        }

        if (bumpEnabled) {
            let bumpColor = `textures[${material.bumpTexture}].rgb * 2.0 - 1.0`; // make it -1 to 1
            if (bumpTangent) {
                codes.push("vec3 surfaceNormal = vec3(0.0, 0.0, 1.0);");
                codes.push(`vec3 surfaceTangent = normalize(${bumpColor});`);
            } else {
                codes.push(`vec3 surfaceNormal = normalize(${bumpColor});`);
                codes.push("vec3 surfaceTangent = vec3(1.0, 0.0, 0.0);");
            }
        } else {
            codes.push("vec3 surfaceNormal = vec3(0.0, 0.0, 1.0);");
            codes.push("vec3 surfaceTangent = vec3(1.0, 0.0, 0.0);");
        }
 
        let specularColor0 = "speculars[0]";
        let specularColor1 = "speculars[1]";
        
        codes.push("vec4 normalizedNormal = normalize(fragQuaternionNormal);");
        codes.push("vec3 normal = rotateQuaternion(normalizedNormal, surfaceNormal);");
        codes.push("vec3 tangent = rotateQuaternion(normalizedNormal, surfaceTangent);");

        codes.push("for (int i = 0; i < 3; i++) {");
        codes.push("    if (i < lightsCount) {");
        codes.push("");
        codes.push("        vec3 light = normalize(lightPositions[i].xyz);");
        codes.push("");
        codes.push("        vec3 halfVec = normalize(normalize(fragView.xyz) + light);");
        codes.push("");
        codes.push("        float cosNormalHalf = dot(normal, halfVec);");
        codes.push("        float cosViewHalf = dot(normalize(fragView.xyz), halfVec);");
        codes.push("        float cosNormalView = dot(normal, normalize(fragView.xyz));");
        codes.push("        float cosLightNormal = dot(light, normal);");
        codes.push("        float cosLightSpot = dot(light, lightDirections[i]);");
        codes.push("        float cosPhi = dot(halfVec - normal / dot(normal, normal) * dot(normal, halfVec), tangent);");
        codes.push("");
        codes.push("        float ln = max(cosLightNormal, 0.0);");
        codes.push("");
        if (features.dist0) {
            codes.push(`        float d0 = ${dist0};`);
            specularColor0 += " * d0";
        }
        if (features.reflectR || features.reflectG || features.reflectB) {
            codes.push("        vec3 r = speculars[1];");
            if (features.reflectR) {
                codes.push(`        r.r = ${reflectR};`);
            } else {
                codes.push("        r.r = 1.0;");
            }
            if (features.reflectG) {
                codes.push(`        r.g = ${reflectG};`);
            } else {
                codes.push("        r.g = 1.0;");
            }
            if (features.reflectB) {
                codes.push(`        r.b = ${reflectB};`);
            } else {
                codes.push("        r.b = 1.0;");
            }
            specularColor1 = "r";
        }
        if (features.dist1) {
            codes.push(`        float d1 = ${dist1}`);
            specularColor1 += " * d1";
        }
        
        codes.push("        vec3 diffuseColor = ambient * lightAmbients[i].rgb * lightAmbients[i].a + diffuse * lightDiffuses[i].rgb * lightDiffuses[i].a * clamp(ln, 0.0, 1.0);");
        codes.push(`        vec3 specularColor = ${specularColor0} * lightSpeculars[i * 2].rgb * lightSpeculars[i * 2].a + ${specularColor1} * lightSpeculars[i * 2 + 1].rgb * lightSpeculars[i * 2 + 1].a;`);
        
        codes.push("        lutColor.rgb += diffuseColor.rgb;");
        codes.push(`        lutColor2.rgb += specularColor.rgb;`);
        
        if (features.fresnel) {
            $.warn("FRESNEL not determined");
            // if (fresnelPrimary) {
            //     codes.push(`        lutColor.a = ${fresnel};`);
            // } else if (fresnelSecondary) {
            //     codes.push(`        lutColor2.a = ${fresnel};`);
            // }
        }
        
        codes.push("    }");
        codes.push("}");
        
        codes.push("lutColor = clamp(lutColor, 0.0, 1.0);");
        codes.push("lutColor2 = clamp(lutColor2, 0.0, 1.0);");
        
        codes.push("");
        
        return codes.join("\n");

    };
    
    Shader.prototype.getLightingLUTInput = function (selection, scale, lut) {
        
        let input = null;
        
        switch (selection.code) {
            case PICA.LightingLUTInputSelectionChoice.NORMAL_HALF: { input = "cosNormalHalf"; break; }
            case PICA.LightingLUTInputSelectionChoice.VIEW_HALF: { input = "cosViewHalf"; break; }
            case PICA.LightingLUTInputSelectionChoice.NORMAL_VIEW: { input = "cosNormalView"; break; }
            case PICA.LightingLUTInputSelectionChoice.LIGHT_NORMAL: { input = "cosLightNormal"; break; }
            case PICA.LightingLUTInputSelectionChoice.LIGHT_SPOT: { input = "cosLightSpot"; break; }
            case PICA.LightingLUTInputSelectionChoice.PHI: { input = "cosPhi"; break; }
            default: { input = "cosNormalHalf"; break; }
        }

        // TODO: check why this is inversed
        let output = `texture2D(${lut}, vec2((1.0 - ${input}) * 0.5, 0.0)).r`;
        // let output = `texture2D(${lut}, vec2((${input} - 1.0) * 0.5, 0.0)).r`;
        switch (scale.code) {
            case PICA.LightingLUTInputScaleMode.ONE: { break; }
            case PICA.LightingLUTInputScaleMode.TWO: {  output = `min(${output} * 2.0, 1.0)`; break; }
            case PICA.LightingLUTInputScaleMode.FOUR: {  output = `min(${output} * 4.0, 1.0)`; break; }
            case PICA.LightingLUTInputScaleMode.QUARTER: {  output = `min(${output} * 0.25, 1.0)`; break; }
            case PICA.LightingLUTInputScaleMode.HALF: {  output = `min(${output} * 0.5, 1.0)`; break; }
            default: { throw new Error("Input scale not found"); }
        }

        return output;
        
    };
    
    Shader.bools = {
        "0": "has_bone",
        "1": "light",
        "2": "uv_map_0",
        "3": "uv_map_1",
        "4": "uv_map_2",
        "5": "uv_map_1_sphere_reflection",
        "6": "uv_map_2_sphere_reflection",
        "7": "light_specular",
        "8": "normal_specular",
        "9": "diffuse",
        "10": "smooth_skin",
        "11": "rigid_skin"
    };
    
    Shader.floats  = {
        
        "0": { "name": "texture_coordinate_map", "from": 0, "to": 0 }, 
        "1": { "name": "texture_0_transposed_matrix", "from": 1, "to": 3 },
        "4": { "name": "texture_1_transposed_matrix", "from": 4, "to": 6 },
        "7": { "name": "texture_2_transposed_matrix", "from": 7, "to": 8 },
        "9": { "name": "texture_transform", "from": 9, "to": 9 }, 
        "10": { "name": "indexed_transposed_bone_matrices[0]", "from": 10, "to": 69 },
        // 10 - 12 // 13 - 15 // 16 - 18 // 19 - 21 // 22 - 24
        // 25 - 27 // 28 - 30 // 31 - 33 // 34 - 36 // 37 - 39
        // 40 - 42 // 43 - 45 // 46 - 48 // 49 - 51 // 52 - 54
        // 55 - 57 // 58 - 60 // 61 - 63 // 64 - 66 // 67 - 69
       
        "82": { "name": "rim_and_phong_specular", "from": 82, "to": 82 },
        
        "83": { "name": "light_direction", "from": 83, "to": 83 },
        "84": { "name": "bounding_box_or_light_diffuse", "from": 84, "to": 84 },
        
        "85": { "name": "shader_parameter", "from": 85, "to": 85 },
        
        "86": { "name": "transposed_projection_matrix", "from": 86, "to": 89 }, 
        "90": { "name": "transposed_view_matrix", "from": 90, "to": 92 },
        
        "93": { "name": "vec4(0, 1, 2, 3)", "from": 93, "to": 93 },
        "94": { "name": "vec4(0.5, sin(1.7), 1/255, 0)", "from": 94, "to": 94 },
        "95": { "name": "vec4(3, 4, 5, 6)", "from": 95, "to": 95 }
        
    };
    
    Shader.codes = {};
    
    Shader.codes.ADD = { "from": 0x00, "to": 0x00, "format": "1", "strip": true,
                         "comment": "${dst} = ${src1} + ${src2};",
                         "glsl": "${dst.glsl} = ${src1.glsl} + ${src2.glsl};"};
    Shader.codes.DP3 = { "from": 0x01, "to": 0x01, "format": "1", "strip": 3,
                         "comment": "${dst[1]} = dot(${src1[3]}, ${src2[3]});",
                         "glsl": "${dst[1].glsl} = dot(${src1[3].glsl}, ${src2[3].glsl});" };
    Shader.codes.DP4 = { "from": 0x02, "to": 0x02, "format": "1", 
                         "comment": "${dst[1]} = dot(${src1}, ${src2});",
                         "glsl": "${dst[1].glsl} = dot(${src1.glsl}, ${src2.glsl});" };
    // TODO: check
    Shader.codes.DPH = { "from": 0x03, "to": 0x03, "format": "1", "strip": 3,
                         "comment": "${dst} = ${vec('dot(' + src1[3] + ', ' + src2[3] + ')', dst.size)};",
                         "glsl": "${dst.glsl} = ${vec('dot(' + src1[3].glsl + ', ' + src2[3].glsl + ')', dst.size)};" };
    Shader.codes.DST = { "from": 0x04, "to": 0x04, "format": "1",
                         "comment": "${dst} = vec4(1, ${src1.name}.y * ${src1.name}.y, ${src1.name}.z, ${src2.name}.w);",
                        //  "glsl": "${dst.glsl} = vec4(1, ${src1.name}.y * ${src1.name}.y, ${src1.name}.z, ${src2.name}.w);" 
                       };
    Shader.codes.EX2 = { "from": 0x05, "to": 0x05, "format": "1u", "strip": true,
                         "comment": "${dst} = exp2(${src1});",
                         "glsl": "${dst.glsl} = spicaExp2(${src1.glsl});" };
    Shader.codes.LG2 = { "from": 0x06, "to": 0x06, "format": "1u", "strip": true,
                         "comment": "${dst} = log2(${src1});",
                         "glsl": "${dst.glsl} = spicaLog2(${src1.glsl});" };
    // TODO: check
    Shader.codes.LITP = { "from": 0x07, "to": 0x07, "format": "1u",
                          "comment": "${dst} = vec4(max(${src1.name}.x, 0), clamp(${src1.name}.y, -1, 1), 0, max(${src1.name}.w, 0)); " +
                                     "cmp.x = ${src1.name}.x > 0 ? 1 : 0; " +
                                     "cmp.y = ${src1.name}.w > 0 ? 1 : 0; ",
                        //   "glsl": "${dst.glsl} = vec4(max(${src1.name}.x, 0), clamp(${src1.name}.y, -1, 1), 0, max(${src1.name}.w, 0)); " +
                        //              "cmp.x = ${src1.name}.x > 0 ? 1 : 0; " +
                        //              "cmp.y = ${src1.name}.w > 0 ? 1 : 0; ",
                        };
    Shader.codes.MUL = { "from": 0x08, "to": 0x08, "format": "1", "strip": true,
                         "comment": "${dst} = ${src1} * ${src2};",
                         "glsl": "${dst.glsl} = ${src1.glsl} * ${src2.glsl};" };
    Shader.codes.SGE = { "from": 0x09, "to": 0x09, "format": "1", 
                         "comment": "${dst} = (${src1} >= ${src2}) ? 1 : 0;",
                         "glsl": "${dst.glsl} = (${src1.glsl} >= ${src2.glsl}) ? 1 : 0;" };
    Shader.codes.SLT = { "from": 0x0a, "to": 0x0a, "format": "1", 
                         "comment": "${dst} = (${src1} < ${src2}) ? 1 : 0;",
                         "glsl": "${dst.glsl} = (${src1.glsl} < ${src2.glsl}) ? 1 : 0;" };
    Shader.codes.FLR = { "from": 0x0b, "to": 0x0b, "format": "1u", "strip": true,
                         "comment": "${dst} = floor(${src1});",
                         "glsl": "${dst.glsl} = floor(${src1.glsl});" };
    Shader.codes.MAX = { "from": 0x0c, "to": 0x0c, "format": "1", "strip": true,
                         "comment": "${dst} = max(${src1}, ${src2});",
                         "glsl": "${dst.glsl} = max(${src1.glsl}, ${src2.glsl});" };
    Shader.codes.MIN = { "from": 0x0d, "to": 0x0d, "format": "1", "strip": true,
                         "comment": "${dst} = min(${src1}, ${src2});",
                         "glsl": "${dst.glsl} = min(${src1.glsl}, ${src2.glsl});" };
    Shader.codes.RCP = { "from": 0x0e, "to": 0x0e, "format": "1u", "strip": true,
                         "comment": "${dst} = ${vec('1.0', dst.size)} / ${src1};",
                         "glsl": "${dst.glsl} = ${vec('1', dst.size)} / ${src1.glsl};" };
    Shader.codes.RSQ = { "from": 0x0f, "to": 0x0f, "format": "1u", "strip": true,
                         "comment": "${dst} = ${vec('1', dst.size)} / sqrt(${src1});",
                         "glsl": "${dst.glsl} = inversesqrt(${src1.glsl});" };
    Shader.codes.MOVA = { "from": 0x12, "to": 0x12, "format": "1u", "strip": true,
                          "comment": "a0.${dst.components} = ${if(dst.size >= 2, 'ivec2', 'int')}(${src1[dst.size]});",
                          "glsl": "${glmova()}" };
    Shader.codes.MOV = { "from": 0x13, "to": 0x13, "format": "1u", "strip": true,
                         "comment": "${dst} = ${src1};",
                         "glsl": "${dst.glsl} = ${src1.glsl};" };
    Shader.codes.DPHI = { "from": 0x18, "to": 0x18, "format": "1i", "strip": 3,
                          "comment": "${dst} = ${vec('dot(' + src1[3] + ', ' + src2[3] + ')', dst.size)};",
                          "glsl": "${dst} = ${vec('dot(' + src1[3].glsl + ', ' + src2[3].glsl + ')', dst.size)};" };
    Shader.codes.DSTI = { "from": 0x19, "to": 0x19, "format": "1i",
                          "comment": "${dst} = vec4(1, ${src1.name}.y * ${src1.name}.y, ${src1.name}.z, ${src2.name}.w);" };
    Shader.codes.SGEI = { "from": 0x1a, "to": 0x1a, "format": "1i", 
                          "comment": "${dst} = (${src1} >= ${src2}) ? 1.0 : 0.0;",
                          "glsl": "${dst.glsl} = (${src1.glsl} >= ${src2.glsl}) ? 1.0 : 0.0;" };
    Shader.codes.SLTI = { "from": 0x1b, "to": 0x1b, "format": "1i", 
                          "comment": "${dst} = (${src1} < ${src2}) ? 1.0 : 0.0;",
                          "glsl": "${dst.glsl} = (${src1.glsl} < ${src2.glsl}) ? 1.0 : 0.0;" };
    Shader.codes.BREAK = { "from": 0x20, "to": 0x20, "format": "0", 
                           "comment": "break;",
                           "glsl": "break;" };
    Shader.codes.NOP = { "from": 0x21, "to": 0x21, "format": "0", 
                         "comment": ";",
                         "glsl": "" };
    Shader.codes.END = { "from": 0x22, "to": 0x22, "format": "0", 
                         "comment": "exit;",
                         "glsl": "${glend()};\n${indent}return;" };
    Shader.codes.BREAKC = { "from": 0x23, "to": 0x23, "format": "2", 
                            "comment": "if (${join(slice(parameters, 0, -2), ' ')}) { break; }",
                            "glsl": "if (${join(glsl(slice(parameters, 0, -2)), ' ')}) { break; }" };
    Shader.codes.CALL = { "from": 0x24, "to": 0x24, "format": "2", 
                          "comment": "${callCode(parameters[parameters.length - 2], parameters[parameters.length - 1])};",
                          "glsl": "${glcall(parameters[parameters.length - 2], parameters[parameters.length - 1])};" };
    Shader.codes.CALLC = { "from": 0x25, "to": 0x25, "format": "2", 
                           "comment": "if (${join(slice(parameters, 0, -2), ' ')}) { ${callCode(parameters[parameters.length - 2], parameters[parameters.length - 1])}; }",
                           "glsl": "if (${join(glsl(slice(parameters, 0, -2)), ' ')}) { \n${indent}    ${glcall(parameters[parameters.length - 2], parameters[parameters.length - 1])};\n${indent}}"};
    Shader.codes.CALLU = { "from": 0x26, "to": 0x26, "format": "3", "reg": "b",
                           "comment": "if (${join(slice(parameters, 0, -2), ' ')}) { ${callCode(parameters[parameters.length - 2], parameters[parameters.length - 1])}; }",
                           "glsl": "if (${join(glsl(slice(parameters, 0, -2)), ' ')}) { \n${indent}    ${glcall(parameters[parameters.length - 2], parameters[parameters.length - 1])};\n${indent}}"};
    Shader.codes.IFU = { "from": 0x27, "to": 0x27, "format": "3", "reg": "b",
                         "comment": "if (${if(parameters[parameters.length - 2] - line - 1 > 0, '', '!')}(${join(slice(parameters, 0, -2), ' ')})) { " +
                                        "${if(parameters[parameters.length - 2] - line - 1 > 0, callCode(line + 1, parameters[parameters.length - 2] - line - 1), callCode(parameters[parameters.length - 2], parameters[parameters.length - 1]))}; " +
                                    "}${if((parameters[parameters.length - 2] - line - 1 > 0) && (parameters[parameters.length - 1] > 0), ' else { ' + callCode(parameters[parameters.length - 2], parameters[parameters.length - 1]) + '}', '')} " +
                                    "goto ${label(parameters[1] + parameters[2])};",
                         "glsl": "if (${if(parameters[parameters.length - 2] - line - 1 > 0, '', '!')}(${join(glsl(slice(parameters, 0, -2)), ' ')})) { \n" +
                                 "${glblock(0)}\n" +
                                 "${indent}}${if((parameters[parameters.length - 2] - line - 1 > 0) && (parameters[parameters.length - 1] > 0), ' else {\\n' + glblock(1) + '\\n' + indent + '}', '')} " };
    Shader.codes.IFC = { "from": 0x28, "to": 0x28, "format": "2", 
                         "comment": "if (${if(parameters[parameters.length - 2] - line - 1 > 0, '', '!')}(${join(slice(parameters, 0, -2), ' ')})) { " +
                                        "${if(parameters[parameters.length - 2] - line - 1 > 0, callCode(line + 1, parameters[1] - line - 1), callCode(parameters[parameters.length - 2], parameters[parameters.length - 1]))}; " +
                                    "}${if((parameters[parameters.length - 2] - line - 1 > 0) && (parameters[parameters.length - 1] > 0), ' else { ' + callCode(parameters[parameters.length - 2], parameters[parameters.length - 1]) + '}', '')} " +
                                    "goto ${label(parameters[1] + parameters[2])};",
                         "glsl": "if (${if(parameters[parameters.length - 2] - line - 1 > 0, '', '!')}(${join(glsl(slice(parameters, 0, -2)), ' ')})) { \n" +
                                 "${glblock(0)}\n" +
                                 "${indent}}${if((parameters[parameters.length - 2] - line - 1 > 0) && (parameters[parameters.length - 1] > 0), ' else {\\n' + glblock(1) + '\\n' + indent + '}', '')} " };
    Shader.codes.LOOP = { "from": 0x29, "to": 0x29, "format": "3", "reg": "i",
                          "comment": "reg_al = ${parameters[0]}.y; loop (${parameters[0]}.x + 1) { ${callCode(line, parameters[1] - line)}; reg_al += ${parameters[0]}.z; }" };
                        //   case SHDR_LOOP:
                        //           {
                        //               u32 NUM = (instr & 0xFF);
                        //               u32 DST = ((instr >> 0xA) & 0xFFF);
                        //               u32 ID = ((instr >> 0x16) & 0xF);
                        //   #ifdef printfunc
                        //               DEBUG("LOOP %02X %03X %01x\n", NUM, DST, ID); //this is not realy a loop it is more like that happens for(aL = ID.y;<true for ID.x + 1>;aL += ID.z)
                        //   #endif
                        //               state->address_registers[2] = state->integer_registers[ID][1];
                        //               loop(state, DST, NUM + 1, ((u32)(uintptr_t)(state->program_counter) - (u32)(uintptr_t)(&GPU_ShaderCodeBuffer[0])) / 4 + 1, ID, state->integer_registers[ID][0]);
                        //               break;
                        //           }
    Shader.codes.EMIT = { "from": 0x2a, "to": 0x2a, "format": "0", 
                          "comment": "emit;", 
                          "glsl": "" };
    Shader.codes.SETEMIT = { "from": 0x2b, "to": 0x2b, "format": "4",
                             "comment": "setemit(${parameters[0]}, ${join(slice(parameters, 1), ', ')});",
                             "glsl": "" };
    Shader.codes.JMPC = { "from": 0x2c, "to": 0x2c, "format": "2", // TODO: check whether bit 0 of num has effect?
                          "comment": "if (${join(slice(parameters, 0, -2), ' ')}) { goto ${label(parameters[parameters.length - 2])}; }",
                          "glsl": "if (!(${join(glsl(slice(parameters, 0, -2)), ' ')})) { \n${glblock(0)}\n${indent}}" };
    Shader.codes.JMPU = { "from": 0x2d, "to": 0x2d, "format": "3", "reg": "b",
                          "comment": "if (${if((parameters[parameters.length - 1] & 0x1) == 1, '!', '')}(${join(slice(parameters, 0, -2), ' ')})) { goto ${label(parameters[parameters.length - 2])}; }",
                          "glsl": "if (!(${if((parameters[parameters.length - 1] & 0x1) == 1, '!', '')}(${join(glsl(slice(parameters, 0, -2)), ' ')}))) { \n${glblock(0)}\n${indent}}" };
    Shader.codes.CMP = { "from": 0x2e, "to": 0x2f, "format": "1c",
                         "comment": "cmp.x = ${join(slice(parameters, 0, 3), ' ')}; ${if(parameters.length > 3, 'cmp.y = ' + join(slice(parameters, 3), ' ') + ';', '')}",
                         "glsl": "gpu_cmp.x = ${join(glsl(slice(parameters, 0, 3)), ' ')}; ${if(parameters.length > 3, '\n' + indent + 'gpu_cmp.y = ' + join(glsl(slice(parameters, 3)), ' ') + ';', '')}"};
    Shader.codes.MADI = { "from": 0x30, "to": 0x37, "format": "5i", "strip": true,
                          "comment": "${dst} = ${src1} * ${src2} + ${src3};",
                          "glsl": "${dst.glsl} = ${src1.glsl} * ${src2.glsl} + ${src3.glsl};"};
    Shader.codes.MAD = { "from": 0x38, "to": 0x3f, "format": "5", "strip": true,
                         "comment": "${dst} = ${src1} * ${src2} + ${src3};",
                         "glsl": "${dst.glsl} = ${src1.glsl} * ${src2.glsl} + ${src3.glsl};"};
    
    Shader.functors = {
        "vec": function (template, call, parameters, options, value, dimension) {
            switch (dimension) {
                case 1: return "float(" + value + ")";
                case 2: return "vec2(" + value + ")";
                case 3: return "vec3(" + value + ")";
                case 4: return "vec4(" + value + ")";
                default: throw new Error("Unsupported dimension " + dimension);
            }
        },
        "label": function (template, call, parameters, options, target) {
            if (parameters.report.labels[target]) {
                return parameters.report.labels[target].name.trim();
            } else {
                return "0x" + target.toString(16);
            }
        },
        "callCode": function (template, call, parameters, options, target, length) {
            if (length === 0) {
                return "";
            } else if (parameters.report.labels.hasOwnProperty(target) &&
                       (parameters.report.labels[target].end + 1 === target + length)) {
                return parameters.report.labels[target].name.trim() + "()";
            } else {
                return "call 0x" + target.toString(16) + " +0x" + length.toString(16) + "";
            }
        }
    };
    
    Shader.float = function (value) {
        
        let result = value.toString();
        if (result.indexOf(".") === -1) {
            result += ".0";
        } else {
            if (result.split(".")[1].length >= 7) {
                result = value.toFixed(7);
            }
        }
        return result;
        
    };
    
    const Register = function Register(sign, name, offset, components, shader) {
        this.sign = sign;
        this.name = name;
        this.offset = offset;
        this.components = components;
        this.shader = shader;
    };
   
    Register.prototype.toString = function (prefix, map) {
        
        if (!prefix) {
            prefix = "";
        }
        
        let offset = this.offset;
        if ((!$.is.nil(offset)) && (offset !== "")) {
            if ($.is(offset, Register)) {
                offset = "[" + offset.toString(prefix) + "]";
            } else {
                offset = "[" + offset + "]";
            }
        }
        
        let components = this.components;
        if (components) {
            components = "." + components;
        }
        
        if (components === ".xyzw") {
            components = "";
        }
        
        let name = prefix + this.name + offset;
        if (map && map[name]) {
            name = map[name];
        }
        
        if (this.sign) {
            return "(" + this.sign + name + components + ")";
        } else {
            return name + components;
        }
        
    };
    
    Object.defineProperty(Register.prototype, "size", {
        "get": function () {
            return this.components.length;
        }
    });
      
    Object.defineProperty(Register.prototype, "1", {
        "get": function () {
            return new Register(this.sign, this.name, this.offset, this.components[0], this.shader);
        }
    });
     
    Object.defineProperty(Register.prototype, "@1", {
        "get": function () {
            return new Register(this.sign, this.name, this.offset, this.components[0], this.shader);
        }
    });
     
    Object.defineProperty(Register.prototype, "2", {
        "get": function () {
            return new Register(this.sign, this.name, this.offset, this.components.slice(0, 2), this.shader);
        }
    });
     
    Object.defineProperty(Register.prototype, "@2", {
        "get": function () {
            return new Register(this.sign, this.name, this.offset, this.components[1], this.shader);
        }
    });
      
    Object.defineProperty(Register.prototype, "3", {
        "get": function () {
            return new Register(this.sign, this.name, this.offset, this.components.slice(0, 3), this.shader);
        }
    });
    
    Object.defineProperty(Register.prototype, "4", {
        "get": function () {
            return new Register(this.sign, this.name, this.offset, this.components.slice(0, 4), this.shader);
        }
    });
     
    Object.defineProperty(Register.prototype, "x", {
        "get": function () {
            return new Register(this.sign, this.name, this.offset, "x", this.shader);
        }
    });
     
    Object.defineProperty(Register.prototype, "y", {
        "get": function () {
            return new Register(this.sign, this.name, this.offset, "y", this.shader);
        }
    });
     
    Object.defineProperty(Register.prototype, "xy", {
        "get": function () {
            return new Register(this.sign, this.name, this.offset, "xy", this.shader);
        }
    });
   
    Object.defineProperty(Register.prototype, "glsl", {
        "get": function () {
            
            let shader = this.shader.pica.shader ? this.shader.pica.shader.vertex : null;
            if ((!shader) || $.is.nil(shader.entryPoint)) {
                shader = this.shader.pica.shader ? this.shader.pica.shader.geometry : null;
            } else if ((!shader) || $.is.nil(shader.entryPoint)) {
                shader = null;
            }
            
            if (!shader) {
                return this.toString();
            }
            
            const simplify = (prefix) => {
                 
                let components = this.components;
                if (components) {
                    components = "." + components;
                }
                if (components === ".xyzw") {
                    components = "";
                }
                
                let offset = this.name.slice(1);
                if (this.offset) {
                    let offsetGLSL = this.offset.glsl;
                    if (this.shader.offsetMap[offsetGLSL]) {
                        offsetGLSL = this.shader.offsetMap[offsetGLSL];
                    }
                    offset += " + " + offsetGLSL;
                }
                
                let name = prefix + this.name[0];
                if (Register.glslMap[name]) {
                    name = Register.glslMap[name];
                }
               
                name = name + "[" + offset + "]";
                if (Register.glslMap[name]) {
                    name = Register.glslMap[name];
                }
                
                if (this.sign) {
                    return "(" + this.sign + name + components + ")";
                } else {
                    return name + components;
                }
                
            };
            
            switch (this.name[0]) {
                case "b": { return this.toString("gpu_", Register.glslMap); }
                case "i": { return simplify("gpu_"); }
                case "r": { return simplify("gpu_"); }
                case "c": { 
                    if (this.name === "cmp") {
                        return this.toString("gpu_", Register.glslMap);
                    }
                    if (this.shader.pica.shader.vertex.floats[this.name.slice(1)]) {
                        let vector = this.shader.pica.shader.vertex.floats[this.name.slice(1)];
                        let values = this.components.split("").map((component) => Shader.float(vector[component]));
                        if (values.length > 1) {
                            return "vec" + values.length + "(" + values.join(", ") + ")";
                        } else {
                            return values[0];
                        }
                    }
                    return simplify("gpu_"); 
                }
                case "v": { 
                    return this.toString("gpu_", Register.glslMap); 
                }
                case "o": { return this.toString("gpu_", Register.glslMap); }
                default: { 
                    if ((this.name === "a0") || (this.name === "al")) {
                        return this.toString("gpu_", Register.glslMap);
                    } else {
                        return this.toString(); 
                    }
                }
            }
            
        }
    });
    
    Register.glslMap = {
        
        "gpu_v0": "position",
        "gpu_v1": "normal",
        "gpu_v2": "tangent",
        "gpu_v3": "color",
        "gpu_v4": "uv",
        "gpu_v5": "uv2",
        "gpu_v6": "uv3",
        "gpu_v7": "boneIndex", // not skin index
        "gpu_v8": "boneWeight", // not skin weight
        
        "gpu_o0": "fragPosition",
        "gpu_o1": "fragQuaternionNormal",
        "gpu_o2": "fragView",
        "gpu_o3": "fragColor",
        "gpu_o4": "fragUV",
        "gpu_o5": "fragUV2",
        "gpu_o6": "fragUV3",
        
        "gpu_b0": "hasBone",
        "gpu_b1": "needColor",
        "gpu_b2": "hasUVMap",
        "gpu_b3": "hasUVMap2",
        "gpu_b4": "hasUVMap3",
        "gpu_b5": "needUVMap2SphereReflection",
        "gpu_b6": "needUVMap3SphereReflection",
        "gpu_b7": "needLightSpecular",
        "gpu_b8": "needViewSpecular",
        "gpu_b9": "needDiffuse",
        "gpu_b10": "hasTangent",
        "gpu_b11": "hasBoneW",
        
        "gpu_c": "vectors"
        
    };
    
    Shader.Register = Register;
    
    module.exports = Shader;
    
})(this, this.$);
