((global, $) => {
    
    // reader, length
    // instructs 
    const PICA = function PICA(reader, length) {
        
        this.commands = {
            "buffers": [[], []],
            "offsets": [0, 0],
            "sizes": [0, 0],
            "states": ["ready", "ready"],
        };
        this.commands.current = this.commands.buffers[0];
        
        this.parse(reader, length);
       
    };
    
    PICA.prototype.parse = function (reader, length) {
         
        let instructs;
        if (length) {
            instructs = [];
            let looper = 0;
            while (looper < length / 4) {
                instructs[looper] = reader.readUint32();
                ++looper;
            }
        } else {
            instructs = reader;
        }
        
        let commands = [];
        
        let looper = 0;
        while (looper < instructs.length) {
            
            let parameter = instructs[looper++];
            let command = instructs[looper++];
            
            let id = (command >> 0) & 0xffff;
            let mask = (command >> 16) & 0xf;
            let extraParameters = (command >> 20) & 0x7ff;
            let consecutive = (command >> 31) !== 0;

            if (consecutive) {
                
                let looper2 = 0;
                while (looper2 <= extraParameters) {
                    
                    let pica = {
                        "register": id++, // PICARegister
                        "parameters": [parameter],
                        "mask": mask
                    };
                    
                    commands.push(pica);
                    if (looper2 < extraParameters) {
                        parameter = instructs[looper++];
                    }
                    
                    ++looper2;
                }
               
            } else {
                
                let parameters = [parameter];
                let looper2 = 0;
                while (looper2 < extraParameters) {
                    parameters.push(instructs[looper++]);
                    ++looper2;
                }

                let pica = {
                    "register": id,
                    "parameters": parameters,
                    "mask": mask
                };
                    
                commands.push(pica);

            }
            
            if ((looper & 1) !== 0) {
                looper++;
            }
            
        }
       
        this.decode(commands);
        
    };
    
    PICA.prototype.decode = function (commands) {
         
        let looper = 0;
        while (looper < commands.length) {
            
            let command = commands[looper];
            
            this.commands.current.push(command);
            
            if (PICA.commands[command.register]) {
                PICA.commands[command.register].call(this, command);
            } else {
                let key = Object.keys(PICA).filter((key) => PICA[key] === command.register)[0];
                if (key) {
                    if (!PICA.unprocessed[key]) {
                        PICA.unprocessed[key] = true;
                        $.warn("Unprocessed PICA command " + key); 
                    }
                } else {
                    $.warn("Unprocessed PICA command " + command.register); 
                }
            }
            
            ++looper;
        }
        
    };
    
    PICA.unprocessed = {};
     
    PICA.GPUREG_DUMMY                           = 0x0000;
    PICA.GPUREG_FINALIZE                        = 0x0010;
    PICA.GPUREG_FACECULLING_CONFIG              = 0x0040;
    PICA.GPUREG_VIEWPORT_WIDTH                  = 0x0041;
    PICA.GPUREG_VIEWPORT_INVW                   = 0x0042;
    PICA.GPUREG_VIEWPORT_HEIGHT                 = 0x0043;
    PICA.GPUREG_VIEWPORT_INVH                   = 0x0044;
    PICA.GPUREG_FRAGOP_CLIP                     = 0x0047;
    PICA.GPUREG_FRAGOP_CLIP_DATA0               = 0x0048;
    PICA.GPUREG_FRAGOP_CLIP_DATA1               = 0x0049;
    PICA.GPUREG_FRAGOP_CLIP_DATA2               = 0x004A;
    PICA.GPUREG_FRAGOP_CLIP_DATA3               = 0x004B;
    PICA.GPUREG_DEPTHMAP_SCALE                  = 0x004D;
    PICA.GPUREG_DEPTHMAP_OFFSET                 = 0x004E;
    PICA.GPUREG_SH_OUTMAP_TOTAL                 = 0x004F;
    PICA.GPUREG_SH_OUTMAP_O0                    = 0x0050;
    PICA.GPUREG_SH_OUTMAP_O1                    = 0x0051;
    PICA.GPUREG_SH_OUTMAP_O2                    = 0x0052;
    PICA.GPUREG_SH_OUTMAP_O3                    = 0x0053;
    PICA.GPUREG_SH_OUTMAP_O4                    = 0x0054;
    PICA.GPUREG_SH_OUTMAP_O5                    = 0x0055;
    PICA.GPUREG_SH_OUTMAP_O6                    = 0x0056;
    PICA.GPUREG_EARLYDEPTH_FUNC                 = 0x0061;
    PICA.GPUREG_EARLYDEPTH_TEST1                = 0x0062;
    PICA.GPUREG_EARLYDEPTH_CLEAR                = 0x0063;
    PICA.GPUREG_SH_OUTATTR_MODE                 = 0x0064;
    PICA.GPUREG_SCISSORTEST_MODE                = 0x0065;
    PICA.GPUREG_SCISSORTEST_POS                 = 0x0066;
    PICA.GPUREG_SCISSORTEST_DIM                 = 0x0067;
    PICA.GPUREG_VIEWPORT_XY                     = 0x0068;
    PICA.GPUREG_EARLYDEPTH_DATA                 = 0x006A;
    PICA.GPUREG_DEPTHMAP_ENABLE                 = 0x006D;
    PICA.GPUREG_RENDERBUF_DIM                   = 0x006E;
    PICA.GPUREG_SH_OUTATTR_CLOCK                = 0x006F;
    PICA.GPUREG_TEXUNIT_CONFIG                  = 0x0080;
    PICA.GPUREG_TEXUNIT0_BORDER_COLOR           = 0x0081;
    PICA.GPUREG_TEXUNIT0_DIM                    = 0x0082;
    PICA.GPUREG_TEXUNIT0_PARAM                  = 0x0083;
    PICA.GPUREG_TEXUNIT0_LOD                    = 0x0084;
    PICA.GPUREG_TEXUNIT0_ADDR1                  = 0x0085;
    PICA.GPUREG_TEXUNIT0_ADDR2                  = 0x0086;
    PICA.GPUREG_TEXUNIT0_ADDR3                  = 0x0087;
    PICA.GPUREG_TEXUNIT0_ADDR4                  = 0x0088;
    PICA.GPUREG_TEXUNIT0_ADDR5                  = 0x0089;
    PICA.GPUREG_TEXUNIT0_ADDR6                  = 0x008A;
    PICA.GPUREG_TEXUNIT0_SHADOW                 = 0x008B;
    PICA.GPUREG_TEXUNIT0_TYPE                   = 0x008E;
    PICA.GPUREG_LIGHTING_ENABLE0                = 0x008F;
    PICA.GPUREG_TEXUNIT1_BORDER_COLOR           = 0x0091;
    PICA.GPUREG_TEXUNIT1_DIM                    = 0x0092;
    PICA.GPUREG_TEXUNIT1_PARAM                  = 0x0093;
    PICA.GPUREG_TEXUNIT1_LOD                    = 0x0094;
    PICA.GPUREG_TEXUNIT1_ADDR                   = 0x0095;
    PICA.GPUREG_TEXUNIT1_TYPE                   = 0x0096;
    PICA.GPUREG_TEXUNIT2_BORDER_COLOR           = 0x0099;
    PICA.GPUREG_TEXUNIT2_DIM                    = 0x009A;
    PICA.GPUREG_TEXUNIT2_PARAM                  = 0x009B;
    PICA.GPUREG_TEXUNIT2_LOD                    = 0x009C;
    PICA.GPUREG_TEXUNIT2_ADDR                   = 0x009D;
    PICA.GPUREG_TEXUNIT2_TYPE                   = 0x009E;
    PICA.GPUREG_TEXUNIT3_PROCTEX0               = 0x00A8;
    PICA.GPUREG_TEXUNIT3_PROCTEX1               = 0x00A9;
    PICA.GPUREG_TEXUNIT3_PROCTEX2               = 0x00AA;
    PICA.GPUREG_TEXUNIT3_PROCTEX3               = 0x00AB;
    PICA.GPUREG_TEXUNIT3_PROCTEX4               = 0x00AC;
    PICA.GPUREG_TEXUNIT3_PROCTEX5               = 0x00AD;
    PICA.GPUREG_PROCTEX_LUT                     = 0x00AF;
    PICA.GPUREG_PROCTEX_LUT_DATA0               = 0x00B0;
    PICA.GPUREG_PROCTEX_LUT_DATA1               = 0x00B1;
    PICA.GPUREG_PROCTEX_LUT_DATA2               = 0x00B2;
    PICA.GPUREG_PROCTEX_LUT_DATA3               = 0x00B3;
    PICA.GPUREG_PROCTEX_LUT_DATA4               = 0x00B4;
    PICA.GPUREG_PROCTEX_LUT_DATA5               = 0x00B5;
    PICA.GPUREG_PROCTEX_LUT_DATA6               = 0x00B6;
    PICA.GPUREG_PROCTEX_LUT_DATA7               = 0x00B7;
    PICA.GPUREG_TEXENV0_SOURCE                  = 0x00C0;
    PICA.GPUREG_TEXENV0_OPERAND                 = 0x00C1;
    PICA.GPUREG_TEXENV0_COMBINER                = 0x00C2;
    PICA.GPUREG_TEXENV0_COLOR                   = 0x00C3;
    PICA.GPUREG_TEXENV0_SCALE                   = 0x00C4;
    PICA.GPUREG_TEXENV1_SOURCE                  = 0x00C8;
    PICA.GPUREG_TEXENV1_OPERAND                 = 0x00C9;
    PICA.GPUREG_TEXENV1_COMBINER                = 0x00CA;
    PICA.GPUREG_TEXENV1_COLOR                   = 0x00CB;
    PICA.GPUREG_TEXENV1_SCALE                   = 0x00CC;
    PICA.GPUREG_TEXENV2_SOURCE                  = 0x00D0;
    PICA.GPUREG_TEXENV2_OPERAND                 = 0x00D1;
    PICA.GPUREG_TEXENV2_COMBINER                = 0x00D2;
    PICA.GPUREG_TEXENV2_COLOR                   = 0x00D3;
    PICA.GPUREG_TEXENV2_SCALE                   = 0x00D4;
    PICA.GPUREG_TEXENV3_SOURCE                  = 0x00D8;
    PICA.GPUREG_TEXENV3_OPERAND                 = 0x00D9;
    PICA.GPUREG_TEXENV3_COMBINER                = 0x00DA;
    PICA.GPUREG_TEXENV3_COLOR                   = 0x00DB;
    PICA.GPUREG_TEXENV3_SCALE                   = 0x00DC;
    PICA.GPUREG_TEXENV_UPDATE_BUFFER            = 0x00E0;
    PICA.GPUREG_FOG_COLOR                       = 0x00E1;
    PICA.GPUREG_GAS_ATTENUATION                 = 0x00E4;
    PICA.GPUREG_GAS_ACCMAX                      = 0x00E5;
    PICA.GPUREG_FOG_LUT_INDEX                   = 0x00E6;
    PICA.GPUREG_FOG_LUT_DATA0                   = 0x00E8;
    PICA.GPUREG_FOG_LUT_DATA1                   = 0x00E9;
    PICA.GPUREG_FOG_LUT_DATA2                   = 0x00EA;
    PICA.GPUREG_FOG_LUT_DATA3                   = 0x00EB;
    PICA.GPUREG_FOG_LUT_DATA4                   = 0x00EC;
    PICA.GPUREG_FOG_LUT_DATA5                   = 0x00ED;
    PICA.GPUREG_FOG_LUT_DATA6                   = 0x00EE;
    PICA.GPUREG_FOG_LUT_DATA7                   = 0x00EF;
    PICA.GPUREG_TEXENV4_SOURCE                  = 0x00F0;
    PICA.GPUREG_TEXENV4_OPERAND                 = 0x00F1;
    PICA.GPUREG_TEXENV4_COMBINER                = 0x00F2;
    PICA.GPUREG_TEXENV4_COLOR                   = 0x00F3;
    PICA.GPUREG_TEXENV4_SCALE                   = 0x00F4;
    PICA.GPUREG_TEXENV5_SOURCE                  = 0x00F8;
    PICA.GPUREG_TEXENV5_OPERAND                 = 0x00F9;
    PICA.GPUREG_TEXENV5_COMBINER                = 0x00FA;
    PICA.GPUREG_TEXENV5_COLOR                   = 0x00FB;
    PICA.GPUREG_TEXENV5_SCALE                   = 0x00FC;
    PICA.GPUREG_TEXENV_BUFFER_COLOR             = 0x00FD;
    PICA.GPUREG_COLOR_OPERATION                 = 0x0100;
    PICA.GPUREG_BLEND_FUNC                      = 0x0101;
    PICA.GPUREG_LOGIC_OP                        = 0x0102;
    PICA.GPUREG_BLEND_COLOR                     = 0x0103;
    PICA.GPUREG_FRAGOP_ALPHA_TEST               = 0x0104;
    PICA.GPUREG_STENCIL_TEST                    = 0x0105;
    PICA.GPUREG_STENCIL_OP                      = 0x0106;
    PICA.GPUREG_DEPTH_COLOR_MASK                = 0x0107;
    PICA.GPUREG_FRAMEBUFFER_INVALIDATE          = 0x0110;
    PICA.GPUREG_FRAMEBUFFER_FLUSH               = 0x0111;
    PICA.GPUREG_COLORBUFFER_READ                = 0x0112;
    PICA.GPUREG_COLORBUFFER_WRITE               = 0x0113;
    PICA.GPUREG_DEPTHBUFFER_READ                = 0x0114;
    PICA.GPUREG_DEPTHBUFFER_WRITE               = 0x0115;
    PICA.GPUREG_DEPTHBUFFER_FORMAT              = 0x0116;
    PICA.GPUREG_COLORBUFFER_FORMAT              = 0x0117;
    PICA.GPUREG_EARLYDEPTH_TEST2                = 0x0118;
    PICA.GPUREG_FRAMEBUFFER_BLOCK32             = 0x011B;
    PICA.GPUREG_DEPTHBUFFER_LOC                 = 0x011C;
    PICA.GPUREG_COLORBUFFER_LOC                 = 0x011D;
    PICA.GPUREG_FRAMEBUFFER_DIM                 = 0x011E;
    PICA.GPUREG_GAS_LIGHT_XY                    = 0x0120;
    PICA.GPUREG_GAS_LIGHT_Z                     = 0x0121;
    PICA.GPUREG_GAS_LIGHT_Z_COLOR               = 0x0122;
    PICA.GPUREG_GAS_LUT_INDEX                   = 0x0123;
    PICA.GPUREG_GAS_LUT_DATA                    = 0x0124;
    PICA.GPUREG_GAS_DELTAZ_DEPTH                = 0x0126;
    PICA.GPUREG_FRAGOP_SHADOW                   = 0x0130;
    PICA.GPUREG_LIGHT0_SPECULAR0                = 0x0140;
    PICA.GPUREG_LIGHT0_SPECULAR1                = 0x0141;
    PICA.GPUREG_LIGHT0_DIFFUSE                  = 0x0142;
    PICA.GPUREG_LIGHT0_AMBIENT                  = 0x0143;
    PICA.GPUREG_LIGHT0_XY                       = 0x0144;
    PICA.GPUREG_LIGHT0_Z                        = 0x0145;
    PICA.GPUREG_LIGHT0_SPOTDIR_XY               = 0x0146;
    PICA.GPUREG_LIGHT0_SPOTDIR_Z                = 0x0147;
    PICA.GPUREG_LIGHT0_CONFIG                   = 0x0149;
    PICA.GPUREG_LIGHT0_ATTENUATION_BIAS         = 0x014A;
    PICA.GPUREG_LIGHT0_ATTENUATION_SCALE        = 0x014B;
    PICA.GPUREG_LIGHT1_SPECULAR0                = 0x0150;
    PICA.GPUREG_LIGHT1_SPECULAR1                = 0x0151;
    PICA.GPUREG_LIGHT1_DIFFUSE                  = 0x0152;
    PICA.GPUREG_LIGHT1_AMBIENT                  = 0x0153;
    PICA.GPUREG_LIGHT1_XY                       = 0x0154;
    PICA.GPUREG_LIGHT1_Z                        = 0x0155;
    PICA.GPUREG_LIGHT1_SPOTDIR_XY               = 0x0156;
    PICA.GPUREG_LIGHT1_SPOTDIR_Z                = 0x0157;
    PICA.GPUREG_LIGHT1_CONFIG                   = 0x0159;
    PICA.GPUREG_LIGHT1_ATTENUATION_BIAS         = 0x015A;
    PICA.GPUREG_LIGHT1_ATTENUATION_SCALE        = 0x015B;
    PICA.GPUREG_LIGHT2_SPECULAR0                = 0x0160;
    PICA.GPUREG_LIGHT2_SPECULAR1                = 0x0161;
    PICA.GPUREG_LIGHT2_DIFFUSE                  = 0x0162;
    PICA.GPUREG_LIGHT2_AMBIENT                  = 0x0163;
    PICA.GPUREG_LIGHT2_XY                       = 0x0164;
    PICA.GPUREG_LIGHT2_Z                        = 0x0165;
    PICA.GPUREG_LIGHT2_SPOTDIR_XY               = 0x0166;
    PICA.GPUREG_LIGHT2_SPOTDIR_Z                = 0x0167;
    PICA.GPUREG_LIGHT2_CONFIG                   = 0x0169;
    PICA.GPUREG_LIGHT2_ATTENUATION_BIAS         = 0x016A;
    PICA.GPUREG_LIGHT2_ATTENUATION_SCALE        = 0x016B;
    PICA.GPUREG_LIGHT3_SPECULAR0                = 0x0170;
    PICA.GPUREG_LIGHT3_SPECULAR1                = 0x0171;
    PICA.GPUREG_LIGHT3_DIFFUSE                  = 0x0172;
    PICA.GPUREG_LIGHT3_AMBIENT                  = 0x0173;
    PICA.GPUREG_LIGHT3_XY                       = 0x0174;
    PICA.GPUREG_LIGHT3_Z                        = 0x0175;
    PICA.GPUREG_LIGHT3_SPOTDIR_XY               = 0x0176;
    PICA.GPUREG_LIGHT3_SPOTDIR_Z                = 0x0177;
    PICA.GPUREG_LIGHT3_CONFIG                   = 0x0179;
    PICA.GPUREG_LIGHT3_ATTENUATION_BIAS         = 0x017A;
    PICA.GPUREG_LIGHT3_ATTENUATION_SCALE        = 0x017B;
    PICA.GPUREG_LIGHT4_SPECULAR0                = 0x0180;
    PICA.GPUREG_LIGHT4_SPECULAR1                = 0x0181;
    PICA.GPUREG_LIGHT4_DIFFUSE                  = 0x0182;
    PICA.GPUREG_LIGHT4_AMBIENT                  = 0x0183;
    PICA.GPUREG_LIGHT4_XY                       = 0x0184;
    PICA.GPUREG_LIGHT4_Z                        = 0x0185;
    PICA.GPUREG_LIGHT4_SPOTDIR_XY               = 0x0186;
    PICA.GPUREG_LIGHT4_SPOTDIR_Z                = 0x0187;
    PICA.GPUREG_LIGHT4_CONFIG                   = 0x0189;
    PICA.GPUREG_LIGHT4_ATTENUATION_BIAS         = 0x018A;
    PICA.GPUREG_LIGHT4_ATTENUATION_SCALE        = 0x018B;
    PICA.GPUREG_LIGHT5_SPECULAR0                = 0x0190;
    PICA.GPUREG_LIGHT5_SPECULAR1                = 0x0191;
    PICA.GPUREG_LIGHT5_DIFFUSE                  = 0x0192;
    PICA.GPUREG_LIGHT5_AMBIENT                  = 0x0193;
    PICA.GPUREG_LIGHT5_XY                       = 0x0194;
    PICA.GPUREG_LIGHT5_Z                        = 0x0195;
    PICA.GPUREG_LIGHT5_SPOTDIR_XY               = 0x0196;
    PICA.GPUREG_LIGHT5_SPOTDIR_Z                = 0x0197;
    PICA.GPUREG_LIGHT5_CONFIG                   = 0x0199;
    PICA.GPUREG_LIGHT5_ATTENUATION_BIAS         = 0x019A;
    PICA.GPUREG_LIGHT5_ATTENUATION_SCALE        = 0x019B;
    PICA.GPUREG_LIGHT6_SPECULAR0                = 0x01A0;
    PICA.GPUREG_LIGHT6_SPECULAR1                = 0x01A1;
    PICA.GPUREG_LIGHT6_DIFFUSE                  = 0x01A2;
    PICA.GPUREG_LIGHT6_AMBIENT                  = 0x01A3;
    PICA.GPUREG_LIGHT6_XY                       = 0x01A4;
    PICA.GPUREG_LIGHT6_Z                        = 0x01A5;
    PICA.GPUREG_LIGHT6_SPOTDIR_XY               = 0x01A6;
    PICA.GPUREG_LIGHT6_SPOTDIR_Z                = 0x01A7;
    PICA.GPUREG_LIGHT6_CONFIG                   = 0x01A9;
    PICA.GPUREG_LIGHT6_ATTENUATION_BIAS         = 0x01AA;
    PICA.GPUREG_LIGHT6_ATTENUATION_SCALE        = 0x01AB;
    PICA.GPUREG_LIGHT7_SPECULAR0                = 0x01B0;
    PICA.GPUREG_LIGHT7_SPECULAR1                = 0x01B1;
    PICA.GPUREG_LIGHT7_DIFFUSE                  = 0x01B2;
    PICA.GPUREG_LIGHT7_AMBIENT                  = 0x01B3;
    PICA.GPUREG_LIGHT7_XY                       = 0x01B4;
    PICA.GPUREG_LIGHT7_Z                        = 0x01B5;
    PICA.GPUREG_LIGHT7_SPOTDIR_XY               = 0x01B6;
    PICA.GPUREG_LIGHT7_SPOTDIR_Z                = 0x01B7;
    PICA.GPUREG_LIGHT7_CONFIG                   = 0x01B9;
    PICA.GPUREG_LIGHT7_ATTENUATION_BIAS         = 0x01BA;
    PICA.GPUREG_LIGHT7_ATTENUATION_SCALE        = 0x01BB;
    PICA.GPUREG_LIGHTING_AMBIENT                = 0x01C0;
    PICA.GPUREG_LIGHTING_NUM_LIGHTS             = 0x01C2;
    PICA.GPUREG_LIGHTING_CONFIG0                = 0x01C3;
    PICA.GPUREG_LIGHTING_CONFIG1                = 0x01C4;
    PICA.GPUREG_LIGHTING_LUT_INDEX              = 0x01C5;
    PICA.GPUREG_LIGHTING_ENABLE1                = 0x01C6;
    PICA.GPUREG_LIGHTING_LUT_DATA0              = 0x01C8;
    PICA.GPUREG_LIGHTING_LUT_DATA1              = 0x01C9;
    PICA.GPUREG_LIGHTING_LUT_DATA2              = 0x01CA;
    PICA.GPUREG_LIGHTING_LUT_DATA3              = 0x01CB;
    PICA.GPUREG_LIGHTING_LUT_DATA4              = 0x01CC;
    PICA.GPUREG_LIGHTING_LUT_DATA5              = 0x01CD;
    PICA.GPUREG_LIGHTING_LUT_DATA6              = 0x01CE;
    PICA.GPUREG_LIGHTING_LUT_DATA7              = 0x01CF;
    PICA.GPUREG_LIGHTING_LUTINPUT_ABS           = 0x01D0;
    PICA.GPUREG_LIGHTING_LUTINPUT_SELECT        = 0x01D1;
    PICA.GPUREG_LIGHTING_LUTINPUT_SCALE         = 0x01D2;
    PICA.GPUREG_LIGHTING_LIGHT_PERMUTATION      = 0x01D9;
    PICA.GPUREG_ATTRIBBUFFERS_LOC               = 0x0200;
    PICA.GPUREG_ATTRIBBUFFERS_FORMAT_LOW        = 0x0201;
    PICA.GPUREG_ATTRIBBUFFERS_FORMAT_HIGH       = 0x0202;
    PICA.GPUREG_ATTRIBBUFFER0_OFFSET            = 0x0203;
    PICA.GPUREG_ATTRIBBUFFER0_CONFIG1           = 0x0204;
    PICA.GPUREG_ATTRIBBUFFER0_CONFIG2           = 0x0205;
    PICA.GPUREG_ATTRIBBUFFER1_OFFSET            = 0x0206;
    PICA.GPUREG_ATTRIBBUFFER1_CONFIG1           = 0x0207;
    PICA.GPUREG_ATTRIBBUFFER1_CONFIG2           = 0x0208;
    PICA.GPUREG_ATTRIBBUFFER2_OFFSET            = 0x0209;
    PICA.GPUREG_ATTRIBBUFFER2_CONFIG1           = 0x020A;
    PICA.GPUREG_ATTRIBBUFFER2_CONFIG2           = 0x020B;
    PICA.GPUREG_ATTRIBBUFFER3_OFFSET            = 0x020C;
    PICA.GPUREG_ATTRIBBUFFER3_CONFIG1           = 0x020D;
    PICA.GPUREG_ATTRIBBUFFER3_CONFIG2           = 0x020E;
    PICA.GPUREG_ATTRIBBUFFER4_OFFSET            = 0x020F;
    PICA.GPUREG_ATTRIBBUFFER4_CONFIG1           = 0x0210;
    PICA.GPUREG_ATTRIBBUFFER4_CONFIG2           = 0x0211;
    PICA.GPUREG_ATTRIBBUFFER5_OFFSET            = 0x0212;
    PICA.GPUREG_ATTRIBBUFFER5_CONFIG1           = 0x0213;
    PICA.GPUREG_ATTRIBBUFFER5_CONFIG2           = 0x0214;
    PICA.GPUREG_ATTRIBBUFFER6_OFFSET            = 0x0215;
    PICA.GPUREG_ATTRIBBUFFER6_CONFIG1           = 0x0216;
    PICA.GPUREG_ATTRIBBUFFER6_CONFIG2           = 0x0217;
    PICA.GPUREG_ATTRIBBUFFER7_OFFSET            = 0x0218;
    PICA.GPUREG_ATTRIBBUFFER7_CONFIG1           = 0x0219;
    PICA.GPUREG_ATTRIBBUFFER7_CONFIG2           = 0x021A;
    PICA.GPUREG_ATTRIBBUFFER8_OFFSET            = 0x021B;
    PICA.GPUREG_ATTRIBBUFFER8_CONFIG1           = 0x021C;
    PICA.GPUREG_ATTRIBBUFFER8_CONFIG2           = 0x021D;
    PICA.GPUREG_ATTRIBBUFFER9_OFFSET            = 0x021E;
    PICA.GPUREG_ATTRIBBUFFER9_CONFIG1           = 0x021F;
    PICA.GPUREG_ATTRIBBUFFER9_CONFIG2           = 0x0220;
    PICA.GPUREG_ATTRIBBUFFER10_OFFSET           = 0x0221;
    PICA.GPUREG_ATTRIBBUFFER10_CONFIG1          = 0x0222;
    PICA.GPUREG_ATTRIBBUFFER10_CONFIG2          = 0x0223;
    PICA.GPUREG_ATTRIBBUFFER11_OFFSET           = 0x0224;
    PICA.GPUREG_ATTRIBBUFFER11_CONFIG1          = 0x0225;
    PICA.GPUREG_ATTRIBBUFFER11_CONFIG2          = 0x0226;
    PICA.GPUREG_INDEXBUFFER_CONFIG              = 0x0227;
    PICA.GPUREG_NUMVERTICES                     = 0x0228;
    PICA.GPUREG_GEOSTAGE_CONFIG                 = 0x0229;
    PICA.GPUREG_VERTEX_OFFSET                   = 0x022A;
    PICA.GPUREG_POST_VERTEX_CACHE_NUM           = 0x022D;
    PICA.GPUREG_DRAWARRAYS                      = 0x022E;
    PICA.GPUREG_DRAWELEMENTS                    = 0x022F;
    PICA.GPUREG_VTX_FUNC                        = 0x0231;
    PICA.GPUREG_FIXEDATTRIB_INDEX               = 0x0232;
    PICA.GPUREG_FIXEDATTRIB_DATA0               = 0x0233;
    PICA.GPUREG_FIXEDATTRIB_DATA1               = 0x0234;
    PICA.GPUREG_FIXEDATTRIB_DATA2               = 0x0235;
    PICA.GPUREG_CMDBUF_SIZE0                    = 0x0238;
    PICA.GPUREG_CMDBUF_SIZE1                    = 0x0239;
    PICA.GPUREG_CMDBUF_ADDR0                    = 0x023A;
    PICA.GPUREG_CMDBUF_ADDR1                    = 0x023B;
    PICA.GPUREG_CMDBUF_JUMP0                    = 0x023C;
    PICA.GPUREG_CMDBUF_JUMP1                    = 0x023D;
    PICA.GPUREG_VSH_NUM_ATTR                    = 0x0242;
    PICA.GPUREG_VSH_COM_MODE                    = 0x0244;
    PICA.GPUREG_START_DRAW_FUNC0                = 0x0245;
    PICA.GPUREG_VSH_OUTMAP_TOTAL1               = 0x024A;
    PICA.GPUREG_VSH_OUTMAP_TOTAL2               = 0x0251;
    PICA.GPUREG_GSH_MISC0                       = 0x0252;
    PICA.GPUREG_GEOSTAGE_CONFIG2                = 0x0253;
    PICA.GPUREG_GSH_MISC1                       = 0x0254;
    PICA.GPUREG_PRIMITIVE_CONFIG                = 0x025E;
    PICA.GPUREG_RESTART_PRIMITIVE               = 0x025F;
    PICA.GPUREG_GSH_BOOLUNIFORM                 = 0x0280;
    PICA.GPUREG_GSH_INTUNIFORM_I0               = 0x0281;
    PICA.GPUREG_GSH_INTUNIFORM_I1               = 0x0282;
    PICA.GPUREG_GSH_INTUNIFORM_I2               = 0x0283;
    PICA.GPUREG_GSH_INTUNIFORM_I3               = 0x0284;
    PICA.GPUREG_GSH_INPUTBUFFER_CONFIG          = 0x0289;
    PICA.GPUREG_GSH_ENTRYPOINT                  = 0x028A;
    PICA.GPUREG_GSH_ATTRIBUTES_PERMUTATION_LOW  = 0x028B;
    PICA.GPUREG_GSH_ATTRIBUTES_PERMUTATION_HIGH = 0x028C;
    PICA.GPUREG_GSH_OUTMAP_MASK                 = 0x028D;
    PICA.GPUREG_GSH_CODETRANSFER_END            = 0x028F;
    PICA.GPUREG_GSH_FLOATUNIFORM_INDEX          = 0x0290;
    PICA.GPUREG_GSH_FLOATUNIFORM_DATA0          = 0x0291;
    PICA.GPUREG_GSH_FLOATUNIFORM_DATA1          = 0x0292;
    PICA.GPUREG_GSH_FLOATUNIFORM_DATA2          = 0x0293;
    PICA.GPUREG_GSH_FLOATUNIFORM_DATA3          = 0x0294;
    PICA.GPUREG_GSH_FLOATUNIFORM_DATA4          = 0x0295;
    PICA.GPUREG_GSH_FLOATUNIFORM_DATA5          = 0x0296;
    PICA.GPUREG_GSH_FLOATUNIFORM_DATA6          = 0x0297;
    PICA.GPUREG_GSH_FLOATUNIFORM_DATA7          = 0x0298;
    PICA.GPUREG_GSH_CODETRANSFER_INDEX          = 0x029B;
    PICA.GPUREG_GSH_CODETRANSFER_DATA0          = 0x029C;
    PICA.GPUREG_GSH_CODETRANSFER_DATA1          = 0x029D;
    PICA.GPUREG_GSH_CODETRANSFER_DATA2          = 0x029E;
    PICA.GPUREG_GSH_CODETRANSFER_DATA3          = 0x029F;
    PICA.GPUREG_GSH_CODETRANSFER_DATA4          = 0x02A0;
    PICA.GPUREG_GSH_CODETRANSFER_DATA5          = 0x02A1;
    PICA.GPUREG_GSH_CODETRANSFER_DATA6          = 0x02A2;
    PICA.GPUREG_GSH_CODETRANSFER_DATA7          = 0x02A3;
    PICA.GPUREG_GSH_OPDESCS_INDEX               = 0x02A5;
    PICA.GPUREG_GSH_OPDESCS_DATA0               = 0x02A6;
    PICA.GPUREG_GSH_OPDESCS_DATA1               = 0x02A7;
    PICA.GPUREG_GSH_OPDESCS_DATA2               = 0x02A8;
    PICA.GPUREG_GSH_OPDESCS_DATA3               = 0x02A9;
    PICA.GPUREG_GSH_OPDESCS_DATA4               = 0x02AA;
    PICA.GPUREG_GSH_OPDESCS_DATA5               = 0x02AB;
    PICA.GPUREG_GSH_OPDESCS_DATA6               = 0x02AC;
    PICA.GPUREG_GSH_OPDESCS_DATA7               = 0x02AD;
    PICA.GPUREG_VSH_BOOLUNIFORM                 = 0x02B0;
    PICA.GPUREG_VSH_INTUNIFORM_I0               = 0x02B1;
    PICA.GPUREG_VSH_INTUNIFORM_I1               = 0x02B2;
    PICA.GPUREG_VSH_INTUNIFORM_I2               = 0x02B3;
    PICA.GPUREG_VSH_INTUNIFORM_I3               = 0x02B4;
    PICA.GPUREG_VSH_INPUTBUFFER_CONFIG          = 0x02B9;
    PICA.GPUREG_VSH_ENTRYPOINT                  = 0x02BA;
    PICA.GPUREG_VSH_ATTRIBUTES_PERMUTATION_LOW  = 0x02BB;
    PICA.GPUREG_VSH_ATTRIBUTES_PERMUTATION_HIGH = 0x02BC;
    PICA.GPUREG_VSH_OUTMAP_MASK                 = 0x02BD;
    PICA.GPUREG_VSH_CODETRANSFER_END            = 0x02BF;
    PICA.GPUREG_VSH_FLOATUNIFORM_INDEX          = 0x02C0;
    PICA.GPUREG_VSH_FLOATUNIFORM_DATA0          = 0x02C1;
    PICA.GPUREG_VSH_FLOATUNIFORM_DATA1          = 0x02C2;
    PICA.GPUREG_VSH_FLOATUNIFORM_DATA2          = 0x02C3;
    PICA.GPUREG_VSH_FLOATUNIFORM_DATA3          = 0x02C4;
    PICA.GPUREG_VSH_FLOATUNIFORM_DATA4          = 0x02C5;
    PICA.GPUREG_VSH_FLOATUNIFORM_DATA5          = 0x02C6;
    PICA.GPUREG_VSH_FLOATUNIFORM_DATA6          = 0x02C7;
    PICA.GPUREG_VSH_FLOATUNIFORM_DATA7          = 0x02C8;
    PICA.GPUREG_VSH_CODETRANSFER_INDEX          = 0x02CB;
    PICA.GPUREG_VSH_CODETRANSFER_DATA0          = 0x02CC;
    PICA.GPUREG_VSH_CODETRANSFER_DATA1          = 0x02CD;
    PICA.GPUREG_VSH_CODETRANSFER_DATA2          = 0x02CE;
    PICA.GPUREG_VSH_CODETRANSFER_DATA3          = 0x02CF;
    PICA.GPUREG_VSH_CODETRANSFER_DATA4          = 0x02D0;
    PICA.GPUREG_VSH_CODETRANSFER_DATA5          = 0x02D1;
    PICA.GPUREG_VSH_CODETRANSFER_DATA6          = 0x02D2;
    PICA.GPUREG_VSH_CODETRANSFER_DATA7          = 0x02D3;
    PICA.GPUREG_VSH_OPDESCS_INDEX               = 0x02D5;
    PICA.GPUREG_VSH_OPDESCS_DATA0               = 0x02D6;
    PICA.GPUREG_VSH_OPDESCS_DATA1               = 0x02D7;
    PICA.GPUREG_VSH_OPDESCS_DATA2               = 0x02D8;
    PICA.GPUREG_VSH_OPDESCS_DATA3               = 0x02D9;
    PICA.GPUREG_VSH_OPDESCS_DATA4               = 0x02DA;
    PICA.GPUREG_VSH_OPDESCS_DATA5               = 0x02DB;
    PICA.GPUREG_VSH_OPDESCS_DATA6               = 0x02DC;
    PICA.GPUREG_VSH_OPDESCS_DATA7               = 0x02DD;
    
    PICA.commands = {};
    
    const initialViewport = function (pica) {
        if (!pica.viewport) {
            pica.viewport = {};
        }
    };
    
    const initialClipping = function (pica) {
        if (!pica.clipping) {
            pica.clipping = {
                "enabled": false,
                "data": [0, 0, 0, 0]
            };
        }
    };
    
    const initialDepth = function (pica) {
        if (!pica.depth) {
            pica.depth = {};
        }
    };
    
    const initialDepthEarly = function (pica) {
        pica.depth.early = {};
    };
    
    const initialShader = function (pica) {
        if (!pica.shader) {
            pica.shader = {};
        }
    };
    
    const initialShaderOutputMap = function (pica) {
        if (!pica.shader.outputMap) {
            pica.shader.outputMap = [];
        }
    };
    
    const initialShaderOutputMapIndex = function (pica, index, parameter) {
           
        pica.shader.outputMap[index] = {};
        
        let looper = 0;
        while (looper < 4) {
            
            let value = (parameter >> looper * 8) & 0x1f;
            
            let map = {};
            
            pica.shader.outputMap[index][({
                "0": "x",
                "1": "y",
                "2": "z",
                "3": "w"
            })[looper]] = map;
            
            switch (value) {
                 
                case 0x00: { map.register = new PICA.ShaderOutputRegister(PICA.ShaderOutputRegister.POSITION); map.offset = "x"; break; }
                case 0x01: { map.register = new PICA.ShaderOutputRegister(PICA.ShaderOutputRegister.POSITION); map.offset = "y"; break; }
                case 0x02: { map.register = new PICA.ShaderOutputRegister(PICA.ShaderOutputRegister.POSITION); map.offset = "z"; break; }
                case 0x03: { map.register = new PICA.ShaderOutputRegister(PICA.ShaderOutputRegister.POSITION); map.offset = "w"; break; }
                 
                case 0x04: { map.register = new PICA.ShaderOutputRegister(PICA.ShaderOutputRegister.QUAT_NORMAL); map.offset = "x"; break; }
                case 0x05: { map.register = new PICA.ShaderOutputRegister(PICA.ShaderOutputRegister.QUAT_NORMAL); map.offset = "y"; break; }
                case 0x06: { map.register = new PICA.ShaderOutputRegister(PICA.ShaderOutputRegister.QUAT_NORMAL); map.offset = "z"; break; }
                case 0x07: { map.register = new PICA.ShaderOutputRegister(PICA.ShaderOutputRegister.QUAT_NORMAL); map.offset = "w"; break; }
                
                case 0x08: { map.register = new PICA.ShaderOutputRegister(PICA.ShaderOutputRegister.COLOR); map.offset = "r"; break; }
                case 0x09: { map.register = new PICA.ShaderOutputRegister(PICA.ShaderOutputRegister.COLOR); map.offset = "g"; break; }
                case 0x0a: { map.register = new PICA.ShaderOutputRegister(PICA.ShaderOutputRegister.COLOR); map.offset = "b"; break; }
                case 0x0b: { map.register = new PICA.ShaderOutputRegister(PICA.ShaderOutputRegister.COLOR); map.offset = "a"; break; }
                  
                case 0x0c: { map.register = new PICA.ShaderOutputRegister(PICA.ShaderOutputRegister.TEXTURE_COORDINATE_0); map.offset = "u"; break; }
                case 0x0d: { map.register = new PICA.ShaderOutputRegister(PICA.ShaderOutputRegister.TEXTURE_COORDINATE_0); map.offset = "v"; break; }

                case 0x0e: { map.register = new PICA.ShaderOutputRegister(PICA.ShaderOutputRegister.TEXTURE_COORDINATE_1); map.offset = "u"; break; }
                case 0x0f: { map.register = new PICA.ShaderOutputRegister(PICA.ShaderOutputRegister.TEXTURE_COORDINATE_1); map.offset = "v"; break; }
                
                case 0x10: { map.register = new PICA.ShaderOutputRegister(PICA.ShaderOutputRegister.TEXTURE_COORDINATE_0); map.offset = "w"; break; }

                case 0x12: { map.register = new PICA.ShaderOutputRegister(PICA.ShaderOutputRegister.VIEW); map.offset = "x"; break; }
                case 0x13: { map.register = new PICA.ShaderOutputRegister(PICA.ShaderOutputRegister.VIEW); map.offset = "y"; break; }
                case 0x14: { map.register = new PICA.ShaderOutputRegister(PICA.ShaderOutputRegister.VIEW); map.offset = "z"; break; }
                
                case 0x16: { map.register = new PICA.ShaderOutputRegister(PICA.ShaderOutputRegister.TEXTURE_COORDINATE_2); map.offset = "u"; break; }
                case 0x17: { map.register = new PICA.ShaderOutputRegister(PICA.ShaderOutputRegister.TEXTURE_COORDINATE_2); map.offset = "v"; break; }

                default: { map.register = new PICA.ShaderOutputRegister(PICA.ShaderOutputRegister.GENERIC); break; }

            }
            
            ++looper;
        }

    };
      
    const initialVertexShader = function (pica) {
        if (!pica.shader.vertex) {
            pica.shader.vertex = {};
        }
    };
    
    const initialVertexShaderOutputMap = function (pica) {
        if (!pica.shader.vertex.outputMap) {
            pica.shader.vertex.outputMap = [];
        }
    };
    
    const initialVertexShaderAttributes = function (pica) {
        if (!pica.shader.vertex.attributes) {
            pica.shader.vertex.attributes = {};
        }
    };
    
    const initialVertexShaderAttributePermutations = function (pica) {
        if (!pica.shader.vertex.attributes.permutations) {
            pica.shader.vertex.attributes.permutations = [];
        }
    };
    
    const initialVertexShaderIntUnifrom = function (pica) {
        if (!pica.shader.vertex.ints) {
            pica.shader.vertex.ints = [];
        }
    };
    
    const initialVertexShaderFloatUnifrom = function (pica) {
        
        if (!pica.shader.vertex.floats) {
            
            pica.shader.vertex.floats = [];
            
            let index = 0;
            let is32Bit = false;
            Object.defineProperty(pica.shader.vertex.floats, "index", {
                "get": function () {
                    return index;
                },
                "set": function (value) {
                    index = (value % 0x100) << 2;
                    is32Bit = (value >> 31) !== 0;
                }
            });
            Object.defineProperty(pica.shader.vertex.floats, "is32Bit", {
                "get": function () {
                    return is32Bit;
                }
            });
            
            Object.defineProperty(pica.shader.vertex.floats, "setValues", {
                "get": function () {
                    return (function (values) {
                       
                       let getValue = () => {
                           
                           let valueIndex = (index >> 2) & 0x5f;
                           let value = this[valueIndex];
                           if (!value) {
                               if (is32Bit) {
                                   value = new PICA.Float32Vector();
                               } else {
                                   value = new PICA.Float24Vector();
                               }
                               this[valueIndex] = value;
                           }
                           
                           return value;
                           
                       };
                       
                       values.forEach((parameter) => {
                           
                           let value = getValue();
                           
                           value.words[index % 4] = parameter;
                           ++index;
                           if ($.is(value, PICA.Float24Vector) && (index % 4 === 3)) {
                               ++index;
                           }
               
                       });
                       
                    }).bind(pica.shader.vertex.floats)
                }
            });
            
        }
    };
    
    const initialVertexShaderCodes = function (pica) {
        if (!pica.shader.vertex.codes) {
            pica.shader.vertex.codes = {};
        }
    };
    
    const initialVertexShaderOpdescs = function (pica) {
        if (!pica.shader.vertex.opdescs) {
            pica.shader.vertex.opdescs = {};
        }
    };
    
    const initialGeometryShader = function (pica) {
        if (!pica.shader.geometry) {
            pica.shader.geometry = {};
        }
    };
    
    const initialGeometryShaderOutputMap = function (pica) {
        if (!pica.shader.geometry.outputMap) {
            pica.shader.geometry.outputMap = [];
        }
    };
    
    const initialGeometryShaderAttributes = function (pica) {
        if (!pica.shader.geometry.attributes) {
            pica.shader.geometry.attributes = {};
        }
    };
    
    const initialGeometryShaderAttributePermutations = function (pica) {
        if (!pica.shader.geometry.attributes.permutations) {
            pica.shader.geometry.attributes.permutations = [];
        }
    };
    
    const initialGeometryShaderIntUnifrom = function (pica) {
        if (!pica.shader.geometry.ints) {
            pica.shader.geometry.ints = [];
        }
    };
    
    const initialGeometryShaderFloatUnifrom = function (pica) {
        
        if (!pica.shader.geometry.floats) {
            
            pica.shader.geometry.floats = [];
            
            let index = 0;
            let is32Bit = false;
            Object.defineProperty(pica.shader.geometry.floats, "index", {
                "get": function () {
                    return index;
                },
                "set": function (value) {
                    index = (value % 0x100) << 2;
                    is32Bit = (value >> 31) !== 0;
                }
            });
            Object.defineProperty(pica.shader.geometry.floats, "is32Bit", {
                "get": function () {
                    return is32Bit;
                }
            });
            
            Object.defineProperty(pica.shader.geometry.floats, "setValues", {
                "get": function () {
                    return (function (values) {
                       
                       let getValue = () => {
                           
                           let valueIndex = (index >> 2) & 0x5f;
                           let value = this[valueIndex];
                           if (!value) {
                               if (is32Bit) {
                                   value = new PICA.Float32Vector();
                               } else {
                                   value = new PICA.Float24Vector();
                               }
                               this[valueIndex] = value;
                           }
                           
                           return value;
                           
                       };
                       
                       values.forEach((parameter) => {
                           
                           let value = getValue();
                           
                           value.words[index % 4] = parameter;
                           ++index;
                           if ($.is(value, PICA.Float24Vector) && (index % 3 === 2)) {
                               ++index;
                           }
               
                       });
                       
                    }).bind(pica.shader.geometry.floats)
                }
            });
            
        }
    };
    
    const initialGeometryShaderCodes = function (pica) {
        if (!pica.shader.geometry.codes) {
            pica.shader.geometry.codes = {};
        }
    };
    
    const initialGeometryShaderOpdescs = function (pica) {
        if (!pica.shader.geometry.opdescs) {
            pica.shader.geometry.opdescs = {};
        }
    };
    
    const initialScissor = function (pica) {
        if (!pica.scissor) {
            pica.scissor = {};
        }
    };
    
    const initialFrameBuffer = function (pica) {
        if (!pica.frameBuffer) {
            pica.frameBuffer = {};
        }
    };
      
    const initialTextures = function (pica) {
        if (!pica.textures) {
            pica.textures = {};
        }
    };
    
    const initialTextureUnits = function (pica) {
        if (!pica.textures.units) {
            pica.textures.units = [{}, {}, {}, {}];
        }
    };
    
    const setTextureParameter = function (pica, index, parameter) {
        
        let unit = pica.textures.units[0];
        
        unit.magnificationFilter = new PICA.TextureFilter(parameter & 0x1);
        unit.minificationFilter = new PICA.TextureFilter(parameter & 0x1);
        
        unit.etc1 = (parameter >> 4) & 0x3;
        unit.wrap = [
            new PICA.TextureWrap((parameter >> 8) & 0x3),
            new PICA.TextureWrap((parameter >> 12) & 0x3)
        ];
        unit.shadow = ((parameter >> 20) & 0x1) !== 0;
        unit.mipmap = ((parameter >> 24) & 0x1) !== 0;
        
        unit.type = new PICA.TextureType((parameter >> 28) & 0x3);
        
    };
    
    const initialLighting = function (pica) {
        if (!pica.lighting) {
            pica.lighting = true;
        }
    };
    
    const initialRendering = function (pica) {
        if (!pica.rendering) {
            pica.rendering = {};
        }
    };
    
    const initialRenderingStage = function (pica, index) {
        if (!pica.rendering.stages) {
            pica.rendering.stages = [];
        }
        if (!pica.rendering.stages[index]) {
            pica.rendering.stages[index] = new PICA.RenderingStage();
        }
    };
     
    const initialPermissions = function (pica) {
        if (!pica.permissions) {
            pica.permissions = {};
        }
    };
    
    const initialLightingLUTs = function (pica) {
        if (!pica.lightingLUTs) {
            pica.lightingLUTs = {};
        }
    };
    
    const setLightingLUT = function (pica, index, parameters) {
        if (!pica.lightingLUTs.data) {
            pica.lightingLUTs.data = [];
        }
        parameters.forEach((parameter) => {
            pica.lightingLUTs.data[pica.lightingLUTs.index++] = (parameter & 0xfff) / 0xfff;
        });
    };
   
    const initialAttributes = function (pica) {
        if (!pica.attributes) {
            pica.attributes = {};
        }
    };
    
    const initialAttributeBuffer = function (pica) {
        if (!pica.attributes.buffer) {
            pica.attributes.buffer = {};
        }
    };
    
    const initialAttributeBufferMapping = function (pica) {
       if (!pica.attributes.buffer.mapping) {
           pica.attributes.buffer.mapping = [];
       } 
    };
     
    const initialAttributeFixeds = function (pica) {
        if (!pica.attributes.fixeds) {
            pica.attributes.fixeds = {
                "index": 0
            };
        }
    };
    
    const initialAttributeFixedData = function (pica) {
        if ($.is.nil(pica.attributes.fixeds.index)) {
            pica.attributes.fixeds.index = 0;
        }
        if (!pica.attributes.fixeds.data) {
            pica.attributes.fixeds.data = [];
        }
        if (!pica.attributes.fixeds.data[pica.attributes.fixeds.index]) {
            pica.attributes.fixeds.data[pica.attributes.fixeds.index] = new PICA.Float24Vector();
        }
    };
    
    PICA.commands[PICA.GPUREG_DUMMY] = function (/*command*/) {
        // Do nothing
    };
    
    PICA.commands[PICA.GPUREG_FINALIZE] = function (/*command*/) {
        
        let active = this.commands.buffers.indexOf(this.commands.current);
        
        this.commands.states[active] = "finalized";
        
    };
    
    PICA.commands[PICA.GPUREG_FACECULLING_CONFIG] = function (command) {
        this.faceCulling = new PICA.FaceCulling(command.parameters[0] & 3);
    };
     
    PICA.commands[PICA.GPUREG_VIEWPORT_WIDTH] = function (command) {
        initialViewport(this);
        this.viewport.width = PICA.Float24Vector.getFloat(command.parameters[0] % 0x1000000) * 2;
    };
    
    PICA.commands[PICA.GPUREG_VIEWPORT_INVW] = function (command) {
        initialViewport(this);
        this.viewport.width = 2 / PICA.Float32Vector.asFloat32(command.parameters[0]);
    };
    
    PICA.commands[PICA.GPUREG_VIEWPORT_HEIGHT] = function (command) {
        initialViewport(this);
        this.viewport.height = PICA.Float24Vector.getFloat(command.parameters[0] % 0x1000000) * 2;
    };
    
    PICA.commands[PICA.GPUREG_VIEWPORT_INVH] = function (command) {
        initialViewport(this);
        this.viewport.height = 2 / PICA.Float32Vector.asFloat32(command.parameters[0]);
    };
    
    PICA.commands[PICA.GPUREG_FRAGOP_CLIP] = function (command) {
        initialClipping(this);
        this.clipping.enabled = (command.parameters[0] & 0x1) !== 0;
    };
     
    PICA.commands[PICA.GPUREG_FRAGOP_CLIP_DATA0] = function (command) {
        initialClipping(this);
        this.clipping.data[0] = PICA.Float32Vector.asFloat32(command.parameters[0]);
    };
     
    PICA.commands[PICA.GPUREG_FRAGOP_CLIP_DATA1] = function (command) {
        initialClipping(this);
        this.clipping.data[1] = PICA.Float32Vector.asFloat32(command.parameters[0]);
    };
     
    PICA.commands[PICA.GPUREG_FRAGOP_CLIP_DATA2] = function (command) {
        initialClipping(this);
        this.clipping.data[2] = PICA.Float32Vector.asFloat32(command.parameters[0]);
    };
    
    PICA.commands[PICA.GPUREG_FRAGOP_CLIP_DATA3] = function (command) {
        initialClipping(this);
        this.clipping.data[3] = PICA.Float32Vector.asFloat32(command.parameters[0]);
    };
    
    PICA.commands[PICA.GPUREG_DEPTHMAP_SCALE] = function (command) {
        initialDepth(this);
        this.depth.scale = PICA.Float24Vector.getFloat(command.parameters[0] % 0x1000000);
    };
    
    PICA.commands[PICA.GPUREG_DEPTHMAP_OFFSET] = function (command) {
        initialDepth(this);
        this.depth.offset = PICA.Float24Vector.getFloat(command.parameters[0] % 0x1000000);
    };
     
    PICA.commands[PICA.GPUREG_SH_OUTMAP_TOTAL] = function (command) {
        initialShader(this);
        initialShaderOutputMap(this);
        this.shader.outputMap.length = command.parameters[0] & 0x7;
    };
     
    PICA.commands[PICA.GPUREG_SH_OUTMAP_O0] = function (command) {
        initialShader(this);
        initialShaderOutputMap(this);
        initialShaderOutputMapIndex(this, 0, command.parameters[0]);
    };
     
    PICA.commands[PICA.GPUREG_SH_OUTMAP_O1] = function (command) {
        initialShader(this);
        initialShaderOutputMap(this);
        initialShaderOutputMapIndex(this, 1, command.parameters[0]);
    };
     
    PICA.commands[PICA.GPUREG_SH_OUTMAP_O2] = function (command) {
        initialShader(this);
        initialShaderOutputMap(this);
        initialShaderOutputMapIndex(this, 2, command.parameters[0]);
    };
     
    PICA.commands[PICA.GPUREG_SH_OUTMAP_O3] = function (command) {
        initialShader(this);
        initialShaderOutputMap(this);
        initialShaderOutputMapIndex(this, 3, command.parameters[0]);
    };
     
    PICA.commands[PICA.GPUREG_SH_OUTMAP_O4] = function (command) {
        initialShader(this);
        initialShaderOutputMap(this);
        initialShaderOutputMapIndex(this, 4, command.parameters[0]);
    };
     
    PICA.commands[PICA.GPUREG_SH_OUTMAP_O5] = function (command) {
        initialShader(this);
        initialShaderOutputMap(this);
        initialShaderOutputMapIndex(this, 5, command.parameters[0]);
    };
     
    PICA.commands[PICA.GPUREG_SH_OUTMAP_O6] = function (command) {
        initialShader(this);
        initialShaderOutputMap(this);
        initialShaderOutputMapIndex(this, 6, command.parameters[0]);
    };
    
    PICA.commands[PICA.GPUREG_EARLYDEPTH_FUNC] = function (command) {
        initialDepth(this);
        initialDepthEarly(this);
        this.depth.early.test = ({
            "0": ">=",
            "1": ">",
            "2": "<=",
            "3": "<"
        })[command.parameters[0] & 0x3];
    };
    
    PICA.commands[PICA.GPUREG_EARLYDEPTH_TEST1] = function (command) {
        initialDepth(this);
        initialDepthEarly(this);
        this.depth.early.enabled = (command.parameters[0] & 0x1) !== 0;
    };
    
    PICA.commands[PICA.GPUREG_EARLYDEPTH_CLEAR] = function (command) {
        if ((command.parameters[0] & 0x1) !== 0) {
            if (this.depth && this.depth.early) {
                delete this.depth.early;
            }
        }
    };
    
    PICA.commands[PICA.GPUREG_SH_OUTATTR_MODE] = function (command) {
        initialShader(this);
        this.shader.outputTextures = (command.parameters[0] & 0x1) !== 0;
    };
    
    PICA.commands[PICA.GPUREG_SCISSORTEST_MODE] = function (command) {
        initialScissor(this);
        this.scissor.enabled = (command.parameters[0] & 0x1) !== 0;
    };
     
    PICA.commands[PICA.GPUREG_SCISSORTEST_POS] = function (command) {
        initialScissor(this);
        this.scissor.position = {
            "x": command.parameters[0] % 0x200,
            "y": (command.parameters[0] >> 16) % 0x200
        };
    };
    
    PICA.commands[PICA.GPUREG_SCISSORTEST_DIM] = function (command) {
        initialScissor(this);
        this.scissor.dim = {
            "x": command.parameters[0] % 0x200, 
            "y": (command.parameters[0] >> 16) % 0x200
        };
    };
    
    PICA.commands[PICA.GPUREG_VIEWPORT_XY] = function (command) {
        initialViewport(this);
        this.viewport.position = {
            "x": command.parameters[0] % 0x200, 
            "y": (command.parameters[0] >> 16) % 0x200
        };
    };
     
    PICA.commands[PICA.GPUREG_EARLYDEPTH_DATA] = function (command) {
        initialDepth(this);
        initialDepthEarly(this);
        this.depth.early.clearValue = command.parameters[0] & 0xffffff;
    };
  
    PICA.commands[PICA.GPUREG_DEPTHMAP_ENABLE] = function (command) {
        initialDepth(this);
        this.depth.enabled = (command.parameters[0] & 0x1) !== 0;
    };
   
    PICA.commands[PICA.GPUREG_RENDERBUF_DIM] = function (command) {
        initialRendering(this);
        this.rendering.width = command.parameters[0] & 0x7ff;
        this.rendering.height = ((command.parameters[0] >> 12) & 0x3ff) + 1;
    };
    
    PICA.commands[PICA.GPUREG_SH_OUTATTR_CLOCK] = function (command) {
        initialShader(this);
        this.shader.outputAvailables = {
            "positionZ": (command.parameters[0] & 0x1) !== 0,
            "color": (command.parameters[0] & 0x2) !== 0,
            "texCoord0": (command.parameters[0] & 0x100) !== 0,
            "texCoord1": (command.parameters[0] & 0x200) !== 0,
            "texCoord2": (command.parameters[0] & 0x400) !== 0,
            "texCoord0W": (command.parameters[0] & 0x10000) !== 0,
            "quatNormalOrView": (command.parameters[0] & 0x1000000) !== 0
        };
    };
    
    PICA.commands[PICA.GPUREG_TEXUNIT_CONFIG] = function (command) {
        
        initialTextures(this);
        initialTextureUnits(this);
        
        const parameter = command.parameters[0];
        
        if (parameter & 0x10000 !== 0) {
            this.textures.units = [{}, {}, {}, {}];
        }
        
        this.textures.units[0].coordinates = 0;
        this.textures.units[0].enabled = (parameter & 0x1) !== 0;
        
        this.textures.units[1].coordinates = 1;
        this.textures.units[1].enabled = (parameter & 0x2) !== 0;
        
        this.textures.units[2].coordinates = (((parameter >> 13) & 0x1) !== 0) ? 1 : 2;
        this.textures.units[2].enabled = (parameter & 0x4) !== 0;
        
        this.textures.units[3].coordinates = (parameter >> 8) & 0x3;
        this.textures.units[3].enabled = (parameter & 0x400) !== 0;
        
    };
   
    PICA.commands[PICA.GPUREG_TEXUNIT0_BORDER_COLOR] = function (command) {
        initialTextures(this);
        initialTextureUnits(this);
        this.textures.units[0].border = new PICA.Color(command.parameters[0]); 
    };
    
    PICA.commands[PICA.GPUREG_TEXUNIT0_DIM] = function (command) {
        initialTextures(this);
        initialTextureUnits(this);
        this.textures.units[0].width = command.parameters[0] & 0x7ff;
        this.textures.units[0].height = (command.parameters[0] >> 16) & 0x7ff;
    };
    
    PICA.commands[PICA.GPUREG_TEXUNIT0_PARAM] = function (command) {
        initialTextures(this);
        initialTextureUnits(this);
        setTextureParameter(this, 0, command.parameters[0]);
    };
    
    PICA.commands[PICA.GPUREG_TEXUNIT1_BORDER_COLOR] = function (command) {
        initialTextures(this);
        initialTextureUnits(this);
        this.textures.units[1].border = new PICA.Color(command.parameters[0]); 
    };
    
    PICA.commands[PICA.GPUREG_TEXUNIT1_DIM] = function (command) {
        initialTextures(this);
        initialTextureUnits(this);
        this.textures.units[1].width = command.parameters[0] & 0x7ff;
        this.textures.units[1].height = (command.parameters[0] >> 16) & 0x7ff;
    };
    
    PICA.commands[PICA.GPUREG_TEXUNIT1_PARAM] = function (command) {
        initialTextures(this);
        initialTextureUnits(this);
        setTextureParameter(this, 1, command.parameters[0]);
    };
    
    PICA.commands[PICA.GPUREG_TEXUNIT2_BORDER_COLOR] = function (command) {
        initialTextures(this);
        initialTextureUnits(this);
        this.textures.units[2].border = new PICA.Color(command.parameters[0]); 
    };
   
    PICA.commands[PICA.GPUREG_TEXUNIT2_DIM] = function (command) {
        initialTextures(this);
        initialTextureUnits(this);
        this.textures.units[2].width = command.parameters[0] & 0x7ff;
        this.textures.units[2].height = (command.parameters[0] >> 16) & 0x7ff;
    };
    
    PICA.commands[PICA.GPUREG_TEXUNIT2_PARAM] = function (command) {
        initialTextures(this);
        initialTextureUnits(this);
        setTextureParameter(this, 0, command.parameters[0]);
    };
    
    // TODO: add lod, addrx, shadow, type and proctex support
    
    PICA.commands[PICA.GPUREG_LIGHTING_ENABLE0] = function (command) {
        initialLighting(this);
        this.lighting.enabled = (command.parameters[0] & 0x1) !== 0;
    };
    
    PICA.commands[PICA.GPUREG_TEXENV0_SOURCE] = function (command) {
        initialRendering(this);
        initialRenderingStage(this, 0);
        this.rendering.stages[0].source = new PICA.RenderingSource(command.parameters[0]);
    };
     
    PICA.commands[PICA.GPUREG_TEXENV1_SOURCE] = function (command) {
        initialRendering(this);
        initialRenderingStage(this, 1);
        this.rendering.stages[1].source = new PICA.RenderingSource(command.parameters[0]);
    };
     
    PICA.commands[PICA.GPUREG_TEXENV2_SOURCE] = function (command) {
        initialRendering(this);
        initialRenderingStage(this, 2);
        this.rendering.stages[2].source = new PICA.RenderingSource(command.parameters[0]);
    };
     
    PICA.commands[PICA.GPUREG_TEXENV3_SOURCE] = function (command) {
        initialRendering(this);
        initialRenderingStage(this, 3);
        this.rendering.stages[3].source = new PICA.RenderingSource(command.parameters[0]);
    };
     
    PICA.commands[PICA.GPUREG_TEXENV4_SOURCE] = function (command) {
        initialRendering(this);
        initialRenderingStage(this, 4);
        this.rendering.stages[4].source = new PICA.RenderingSource(command.parameters[0]);
    };
     
    PICA.commands[PICA.GPUREG_TEXENV5_SOURCE] = function (command) {
        initialRendering(this);
        initialRenderingStage(this, 5);
        this.rendering.stages[5].source = new PICA.RenderingSource(command.parameters[0]);
    };
    
    PICA.commands[PICA.GPUREG_TEXENV0_OPERAND] = function (command) {
        initialRendering(this);
        initialRenderingStage(this, 0);
        this.rendering.stages[0].operand = new PICA.RenderingOperand(command.parameters[0]);
    };
     
    PICA.commands[PICA.GPUREG_TEXENV1_OPERAND] = function (command) {
        initialRendering(this);
        initialRenderingStage(this, 1);
        this.rendering.stages[1].operand = new PICA.RenderingOperand(command.parameters[0]);
    };
     
    PICA.commands[PICA.GPUREG_TEXENV2_OPERAND] = function (command) {
        initialRendering(this);
        initialRenderingStage(this, 2);
        this.rendering.stages[2].operand = new PICA.RenderingOperand(command.parameters[0]);
    };
     
    PICA.commands[PICA.GPUREG_TEXENV3_OPERAND] = function (command) {
        initialRendering(this);
        initialRenderingStage(this, 3);
        this.rendering.stages[3].operand = new PICA.RenderingOperand(command.parameters[0]);
    };
     
    PICA.commands[PICA.GPUREG_TEXENV4_OPERAND] = function (command) {
        initialRendering(this);
        initialRenderingStage(this, 4);
        this.rendering.stages[4].operand = new PICA.RenderingOperand(command.parameters[0]);
    };
     
    PICA.commands[PICA.GPUREG_TEXENV5_OPERAND] = function (command) {
        initialRendering(this);
        initialRenderingStage(this, 5);
        this.rendering.stages[5].operand = new PICA.RenderingOperand(command.parameters[0]);
    };
     
    PICA.commands[PICA.GPUREG_TEXENV0_COMBINER] = function (command) {
        initialRendering(this);
        initialRenderingStage(this, 0);
        this.rendering.stages[0].mode = new PICA.RenderingMode(command.parameters[0]);
    };
     
    PICA.commands[PICA.GPUREG_TEXENV1_COMBINER] = function (command) {
        initialRendering(this);
        initialRenderingStage(this, 1);
        this.rendering.stages[1].mode = new PICA.RenderingMode(command.parameters[0]);
    };
     
    PICA.commands[PICA.GPUREG_TEXENV2_COMBINER] = function (command) {
        initialRendering(this);
        initialRenderingStage(this, 2);
        this.rendering.stages[2].mode = new PICA.RenderingMode(command.parameters[0]);
    };
     
    PICA.commands[PICA.GPUREG_TEXENV3_COMBINER] = function (command) {
        initialRendering(this);
        initialRenderingStage(this, 3);
        this.rendering.stages[3].mode = new PICA.RenderingMode(command.parameters[0]);
    };
     
    PICA.commands[PICA.GPUREG_TEXENV4_COMBINER] = function (command) {
        initialRendering(this);
        initialRenderingStage(this, 4);
        this.rendering.stages[4].mode = new PICA.RenderingMode(command.parameters[0]);
    };
    
    PICA.commands[PICA.GPUREG_TEXENV5_COMBINER] = function (command) {
        initialRendering(this);
        initialRenderingStage(this, 5);
        this.rendering.stages[5].mode = new PICA.RenderingMode(command.parameters[0]);
    };
     
    PICA.commands[PICA.GPUREG_TEXENV0_COLOR] = function (command) {
        initialRendering(this);
        initialRenderingStage(this, 0);
        this.rendering.stages[0].color = new PICA.Color(command.parameters[0]);
    };
     
    PICA.commands[PICA.GPUREG_TEXENV1_COLOR] = function (command) {
        initialRendering(this);
        initialRenderingStage(this, 1);
        this.rendering.stages[1].color = new PICA.Color(command.parameters[0]);
    };
     
    PICA.commands[PICA.GPUREG_TEXENV2_COLOR] = function (command) {
        initialRendering(this);
        initialRenderingStage(this, 2);
        this.rendering.stages[2].color = new PICA.Color(command.parameters[0]);
    };
     
    PICA.commands[PICA.GPUREG_TEXENV3_COLOR] = function (command) {
        initialRendering(this);
        initialRenderingStage(this, 3);
        this.rendering.stages[3].color = new PICA.Color(command.parameters[0]);
    };
     
    PICA.commands[PICA.GPUREG_TEXENV4_COLOR] = function (command) {
        initialRendering(this);
        initialRenderingStage(this, 4);
        this.rendering.stages[4].color = new PICA.Color(command.parameters[0]);
    };
    
    PICA.commands[PICA.GPUREG_TEXENV5_COLOR] = function (command) {
        initialRendering(this);
        initialRenderingStage(this, 5);
        this.rendering.stages[5].color = new PICA.Color(command.parameters[0]);
    };
     
    PICA.commands[PICA.GPUREG_TEXENV0_SCALE] = function (command) {
        initialRendering(this);
        initialRenderingStage(this, 0);
        this.rendering.stages[0].scale = new PICA.RenderingScale(command.parameters[0]);
    };
     
    PICA.commands[PICA.GPUREG_TEXENV1_SCALE] = function (command) {
        initialRendering(this);
        initialRenderingStage(this, 1);
        this.rendering.stages[1].scale = new PICA.RenderingScale(command.parameters[0]);
    };
     
    PICA.commands[PICA.GPUREG_TEXENV2_SCALE] = function (command) {
        initialRendering(this);
        initialRenderingStage(this, 2);
        this.rendering.stages[2].scale = new PICA.RenderingScale(command.parameters[0]);
    };
     
    PICA.commands[PICA.GPUREG_TEXENV3_SCALE] = function (command) {
        initialRendering(this);
        initialRenderingStage(this, 3);
        this.rendering.stages[3].scale = new PICA.RenderingScale(command.parameters[0]);
    };
     
    PICA.commands[PICA.GPUREG_TEXENV4_SCALE] = function (command) {
        initialRendering(this);
        initialRenderingStage(this, 4);
        this.rendering.stages[4].scale = new PICA.RenderingScale(command.parameters[0]);
    };
    
    PICA.commands[PICA.GPUREG_TEXENV5_SCALE] = function (command) {
        initialRendering(this);
        initialRenderingStage(this, 5);
        this.rendering.stages[5].scale = new PICA.RenderingScale(command.parameters[0]);
    };
    
    // TODO: change the data structs for rendering stages
    
    PICA.commands[PICA.GPUREG_TEXENV_UPDATE_BUFFER] = function (command) {
        
        initialRendering(this);
        
        this.rendering.fogMode = command.parameters[0] & 0x7;
        this.rendering.densitySource = (command.parameters[0] >> 3) & 0x1 ? "depth" : "plain";
         
        initialRenderingStage(this, 0);
        this.rendering.stages[0].buffers = {
            "color": ((command.parameters[0] >> 8) & 0x1) !== 0,
            "alpha": ((command.parameters[0] >> 12) & 0x1) !== 0
        };
         
        initialRenderingStage(this, 1);
        this.rendering.stages[1].buffers = {
            "color": ((command.parameters[0] >> 9) & 0x1) !== 0,
            "alpha": ((command.parameters[0] >> 13) & 0x1) !== 0
        };
         
        initialRenderingStage(this, 2);
        this.rendering.stages[2].buffers = {
            "color": ((command.parameters[0] >> 10) & 0x1) !== 0,
            "alpha": ((command.parameters[0] >> 14) & 0x1) !== 0
        };
        
        initialRenderingStage(this, 3);
        this.rendering.stages[3].buffers = {
            "color": ((command.parameters[0] >> 11) & 0x1) !== 0,
            "alpha": ((command.parameters[0] >> 15) & 0x1) !== 0
        };
        
        this.rendering.zFlip = ((command.parameters[0] >> 16) & 0x1) !== 0;
        
    };
    
    // TODO: fogs and gas support
    
    PICA.commands[PICA.GPUREG_TEXENV_BUFFER_COLOR] = function (command) {
        initialRendering(this);
        this.rendering.bufferColor = new PICA.Color(command.parameters[0]); 
    };
   
    PICA.commands[PICA.GPUREG_COLOR_OPERATION] = function (command) {
        initialRendering(this);
        this.rendering.colorOperation = new PICA.ColorOperation(command.parameters[0]);
    };
    
    PICA.commands[PICA.GPUREG_BLEND_FUNC] = function (command) {
        initialRendering(this);
        this.rendering.blendFunction = new PICA.BlendFunction(command.parameters[0]);
    };
    
    PICA.commands[PICA.GPUREG_LOGIC_OP] = function (command) {
        initialRendering(this);
        this.rendering.logicalOperation = new PICA.LogicalOperation(command.parameters[0] & 0xf);
    };
    
    PICA.commands[PICA.GPUREG_BLEND_COLOR] = function (command) {
        initialRendering(this);
        this.rendering.blendColor = new PICA.Color(command.parameters[0]);
    };
    
    PICA.commands[PICA.GPUREG_FRAGOP_ALPHA_TEST] = function (command) {
        initialRendering(this);
        this.rendering.alphaTest = new PICA.AlphaTest(command.parameters[0]);
    };
    
    PICA.commands[PICA.GPUREG_STENCIL_TEST] = function (command) {
        initialRendering(this);
        this.rendering.stencilTest = new PICA.StencilTest(command.parameters[0]);
    };
    
    PICA.commands[PICA.GPUREG_STENCIL_OP] = function (command) {
        initialRendering(this);
        this.rendering.stencilOperation = new PICA.StencilOperation(command.parameters[0]);
    };
    
    PICA.commands[PICA.GPUREG_DEPTH_COLOR_MASK] = function (command) {
        initialDepth(this);
        this.depth.colorMask = new PICA.DepthColorMask(command.parameters[0]);
    };
    
    PICA.commands[PICA.GPUREG_FRAMEBUFFER_INVALIDATE] = function (command) {
        initialRendering(this);
        this.rendering.dirty = (command.parameters[0] & 0x1) !== 0;
    };
    
    PICA.commands[PICA.GPUREG_FRAMEBUFFER_FLUSH] = function (command) {
        initialRendering(this);
        this.rendering.dirty = (command.parameters[0] & 0x1) === 0;
    };
    
    PICA.commands[PICA.GPUREG_COLORBUFFER_READ] = function (command) {
        initialPermissions(this);
        this.permissions.colorBufferRead = (command.parameters[0] & 0xf) === 0xf;
    };
    
    PICA.commands[PICA.GPUREG_COLORBUFFER_WRITE] = function (command) {
        initialPermissions(this);
        this.permissions.colorBufferWrite = (command.parameters[0] & 0xf) === 0xf;
    };

    PICA.commands[PICA.GPUREG_DEPTHBUFFER_READ] = function (command) {
        initialPermissions(this);
        this.permissions.stencilBufferRead = (command.parameters[0] & 1) !== 0;
        this.permissions.depthBufferRead = (command.parameters[0] & 2) !== 0;
    };

    PICA.commands[PICA.GPUREG_DEPTHBUFFER_WRITE] = function (command) {
        initialPermissions(this);
        this.permissions.stencilBufferWrite = (command.parameters[0] & 1) !== 0;
        this.permissions.depthBufferWrite = (command.parameters[0] & 2) !== 0;
    };

    // TODO: depth and color buffer format support
    
    PICA.commands[PICA.GPUREG_EARLYDEPTH_TEST2] = PICA.commands[PICA.GPUREG_EARLYDEPTH_TEST1];

    // TODO: frame buffer block mode
    // TODO: depth and color buffer location
    
    PICA.commands[PICA.GPUREG_FRAMEBUFFER_DIM] = function (command) {
        // TODO: check rendering the same as frame buffer?
        initialFrameBuffer(this);
        this.frameBuffer.width = command.parameters[0] & 0x7ff;
        this.frameBuffer.height = ((command.parameters[0] >> 12) & 0x3ff) + 1;
    };
    
    // TODO: gas light lut
    // TODO: frag op shadow
    // TODO: lights
    
    PICA.commands[PICA.GPUREG_LIGHTING_LUT_INDEX] = function (command) {
        initialLightingLUTs(this);
        this.lightingLUTs.index = command.parameters[0] & 0xff;
        this.lightingLUTs.type = new PICA.LUTType(command.parameters[0] >> 8);
    };
     
    PICA.commands[PICA.GPUREG_LIGHTING_LUT_DATA0] = function (command) {
        initialLightingLUTs(this);
        setLightingLUT(this, 0, command.parameters);
    };
    
    PICA.commands[PICA.GPUREG_LIGHTING_LUT_DATA1] = PICA.commands[PICA.GPUREG_LIGHTING_LUT_DATA0];
    PICA.commands[PICA.GPUREG_LIGHTING_LUT_DATA2] = PICA.commands[PICA.GPUREG_LIGHTING_LUT_DATA0];
    PICA.commands[PICA.GPUREG_LIGHTING_LUT_DATA3] = PICA.commands[PICA.GPUREG_LIGHTING_LUT_DATA0];
    PICA.commands[PICA.GPUREG_LIGHTING_LUT_DATA4] = PICA.commands[PICA.GPUREG_LIGHTING_LUT_DATA0];
    PICA.commands[PICA.GPUREG_LIGHTING_LUT_DATA5] = PICA.commands[PICA.GPUREG_LIGHTING_LUT_DATA0];
    PICA.commands[PICA.GPUREG_LIGHTING_LUT_DATA6] = PICA.commands[PICA.GPUREG_LIGHTING_LUT_DATA0];
    PICA.commands[PICA.GPUREG_LIGHTING_LUT_DATA7] = PICA.commands[PICA.GPUREG_LIGHTING_LUT_DATA0];
     
    PICA.commands[PICA.GPUREG_LIGHTING_LUTINPUT_ABS] = function (command) {
        initialLightingLUTs(this);
        this.lightingLUTs.inputAbsolute = new PICA.LightingLUTInputAbsolute(command.parameters[0]);
    };
    
    PICA.commands[PICA.GPUREG_LIGHTING_LUTINPUT_SELECT] = function (command) {
        initialLightingLUTs(this);
        this.lightingLUTs.inputSelection = new PICA.LightingLUTInputSelection(command.parameters[0]);
    };
    
    PICA.commands[PICA.GPUREG_LIGHTING_LUTINPUT_SCALE] = function (command) {
        initialLightingLUTs(this);
        this.lightingLUTs.inputScale = new PICA.LightingLUTInputScale(command.parameters[0]);
    };
    
    PICA.commands[PICA.GPUREG_ATTRIBBUFFERS_LOC] = function (command) {
        initialAttributes(this);
        this.attributes.location = (command.parameters / 2) >> 27;
    };
     
    PICA.commands[PICA.GPUREG_ATTRIBBUFFERS_FORMAT_LOW] = function (command) { 
        
        initialAttributes(this);
        
        if (!this.attributes.formats) {
            this.attributes.formats = [];
        }
        
        let looper = 0;
        while (looper < 8) {
            
            let value = (command.parameters[0] / Math.pow(2, looper * 4)) % 0x10;
            
            let type = new PICA.AttributeFormat(value & 0x3);
            let size = ((value >> 2) & 0x3) + 1;
            
            if (!this.attributes.formats[looper]) {
                this.attributes.formats[looper] = {};
            }
            
            this.attributes.formats[looper].type = type;
            this.attributes.formats[looper].size = size;
            
            ++looper;
        }
        
    };
    
    PICA.commands[PICA.GPUREG_ATTRIBBUFFERS_FORMAT_HIGH] = function (command) { 
        
        initialAttributes(this);
        
        if (!this.attributes.formats) {
            this.attributes.formats = [];
        }
        
        let looper = 0;
        while (looper < 4) {
            
            initialAttributeBuffer(this, looper + 8);
            
            let value = (command.parameters[0] / Math.pow(2, looper * 4)) % 0x10;
            
            let type = new PICA.AttributeFormat(value & 0x3);
            let size = ((value >> 2) & 0x3) + 1;
            
            if (!this.attributes.formats[looper + 8]) {
                this.attributes.formats[looper + 8] = {};
            }
            
            this.attributes.formats[looper + 8].type = type;
            this.attributes.formats[looper + 8].size = size;
            
            ++looper;
        }
        
        let fixed = ((command.parameters[0] / 2) >> 15) & 0x1fff;
        looper = 0;
        while (looper < 12) {
            if (((fixed >> looper) & 0x1) !== 0) {
                this.attributes.formats[looper].fixed = true;
            }
            ++looper;
        }
        
        this.attributes.count = ((command.parameters[0] / 2) >> 27) + 1;
       
    };
     
    PICA.commands[PICA.GPUREG_ATTRIBBUFFER0_OFFSET] = function (command) {
        initialAttributes(this);
        initialAttributeBuffer(this);
        this.attributes.buffer.offset = command.parameters[0] % 0x10000000;
    };
    
    PICA.commands[PICA.GPUREG_ATTRIBBUFFER0_CONFIG1] = function (command) { 
        initialAttributes(this);
        initialAttributeBuffer(this);
        initialAttributeBufferMapping(this);
        let buffer = this.attributes.buffer;
        let looper = 0;
        while (looper < 8) {
            buffer.mapping[looper] = Math.floor(command.parameters[0] / Math.pow(2, looper * 4)) % 16;
            ++looper;
        }
    };
    
    PICA.commands[PICA.GPUREG_ATTRIBBUFFER0_CONFIG2] = function (command) {
        initialAttributes(this);
        initialAttributeBuffer(this);
        initialAttributeBufferMapping(this);
        let buffer = this.attributes.buffer;
        let looper = 0;
        while (looper < 4) {
            buffer.mapping[looper + 8] = Math.floor(command.parameters[0] / Math.pow(2, looper * 4)) % 16;
            ++looper;
        }
        buffer.unitSize = ((command.parameters[0] / 2) >> 15) & 0xff;
        buffer.components = ((command.parameters[0] / 2) >> 27) & 0xf;
    };
     
    PICA.commands[PICA.GPUREG_ATTRIBBUFFER1_OFFSET] = PICA.commands[PICA.GPUREG_ATTRIBBUFFER0_OFFSET];
    PICA.commands[PICA.GPUREG_ATTRIBBUFFER2_OFFSET] = PICA.commands[PICA.GPUREG_ATTRIBBUFFER0_OFFSET];
    PICA.commands[PICA.GPUREG_ATTRIBBUFFER3_OFFSET] = PICA.commands[PICA.GPUREG_ATTRIBBUFFER0_OFFSET];
    PICA.commands[PICA.GPUREG_ATTRIBBUFFER4_OFFSET] = PICA.commands[PICA.GPUREG_ATTRIBBUFFER0_OFFSET];
    PICA.commands[PICA.GPUREG_ATTRIBBUFFER5_OFFSET] = PICA.commands[PICA.GPUREG_ATTRIBBUFFER0_OFFSET];
    PICA.commands[PICA.GPUREG_ATTRIBBUFFER6_OFFSET] = PICA.commands[PICA.GPUREG_ATTRIBBUFFER0_OFFSET];
    PICA.commands[PICA.GPUREG_ATTRIBBUFFER7_OFFSET] = PICA.commands[PICA.GPUREG_ATTRIBBUFFER0_OFFSET];
    PICA.commands[PICA.GPUREG_ATTRIBBUFFER8_OFFSET] = PICA.commands[PICA.GPUREG_ATTRIBBUFFER0_OFFSET];
    PICA.commands[PICA.GPUREG_ATTRIBBUFFER9_OFFSET] = PICA.commands[PICA.GPUREG_ATTRIBBUFFER0_OFFSET];
    PICA.commands[PICA.GPUREG_ATTRIBBUFFER10_OFFSET] = PICA.commands[PICA.GPUREG_ATTRIBBUFFER0_OFFSET];
    PICA.commands[PICA.GPUREG_ATTRIBBUFFER11_OFFSET] = PICA.commands[PICA.GPUREG_ATTRIBBUFFER0_OFFSET];
      
    PICA.commands[PICA.GPUREG_ATTRIBBUFFER1_CONFIG1] = PICA.commands[PICA.GPUREG_ATTRIBBUFFER0_CONFIG1];
    PICA.commands[PICA.GPUREG_ATTRIBBUFFER2_CONFIG1] = PICA.commands[PICA.GPUREG_ATTRIBBUFFER0_CONFIG1];
    PICA.commands[PICA.GPUREG_ATTRIBBUFFER3_CONFIG1] = PICA.commands[PICA.GPUREG_ATTRIBBUFFER0_CONFIG1];
    PICA.commands[PICA.GPUREG_ATTRIBBUFFER4_CONFIG1] = PICA.commands[PICA.GPUREG_ATTRIBBUFFER0_CONFIG1];
    PICA.commands[PICA.GPUREG_ATTRIBBUFFER5_CONFIG1] = PICA.commands[PICA.GPUREG_ATTRIBBUFFER0_CONFIG1];
    PICA.commands[PICA.GPUREG_ATTRIBBUFFER6_CONFIG1] = PICA.commands[PICA.GPUREG_ATTRIBBUFFER0_CONFIG1];
    PICA.commands[PICA.GPUREG_ATTRIBBUFFER7_CONFIG1] = PICA.commands[PICA.GPUREG_ATTRIBBUFFER0_CONFIG1];
    PICA.commands[PICA.GPUREG_ATTRIBBUFFER8_CONFIG1] = PICA.commands[PICA.GPUREG_ATTRIBBUFFER0_CONFIG1];
    PICA.commands[PICA.GPUREG_ATTRIBBUFFER9_CONFIG1] = PICA.commands[PICA.GPUREG_ATTRIBBUFFER0_CONFIG1];
    PICA.commands[PICA.GPUREG_ATTRIBBUFFER10_CONFIG1] = PICA.commands[PICA.GPUREG_ATTRIBBUFFER0_CONFIG1];
    PICA.commands[PICA.GPUREG_ATTRIBBUFFER11_CONFIG1] = PICA.commands[PICA.GPUREG_ATTRIBBUFFER0_CONFIG1];
  
    PICA.commands[PICA.GPUREG_ATTRIBBUFFER1_CONFIG2] = PICA.commands[PICA.GPUREG_ATTRIBBUFFER0_CONFIG2];
    PICA.commands[PICA.GPUREG_ATTRIBBUFFER2_CONFIG2] = PICA.commands[PICA.GPUREG_ATTRIBBUFFER0_CONFIG2];
    PICA.commands[PICA.GPUREG_ATTRIBBUFFER3_CONFIG2] = PICA.commands[PICA.GPUREG_ATTRIBBUFFER0_CONFIG2];
    PICA.commands[PICA.GPUREG_ATTRIBBUFFER4_CONFIG2] = PICA.commands[PICA.GPUREG_ATTRIBBUFFER0_CONFIG2];
    PICA.commands[PICA.GPUREG_ATTRIBBUFFER5_CONFIG2] = PICA.commands[PICA.GPUREG_ATTRIBBUFFER0_CONFIG2];
    PICA.commands[PICA.GPUREG_ATTRIBBUFFER6_CONFIG2] = PICA.commands[PICA.GPUREG_ATTRIBBUFFER0_CONFIG2];
    PICA.commands[PICA.GPUREG_ATTRIBBUFFER7_CONFIG2] = PICA.commands[PICA.GPUREG_ATTRIBBUFFER0_CONFIG2];
    PICA.commands[PICA.GPUREG_ATTRIBBUFFER8_CONFIG2] = PICA.commands[PICA.GPUREG_ATTRIBBUFFER0_CONFIG2];
    PICA.commands[PICA.GPUREG_ATTRIBBUFFER9_CONFIG2] = PICA.commands[PICA.GPUREG_ATTRIBBUFFER0_CONFIG2];
    PICA.commands[PICA.GPUREG_ATTRIBBUFFER10_CONFIG2] = PICA.commands[PICA.GPUREG_ATTRIBBUFFER0_CONFIG2];
    PICA.commands[PICA.GPUREG_ATTRIBBUFFER11_CONFIG2] = PICA.commands[PICA.GPUREG_ATTRIBBUFFER0_CONFIG2];
  
    PICA.commands[PICA.GPUREG_INDEXBUFFER_CONFIG] = function (command) {
        initialAttributes(this);
        if (!this.attributes.indices) {
            this.attributes.indices = {};
        }
        this.attributes.indices.offset = command.parameters[0] & 0x7ffffff; // TODO: correct 27 bit?
        this.attributes.indices.is16Bit = (command.parameters[0] >> 31) !== 0;
    };
    
    PICA.commands[PICA.GPUREG_NUMVERTICES] = function (command) {
        initialAttributes(this);
        this.attributes.verticesCount = command.parameters[0];
    };
    
    PICA.commands[PICA.GPUREG_GEOSTAGE_CONFIG] = function (command) {
        initialRendering(this);
        this.rendering.usingGeometryShader = (command.parameters[0] & 0x2) !== 0;
        this.rendering.drawingTriangleElements = (command.parameters[0] & 0x10) !== 0;
    };
    
    PICA.commands[PICA.GPUREG_VERTEX_OFFSET] = function (command) {
        this.vertices.offset = command.parameters[0];
    };
    
    PICA.commands[PICA.GPUREG_POST_VERTEX_CACHE_NUM] = function (/*command*/) {
        // TODO: post vertex cache
    };
    
    PICA.commands[PICA.GPUREG_DRAWARRAYS] = function (command) {
        if (this.draw && this.draw.array && command.parameters[0]) {
            this.draw.array(this, command.parameters[0]);
        }
    };
    
    PICA.commands[PICA.GPUREG_DRAWELEMENTS] = function (command) {
        if (this.draw && this.draw.elements && command.parameters[0]) {
            this.draw.elements(this, command.parameters[0])
        }
        
    };
    
    PICA.commands[PICA.GPUREG_VTX_FUNC] = function (/*command*/) {
        // TODO: clear post vertex cache
    };
    
    PICA.commands[PICA.GPUREG_FIXEDATTRIB_INDEX] = function (command) { 
        initialAttributeFixeds(this);
        this.attributes.fixeds.index = command.parameters[0] & 0xf; 
    };

    PICA.commands[PICA.GPUREG_FIXEDATTRIB_DATA0] = function (command) { 
        initialAttributeFixeds(this);
        initialAttributeFixedData(this);
        this.attributes.fixeds.data[this.attributes.fixeds.index].words[0] = command.parameters[0]; 
    };
 
    PICA.commands[PICA.GPUREG_FIXEDATTRIB_DATA1] = function (command) { 
        initialAttributeFixeds(this);
        initialAttributeFixedData(this);
        this.attributes.fixeds.data[this.attributes.fixeds.index].words[1] = command.parameters[0]; 
    };
 
    PICA.commands[PICA.GPUREG_FIXEDATTRIB_DATA2] = function (command) { 
        initialAttributeFixeds(this);
        initialAttributeFixedData(this);
        this.attributes.fixeds.data[this.attributes.fixeds.index].words[2] = command.parameters[0]; 
    };
     
    PICA.commands[PICA.GPUREG_CMDBUF_SIZE0] = function (command) {
        this.commands.sizes[0] = command.parameters[0] & 0x3fffff;
    };
    
    PICA.commands[PICA.GPUREG_CMDBUF_SIZE1] = function (command) {
        this.commands.sizes[1] = command.parameters[0] & 0x3fffff;
    };
    
    PICA.commands[PICA.GPUREG_CMDBUF_ADDR0] = function (command) {
        this.commands.offsets[0] = command.parameters[0] & 0x3fffffff;
    };
    
    PICA.commands[PICA.GPUREG_CMDBUF_ADDR1] = function (command) {
        this.commands.offsets[1] = command.parameters[0] & 0x3fffffff;
    };
     
    PICA.commands[PICA.GPUREG_CMDBUF_JUMP0] = function (command) {
        if (command.parameters[0] !== 0) {
            this.commands.current = this.commands.buffers[0];
        }
    };
    
    PICA.commands[PICA.GPUREG_CMDBUF_JUMP1] = function (command) {
        if (command.parameters[0] !== 0) {
            this.commands.current = this.commands.buffers[1];
        }
    };
    
    PICA.commands[PICA.GPUREG_VSH_NUM_ATTR] = function (command) { 
        initialShader(this);
        initialVertexShader(this);
        initialVertexShaderAttributes(this);
        this.shader.vertex.attributes.count = (command.parameters[0] & 0xf) + 1; 
    };

    PICA.commands[PICA.GPUREG_VSH_COM_MODE] = function (command) {
        initialShader(this);
        initialVertexShader(this);
        this.shader.vertex.usingGeometryConfiguration = (command.parameters[0] & 0x1) !== 0;
    };
    
    PICA.commands[PICA.GPUREG_START_DRAW_FUNC0] = function (command) {
        initialRendering(this);
        this.rendering.drawing = (command.parameters[0] & 0x1) === 0;
    };
    
    PICA.commands[PICA.GPUREG_VSH_OUTMAP_TOTAL1] = function (command) {
        initialShader(this);
        initialVertexShader(this);
        initialVertexShaderOutputMap(this);
        this.shader.vertex.outputMap.count = command.parameters[0] & 0xf;
    };
    
    PICA.commands[PICA.GPUREG_VSH_OUTMAP_TOTAL2] =  PICA.commands[PICA.GPUREG_VSH_OUTMAP_TOTAL1];
    
    PICA.commands[PICA.GPUREG_GSH_MISC0] = function (/*command*/) {
        // TODO: geometry misc
    };
    
    PICA.commands[PICA.GPUREG_GEOSTAGE_CONFIG2] = function (command) {
        initialRendering(this);
        this.rendering.drawingElements = (command.parameters[0] & 0x1) === 0;
        this.rendering.drawingArrays = (command.parameters[0] & 0x1) !== 0;
        this.rendering.drawingTriangleElements = (command.parameters[0] & 0x10) !== 0;
    };
    
    PICA.commands[PICA.GPUREG_PRIMITIVE_CONFIG] = function (command) {
        initialRendering(this);
        this.rendering.outputRegisters = (command.parameters[0] & 0xf) + 1;
        this.rendering.primitiveMode = new PICA.PrimitiveMode(command.parameters[0] >> 8);
    };
    
    PICA.commands[PICA.GPUREG_RESTART_PRIMITIVE] = function (command) {
        if (command.parameters[0] & 0x1) {
            initialRendering(this);
            this.rendering.outputRegisters = 1;
            this.rendering.primitiveMode = new PICA.PrimitiveMode(0);
        }
    };
    
    PICA.commands[PICA.GPUREG_GSH_BOOLUNIFORM] = function (command) {
        initialShader(this);
        initialGeometryShader(this);
        this.shader.geometry.bools = [];
        let value = command.parameters[0] % 0x100;
        let looper = 0;
        while (looper < 16) {
            this.shader.geometry.bools[looper] = ((value >> looper) & 0x1) !== 0;
            ++looper;
        }
    };
    
    PICA.commands[PICA.GPUREG_GSH_INTUNIFORM_I0] = function (command) {
        initialShader(this);
        initialGeometryShader(this);
        initialGeometryShaderIntUnifrom(this);
        this.shader.geometry.ints[0] = {
            "x": command.parameters[0] % 0x100,
            "y": Math.floor(command.parameters[0] / 0x100) & 0xff,
            "z": Math.floor(command.parameters[0] / 0x10000) & 0xff,
            "w": Math.floor(command.parameters[0] / 0x1000000) & 0xff,
        };
    };
   
    PICA.commands[PICA.GPUREG_GSH_INTUNIFORM_I1] = function (command) {
        initialShader(this);
        initialGeometryShader(this);
        initialGeometryShaderIntUnifrom(this);
        this.shader.geometry.ints[1] = {
            "x": command.parameters[0] % 0x100,
            "y": Math.floor(command.parameters[0] / 0x100) & 0xff,
            "z": Math.floor(command.parameters[0] / 0x10000) & 0xff,
            "w": Math.floor(command.parameters[0] / 0x1000000) & 0xff,
        };
    };
   
    PICA.commands[PICA.GPUREG_GSH_INTUNIFORM_I2] = function (command) {
        initialShader(this);
        initialGeometryShader(this);
        initialGeometryShaderIntUnifrom(this);
        this.shader.geometry.ints[2] = {
            "x": command.parameters[0] % 0x100,
            "y": Math.floor(command.parameters[0] / 0x100) & 0xff,
            "z": Math.floor(command.parameters[0] / 0x10000) & 0xff,
            "w": Math.floor(command.parameters[0] / 0x1000000) & 0xff,
        };
    };
   
    PICA.commands[PICA.GPUREG_GSH_INTUNIFORM_I3] = function (command) {
        initialShader(this);
        initialGeometryShader(this);
        initialGeometryShaderIntUnifrom(this);
        this.shader.geometry.ints[3] = {
            "x": command.parameters[0] % 0x100,
            "y": Math.floor(command.parameters[0] / 0x100) & 0xff,
            "z": Math.floor(command.parameters[0] / 0x10000) & 0xff,
            "w": Math.floor(command.parameters[0] / 0x1000000) & 0xff,
        };
    };
  
    PICA.commands[PICA.GPUREG_GSH_INPUTBUFFER_CONFIG] = function (command) {
        initialShader(this);
        initialGeometryShader(this);
        this.shader.geometry.inputs = (command.parameters[0] & 0xf) + 1;
        this.shader.geometry.enabled = ((command.parameters[0] >> 24) & 0xff) === 0x80;
    };
  
    PICA.commands[PICA.GPUREG_GSH_ENTRYPOINT] = function (command) {
        initialShader(this);
        initialGeometryShader(this);
        this.shader.geometry.entryPoint = command.parameters[0] & 0xffff;
    };
   
    PICA.commands[PICA.GPUREG_GSH_ATTRIBUTES_PERMUTATION_LOW] = function (command) { 
        initialShader(this);
        initialGeometryShader(this);
        initialGeometryShaderAttributes(this);
        initialGeometryShaderAttributePermutations(this);
        let looper = 0;
        while (looper < 8) {
            this.shader.geometry.attributes.permutations[looper] = Math.floor(command.parameters[0] / Math.pow(2, looper * 4)) % 0x10;
            ++looper;
        }
    };
   
    PICA.commands[PICA.GPUREG_GSH_ATTRIBUTES_PERMUTATION_HIGH] = function (command) { 
        initialShader(this);
        initialGeometryShader(this);
        initialGeometryShaderAttributes(this);
        initialGeometryShaderAttributePermutations(this);
        let looper = 0;
        while (looper < 8) {
            this.shader.geometry.attributes.permutations[looper + 8] = Math.floor(command.parameters[0] / Math.pow(2, looper * 4)) % 0x10;
            ++looper;
        }
    };
   
    PICA.commands[PICA.GPUREG_GSH_OUTMAP_MASK] = function (command) {
        initialShader(this);
        initialGeometryShader(this);
        initialGeometryShaderOutputMap(this);
        let looper = 0;
        while (looper < 16) {
            this.shader.geometry.outputMap[looper] = ((command.parameters[0] >> looper) & 0x1) !== 0;
            ++looper;
        }
    };
    
    PICA.commands[PICA.GPUREG_GSH_CODETRANSFER_END] = function (command) {
        if (command.parameters[0]) {
            initialShader(this);
            initialGeometryShader(this);
            this.shader.geometry.codes.ready = true;
        }
    };
     
    PICA.commands[PICA.GPUREG_GSH_FLOATUNIFORM_INDEX] = function (command) {
        initialShader(this);
        initialGeometryShader(this);
        initialGeometryShaderFloatUnifrom(this);
        this.shader.geometry.floats.index = command.parameters[0];
    };
    
    PICA.commands[PICA.GPUREG_GSH_FLOATUNIFORM_DATA0] = function (command) {
        initialShader(this);
        initialGeometryShader(this);
        initialGeometryShaderFloatUnifrom(this);
        this.shader.geometry.floats.setValues(command.parameters);
    };
    
    PICA.commands[PICA.GPUREG_GSH_FLOATUNIFORM_DATA1] = PICA.commands[PICA.GPUREG_GSH_FLOATUNIFORM_DATA0];
    PICA.commands[PICA.GPUREG_GSH_FLOATUNIFORM_DATA2] = PICA.commands[PICA.GPUREG_GSH_FLOATUNIFORM_DATA0];
    PICA.commands[PICA.GPUREG_GSH_FLOATUNIFORM_DATA3] = PICA.commands[PICA.GPUREG_GSH_FLOATUNIFORM_DATA0];
    PICA.commands[PICA.GPUREG_GSH_FLOATUNIFORM_DATA4] = PICA.commands[PICA.GPUREG_GSH_FLOATUNIFORM_DATA0];
    PICA.commands[PICA.GPUREG_GSH_FLOATUNIFORM_DATA5] = PICA.commands[PICA.GPUREG_GSH_FLOATUNIFORM_DATA0];
    PICA.commands[PICA.GPUREG_GSH_FLOATUNIFORM_DATA6] = PICA.commands[PICA.GPUREG_GSH_FLOATUNIFORM_DATA0];
    PICA.commands[PICA.GPUREG_GSH_FLOATUNIFORM_DATA7] = PICA.commands[PICA.GPUREG_GSH_FLOATUNIFORM_DATA0];
    
    PICA.commands[PICA.GPUREG_GSH_CODETRANSFER_INDEX] = function (command) {
        initialShader(this);
        initialGeometryShader(this);
        initialGeometryShaderCodes(this);
        this.shader.geometry.codes.index = command.parameters[0] & 0x1fff;
    };
    
    PICA.commands[PICA.GPUREG_GSH_CODETRANSFER_DATA0] = function (command) {
        initialShader(this);
        initialGeometryShader(this);
        initialGeometryShaderCodes(this);
        if (!this.shader.geometry.codes.data) {
            this.shader.geometry.codes.data = [];
        }
        command.parameters.forEach((parameter) => {
            this.shader.geometry.codes.data[this.shader.geometry.codes.index] = parameter;
            ++this.shader.geometry.codes.index;
        });
    };
    
    PICA.commands[PICA.GPUREG_GSH_CODETRANSFER_DATA1] = PICA.commands[PICA.GPUREG_GSH_CODETRANSFER_DATA0];
    PICA.commands[PICA.GPUREG_GSH_CODETRANSFER_DATA2] = PICA.commands[PICA.GPUREG_GSH_CODETRANSFER_DATA0];
    PICA.commands[PICA.GPUREG_GSH_CODETRANSFER_DATA3] = PICA.commands[PICA.GPUREG_GSH_CODETRANSFER_DATA0];
    PICA.commands[PICA.GPUREG_GSH_CODETRANSFER_DATA4] = PICA.commands[PICA.GPUREG_GSH_CODETRANSFER_DATA0];
    PICA.commands[PICA.GPUREG_GSH_CODETRANSFER_DATA5] = PICA.commands[PICA.GPUREG_GSH_CODETRANSFER_DATA0];
    PICA.commands[PICA.GPUREG_GSH_CODETRANSFER_DATA6] = PICA.commands[PICA.GPUREG_GSH_CODETRANSFER_DATA0];
    PICA.commands[PICA.GPUREG_GSH_CODETRANSFER_DATA7] = PICA.commands[PICA.GPUREG_GSH_CODETRANSFER_DATA0];
    
    PICA.commands[PICA.GPUREG_GSH_OPDESCS_INDEX] = function (command) {
        initialShader(this);
        initialGeometryShader(this);
        initialGeometryShaderOpdescs(this);
        this.shader.geometry.opdescs.index = command.parameters[0] & 0x1fff;
    };
    
    PICA.commands[PICA.GPUREG_GSH_OPDESCS_DATA0] = function (command) {
        initialShader(this);
        initialGeometryShader(this);
        initialGeometryShaderOpdescs(this);
        if (!this.shader.geometry.opdescs.data) {
            this.shader.geometry.opdescs.data = [];
        }
        command.parameters.forEach((parameter) => {
            this.shader.geometry.opdescs.data[this.shader.geometry.opdescs.index] = parameter;
            ++this.shader.geometry.opdescs.index;
        });
    };
    
    PICA.commands[PICA.GPUREG_GSH_OPDESCS_DATA1] = PICA.commands[PICA.GPUREG_GSH_OPDESCS_DATA0];
    PICA.commands[PICA.GPUREG_GSH_OPDESCS_DATA2] = PICA.commands[PICA.GPUREG_GSH_OPDESCS_DATA0];
    PICA.commands[PICA.GPUREG_GSH_OPDESCS_DATA3] = PICA.commands[PICA.GPUREG_GSH_OPDESCS_DATA0];
    PICA.commands[PICA.GPUREG_GSH_OPDESCS_DATA4] = PICA.commands[PICA.GPUREG_GSH_OPDESCS_DATA0];
    PICA.commands[PICA.GPUREG_GSH_OPDESCS_DATA5] = PICA.commands[PICA.GPUREG_GSH_OPDESCS_DATA0];
    PICA.commands[PICA.GPUREG_GSH_OPDESCS_DATA6] = PICA.commands[PICA.GPUREG_GSH_OPDESCS_DATA0];
    PICA.commands[PICA.GPUREG_GSH_OPDESCS_DATA7] = PICA.commands[PICA.GPUREG_GSH_OPDESCS_DATA0];
    
    PICA.commands[PICA.GPUREG_VSH_BOOLUNIFORM] = function (command) {
        initialShader(this);
        initialVertexShader(this);
        this.shader.vertex.bools = [];
        let value = command.parameters[0] & 0xffff;
        let looper = 0;
        while (looper < 16) {
            this.shader.vertex.bools[looper] = ((value >> looper) & 0x1) !== 0;
            ++looper;
        }
    };
    
    PICA.commands[PICA.GPUREG_VSH_INTUNIFORM_I0] = function (command) {
        initialShader(this);
        initialVertexShader(this);
        initialVertexShaderIntUnifrom(this);
        this.shader.vertex.ints[0] = {
            "x": command.parameters[0] % 0x100,
            "y": Math.floor(command.parameters[0] / 0x100) & 0xff,
            "z": Math.floor(command.parameters[0] / 0x10000) & 0xff,
            "w": Math.floor(command.parameters[0] / 0x1000000) & 0xff,
        };
    };
   
    PICA.commands[PICA.GPUREG_VSH_INTUNIFORM_I1] = function (command) {
        initialShader(this);
        initialVertexShader(this);
        initialVertexShaderIntUnifrom(this);
        this.shader.vertex.ints[1] = {
            "x": command.parameters[0] % 0x100,
            "y": Math.floor(command.parameters[0] / 0x100) & 0xff,
            "z": Math.floor(command.parameters[0] / 0x10000) & 0xff,
            "w": Math.floor(command.parameters[0] / 0x1000000) & 0xff,
        };
    };
   
    PICA.commands[PICA.GPUREG_VSH_INTUNIFORM_I2] = function (command) {
        initialShader(this);
        initialVertexShader(this);
        initialVertexShaderIntUnifrom(this);
        this.shader.vertex.ints[2] = {
            "x": command.parameters[0] % 0x100,
            "y": Math.floor(command.parameters[0] / 0x100) & 0xff,
            "z": Math.floor(command.parameters[0] / 0x10000) & 0xff,
            "w": Math.floor(command.parameters[0] / 0x1000000) & 0xff,
        };
    };
   
    PICA.commands[PICA.GPUREG_VSH_INTUNIFORM_I3] = function (command) {
        initialShader(this);
        initialVertexShader(this);
        initialVertexShaderIntUnifrom(this);
        this.shader.vertex.ints[3] = {
            "x": command.parameters[0] % 0x100,
            "y": Math.floor(command.parameters[0] / 0x100) & 0xff,
            "z": Math.floor(command.parameters[0] / 0x10000) & 0xff,
            "w": Math.floor(command.parameters[0] / 0x1000000) & 0xff,
        };
    };
  
    PICA.commands[PICA.GPUREG_VSH_INPUTBUFFER_CONFIG] = function (command) {
        initialShader(this);
        initialVertexShader(this);
        this.shader.vertex.inputs = (command.parameters[0] & 0xf) + 1;
    };
    
    PICA.commands[PICA.GPUREG_VSH_ENTRYPOINT] = function (command) {
        initialShader(this);
        initialVertexShader(this);
        this.shader.vertex.entryPoint = command.parameters[0] & 0xffff;
    };
   
    PICA.commands[PICA.GPUREG_VSH_ATTRIBUTES_PERMUTATION_LOW] = function (command) { 
        initialShader(this);
        initialVertexShader(this);
        initialVertexShaderAttributes(this);
        initialVertexShaderAttributePermutations(this);
        let looper = 0;
        while (looper < 8) {
            this.shader.vertex.attributes.permutations[looper] = Math.floor(command.parameters[0] / Math.pow(2, looper * 4)) % 0x10;
            ++looper;
        }
    };
   
    PICA.commands[PICA.GPUREG_VSH_ATTRIBUTES_PERMUTATION_HIGH] = function (command) { 
        initialShader(this);
        initialVertexShader(this);
        initialVertexShaderAttributes(this);
        initialVertexShaderAttributePermutations(this);
        let looper = 0;
        while (looper < 8) {
            this.shader.vertex.attributes.permutations[looper + 8] = Math.floor(command.parameters[0] / Math.pow(2, looper * 4)) % 0x10;
            ++looper;
        }
    };
   
    PICA.commands[PICA.GPUREG_VSH_OUTMAP_MASK] = function (command) {
        initialShader(this);
        initialVertexShader(this);
        initialVertexShaderOutputMap(this);
        let looper = 0;
        while (looper < 16) {
            if (!this.shader.vertex.outputMap[looper]) {
                this.shader.vertex.outputMap[looper] = {};
            }
            this.shader.vertex.outputMap[looper].enabled = ((command.parameters[0] >> looper) & 0x1) !== 0;
            ++looper;
        }
    };
    
    PICA.commands[PICA.GPUREG_VSH_CODETRANSFER_END] = function (command) {
        if (command.parameters[0]) {
            initialShader(this);
            initialVertexShader(this);
            this.shader.vertex.codes.ready = true;
        }
    };
     
    PICA.commands[PICA.GPUREG_VSH_FLOATUNIFORM_INDEX] = function (command) {
        initialShader(this);
        initialVertexShader(this);
        initialVertexShaderFloatUnifrom(this);
        this.shader.vertex.floats.index = command.parameters[0];
    };
    
    PICA.commands[PICA.GPUREG_VSH_FLOATUNIFORM_DATA0] = function (command) {
        initialShader(this);
        initialVertexShader(this);
        initialVertexShaderFloatUnifrom(this);
        this.shader.vertex.floats.setValues(command.parameters);
    };
    
    PICA.commands[PICA.GPUREG_VSH_FLOATUNIFORM_DATA1] = PICA.commands[PICA.GPUREG_VSH_FLOATUNIFORM_DATA0];
    PICA.commands[PICA.GPUREG_VSH_FLOATUNIFORM_DATA2] = PICA.commands[PICA.GPUREG_VSH_FLOATUNIFORM_DATA0];
    PICA.commands[PICA.GPUREG_VSH_FLOATUNIFORM_DATA3] = PICA.commands[PICA.GPUREG_VSH_FLOATUNIFORM_DATA0];
    PICA.commands[PICA.GPUREG_VSH_FLOATUNIFORM_DATA4] = PICA.commands[PICA.GPUREG_VSH_FLOATUNIFORM_DATA0];
    PICA.commands[PICA.GPUREG_VSH_FLOATUNIFORM_DATA5] = PICA.commands[PICA.GPUREG_VSH_FLOATUNIFORM_DATA0];
    PICA.commands[PICA.GPUREG_VSH_FLOATUNIFORM_DATA6] = PICA.commands[PICA.GPUREG_VSH_FLOATUNIFORM_DATA0];
    PICA.commands[PICA.GPUREG_VSH_FLOATUNIFORM_DATA7] = PICA.commands[PICA.GPUREG_VSH_FLOATUNIFORM_DATA0];
    
    PICA.commands[PICA.GPUREG_VSH_CODETRANSFER_INDEX] = function (command) {
        initialShader(this);
        initialVertexShader(this);
        initialVertexShaderCodes(this);
        this.shader.vertex.codes.index = command.parameters[0] & 0x1fff;
    };
    
    PICA.commands[PICA.GPUREG_VSH_CODETRANSFER_DATA0] = function (command) {
        initialShader(this);
        initialVertexShader(this);
        initialVertexShaderCodes(this);
        if (!this.shader.vertex.codes.data) {
            this.shader.vertex.codes.data = [];
        }
        command.parameters.forEach((parameter) => {
            this.shader.vertex.codes.data[this.shader.vertex.codes.index] = parameter;
            ++this.shader.vertex.codes.index;
        });
    };
    
    PICA.commands[PICA.GPUREG_VSH_CODETRANSFER_DATA1] = PICA.commands[PICA.GPUREG_VSH_CODETRANSFER_DATA0];
    PICA.commands[PICA.GPUREG_VSH_CODETRANSFER_DATA2] = PICA.commands[PICA.GPUREG_VSH_CODETRANSFER_DATA0];
    PICA.commands[PICA.GPUREG_VSH_CODETRANSFER_DATA3] = PICA.commands[PICA.GPUREG_VSH_CODETRANSFER_DATA0];
    PICA.commands[PICA.GPUREG_VSH_CODETRANSFER_DATA4] = PICA.commands[PICA.GPUREG_VSH_CODETRANSFER_DATA0];
    PICA.commands[PICA.GPUREG_VSH_CODETRANSFER_DATA5] = PICA.commands[PICA.GPUREG_VSH_CODETRANSFER_DATA0];
    PICA.commands[PICA.GPUREG_VSH_CODETRANSFER_DATA6] = PICA.commands[PICA.GPUREG_VSH_CODETRANSFER_DATA0];
    PICA.commands[PICA.GPUREG_VSH_CODETRANSFER_DATA7] = PICA.commands[PICA.GPUREG_VSH_CODETRANSFER_DATA0];
    
    PICA.commands[PICA.GPUREG_VSH_OPDESCS_INDEX] = function (command) {
        initialShader(this);
        initialVertexShader(this);
        initialVertexShaderOpdescs(this);
        this.shader.vertex.opdescs.index = command.parameters[0] & 0x1fff;
    };
    
    PICA.commands[PICA.GPUREG_VSH_OPDESCS_DATA0] = function (command) {
        initialShader(this);
        initialVertexShader(this);
        initialVertexShaderOpdescs(this);
        if (!this.shader.vertex.opdescs.data) {
            this.shader.vertex.opdescs.data = [];
        } 
        command.parameters.forEach((parameter) => {
            this.shader.vertex.opdescs.data[this.shader.vertex.opdescs.index] = parameter;
            ++this.shader.vertex.opdescs.index;
        });
    };
    
    PICA.commands[PICA.GPUREG_VSH_OPDESCS_DATA1] = PICA.commands[PICA.GPUREG_VSH_OPDESCS_DATA0];
    PICA.commands[PICA.GPUREG_VSH_OPDESCS_DATA2] = PICA.commands[PICA.GPUREG_VSH_OPDESCS_DATA0];
    PICA.commands[PICA.GPUREG_VSH_OPDESCS_DATA3] = PICA.commands[PICA.GPUREG_VSH_OPDESCS_DATA0];
    PICA.commands[PICA.GPUREG_VSH_OPDESCS_DATA4] = PICA.commands[PICA.GPUREG_VSH_OPDESCS_DATA0];
    PICA.commands[PICA.GPUREG_VSH_OPDESCS_DATA5] = PICA.commands[PICA.GPUREG_VSH_OPDESCS_DATA0];
    PICA.commands[PICA.GPUREG_VSH_OPDESCS_DATA6] = PICA.commands[PICA.GPUREG_VSH_OPDESCS_DATA0];
    PICA.commands[PICA.GPUREG_VSH_OPDESCS_DATA7] = PICA.commands[PICA.GPUREG_VSH_OPDESCS_DATA0];
    
    const Float24Vector = function Float24Vector() {
        Object.defineProperty(this, "words", {
            "value": []
        });
    };
    
    Float24Vector.getFloat = function (value) {
        
        let result;
        if ((value & 0x7fffff) !== 0) {
            
            let mantissa = value & 0xffff;
            let exponent = ((value >> 16) & 0x7f) + 64;
            let signBit = (value >> 23) & 1;
            
            result = mantissa << 7;
            result |= exponent << 23;
            result |= signBit << 31;
            
        } else {
            result = (value & 0x800000) << 8;
        }

        return PICA.Float32Vector.asFloat32(result);
    };
     
    Object.defineProperty(Float24Vector.prototype, "x", {
        "enumerable": true,
        "get": function () {
            let word2 = this.words[2]; if ($.is.nil(word2)) word2 = 0;
            return Float24Vector.getFloat(word2 & 0xffffff);
        }
    });
    
    Object.defineProperty(Float24Vector.prototype, "y", {
        "enumerable": true,
        "get": function () {
            let word2 = this.words[2]; if ($.is.nil(word2)) word2 = 0;
            let word1 = this.words[1]; if ($.is.nil(word1)) word1 = 0;
            let value = ((word2 >> 24) & 0xff) | ((word1 & 0xffff) << 8);
            return Float24Vector.getFloat(value);
        }
    });
     
    Object.defineProperty(Float24Vector.prototype, "z", {
        "enumerable": true,
        "get": function () {
            let word1 = this.words[1]; if ($.is.nil(word1)) word1 = 0;
            let word0 = this.words[0]; if ($.is.nil(word0)) word0 = 0;
            return Float24Vector.getFloat((word1 >> 16) & 0xffff | ((word0 & 0xff) << 16));
        }
    });
    
    Object.defineProperty(Float24Vector.prototype, "w", {
        "enumerable": true,
        "get": function () {
            let word0 = this.words[0]; if ($.is.nil(word0)) word0 = 0;
            return Float24Vector.getFloat((word0 >> 8) & 0xffffff);
        }
    });
      
    Object.defineProperty(Float24Vector.prototype, "0", {
        "get": function () {
            return this.x;
        }
    });
      
    Object.defineProperty(Float24Vector.prototype, "1", {
        "get": function () {
            return this.y;
        }
    });
      
    Object.defineProperty(Float24Vector.prototype, "2", {
        "get": function () {
            return this.z;
        }
    });
     
    Object.defineProperty(Float24Vector.prototype, "3", {
        "get": function () {
            return this.w;
        }
    });
     
    const Float32Vector = function Float32Vector() {
        Object.defineProperty(this, "words", {
            "value": []
        });
    };
     
    Float32Vector.asFloat32 = function (value) {
         
        const dataView = new DataView(new ArrayBuffer(4));
         
        if (value >= 0) {
            dataView.setUint32(0, value, true);
        } else {
            dataView.setInt32(0, value, true);
        }
         
        return dataView.getFloat32(0, true);
         
    };
    
    Object.defineProperty(Float32Vector.prototype, "x", {
        "enumerable": true,
        "get": function () {
            return Float32Vector.asFloat32(this.words[3]);    
        }
    });
     
    Object.defineProperty(Float32Vector.prototype, "y", {
        "enumerable": true,
        "get": function () {
            return Float32Vector.asFloat32(this.words[2]);    
        }
    });
     
    Object.defineProperty(Float32Vector.prototype, "z", {
        "enumerable": true,
        "get": function () {
            return Float32Vector.asFloat32(this.words[1]);    
        }
    });
    
    Object.defineProperty(Float32Vector.prototype, "w", {
        "enumerable": true,
        "get": function () {
            return Float32Vector.asFloat32(this.words[0]);    
        }
    });
    
    Object.defineProperty(Float32Vector.prototype, "0", {
        "get": function () {
            return this.x;
        }
    });
     
    Object.defineProperty(Float32Vector.prototype, "1", {
        "get": function () {
            return this.y;
        }
    });
     
    Object.defineProperty(Float32Vector.prototype, "2", {
        "get": function () {
            return this.z;
        }
    });
    
    Object.defineProperty(Float32Vector.prototype, "3", {
        "get": function () {
            return this.w;
        }
    });
    
    const Color = function Color(reader) {
        if ($.is(reader, Number)) {
            this.r = reader % 0x100;
            this.g = Math.floor(reader / 256) % 0x100;
            this.b = Math.floor(reader / 256 / 256) % 0x100;
            this.a = Math.floor(reader / 256 / 256 / 256) % 0x100;
        } else {
            this.r = reader.readUint8();
            this.g = reader.readUint8();
            this.b = reader.readUint8();
            this.a = reader.readUint8();
        }
    };
    
    const ColorOperation = function ColorOperation(code) {
        this.fragmentOperationMode = new PICA.FragmentOperationMode((code >> 0) & 3);
        this.blendMode = new PICA.BlendMode((code >> 8) & 1);
    };
    
    const BlendFunction = function BlendFunction(code) {
        this.colorEquation = new PICA.BlendEquation((code >> 0) & 7);
        this.alphaEquation = new PICA.BlendEquation((code >> 8) & 7);
        this.colorSourceFunction = new PICA.BlendFunctionOperation((code >> 16) & 0xf);
        this.colorDestinationFunction = new PICA.BlendFunctionOperation((code >> 20) & 0xf);
        this.alphaSourceFunction = new PICA.BlendFunctionOperation((code >> 24) & 0xf);
        this.alphaDestinationFunction = new PICA.BlendFunctionOperation((code >> 28) & 0xf);
    };
    
    const BlendFunctionOperation = function BlendFunctionOperation(code) {
        this.code = code;
        this.label = Object.keys(arguments.callee).filter((key) => arguments.callee[key] === code)[0];
    };
    
    BlendFunctionOperation.ZERO = 0;
    BlendFunctionOperation.ONE = 1;
    BlendFunctionOperation.SOURCE_COLOR = 2;
    BlendFunctionOperation.ONE_MINUS_SOURCE_COLOR = 3;
    BlendFunctionOperation.DESTINATION_COLOR = 4;
    BlendFunctionOperation.ONE_MINUS_DESTINATION_COLOR = 5;
    BlendFunctionOperation.SOURCE_ALPHA = 6;
    BlendFunctionOperation.ONE_MINUS_SOURCE_ALPHA = 7;
    BlendFunctionOperation.DESTINATION_ALPHA = 8;
    BlendFunctionOperation.ONE_MINUS_DESTINATION_ALPHA = 9;
    BlendFunctionOperation.CONSTANT_COLOR = 10;
    BlendFunctionOperation.ONE_MINUS_CONSTANT_COLOR = 11;
    BlendFunctionOperation.CONSTANT_ALPHA = 12;
    BlendFunctionOperation.ONE_MINUS_CONSTANT_ALPHA = 13;
    BlendFunctionOperation.SOURCE_ALPHA_SATURATE = 14;
    
    const AlphaTest = function AlphaTest(code) {
        this.enabled = (code & 1) !== 0;
        this.testFunction = new PICA.TestFunction((code >> 4) & 7);
        this.reference = (code >> 8);
    };
    
    const StencilTest = function StencilTest(code) {
        this.enabled = (code & 1) !== 0;
        this.testFunction = new PICA.TestFunction((code >> 4) & 7);
        this.bufferMask = (code >> 8) & 0xff;
        this.reference = (code >> 16) & 0xff;
        this.mask = (code >> 24) & 0xff;
    };
    
    const StencilOperation = function StencilOperation(code) {
        this.failOperation = new PICA.StencilOperationAction((code >> 0) & 7);
        this.zFailOperation = new PICA.StencilOperationAction((code >> 4) & 7);
        this.zPassOperation = new PICA.StencilOperationAction((code >> 8) & 7);
    };
    
    const StencilOperationAction = function StencilOperationAction(code) {
        this.code = code;
        this.label = Object.keys(arguments.callee).filter((key) => arguments.callee[key] === code)[0];
    };
    
    StencilOperationAction.KEEP = 0;
    StencilOperationAction.ZERO = 1;
    StencilOperationAction.REPLACE = 2;
    StencilOperationAction.INCREMENT = 3;
    StencilOperationAction.DECREMENT = 4;
    StencilOperationAction.INVERT = 5;
    StencilOperationAction.INCREMENT_WRAP = 6;
    StencilOperationAction.DECREMENT_WRAP = 7;
    
    const DepthColorMask = function DepthColorMask(code) {
        this.enabled = (code & 1) !== 0;
        this.depthFunction = new PICA.TestFunction((code >> 4) & 7);
        this.redWrite = (code & 0x0100) !== 0;
        this.greenWrite = (code & 0x0200) !== 0;
        this.blueWrite = (code & 0x0400) !== 0;
        this.alphaWrite = (code & 0x0800) !== 0;
        this.depthWrite = (code & 0x1000) !== 0;
    };
    
    const LogicalOperation = function LogicalOperation(code) {
        this.code = code;
        this.label = Object.keys(arguments.callee).filter((key) => arguments.callee[key] === code)[0];
    };
    
    LogicalOperation.CLEAR = 0;
    LogicalOperation.AND = 1;
    LogicalOperation.AND_REVERSE = 2;
    LogicalOperation.COPY = 3;
    LogicalOperation.SET = 4;
    LogicalOperation.COPY_INVERTED = 5;
    LogicalOperation.NOOP = 6;
    LogicalOperation.INVERT = 7;
    LogicalOperation.NAND = 8;
    LogicalOperation.OR = 9;
    LogicalOperation.NOR = 10;
    LogicalOperation.XOR = 11;
    LogicalOperation.EQUIV = 12;
    LogicalOperation.AND_INVERTED = 13;
    LogicalOperation.OR_REVERSE = 14;
    LogicalOperation.OR_INVERTED = 15;
    LogicalOperation.OR_INVERTED = 15;
    
    const FaceCulling = function FaceCulling(code) {
        this.code = code;
        this.label = Object.keys(arguments.callee).filter((key) => arguments.callee[key] === code)[0];
    };
    
    FaceCulling.NEVER = 0;
    FaceCulling.FRONT_FACE = 1;
    FaceCulling.BACK_FACE = 2;
    
    const FragmentOperationMode = function FragmentOperationMode(code) {
        this.code = code;
        this.label = Object.keys(arguments.callee).filter((key) => arguments.callee[key] === code)[0];
    };
    
    FragmentOperationMode.DEFAULT = 0;
    FragmentOperationMode.GAS = 1;
    FragmentOperationMode.SHADOW = 3;
    
    const BlendMode = function BlendMode(code) {
        this.code = code;
        this.label = Object.keys(arguments.callee).filter((key) => arguments.callee[key] === code)[0];
    }
    
    BlendMode.LOGICAL_OPERATION = 0;
    BlendMode.BLEND = 1;
    
    const BlendEquation = function BlendEquation(code) {
        this.code = code;
        this.label = Object.keys(arguments.callee).filter((key) => arguments.callee[key] === code)[0];
    };
    
    BlendEquation.ADD = 0;
    BlendEquation.SUBTRACT = 1;
    BlendEquation.REVERSE_SUBTRACT = 2;
    BlendEquation.MIN = 3;
    BlendEquation.MAX = 4;
    
    const TestFunction = function TestFunction(code) {
        this.code = code;
        this.label = Object.keys(arguments.callee).filter((key) => arguments.callee[key] === code)[0];
    };
    
    TestFunction.NEVER = 0;
    TestFunction.ALWAYS = 1;
    TestFunction.EQUAL_TO = 2;
    TestFunction.NOT_EQUAL_TO = 3;
    TestFunction.LESS_THAN = 4;
    TestFunction.LESS_THAN_OR_EQUAL_TO = 5;
    TestFunction.GREATER_THAN = 6;
    TestFunction.GREATER_THAN_OR_EQUAL_TO = 7;
    
    const LightingLUTInputAbsolute = function LightingLUTInputAbsolute(code) {
        this.dist0 = (code & 0x00000002) === 0;
        this.dist1 = (code & 0x00000020) === 0;
        this.specular = (code & 0x00000200) === 0;
        this.fresnel = (code & 0x00002000) === 0;
        this.reflectR = (code & 0x00020000) === 0;
        this.reflectG = (code & 0x00200000) === 0;
        this.reflectB = (code & 0x02000000) === 0;     
    };
    
    const LightingLUTInputSelection = function LightingLUTInputSelection(code) {
        this.dist0 = new PICA.LightingLUTInputSelectionChoice((code >> 0)  & 7);
        this.dist1 = new PICA.LightingLUTInputSelectionChoice((code >> 4)  & 7);
        this.specular = new PICA.LightingLUTInputSelectionChoice((code >> 8)  & 7);
        this.fresnel = new PICA.LightingLUTInputSelectionChoice((code >> 12) & 7);
        this.reflectR = new PICA.LightingLUTInputSelectionChoice((code >> 16) & 7);
        this.reflectG = new PICA.LightingLUTInputSelectionChoice((code >> 20) & 7);
        this.reflectB = new PICA.LightingLUTInputSelectionChoice((code >> 24) & 7);
    };
    
    const LightingLUTInputSelectionChoice = function LightingLUTInputSelectionChoice(code) {
        this.code = code;
        this.label = Object.keys(arguments.callee).filter((key) => arguments.callee[key] === code)[0];
    };
    
    LightingLUTInputSelectionChoice.NORMAL_HALF = 0;
    LightingLUTInputSelectionChoice.VIEW_HALF = 1;
    LightingLUTInputSelectionChoice.NORMAL_VIEW = 2;
    LightingLUTInputSelectionChoice.LIGHT_NORMAL = 3;
    LightingLUTInputSelectionChoice.LIGHT_SPOT = 4;
    LightingLUTInputSelectionChoice.PHI = 5;
    
    const LightingLUTInputScale = function LightingLUTInputScale(code) {
        this.dist0 = new PICA.LightingLUTInputScaleMode((code >> 0)  & 7);
        this.dist1 = new PICA.LightingLUTInputScaleMode((code >> 4)  & 7);
        this.specular = new PICA.LightingLUTInputScaleMode((code >> 8)  & 7);
        this.fresnel = new PICA.LightingLUTInputScaleMode((code >> 12) & 7);
        this.reflectR = new PICA.LightingLUTInputScaleMode((code >> 16) & 7);
        this.reflectG = new PICA.LightingLUTInputScaleMode((code >> 20) & 7);
        this.reflectB = new PICA.LightingLUTInputScaleMode((code >> 24) & 7); 
    };
    
    const LightingLUTInputScaleMode = function LightingLUTInputScaleMode(code) {
        this.code = code;
        this.label = Object.keys(arguments.callee).filter((key) => arguments.callee[key] === code)[0];
    };
    
    LightingLUTInputScaleMode.ONE = 0;
    LightingLUTInputScaleMode.TWO = 1;
    LightingLUTInputScaleMode.FOUR = 2;
    LightingLUTInputScaleMode.EIGHT = 3;
    LightingLUTInputScaleMode.QUARTER = 6;
    LightingLUTInputScaleMode.HALF = 7;
    
    const PrimitiveMode = function PrimitiveMode(code) {
        this.code = code;
        this.label = Object.keys(arguments.callee).filter((key) => arguments.callee[key] === code)[0];
    };
    
    PrimitiveMode.TRIANGLES = 0;
    PrimitiveMode.TRIANGLES_STRIP = 1;
    PrimitiveMode.TRIANGLES_FAN = 2;
    PrimitiveMode.GEOMETRY = 3;
    
    const AttributeName = function AttributeName(code) {
        this.code = code;
        this.label = Object.keys(arguments.callee).filter((key) => arguments.callee[key] === code)[0];
    };
    
    AttributeName.POSITION = 0;
    AttributeName.NORMAL = 1;
    AttributeName.TANGENT = 2;
    AttributeName.COLOR = 3;
    AttributeName.TEXTURE_COORDINATE_0 = 4;
    AttributeName.TEXTURE_COORDINATE_1 = 5;
    AttributeName.TEXTURE_COORDINATE_2 = 6;
    AttributeName.BONE_INDEX = 7;
    AttributeName.BONE_WEIGHT = 8;
    AttributeName.USER_ATTRIBUTE_0 = 9;
    AttributeName.USER_ATTRIBUTE_1 = 10;
    AttributeName.USER_ATTRIBUTE_2 = 11;
    AttributeName.USER_ATTRIBUTE_3 = 12;
    AttributeName.USER_ATTRIBUTE_4 = 13;
    AttributeName.USER_ATTRIBUTE_5 = 14;
    AttributeName.USER_ATTRIBUTE_6 = 15;
    AttributeName.USER_ATTRIBUTE_7 = 16;
    AttributeName.USER_ATTRIBUTE_8 = 17;
    AttributeName.USER_ATTRIBUTE_9 = 18;
    AttributeName.USER_ATTRIBUTE_10 = 19;
    AttributeName.USER_ATTRIBUTE_11 = 20;
    AttributeName.INTERLEAVE = 21;
    
    const AttributeFormat = function AttributeFormat(code) {
        this.code = code;
        this.label = Object.keys(arguments.callee).filter((key) => arguments.callee[key] === code)[0];
    };
    
    AttributeFormat.INT_8 = 0;
    AttributeFormat.UINT_8 = 1,
    AttributeFormat.INT_16 = 2;
    AttributeFormat.FLOAT_32 = 3;
    
    AttributeFormat.normalizationScale = function (format) {
        
        let code = format;
        if (format.code) {
            code = format.code;
        }
        
        switch (code) {
            case AttributeFormat.INT_8: return 1 / 127;
            case AttributeFormat.UINT_8: return 1 / 255;
            case AttributeFormat.INT_16: return 1 / 32767;
            case AttributeFormat.FLOAT_32: return 1;
            default: return 1;
        }
        
    };
    
    const TextureCombinerSource = function TextureCombinerSource(code) {
        this.code = code;
        this.label = Object.keys(arguments.callee).filter((key) => arguments.callee[key] === code)[0];
    };
    
    TextureCombinerSource.PRIMARY_COLOR = 0;
    TextureCombinerSource.FRAGMENT_PRIMARY_COLOR = 1;
    TextureCombinerSource.FRAGMENT_SECONDARY_COLOR = 2;
    TextureCombinerSource.TEXTURE_0 = 3;
    TextureCombinerSource.TEXTURE_1 = 4;
    TextureCombinerSource.TEXTURE_2 = 5;
    TextureCombinerSource.TEXTURE_3 = 6;
    TextureCombinerSource.PREVIOUS_BUFFER = 13;
    TextureCombinerSource.CONSTANT = 14;
    TextureCombinerSource.PREVIOUS = 15;
    
    const RenderingStage = function RenderingStage() {
    };
    
    Object.defineProperty(RenderingStage.prototype, "isColorPassThrough", {
        "get": function () {
            return ((this.mode.color.code === PICA.TextureCombinerMode.REPLACE) &&
                    (this.source.color[0].code === PICA.TextureCombinerSource.PREVIOUS) &&
                    (this.operand.color[0].code === PICA.TextureCombinerColor.COLOR) &&
                    (this.scale.color.code === PICA.TextureCombinerScale.ONE));
        }
    });

    Object.defineProperty(RenderingStage.prototype, "isAlphaPassThrough", {
        "get": function () {
            return ((this.mode.alpha.code === PICA.TextureCombinerMode.REPLACE) &&
                    (this.source.alpha[0].code === PICA.TextureCombinerSource.PREVIOUS) &&
                    (this.operand.alpha[0].code === PICA.TextureCombinerAlpha.ALPHA) &&
                    (this.scale.alpha.code === PICA.TextureCombinerScale.ONE));
        }
    });
    
    const RenderingSource = function RenderingSource(code) {
         
        this.color = [
            new PICA.TextureCombinerSource((code >> 0) & 0xf),
            new PICA.TextureCombinerSource((code >> 4) & 0xf),
            new PICA.TextureCombinerSource((code >> 8) & 0xf)
        ];
        
        this.alpha = [
            new PICA.TextureCombinerSource((code >> 16) & 0xf),
            new PICA.TextureCombinerSource((code >> 20) & 0xf),
            new PICA.TextureCombinerSource((code >> 24) & 0xf)
        ];
        
    };
     
    const RenderingOperand = function RenderingOperand(code) {
         
        this.color = [
            new PICA.TextureCombinerColor((code >> 0) & 0xf),
            new PICA.TextureCombinerColor((code >> 4) & 0xf),
            new PICA.TextureCombinerColor((code >> 8) & 0xf)
        ];
        
        this.alpha = [
            new PICA.TextureCombinerAlpha((code >> 12) & 0x7),
            new PICA.TextureCombinerAlpha((code >> 16) & 0x7),
            new PICA.TextureCombinerAlpha((code >> 20) & 0x7)
        ];
        
    };
    
    const RenderingScale = function RenderingScale(code) {
        
        this.color = new PICA.TextureCombinerScale((code >> 0) & 0x3);
        this.alpha = new PICA.TextureCombinerScale((code >> 16) & 0x3);
        
    };
    
    const RenderingMode = function RenderingMode(code) {
         
        this.color = new PICA.TextureCombinerMode((code >> 0) & 0xf);
        this.alpha = new PICA.TextureCombinerMode((code >> 16) & 0xf);
        
    };
    
    const TextureCombinerAlpha = function TextureCombinerAlpha(code) {
        this.code = code;
        this.label = Object.keys(arguments.callee).filter((key) => arguments.callee[key] === code)[0];
    };
    
    TextureCombinerAlpha.ALPHA = 0;
    TextureCombinerAlpha.ONE_MINUS_ALPHA = 1;
    TextureCombinerAlpha.RED = 2;
    TextureCombinerAlpha.ONE_MINUS_RED = 3;
    TextureCombinerAlpha.GREEN = 4;
    TextureCombinerAlpha.ONE_MINUS_GREEN = 5;
    TextureCombinerAlpha.BLUE = 6;
    TextureCombinerAlpha.ONE_MINUS_BLUE = 7;
    
    const TextureCombinerColor = function TextureCombinerColor(code) {
        this.code = code;
        this.label = Object.keys(arguments.callee).filter((key) => arguments.callee[key] === code)[0];
    };
    
    TextureCombinerColor.COLOR = 0;
    TextureCombinerColor.ONE_MINUS_COLOR = 1;
    TextureCombinerColor.ALPHA = 2;
    TextureCombinerColor.ONE_MINUS_ALPHA = 3;
    TextureCombinerColor.RED = 4;
    TextureCombinerColor.ONE_MINUS_RED = 5;
    TextureCombinerColor.GREEN = 8;
    TextureCombinerColor.ONE_MINUS_GREEN = 9;
    TextureCombinerColor.BLUE = 12;
    TextureCombinerColor.ONE_MINUS_BLUE = 13;
    
    const TextureCombinerMode = function TextureCombinerMode(code) {
        this.code = code;
        this.label = Object.keys(arguments.callee).filter((key) => arguments.callee[key] === code)[0];
    };
    
    TextureCombinerMode.REPLACE = 0;
    TextureCombinerMode.MODULATE = 1;
    TextureCombinerMode.ADD = 2;
    TextureCombinerMode.ADD_SIGNED = 3;
    TextureCombinerMode.INTERPOLATE = 4;
    TextureCombinerMode.SUBTRACT = 5;
    TextureCombinerMode.DOT_PRODUCT_3_RGB = 6;
    TextureCombinerMode.DOT_PRODUCT_3_RGBA = 7;
    TextureCombinerMode.MUL_ADD = 8;
    TextureCombinerMode.ADD_MUL = 9;
    
    const TextureCombinerScale = function TextureCombinerScale(code) {
        this.code = code;
        this.label = Object.keys(arguments.callee).filter((key) => arguments.callee[key] === code)[0];
    };
    
    TextureCombinerScale.ONE = 0;
    TextureCombinerScale.TWO = 1;
    TextureCombinerScale.FOUR = 2;
    
    const ShaderOutputRegister = function ShaderOutputRegister(code) {
        this.code = code;
        this.label = Object.keys(arguments.callee).filter((key) => arguments.callee[key] === code)[0];
    };
    
    ShaderOutputRegister.POSITION = 0;
    ShaderOutputRegister.QUAT_NORMAL = 1;
    ShaderOutputRegister.COLOR = 2;
    ShaderOutputRegister.TEXTURE_COORDINATE_0 = 3;
    ShaderOutputRegister.TEXTURE_COORDINATE_0_W = 4;
    ShaderOutputRegister.TEXTURE_COORDINATE_1 = 5;
    ShaderOutputRegister.TEXTURE_COORDINATE_2 = 6;
    ShaderOutputRegister.VIEW = 8;
    ShaderOutputRegister.GENERIC= 9;
    
    const TextureWrap = function TextureWrap(code) {
        this.code = code;
        this.label = Object.keys(arguments.callee).filter((key) => arguments.callee[key] === code)[0];
    };
    
    TextureWrap.CLAMP_TO_EDGE = 0;
    TextureWrap.CLAMP_TO_BORDER = 1;
    TextureWrap.REPEAT = 2;
    TextureWrap.MIRROR = 3;
    
    const TextureFilter = function TextureFilter(code) {
        this.code = code;
        this.label = Object.keys(arguments.callee).filter((key) => arguments.callee[key] === code)[0];
    };
    
    TextureFilter.NEAREST = 0;
    TextureFilter.LINEAR = 1;
    
    const TextureType = function TextureType(code) {
        this.code = code;
        this.label = Object.keys(arguments.callee).filter((key) => arguments.callee[key] === code)[0];
    };
    
    TextureType["2D"] = 0;
    TextureType.CUBE_MAP = 1;
    TextureType.SHADOW_2D = 2;
    TextureType.PROJECTION = 3;
    TextureType.SHADOW_CUBE = 4;
    TextureType.DISABLED = 5;
    
    const LUTType = function LUTType(code) {
        this.code = code;
        this.label = Object.keys(arguments.callee).filter((key) => arguments.callee[key] === code)[0];
    };
    
    LUTType.DIST_0 = 0;
    LUTType.DIST_1 = 1;
    LUTType.FRESNEL = 3;
    LUTType.REFLECT_R = 4;
    LUTType.REFLECT_G = 5;
    LUTType.REFLECT_B = 6;
    LUTType.SPEC_0 = 8;
    LUTType.SPEC_1 = 9;
    LUTType.SPEC_2 = 10;
    LUTType.SPEC_3 = 11;
    LUTType.SPEC_4 = 12;
    LUTType.SPEC_5 = 13;
    LUTType.SPEC_6 = 14;
    LUTType.SPEC_7 = 15;
    LUTType.DIST_ATT_0 = 16;
    LUTType.DIST_ATT_1 = 17;
    LUTType.DIST_ATT_2 = 18;
    LUTType.DIST_ATT_3 = 19;
    LUTType.DIST_ATT_4 = 20;
    LUTType.DIST_ATT_5 = 21;
    LUTType.DIST_ATT_6 = 22;
    LUTType.DIST_ATT_7 = 23;
    
    PICA.Float24Vector = Float24Vector;
    PICA.Float32Vector = Float32Vector;
    
    PICA.Color = Color;
    PICA.ColorOperation = ColorOperation;
    PICA.BlendFunction = BlendFunction;
    PICA.BlendFunctionOperation = BlendFunctionOperation;
    PICA.AlphaTest = AlphaTest;
    PICA.StencilTest = StencilTest;
    PICA.StencilOperation = StencilOperation;
    PICA.StencilOperationAction = StencilOperationAction;
    PICA.DepthColorMask = DepthColorMask;
    
    PICA.LogicalOperation = LogicalOperation;
    PICA.FaceCulling = FaceCulling;
    PICA.FragmentOperationMode = FragmentOperationMode;
    PICA.BlendMode = BlendMode;
    PICA.BlendEquation = BlendEquation;
    PICA.TestFunction = TestFunction;
    PICA.PrimitiveMode = PrimitiveMode;
    PICA.AttributeName = AttributeName;
    PICA.AttributeFormat = AttributeFormat;
    
    PICA.LightingLUTInputAbsolute = LightingLUTInputAbsolute;
    PICA.LightingLUTInputSelection = LightingLUTInputSelection;
    PICA.LightingLUTInputSelectionChoice = LightingLUTInputSelectionChoice;
    PICA.LightingLUTInputScale = LightingLUTInputScale;
    PICA.LightingLUTInputScaleMode = LightingLUTInputScaleMode;
    
    PICA.RenderingStage = RenderingStage;
    PICA.RenderingSource = RenderingSource;
    PICA.RenderingOperand = RenderingOperand;
    PICA.RenderingScale = RenderingScale;
    PICA.RenderingMode = RenderingMode;
    
    PICA.TextureCombinerSource = TextureCombinerSource;
    PICA.TextureCombinerAlpha = TextureCombinerAlpha;
    PICA.TextureCombinerColor = TextureCombinerColor;
    PICA.TextureCombinerMode = TextureCombinerMode;
    PICA.TextureCombinerScale = TextureCombinerScale;
    
    PICA.ShaderOutputRegister = ShaderOutputRegister;

    PICA.TextureWrap = TextureWrap;
    PICA.TextureFilter = TextureFilter;
    PICA.TextureType = TextureType;
    
    PICA.LUTType = LUTType;
    
    module.exports = PICA;
    
})(this, this.$);
