((/* global, $ */) => {
    
    const Section = require("./section.js");
    
    const TILE_ORDER = [ 
         0,  1,  8,  9,  2,  3, 10, 11, 
        16, 17, 24, 25, 18, 19, 26, 27, 
         4,  5, 12, 13,  6,  7, 14, 15, 
        20, 21, 28, 29, 22, 23, 30, 31, 
        32, 33, 40, 41, 34, 35, 42, 43, 
        48, 49, 56, 57, 50, 51, 58, 59, 
        36, 37, 44, 45, 38, 39, 46, 47, 
        52, 53, 60, 61, 54, 55, 62, 63 
    ];
    
    const Texture = function Texture(reader) {
        
        this.magic = reader.readUint32();
        
        if (reader.readUint32() !== 1) {
            throw new Error("Invalid texture version, expected 1");
        }
        
        const section = new Section(reader, "texture");
        
        let index = reader.index;

        const textureLength = reader.readUint32();
        
        reader.skip(0xc, 0);
        
        this.name = reader.readString(0x40);

        this.width = reader.readUint16();
        this.height = reader.readUint16();
        
        this.format = reader.readUint16();
        this.mipmapSize = reader.readUint16();
        
        reader.skip(0x10, 0xff);
        
        const from = reader.index;
        this.data = [];
        while (reader.index < from + textureLength) {
            this.data.push(reader.readUint8());
        }
        
        while (reader.index < index + section.length) {
            if (reader.readUint8() !== 0) {
                throw new Error("Invalid padding, expected 0");
            }
        }
        
    };
    
    Texture.readers = {};
    
    Texture.RGB565 = 0x2;
    Texture.readers[Texture.RGB565] = function (data, format, width, height, image) {
        
        let dataOffset = 0;
        
        let ty = 0;
        while (ty < height / 8) {
            let tx = 0;
            while (tx < width / 8) {
                
                let p = 0;
                while (p < 64) {
                    
                    let x = TILE_ORDER[p] % 8;
                    let y = (TILE_ORDER[p] - x) / 8;
                    
                    let offset = ((tx * 8) + x + (ty * 8 + y) * width) * 4;
                    
                    let d = data[dataOffset] | (data[dataOffset + 1] << 8);

                    let r = ((d >> 11) & 0x1f) << 3;
                    let g = ((d >> 5) & 0x3f) << 2;
                    let b = (d & 0x1f) << 3;

                    image[offset] = 0xff;
                    image[offset + 1] = r | (r >> 5);
                    image[offset + 2] = g | (g >> 6);
                    image[offset + 3] = b | (b >> 5);
                    
                    dataOffset += 2;
                    
                    ++p;
                }
               
                ++tx;
            }
            
            ++ty;
        }
        
    };
    
    Texture.RGB8 = 0x3;
    Texture.readers[Texture.RGB8] = function (data, format, width, height, image) {
        
        let dataOffset = 0;

        let ty = 0;
        while (ty < height / 8) {
            let tx = 0;
            while (tx < width / 8) {
                
                let p = 0;
                while (p < 64) {
                    
                    let x = TILE_ORDER[p] % 8;
                    let y = (TILE_ORDER[p] - x) / 8;
                    
                    let offset = ((tx * 8) + x + (ty * 8 + y) * width) * 4;
                    
                    image[offset] = 0xff;
                    image[offset + 1] = data[dataOffset + 2];
                    image[offset + 2] = data[dataOffset + 1];
                    image[offset + 3] = data[dataOffset];
                    
                    dataOffset += 3;
                    
                    ++p;
                }
               
                ++tx;
            }
            
            ++ty;
        }
        
    };
    
    Texture.RGBA8 = 0x4;
    Texture.readers[Texture.RGBA8] = function (data, format, width, height, image) {
        
        let dataOffset = 0;
        
        let ty = 0;
        while (ty < height / 8) {
            let tx = 0;
            while (tx < width / 8) {
                
                let p = 0;
                while (p < 64) {
                    
                    let x = TILE_ORDER[p] % 8;
                    let y = (TILE_ORDER[p] - x) / 8;
                    
                    let offset = ((tx * 8) + x + (ty * 8 + y) * width) * 4;
                    
                    image[offset] = data[dataOffset];
                    image[offset + 1] = data[dataOffset + 3];
                    image[offset + 2] = data[dataOffset + 2];
                    image[offset + 3] = data[dataOffset + 1];
                    
                    dataOffset += 4;
                    
                    ++p;
                }
               
                ++tx;
            }
            
            ++ty;
        }
        
    };
    
    Texture.RGBA4 = 0x16;
    Texture.readers[Texture.RGBA4] = function (data, format, width, height, image) {
        
        let dataOffset = 0;
        
        let ty = 0;
        while (ty < height / 8) {
            let tx = 0;
            while (tx < width / 8) {
                
                let p = 0;
                while (p < 64) {
                    
                    let x = TILE_ORDER[p] % 8;
                    let y = (TILE_ORDER[p] - x) / 8;
                    
                    let offset = ((tx * 8) + x + (ty * 8 + y) * width) * 4;
                    
                    let d = (data[dataOffset] | (data[dataOffset + 1] << 8)) & 0xffff;

                    let r = (d >> 12) & 0xf;
                    let g = (d >> 8) & 0xf;
                    let b = (d >> 4) & 0xf;
                    let a = d & 0xf;
                    
                    image[offset] = a | (a << 4);
                    image[offset + 1] = r | (r << 4);
                    image[offset + 2] = g | (g << 4);
                    image[offset + 3] = b | (b << 4);
                    
                    dataOffset += 2;
                    
                    ++p;
                }
               
                ++tx;
            }
            
            ++ty;
        }
        
    };
    
    Texture.RGBA5551 = 0x17;
    
    Texture.LA8 = 0x23;
    Texture.readers[Texture.LA8] = function (data, format, width, height, image) {
        
        let dataOffset = 0;
        
        let ty = 0;
        while (ty < height / 8) {
            let tx = 0;
            while (tx < width / 8) {
                
                let p = 0;
                while (p < 64) {
                    
                    let x = TILE_ORDER[p] % 8;
                    let y = (TILE_ORDER[p] - x) / 8;
                    
                    let offset = ((tx * 8) + x + (ty * 8 + y) * width) * 4;
                    
                    image[offset] = data[dataOffset];
                    image[offset + 1] = data[dataOffset + 1];
                    image[offset + 2] = data[dataOffset + 1];
                    image[offset + 3] = data[dataOffset + 1];
                    
                    dataOffset += 2;
                    
                    ++p;
                }
               
                ++tx;
            }
            
            ++ty;
        }
        
    };
    
    Texture.HILO8 = 0x24;
    Texture.readers[Texture.HILO8] = Texture.readers[Texture.L8];
    
    Texture.L8 = 0x25;
    Texture.readers[Texture.L8] = function (data, format, width, height, image) {
        
        let dataOffset = 0;
        
        let ty = 0;
        while (ty < height / 8) {
            let tx = 0;
            while (tx < width / 8) {
                
                let p = 0;
                while (p < 64) {
                    
                    let x = TILE_ORDER[p] % 8;
                    let y = (TILE_ORDER[p] - x) / 8;
                    
                    let offset = ((tx * 8) + x + (ty * 8 + y) * width) * 4;
                     
                    image[offset] = 0xff;
                    image[offset + 1] = data[dataOffset];
                    image[offset + 2] = data[dataOffset];
                    image[offset + 3] = data[dataOffset];
                     
                    ++dataOffset;
                    
                    ++p;
                }
                
                ++tx;
            }
             
            ++ty;
        }
         
    };
    
    Texture.A8 = 0x26;
    
    Texture.LA4 = 0x27;
    Texture.readers[Texture.LA4] = function (data, format, width, height, image) {
        
        let dataOffset = 0;
        
        let ty = 0;
        while (ty < height / 8) {
            let tx = 0;
            while (tx < width / 8) {
                
                let p = 0;
                while (p < 64) {
                    
                    let x = TILE_ORDER[p] % 8;
                    let y = (TILE_ORDER[p] - x) / 8;
                    
                    let offset = ((tx * 8) + x + (ty * 8 + y) * width) * 4;
                    
                    let a = data[dataOffset] & 0xf;
                    let c = data[dataOffset] >> 4;
                    
                    image[offset] = (a << 4) | a;
                    image[offset + 1] = (c << 4) | c;
                    image[offset + 2] = (c << 4) | c;
                    image[offset + 3] = (c << 4) | c;
                    
                    ++dataOffset;
                    
                    ++p;
                }
               
                ++tx;
            }
            
            ++ty;
        }
        
    };
    
    Texture.L4 = 0x28;
    Texture.readers[Texture.L4] = function (data, format, width, height, image) {
        
        let dataOffset = 0;
        
        let toggle = false;
        let ty = 0;
        while (ty < height / 8) {
            let tx = 0;
            while (tx < width / 8) {
                
                let p = 0;
                while (p < 64) {
                    
                    let x = TILE_ORDER[p] % 8;
                    let y = (TILE_ORDER[p] - x) / 8;
                    
                    let offset = ((tx * 8) + x + (ty * 8 + y) * width) * 4;
                    
                    let c = toggle ? ((data[dataOffset++] & 0xf0) >> 4) : (data[dataOffset] & 0xf);
                    
                    toggle = !toggle;
                    
                    c = ((c << 4) | c);
                    
                    image[offset] = 0xff;
                    image[offset + 1] = c;
                    image[offset + 2] = c;
                    image[offset + 3] = c;
                    
                    ++p;
                }
               
                ++tx;
            }
            
            ++ty;
        }
        
    };
    
    Texture.A4 = 0x29;
    
    Texture.ETC1 = 0x2a;
    Texture.readers[Texture.ETC1] = function (data, format, width, height, image) {
         
        // the paper of the etc1 alogrithm
        // http://www.jacobstrom.com/publications/StromAkenineGH05.pdf
        
        const lut = [
            [   -8,   -2,    2,    8],
            [  -17,   -5,    5,   17],
            [  -29,   -9,    9,   29],
            [  -42,  -13,   13,   42],
            [  -60,  -18,   18,   60],
            [  -80,  -24,   24,   80],
            [ -106,  -33,   33,  106],
            [ -183,  -47,   47,  183]
        ];
        
        const decodeAlpha = function (offset, x, y) {
            
            let alpha = (data[offset + (x << 1) + (y >> 1)] >> (4 * (y & 0x1))) & 0xf;
            
            return alpha | (alpha << 4);
            
        };
        
        const decodePixel = function (r, g, b, x, y, colors, table) {
            
            let pixel = lut[table][(colors[x] >> (y * 2)) & 0x3];
            
            return [
                Math.min(Math.max(b + pixel, 0), 255), 
                Math.min(Math.max(g + pixel, 0), 255), 
                Math.min(Math.max(r + pixel, 0), 255)];
             
        };
        
        const signed = function (value) {
            
            if (value > 127) {
                // 255 => -1
                // 254 => -2
                // 128 => -128
                return value - 256;
            } else {
                return value;
            }
            
        };
        
        const decodeTile = function (offset) {
             
            // 63 -> 56: data[offset + 7]                       => r
            // 55 -> 48: data[offset + 6]                       => g
            // 47 -> 40: data[offset + 5]                       => b
            // 39 -> 37: data[offset + 4] >> 4                  => table 1
            // 36 -> 34: (data[offset + 4] >> 2) & 0x3          => table 2
            // 33:       data[offset + 4] & 0x2                 => diff
            // 32:       data[offset + 4] & 0x1                 => flip
            // 31 -> 16: data[offset + 2]                       => color 1
            // 15 -> 0:  data[offset]                           => color 2
            
            let color1Bit = offset;
            let color2Bit = offset + 2;
            let configBit = offset + 4;
            let bBit = offset + 5;
            let gBit = offset + 6;
            let rBit = offset + 7;
            
            let flip = (data[configBit] & 0x1) !== 0;
            let diff = (data[configBit] & 0x2) !== 0;
 
            let table1 = (data[configBit] >> 4) & 0x7;
            let table2 = (data[configBit] >> 2) & 0x7;
            
            let colors = [data[color1Bit + 1], data[color1Bit], data[color2Bit + 1], data[color2Bit]];

            let r = data[rBit];
            let g = data[gBit];
            let b = data[bBit];

            let r1, g1, b1; // color1
            let r2, g2, b2; // color2
           
            if (diff) {
                // abc de fgh => abc de
                // abc de fgh => abc de + signed(fgh)
                // abc de => abc de abc
                b1 = b & 0xf8; b1 |= b1 >> 5;
                g1 = g & 0xf8; g1 |= g1 >> 5;
                r1 = r & 0xf8; r1 |= r1 >> 5;
                b2 = (b >> 3) + (signed((b & 0x07) << 5) >> 5); b2 = (b2 << 3) | (b2 >> 2);
                g2 = (g >> 3) + (signed((g & 0x07) << 5) >> 5); g2 = (g2 << 3) | (g2 >> 2);
                r2 = (r >> 3) + (signed((r & 0x07) << 5) >> 5); r2 = (r2 << 3) | (r2 >> 2);
            } else {
                // abcd efgh => abcd
                // abcd efgh => efgh
                // abcd => abcd abcd
                b1 = b & 0xf0; b1 |= b1 >> 4;
                g1 = g & 0xf0; g1 |= g1 >> 4;
                r1 = r & 0xf0; r1 |= r1 >> 4;
                b2 = (b & 0x0f) << 4; b2 |= b2 >> 4;
                g2 = (g & 0x0f) << 4; g2 |= g2 >> 4;
                r2 = (r & 0x0f) << 4; r2 |= r2 >> 4;
            }

            let output = [];

            if (!flip) {
                let y = 0;
                while (y < 4) {
                    let x = 0;
                    while (x < 2) {
                        
                        let color1 = decodePixel(r1, g1, b1, x + 0, y, colors, table1);
                        let offset1 = (y * 4 + x) * 4;
                        output[offset1 + 0] = color1[2];
                        output[offset1 + 1] = color1[1];
                        output[offset1 + 2] = color1[0];
                        output[offset1 + 3] = Math.round((color1[2] + color1[1] + color1[0]) / 3);
                        if (output[offset1 + 3] < 0x44) {
                            output[offset1 + 3] = 0;
                        }
                        // output[offset1 + 3] = decodeAlpha(offset, x + 0, y);

                        let color2 = decodePixel(r2, g2, b2, x + 2, y, colors, table2);
                        let offset2 = (y * 4 + x + 2) * 4;
                        output[offset2 + 0] = color2[2];
                        output[offset2 + 1] = color2[1];
                        output[offset2 + 2] = color2[0];
                        output[offset2 + 3] = Math.round((color2[2] + color2[1] + color2[0]) / 3);
                        if (output[offset2 + 3] < 0x44) {
                            output[offset2 + 3] = 0;
                        }
                        // output[offset2 + 3] = decodeAlpha(offset, x + 2, y);
                        // output[offset2 + 3] = 0xff;
                        
                        ++x;
                    }
                    ++y;
                }
            } else {
                let y = 0;
                while (y < 2) {
                    let x = 0;
                    while (x < 4) {
                        
                        let color1 = decodePixel(r1, g1, b1, x, y + 0, colors, table1);
                        let offset1 = (y * 4 + x) * 4;
                        output[offset1 + 0] = color1[2];
                        output[offset1 + 1] = color1[1];
                        output[offset1 + 2] = color1[0];
                        output[offset1 + 3] = Math.round((color1[2] + color1[1] + color1[0]) / 3);
                        if (output[offset1 + 3] < 0x44) {
                            output[offset1 + 3] = 0;
                        }

                        let color2 = decodePixel(r2, g2, b2, x, y + 2, colors, table2);
                        let offset2 = ((y + 2) * 4 + x) * 4;
                        output[offset2 + 0] = color2[2];
                        output[offset2 + 1] = color2[1];
                        output[offset2 + 2] = color2[0];
                        output[offset2 + 3] = Math.round((color2[2] + color2[1] + color2[0]) / 3);
                        if (output[offset2 + 3] < 0x44) {
                            output[offset2 + 3] = 0;
                        }
                        
                        ++x;
                    }
                    ++y;
                }
            }
            
            return output;

        };
        
        const xt = [0, 4, 0, 4];
        const yt = [0, 0, 4, 4];
       
        let offset = 0;
        
        let ty = 0;
        while (ty < height) {
            let tx = 0;
            while (tx < width) {
                
                let t = 0;
                while (t < 4) {
                    
                    let tile = decodeTile(offset);
                    offset += 8;
                    
                    let tileOffset = 0;
                    let py = yt[t];
                    while (py < 4 + yt[t]) {
                        let px = xt[t];
                        while (px < 4 + xt[t]) {
                            
                            let pixel = ((ty + py) * width + tx + px) * 4;

                            image[pixel + 0] = tile[tileOffset + 3];
                            image[pixel + 1] = tile[tileOffset + 0];
                            image[pixel + 2] = tile[tileOffset + 1];
                            image[pixel + 3] = tile[tileOffset + 2];

                            tileOffset += 4;
                            
                            ++px;
                        }
                        ++py;
                    }
                    
                    ++t;
                }
                
                tx += 8;
            }
            ty += 8;
        }
       
    };
    
    Texture.ETC1A4 = 0x2b;
    Texture.readers[Texture.ETC1A4] = function (data, format, width, height, image) {
         
        // the paper of the etc1 alogrithm
        // http://www.jacobstrom.com/publications/StromAkenineGH05.pdf
        
        const lut = [
            [   -8,   -2,    2,    8],
            [  -17,   -5,    5,   17],
            [  -29,   -9,    9,   29],
            [  -42,  -13,   13,   42],
            [  -60,  -18,   18,   60],
            [  -80,  -24,   24,   80],
            [ -106,  -33,   33,  106],
            [ -183,  -47,   47,  183]
        ];
        
        const decodePixel = function (r, g, b, x, y, colors, table) {
            
            let pixel = lut[table][(colors[x] >> (y * 2)) & 0x3];
            
            return [
                Math.min(Math.max(b + pixel, 0), 255), 
                Math.min(Math.max(g + pixel, 0), 255), 
                Math.min(Math.max(r + pixel, 0), 255)];
            
        };
        
        const decodeAlpha = function (offset, x, y) {
            
            let alpha = (data[offset + (x << 1) + (y >> 1)] >> (4 * (y & 0x1))) & 0xf;
            
            return alpha | (alpha << 4);
            
        };
        
        const signed = function (value) {
            
            if (value > 127) {
                // 255 => -1
                // 254 => -2
                // 128 => -128
                return value - 256;
            } else {
                return value;
            }
            
        };
        
        const decodeTile = function (offset) {
             
            // 63 -> 56: data[offset + 7]                       => r
            // 55 -> 48: data[offset + 6]                       => g
            // 47 -> 40: data[offset + 5]                       => b
            // 39 -> 37: data[offset + 4] >> 4                  => table 1
            // 36 -> 34: (data[offset + 4] >> 2) & 0x3          => table 2
            // 33:       data[offset + 4] & 0x2                 => diff
            // 32:       data[offset + 4] & 0x1                 => flip
            // 31 -> 16: data[offset + 2]                       => color 1
            // 15 -> 0:  data[offset]                           => color 2
           
            let color1Bit = offset + 8;
            let color2Bit = offset + 10;
            let configBit = offset + 12;
            let bBit = offset + 13;
            let gBit = offset + 14;
            let rBit = offset + 15;
            
            let flip = (data[configBit] & 0x1) !== 0;
            let diff = (data[configBit] & 0x2) !== 0;
    
            let table1 = (data[configBit] >> 4) & 0x7;
            let table2 = (data[configBit] >> 2) & 0x7;
            
            let colors = [data[color1Bit], data[color1Bit + 1], data[color2Bit], data[color2Bit + 1]];
    
            let r = data[rBit];
            let g = data[gBit];
            let b = data[bBit];
    
            let r1, g1, b1; // color1
            let r2, g2, b2; // color2
           
            if (diff) {
                // abc de fgh => abc de
                // abc de fgh => abc de + signed(fgh)
                // abc de => abc de abc
                b1 = b & 0xf8; b1 |= b1 >> 5;
                g1 = g & 0xf8; g1 |= g1 >> 5;
                r1 = r & 0xf8; r1 |= r1 >> 5;
                b2 = (b >> 3) + (signed((b & 0x07) << 5) >> 5); b2 = (b2 << 3) | (b2 >> 2);
                g2 = (g >> 3) + (signed((g & 0x07) << 5) >> 5); g2 = (g2 << 3) | (g2 >> 2);
                r2 = (r >> 3) + (signed((r & 0x07) << 5) >> 5); r2 = (r2 << 3) | (r2 >> 2);
            } else {
                // abcd efgh => abcd
                // abcd efgh => efgh
                // abcd => abcd abcd
                b1 = b & 0xf0; b1 |= b1 >> 4;
                g1 = g & 0xf0; g1 |= g1 >> 4;
                r1 = r & 0xf0; r1 |= r1 >> 4;
                b2 = (b & 0x0f) << 4; b2 |= b2 >> 4;
                g2 = (g & 0x0f) << 4; g2 |= g2 >> 4;
                r2 = (r & 0x0f) << 4; r2 |= r2 >> 4;
            }
            
            let output = [];
    
            if (!flip) {
                let y = 0;
                while (y < 4) {
                    let x = 0;
                    while (x < 2) {
                        
                        let color1 = decodePixel(r1, g1, b1, x + 0, y, colors, table1);
                        let offset1 = (y * 4 + x) * 4;
                        output[offset1 + 0] = color1[2];
                        output[offset1 + 1] = color1[1];
                        output[offset1 + 2] = color1[0];
                        output[offset1 + 3] = decodeAlpha(offset, x + 0, y);
    
                        let color2 = decodePixel(r2, g2, b2, x + 2, y, colors, table2);
                        let offset2 = (y * 4 + x + 2) * 4;
                        output[offset2 + 0] = color2[2];
                        output[offset2 + 1] = color2[1];
                        output[offset2 + 2] = color2[0];
                        output[offset2 + 3] = decodeAlpha(offset, x + 2, y);
                        
                        ++x;
                    }
                    ++y;
                }
            } else {
                let y = 0;
                while (y < 2) {
                    let x = 0;
                    while (x < 4) {
                        
                        let color1 = decodePixel(r1, g1, b1, x, y + 0, colors, table1);
                        let offset1 = (y * 4 + x) * 4;
                        output[offset1 + 0] = color1[2];
                        output[offset1 + 1] = color1[1];
                        output[offset1 + 2] = color1[0];
                        output[offset1 + 3] = decodeAlpha(offset, x, y + 0);
    
                        let color2 = decodePixel(r2, g2, b2, x, y + 2, colors, table2);
                        let offset2 = ((y + 2) * 4 + x) * 4;
                        output[offset2 + 0] = color2[2];
                        output[offset2 + 1] = color2[1];
                        output[offset2 + 2] = color2[0];
                        output[offset2 + 3] = decodeAlpha(offset, x, y + 2);
                        
                        ++x;
                    }
                    ++y;
                }
            }
            
            return output;
    
        };
        
        const xt = [0, 4, 0, 4];
        const yt = [0, 0, 4, 4];
       
        let offset = 0;
        
        let ty = 0;
        while (ty < height) {
            let tx = 0;
            while (tx < width) {
                
                let t = 0;
                while (t < 4) {
                    
                    let tile = decodeTile(offset);
                    offset += 16;
                    
                    let tileOffset = 0;
                    let py = yt[t];
                    while (py < 4 + yt[t]) {
                        let px = xt[t];
                        while (px < 4 + xt[t]) {
                            
                            let pixel = ((ty + py) * width + tx + px) * 4;
    
                            image[pixel + 0] = tile[tileOffset + 3];
                            image[pixel + 1] = tile[tileOffset + 0];
                            image[pixel + 2] = tile[tileOffset + 1];
                            image[pixel + 3] = tile[tileOffset + 2];
                            
                            tileOffset += 4;
                            
                            ++px;
                        }
                        ++py;
                    }
                    
                    ++t;
                }
                
                tx += 8;
            }
            ty += 8;
        }
       
    };

    Texture.prototype.getPixels = function () {
        
        if (Texture.readers[this.format]) {
            
            let image = new Uint8Array(this.width * this.height * 4);
            
            Texture.readers[this.format](this.data, this.format, this.width, this.height, image);
            
            return image;
        
        } else {
            throw new Error("Unsupported texture file format " + this.format);
        }
        
    };
    
    Texture.prototype.toImage = function () {
        
        const dom = new Image();
        
        dom.title = this.name;
        
        dom.src = this.toImageURL();
        
        return dom;
        
    };
    
    Texture.prototype.toImageURL = function () {
        
        return this.toCanvas().toDataURL();
        
    };
    
    Texture.prototype.toCanvas = function () {
        
        var canvas = document.createElement("canvas");
        
        canvas.width = this.width;
        canvas.height = this.height;
        canvas.name = this.name;
    
        var context = canvas.getContext("2d");
        
        var imageData = context.createImageData(this.width, this.height);
        
        let pixels = this.getPixels();
        
        let looper = 0;
        while (looper < pixels.length) {
            imageData.data[looper] = pixels[looper + 1];
            imageData.data[looper + 1] = pixels[looper + 2];
            imageData.data[looper + 2] = pixels[looper + 3];
            imageData.data[looper + 3] = pixels[looper];
            looper += 4;
        }
        
        context.putImageData(imageData, 0, 0);
        
        return canvas;
        
    };
    
    module.exports = Texture;
    
})(this, this.$);
