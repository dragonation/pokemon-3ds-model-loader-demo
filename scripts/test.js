((global, $) => {
    
    const Index = require("../modules/spica/index.js");
    const Texture = require("../modules/spica/texture.js");
    const Motion = require("../modules/spica/motion.js");

    require("../modules/spica/three.js");
    
    const THREE = require("../modules/three/main.js");
         
    $("body").append($("<div>").attribute("id", "pokemon-loading"));
    
    let logs = $("<ol>").attribute("id", "pokemon-logs");
    $("body").append(logs);
    
    let lastLog = null;
    
    $.logger.record = function ([date, contents]) {
        
        if (contents[0] !== "%c%s %c%s") {
            return;
        }
        
        let index = 0;
        let message = contents[0].replace(/%[a-z]/g, (escaping) => {
            ++index;
            if (escaping === "%c") {
                return "";
            } else {
                return contents[index];
            }
        }).slice(18).split("(").slice(0, -1).join("(").split("\n")[0];
        
        if (lastLog !== message) {
        
            logs.append($("<li>").text(message));
            
            logs.children().slice(0, -15).detach();
            
            lastLog = message;
            
        }
        
    };
    
    $.app.test = function () {
       
        new Index("./resources/models/a.0.9.4").then(function (index) {
            
            let version = 0;
            
            let lastPokemon = null;
            
            let ol = $("<ol>").attribute("id", "pokemon-list");
            $("body").append(ol);
            
            let ol2 = $("<ol>").attribute("id", "pokemon-meshes");
            $("body").append(ol2);
             
            let animationSetSelect = null;
            let animationSelect = $("<select>").attribute("id", "pokemon-animations").on("change", function () {
                let action = animationSelect.property("value");
                if (action !== "none") {
                    
                    let values = animationSetSelect.animations[animationSetSelect.property("value")].clips[action].values;
                    
                    const fadingValue = 0;
                    
                    let animationBroken = false;
                    $.async.all(values, function (action, index) {
                        lastPokemon.spicaPlayAction(action, {
                            "channel": "action",
                            "fadings": [
                                ((index === 0) ? fadingValue : 0), 
                                ((index === 0) ? fadingValue : 0), 
                                ((index === values.length - 1) ? fadingValue : 0)
                            ],
                            "priority": ((lastPokemon.pokemonID === 327) ? 0 : 20)
                        }).then(function (broken) {
                            if (!broken) {
                                this.next();
                            } else {
                                animationBroken = true;
                                this.reject(new Error("Animation Broken"));
                            }
                        }).pipe(this);   
                    }).then(function () {
                        animationSelect.property("value", "none");
                        lastPokemon.spicaPlayAction(animationSetSelect.animations[animationSetSelect.property("value")].backgrounds.breath.value, {
                            "loop": Infinity,
                            "fadings": 0,
                            "priority": 0,
                            "channel": "action",
                        }).rejected(function (error) {
                            $.error(error);
                        });
                        this.next();
                    }).rejected(function (error) {
                        if (!animationBroken) {
                            $.error(error);
                        }
                    });
                    
                }
            });
            $("body").append(animationSelect);
            
            animationSetSelect = $("<select>").attribute("id", "pokemon-animation-set").on("change", function () {
                animationSetSelect.updateAnimations();
            });
            animationSetSelect.updateAnimations = function (animations) {
                
                if (animations) {
                    animationSetSelect.animations = animations;
                }
                
                let key = animationSetSelect.property("value");
                animationSelect.children().detach();
                animationSelect.append($("<option>").attribute("value", "none").text("无"));
                animationSetSelect.animations[key].clips.forEach((clip, index) => {
                    animationSelect.append($("<option>").attribute("value", "" + index)
                        .text(clip.label + " (" + clip.duration.toFixed(2) + "s)"));
                });
                
                let statePriority = 10;
                ["state", "state2", "state3", "state4"].forEach((background, index) => {
                    if (animationSetSelect.animations[key].backgrounds[background]) {
                        
                        let options = {
                            "loop": Infinity
                        };
                        if (lastPokemon.pokemonID === 327) {
                            options = {
                                "paused": true,
                                "frame": Math.floor(Math.random() * 256)
                            };
                        }
                        
                        lastPokemon.spicaPlayAction(animationSetSelect.animations[key].backgrounds[background].value, $.merge.simple(options, {
                            "fadings": 0,
                            "priority": statePriority + index,
                            "channel": background
                        })).rejected(function (error) {
                            $.error(error);
                        });
                        
                    }
                });
                 
                if (animationSetSelect.animations[key].backgrounds.breath) {
                    lastPokemon.spicaPlayAction(animationSetSelect.animations[key].backgrounds.breath.value, {
                        "loop": Infinity,
                        "fadings": 0,
                        "priority": 0,
                        // "channel": "breath",
                        "channel": "action",
                    }).rejected(function (error) {
                        $.error(error);
                    });
                }
                       
            };
            $("body").append(animationSetSelect);
            
            if ($.app.world.stats) {
                $($.app.world.stats.dom).style({
                    "position": "absolute",
                    "left": "380px",
                    "bottom": "10px",
                    "top": "auto"
                });
            }
            
            let loadPokemon = null;
            let shinyInput = $("<input>").attribute({ "type": "checkbox", "id": "pokemon-shiny" }).on("change", function (/*event*/) {
                $.delay(function () {
                    loadPokemon(lastPokemon.pokemonID, lastPokemon.pokemonOffset);
                });
            });
            $("body").append(shinyInput);
            
            let info = $("<ol>").attribute("id", "pokemon-info");
            $("body").append(info);
            
            loadPokemon = function (id, offset) {
               
                let start = Date.now();
                
                version++;
                let currentVersion = version; 
                
                $("body").addFeatures("pokemon-loading");
                
                $("#pokemon-loading").text("装载加载[宝可梦#" + id + "-" + offset + "]，请稍后");

                window.location.hash = `#pokemon-${id}-${offset}`;
                
                $(".selected").removeFeatures("selected");
                let li = $(`#pokemon-${id}-${offset}`).addFeatures("selected");
                let position = ol.positionFromPage(li.positionToPage({"x": 0, "y": 0}));
                if ((position.y < 0) || (position.y >= ol.size().height)) {
                    li[0].scrollIntoView({
                        "behavior": "instant",
                        "block": "center"
                    });
                }
                
                $.info(`Pokemon-${id}-${offset} started to load`);
                return index.loadPokemon(id, offset).then(function (pcs) {
                    
                    $.info(`Pokemon-${id}-${offset} loaded within ${Date.now() - start}ms`);
                    start = Date.now();
                    if (currentVersion !== version) {
                        return;
                    }
                 
                    if (lastPokemon) {
                        $.app.world.scene.remove(lastPokemon);
                        $.app.world.removeTicker(lastPokemon.spicaTick);
                        lastPokemon.spicaDispose();
                    }
                          
                    console.log(pcs);
                    
                    let model = pcs.model.files[0];
                    
                    let options = { 
                        "motions": true, 
                        "shiny": shinyInput.property("checked") 
                    };
                    
                    let pokemon = model.toThreeObject(pcs, options);
                    
                    $.info(`Pokemon-${id}-${offset} converted to THREE model within ${Date.now() - start}ms`);
                    start = Date.now();
                    
                    pokemon.pokemonID = id;
                    pokemon.pokemonOffset = offset;
                       
                    ol2.children().detach();
                    pokemon.children.filter((child) => child.isMesh && (!child.spicaOutline)).forEach((mesh) => {
                        
                        const createTextureImage = (name) => {
                            
                            let image = $("<div>").attribute("id", "texture");
                            
                            let texture = (options.shiny ? pcs.textures.shiny : pcs.textures.normal).files.filter((file) => file.name === name)[0];
                            if (texture) {
                                image.style("background-image", "url('" + texture.toImageURL() + "')").on("gesture:tap-ended", function (event, parameter) {
                                    let preview = $("<div>").addFeatures("preview").append(
                                        $("<img>").style({
                                            "background-image": `url('${texture.toImageURL()}')`,
                                            "width": texture.width + "px",
                                            "height": texture.height + "px",
                                            "position": "absolute",
                                            "left": ((document.body.clientWidth - texture.width) / 2) + "px",
                                            "top": ((document.body.clientHeight - texture.height) / 2) + "px"
                                        })
                                    ).on("gesture:tap-ended", function (/*event, parameter*/) {
                                        preview.detach();
                                    });
                                    $("body").append(preview);
                                }).attribute("title", [
                                    "Name: " + texture.name,
                                    "Width: " + texture.width,
                                    "Height: " + texture.height,
                                    "Format: " + Object.keys(Texture).filter((key) => Texture[key] === texture.format)[0]
                                ].join("\n"));
                            } else {
                                image.addFeatures("empty");
                            }
                            
                            return image;
                            
                        };
                        
                        const createLUTImage = (hashID) => {
                            
                            let image = $("<div>").attribute("id", "lut");
                            
                            let lut = pcs.model.files[0].lightingLUTs.filter(lut => lut.hashID === hashID)[0];
                            if (lut) {
                                image.style("background-image", "url('" + lut.toImageURL() + "')").on("gesture:tap-ended", function (event, parameter) {
                                    let height = 20;
                                    let preview = $("<div>").addFeatures("preview").append(
                                        $("<img>").style({
                                            "background-image": `url('${lut.toImageURL(height)}')`,
                                            "width": lut.pica.lightingLUTs.data.length + "px",
                                            "height": height + "px",
                                            "position": "absolute",
                                            "left": ((document.body.clientWidth - lut.pica.lightingLUTs.data.length) / 2) + "px",
                                            "top": ((document.body.clientHeight - height) / 2) + "px"
                                        })
                                    ).on("gesture:tap-ended", function (/*event, parameter*/) {
                                        preview.detach();
                                    });
                                    $("body").append(preview);
                                });
                            } else {
                                image.addFeatures("empty");
                            }
                            
                            return image;
                            
                        };
                        
                        let li = $("<li>").append(
                            $("<span>").attribute("id", "mesh-name").text(mesh.name + ": " + mesh.material.spicaLayer + ", " + mesh.material.spicaPriority),
                            createTextureImage(mesh.material.spicaTextureNames[0]),
                            createTextureImage(mesh.material.spicaTextureNames[1]),
                            createTextureImage(mesh.material.spicaTextureNames[2])
                        ).attribute("title", [
                            "Mesh: " + mesh.name,
                            "Material: " + mesh.material.name,
                            "Vertices: " + mesh.geometry.attributes.position.count,
                            "Triangles: " + mesh.geometry.index.count / 3,
                            "Vertex Shader: " + mesh.material.spicaVertexShaderName,
                            "Fragment Shader: " + mesh.material.spicaFragmentShaderName,
                            "Alpha Test: " + (mesh.material.spicaAlphaTest ? "Enabled" : "Disabled"),
                            "Stencil Test: " + (mesh.material.spicaStencilTest ? "Enabled" : "Disabled"),
                            "Depth Write: " + (mesh.material.depthWrite ? "Enabled" : "Disabled"),
                        ].join("\n")).on("gesture:tap-ended", function (/*event, parameter*/) {
                            mesh.visible = !mesh.visible;
                            if (mesh.visible) {
                                li.removeFeatures("disabled");
                            } else {
                                li.addFeatures("disabled");
                            }
                        });
                        mesh.material.spicaLUTs.filter(lut => lut).forEach((lut) => {
                            li.append(createLUTImage(lut));
                        });
                        li.append(
                            $("<span>").attribute({
                                "id": "vertex-shader",
                                "title": [
                                    "Name: " + mesh.material.spicaVertexShaderName,
                                    "File: " + mesh.material.spicaVertexShaderFileName,
                                    "Type: " + "Vertex Shader",
                                    "Geometry Codes: " + (mesh.material.spicaVertexShaderHasGeometryCodes ? "Yes" : "No")
                                ].join("\n")
                            }).text(mesh.material.spicaVertexShaderName).on("gesture:tap-ended", function (/*event, parameter*/) {
                                $.clipboard.copy(mesh.material.vertexShader);
                                $.info("Vertex shader codes copied");
                            }),
                            $("<span>").attribute({
                                "id": "fragment-shader",
                                "title": [
                                    "Name: " + mesh.material.spicaFragmentShaderName,
                                    "File: " + mesh.material.spicaFragmentShaderFileName,
                                    "Type: " + "Fragment Shader",
                                ].join("\n")
                            }).text(mesh.material.spicaFragmentShaderName).on("gesture:tap-ended", function (/*event, parameter*/) {
                                $.clipboard.copy(mesh.material.fragmentShader);
                                $.info("Fragment shader codes copied");
                            }),
                            $("<span>").attribute("id", "triangles-count").text(mesh.geometry.index.count / 3));
                        
                        let needAttention = false;
                        if (mesh.material.spicaVertexShaderHasGeometryCodes) {
                            needAttention = true;
                        }
                        if (mesh.material.spicaStencilTest) {
                            needAttention = true;
                        }
                        if (!mesh.material.depthWrite) {
                            needAttention = true;
                        }
                        
                        if (needAttention) {
                            li.addFeatures("attention");
                        }
                        
                        ol2.append(li);
                    });
                     
                    const animations = {};
                    pokemon.animations.forEach((animation) => {
                        
                        let animationName = animation.name;
                        let animationSet = animationName.split("Action")[0].toLowerCase();
                        
                        let background = null;
                        
                        switch (animationName) {
                            
                            case "FightingAction1": { background = "breath"; animationName = "准备 #1"; break; }
                            case "FightingAction2": { animationName = "强调 #2"; break; }
                            case "FightingAction3": { animationName = "进入 #3 - #7"; break; }
                            case "FightingAction4": { animationName = "进入 #3 - #7"; break; }
                            case "FightingAction5": { animationName = "进入 #3 - #7"; break; }
                            case "FightingAction6": { animationName = "进入 #3 - #7"; break; }
                            case "FightingAction7": { animationName = "进入 #3 - #7"; break; }
                            case "FightingAction8": { animationName = "攻击 #8"; break; }
                            case "FightingAction9": { animationName = "攻击 #9"; break; }
                            case "FightingAction10": { animationName = "攻击 #10"; break; }
                            case "FightingAction11": { animationName = "攻击 #11"; break; }
                            case "FightingAction12": { animationName = "攻击 #12"; break; }
                            case "FightingAction13": { animationName = "攻击 #13"; break; }
                            case "FightingAction14": { animationName = "攻击 #14"; break; }
                            case "FightingAction15": { animationName = "攻击 #15"; break; }
                            case "FightingAction16": { animationName = "攻击 #16"; break; }
                            case "FightingAction17": { animationName = "被攻击 #17"; break; }
                            case "FightingAction18": { animationName = "濒死 #18"; break; }
                            
                            case "FightingAction20": { background = "eye"; animationName = "眼睛状态 #20"; break; }
                            case "FightingAction21": { background = "eye2"; animationName = "眼睛状态 #21"; break; }
                            case "FightingAction22": { background = "eye3"; animationName = "眼睛状态 #22"; break; }
                            
                            case "FightingAction23": { background = "mouth"; animationName = "嘴巴状态 #23"; break; }
                            case "FightingAction24": { background = "mouth2"; animationName = "嘴巴状态 #24"; break; }
                            
                            case "FightingAction26": { background = "state"; animationName = "持续变化 #26"; break; }
                            case "FightingAction27": { background = "state2"; animationName = "持续变化 #27"; break; }
                            case "FightingAction28": { background = "state3"; animationName = "持续变化 #28"; break; }
                            case "FightingAction29": { background = "state4"; animationName = "持续变化 #29"; break; }
                            
                            case "PetAction1": { background = "breath"; animationName = "准备 #1"; break; }
                            case "PetAction2": { animationName = "振奋 #2"; break; }
                            case "PetAction3": { animationName = "回头 #3"; break; }
                            case "PetAction4": { animationName = "开心回头 #4"; break; }
                            case "PetAction5": { animationName = "瞌睡 #5 - #7"; break; }
                            case "PetAction6": { animationName = "瞌睡 #5 - #7"; break; }
                            case "PetAction7": { animationName = "瞌睡 #5 - #7"; break; }
                            case "PetAction8": { animationName = "睡眠 #8"; break; }
                            case "PetAction9": { animationName = "醒来 #9"; break; }
                            case "PetAction10": { animationName = "清醒 #10"; break; }
                            case "PetAction11": { animationName = "卖萌 #11"; break; }
                            case "PetAction12": { animationName = "开心 #12"; break; }
                            case "PetAction13": { animationName = "欢呼 #13"; break; }
                            case "PetAction14": { animationName = "踊跃 #14"; break; }
                            case "PetAction15": { animationName = "擦脸 #15"; break; }
                            case "PetAction16": { animationName = "困 #16"; break; }
                            case "PetAction17": { animationName = "同意 #17"; break; }
                            case "PetAction18": { animationName = "瞥眼 #18"; break; }
                            case "PetAction19": { animationName = "沮丧 #19"; break; }
                            case "PetAction20": { animationName = "招呼 #20"; break; }
                            case "PetAction21": { animationName = "跳跃 #21"; break; }
                            case "PetAction22": { animationName = "生气 #22"; break; }
                            case "PetAction23": { animationName = "吃 #23 - #25"; break; }
                            case "PetAction24": { animationName = "吃 #23 - #25"; break; }
                            case "PetAction25": { animationName = "吃 #23 - #25"; break; }
                            case "PetAction26": { animationName = "抬头 #26"; break; }
                            
                            case "PetAction28": { background = "eye"; animationName = "眼睛状态 #28"; break; }
                            case "PetAction29": { background = "eye2"; animationName = "眼睛状态 #29"; break; }
                            case "PetAction30": { background = "eye3"; animationName = "眼睛状态 #30"; break; }
                            
                            case "PetAction31": { background = "mouth"; animationName = "嘴巴状态 #31"; break; }
                            case "PetAction32": { background = "mouth2"; animationName = "嘴巴状态 #32"; break; }
                            
                            case "PetAction34": { background = "state"; animationName = "持续变化 #34"; break; }
                            case "PetAction35": { background = "state2"; animationName = "持续变化 #35"; break; }
                            case "PetAction36": { background = "state3"; animationName = "持续变化 #36"; break; }
                            case "PetAction37": { background = "state4"; animationName = "持续变化 #37"; break; }
                            
                            case "MapAction1": { background = "breath"; animationName = "准备 #1"; break; }
                            case "MapAction2": { animationName = "停留 #1"; break; }
                            case "MapAction3": { animationName = "移动 #3"; break; }
                            case "MapAction4": { animationName = "快速移动 #3"; break; }
                            case "MapAction5": { animationName = "快速移动（进入） #4"; break; }
                            case "MapAction6": { animationName = "快速移动（退出） #5"; break; }
                            
                            case "MapAction9": { animationName = "飞行（进入） #9"; break; }
                            case "MapAction10": { animationName = "飞行（退出） #10"; break; }
                            
                            case "MapAction15": { background = "eye"; animationName = "眼睛状态 #15"; break; }
                            case "MapAction16": { background = "eye2"; animationName = "眼睛状态 #16"; break; }
                            case "MapAction17": { background = "eye3"; animationName = "眼睛状态 #17"; break; }
                           
                            case "MapAction18": { background = "mouth"; animationName = "嘴巴状态 #18"; break; }
                            case "MapAction19": { background = "mouth2"; animationName = "嘴巴状态 #19"; break; }
                            
                            case "MapAction21": { background = "state"; animationName = "持续变化 #21"; break; }
                            case "MapAction22": { background = "state2"; animationName = "持续变化 #22"; break; }
                            case "MapAction23": { background = "state3"; animationName = "持续变化 #23"; break; }
                            case "MapAction24": { background = "state4"; animationName = "持续变化 #24"; break; }
                            
                            case "ActingAction1": { background = "breath"; animationName = "战斗 准备 #1"; break; }
                            case "ActingAction2": { animationName = "战斗 强调 #2"; break; }
                            case "ActingAction3": { animationName = "战斗 直接进入 #3"; break; }
                            case "ActingAction4": { animationName = "战斗 进入（出球） #4"; break; }
                            case "ActingAction5": { animationName = "战斗 进入（空中） #5"; break; }
                            case "ActingAction6": { animationName = "战斗 进入（落地） #6"; break; }
                            case "ActingAction7": { animationName = "战斗 直接进入 #7"; break; }
                            case "ActingAction8": { animationName = "战斗 攻击 #8"; break; }
                            case "ActingAction9": { animationName = "战斗 攻击 #9"; break; }
                            case "ActingAction10": { animationName = "战斗 攻击 #10"; break; }
                            case "ActingAction11": { animationName = "战斗 攻击 #11"; break; }
                            case "ActingAction12": { animationName = "战斗 攻击 #12"; break; }
                            case "ActingAction13": { animationName = "战斗 攻击 #13"; break; }
                            case "ActingAction14": { animationName = "战斗 攻击 #14"; break; }
                            case "ActingAction15": { animationName = "战斗 攻击 #15"; break; }
                            case "ActingAction16": { animationName = "战斗 攻击 #16"; break; }
                            case "ActingAction17": { animationName = "战斗 被攻击 #17"; break; }
                            case "ActingAction18": { animationName = "战斗 濒死 #18"; break; }
                             
                            case "ActingAction19": { background = "breath2"; animationName = "宠物 准备 #19"; break; }
                            case "ActingAction20": { animationName = "宠物 振奋 #20"; break; }
                            case "ActingAction21": { animationName = "宠物 回头 #21"; break; }
                            case "ActingAction22": { animationName = "宠物 开心回头 #22"; break; }
                            case "ActingAction23": { animationName = "宠物 瞌睡（入眠） #23"; break; }
                            case "ActingAction24": { animationName = "宠物 瞌睡（睡眠） #24"; break; }
                            case "ActingAction25": { animationName = "宠物 瞌睡（惊醒） #25"; break; }
                            case "ActingAction26": { animationName = "宠物 睡眠 #26"; break; }
                            case "ActingAction27": { animationName = "宠物 醒来 #27"; break; }
                            case "ActingAction28": { animationName = "宠物 清醒 #28"; break; }
                            case "ActingAction29": { animationName = "宠物 卖萌 #29"; break; }
                            case "ActingAction30": { animationName = "宠物 开心 #30"; break; }
                            case "ActingAction31": { animationName = "宠物 欢呼 #31"; break; }
                            case "ActingAction32": { animationName = "宠物 踊跃 #32"; break; }
                            case "ActingAction33": { animationName = "宠物 擦脸 #33"; break; }
                            case "ActingAction34": { animationName = "宠物 困 #34"; break; }
                            case "ActingAction35": { animationName = "宠物 同意 #35"; break; }
                            case "ActingAction36": { animationName = "宠物 瞥眼 #36"; break; }
                            case "ActingAction37": { animationName = "宠物 沮丧 #37"; break; }
                            case "ActingAction38": { animationName = "宠物 招呼 #38"; break; }
                            case "ActingAction39": { animationName = "宠物 跳跃 #39"; break; }
                            case "ActingAction40": { animationName = "宠物 生气 #40"; break; }
                            case "ActingAction41": { animationName = "宠物 吃（拿起）#41"; break; }
                            case "ActingAction42": { animationName = "宠物 吃（过程）#42"; break; }
                            case "ActingAction43": { animationName = "宠物 吃（吞咽）#43"; break; }
                            case "ActingAction44": { animationName = "宠物 抬头 #44"; break; }
                            
                            case "ActingAction45": { background = "breath3"; animationName = "地图 准备 #45"; break; }
                            case "ActingAction46": { animationName = "地图 停留 #46"; break; }
                            case "ActingAction47": { animationName = "地图 移动 #47"; break; }
                            case "ActingAction48": { animationName = "地图 快速移动 #38"; break; }
                            case "ActingAction49": { animationName = "地图 快速移动（进入） #49"; break; }
                            case "ActingAction50": { animationName = "地图 快速移动（退出） #50"; break; }
                            
                            case "ActingAction54": { animationName = "地图 飞行（进入） #54"; break; }
                            case "ActingAction55": { animationName = "地图 飞行（退出） #55"; break; }
                            
                            case "ActingAction59": { background = "eye"; animationName = "眼睛状态 #15"; break; }
                            case "ActingAction60": { background = "eye2"; animationName = "眼睛状态 #16"; break; }
                            case "ActingAction61": { background = "eye3"; animationName = "眼睛状态 #17"; break; }
                            
                            case "ActingAction62": { background = "mouth"; animationName = "嘴巴状态 #18"; break; }
                            case "ActingAction63": { background = "mouth2"; animationName = "嘴巴状态 #19"; break; }
                            
                            case "ActingAction65": { background = "state"; animationName = "持续变化 #21"; break; }
                            case "ActingAction66": { background = "state2"; animationName = "持续变化 #22"; break; }
                            case "ActingAction67": { background = "state3"; animationName = "持续变化 #23"; break; }
                            case "ActingAction68": { background = "state4"; animationName = "持续变化 #24"; break; }
                            
                        }
                        
                        if (!animations[animationSet]) {
                            animations[animationSet] = {
                                "backgrounds": {},
                                "clips": []
                            };
                        }
                        
                        if (background) {
                            animations[animationSet].backgrounds[background] = {
                                "value": animation.name,
                                "label": animationName,
                                "duration": animation.duration
                            };
                        } else {
                            let clip = animations[animationSet].clips.filter((clip) => clip.label === animationName)[0];
                            if (!clip) {
                                clip = {
                                    "values": [],
                                    "duration": 0,
                                    "label": animationName
                                };
                                animations[animationSet].clips.push(clip);
                            }
                            clip.values.push(animation.name);
                            clip.duration += animation.duration;
                        }
                        
                    });
                    
                    $.request("./resources/info/pokemon-" + ("00" + id).slice(-3) + ".json", function (error, data) {
                        
                        info.children().detach();
                        
                        let parseRecord = (record, ol) => {
                            
                            let getValue = (path) => {
                                return $.format.execute(path, data, {});
                            };
                            
                            let li = $("<li>").append(
                                $("<div>").attribute("id", "label").text(record.label)
                            );
                            
                            let value = null;
                            if (record.template) {
                                li.addFeatures("value");
                                let content = getValue(record.template);
                                if (!$.is(content, Array)) {
                                    content = [content];
                                }
                                value = $();
                                content.forEach((content) => {
                                    if (content) {
                                        value.push($("<div>").attribute("id", "value").text(content));
                                    }
                                });
                                value = value.lifted();
                            } else if (record.values) {
                                li.addFeatures("values");
                                value = $("<ol>").attribute("id", "values");
                                record.values.forEach((record) => {
                                    parseRecord(record, value);
                                });
                            }
                            
                            if (value && value.length) {
                                
                                if (record.post) {
                                    record.post(value);
                                }
                               
                                li.append(value);
                                
                                ol.append(li);
                            }
                            
                        };
                        
                        [
                            { "label": "基本信息", "values": [
                                { "label": "编号", "template": "id", "post": (node) => node.text(("00" + node.text()).slice(-3)) },
                                { "label": "中文名称", "template": "names.chinese" },
                                { "label": "日文名称", "template": "names.japanese" },
                                { "label": "英语名称", "template": "names.english" },
                                { "label": "性别比例", "template": "if (gender[0] == 0 && gender[1] == 0, '无性别', '雄性' + gender[0] + '%，雌性' + gender[1] + '%')" },
                            ] },
                            { "label": "基础值", "values": [
                                { "label": "体力", "template": "game.base.hp" },
                                { "label": "攻击", "template": "game.base.attack" },
                                { "label": "防御", "template": "game.base.defense" },
                                { "label": "特攻", "template": "game.base.specialAttack" },
                                { "label": "特防", "template": "game.base.specialDefence" },
                                { "label": "速度", "template": "game.base.speed" },
                            ] },
                            { "label": "类型", "values": [
                                { "label": "分类", "template": "species" },
                                { "label": "属性", "template": "types" },
                                { "label": "特性", "template": "abilities.normal" },
                                { "label": "隐藏特性", "template": "abilities.hidden" },
                            ] },
                            { "label": "体型", "values": [
                                { "label": "分类", "template": "figure.shape" },
                                { "label": "重量", "template": "figure.weight", "post": (node) => node.text(node.text() + " kg") },
                                { "label": "高度", "template": "figure.height", "post": (node) => node.text(node.text() + " m") }
                            ] },
                            { "label": "入手", "values": [
                                { "label": "红", "template": "map(gets['1st'].red, {if ($1.location, $1.location + ': ' + $1.method, $1.method)})" },
                                { "label": "绿", "template": "map(gets['1st'].green, {if ($1.location, $1.location + ': ' + $1.method, $1.method)})" },
                                { "label": "蓝", "template": "map(gets['1st'].blue, {if ($1.location, $1.location + ': ' + $1.method, $1.method)})" },
                                { "label": "黄", "template": "map(gets['1st'].yellow, {if ($1.location, $1.location + ': ' + $1.method, $1.method)})" },
                                { "label": "金", "template": "map(gets['2nd'].gold, {if ($1.location, $1.location + ': ' + $1.method, $1.method)})" },
                                { "label": "银", "template": "map(gets['2nd'].silver, {if ($1.location, $1.location + ': ' + $1.method, $1.method)})" },
                                { "label": "水晶", "template": "map(gets['2nd'].crystal, {if ($1.location, $1.location + ': ' + $1.method, $1.method)})" },
                                { "label": "红宝石", "template": "map(gets['3rd'].ruby, {if ($1.location, $1.location + ': ' + $1.method, $1.method)})" },
                                { "label": "蓝宝石", "template": "map(gets['3rd'].sapphire, {if ($1.location, $1.location + ': ' + $1.method, $1.method)})" },
                                { "label": "绿宝石", "template": "map(gets['3rd'].emerald, {if ($1.location, $1.location + ': ' + $1.method, $1.method)})" },
                                { "label": "火红", "template": "map(gets['3rd'].fireRed, {if ($1.location, $1.location + ': ' + $1.method, $1.method)})" },
                                { "label": "叶绿", "template": "map(gets['3rd'].leafGreen, {if ($1.location, $1.location + ': ' + $1.method, $1.method)})" },
                                { "label": "钻石", "template": "map(gets['4th'].diamond, {if ($1.location, $1.location + ': ' + $1.method, $1.method)})" },
                                { "label": "珍珠", "template": "map(gets['4th'].pearl, {if ($1.location, $1.location + ': ' + $1.method, $1.method)})" },
                                { "label": "白金", "template": "map(gets['4th'].platinum, {if ($1.location, $1.location + ': ' + $1.method, $1.method)})" },
                                { "label": "心金", "template": "map(gets['4th'].heartGold, {if ($1.location, $1.location + ': ' + $1.method, $1.method)})" },
                                { "label": "魂银", "template": "map(gets['4th'].soulSilver, {if ($1.location, $1.location + ': ' + $1.method, $1.method)})" },
                                { "label": "黑", "template": "map(gets['5th'].black, {if ($1.location, $1.location + ': ' + $1.method, $1.method)})" },
                                { "label": "白", "template": "map(gets['5th'].white, {if ($1.location, $1.location + ': ' + $1.method, $1.method)})" },
                                { "label": "黑2", "template": "map(gets['5th'].black2, {if ($1.location, $1.location + ': ' + $1.method, $1.method)})" },
                                { "label": "白2", "template": "map(gets['5th'].white2, {if ($1.location, $1.location + ': ' + $1.method, $1.method)})" },
                                { "label": "X", "template": "map(gets['6th'].x, {if ($1.location, $1.location + ': ' + $1.method, $1.method)})" },
                                { "label": "Y", "template": "map(gets['6th'].y, {if ($1.location, $1.location + ': ' + $1.method, $1.method)})" },
                                { "label": "终极红宝石", "template": "map(gets['6th'].omegaRuby, {if ($1.location, $1.location + ': ' + $1.method, $1.method)})" },
                                { "label": "始源蓝宝石", "template": "map(gets['6th'].alphaSapphire, {if ($1.location, $1.location + ': ' + $1.method, $1.method)})" },
                                { "label": "太阳", "template": "map(gets['7th'].sun, {if ($1.location, $1.location + ': ' + $1.method, $1.method)})" },
                                { "label": "月亮", "template": "map(gets['7th'].moon, {if ($1.location, $1.location + ': ' + $1.method, $1.method)})" },
                                { "label": "究极之日", "template": "map(gets['7th'].ultraSun, {if ($1.location, $1.location + ': ' + $1.method, $1.method)})" },
                                { "label": "究极之月", "template": "map(gets['7th'].ultraMoon, {if ($1.location, $1.location + ': ' + $1.method, $1.method)})" },
                            ] },
                            { "label": "图鉴", "values": [
                                { "label": "红绿", "template": "pokedex['1st'].redGreen" },
                                { "label": "蓝", "template": "pokedex['1st'].blue" },
                                { "label": "黄", "template": "pokedex['1st'].yellow" },
                                { "label": "金", "template": "pokedex['2nd'].gold" },
                                { "label": "银", "template": "pokedex['2nd'].silver" },
                                { "label": "水晶", "template": "pokedex['2nd'].crystal" },
                                { "label": "红蓝绿宝石", "template": "pokedex['3rd'].rubySapphireEmerald" },
                                { "label": "火红", "template": "pokedex['3rd'].fireRed" },
                                { "label": "叶绿", "template": "pokedex['3rd'].leafGreen" },
                                { "label": "钻石珍珠白金", "template": "pokedex['4th'].diamondPearlPlatinum" },
                                { "label": "心金", "template": "pokedex['4th'].heartGold" },
                                { "label": "魂银", "template": "pokedex['4th'].soulSilver" },
                                { "label": "黑白", "template": "pokedex['5th'].blackWhite" },
                                { "label": "黑白2", "template": "pokedex['5th'].blackWhite2" },
                                { "label": "X", "template": "pokedex['6th'].x" },
                                { "label": "Y", "template": "pokedex['6th'].y" },
                                { "label": "始源终极宝石", "template": "pokedex['6th'].omegaRubyAlphaSapphire" },
                                { "label": "太阳", "template": "pokedex['7th'].sun" },
                                { "label": "月亮", "template": "pokedex['7th'].moon" },
                                { "label": "究极之日", "template": "pokedex['7th'].ultraSun" },
                                { "label": "究极之月", "template": "pokedex['7th'].ultraMoon" },
                            ] }
                        ].forEach((record) => {
                            parseRecord(record, info);
                        });
                        
                    });
                    
                    let region = pcs.motions.fighting.files[0].animationRegion;
                    
                    let minSize = Math.min(region.max[0] - region.min[0],
                                          region.max[1] - region.min[1],
                                          region.max[2] - region.min[2]);
                      
                    let maxSize = Math.max(region.max[0] - region.min[0],
                                          region.max[1] - region.min[1],
                                          region.max[2] - region.min[2]);
                          
                    let scale = 50 / maxSize * (0.5 * (maxSize - minSize) / maxSize + 0.5);
                    
                    pokemon.scale.set(scale, scale, scale);
                      
                    $.app.world.scene.add(pokemon);
                    $.app.world.addTicker(pokemon.spicaTick);
                    
                    // $.app.world.addSkeletonHelper(pokemon);
                    
                    lastPokemon = pokemon;
                    
                    animationSetSelect.children().detach();
                    Object.keys(animations).filter((key) => animations[key].clips.length > 0).forEach((key) => {
                        let label = ({
                            "fighting": "战斗",
                            "pet": "宠物",
                            "map": "地图",
                            "acting": "剧情"
                        })[key];
                        animationSetSelect.append($("<option>").attribute("value", key).text(label));
                    });
                    animationSetSelect.updateAnimations(animations);
                   
                    $.info(`Pokemon-${id}-${offset} meta updated within ${Date.now() - start}ms`);
                    $("body").removeFeatures("pokemon-loading");
                    start = Date.now();
                    $.delay(function () {
                        $.info(`Pokemon-${id}-${offset} first rendering finished within ${Date.now() - start}ms`);
                    });
                    
                    this.next();
                      
                }).rejected(function (error) {
                    $("body").removeFeatures("pokemon-loading");
                });
                
            };

            const availables = {
                "1-0": true,
                "2-0": true,
                "3-0": true,
                "3-1": true,
                "3-2": true,
                "4-0": true,
                "5-0": true,
                "6-0": true,
                "6-1": true,
                "6-2": true,
                "7-0": true,
                "8-0": true,
                "9-0": true,
                "9-1": true,
                "15-0": true,
                "15-1": true,
                "25-0": true,
                "25-1": true,
                "25-2": true,
                "27-0": true,
                "27-1": true,
                "28-0": true,
                "28-1": true,
                "72-0": true,
                "77-0": true,
                "89-0": true,
                "89-1": true,
                "92-0": true,
                "93-0": true,
                "94-0": true,
                "94-1": true,
                "105-0": true,
                "105-1": true,
                "110-0": true,
                "129-0": true,
                "130-0": true,
                "146-0": true,
                "183-0": true,
                "187-0": true,
                "327-0": true,
                "382-0": true,
                "382-1": true,
                "383-0": true,
                "383-1": true,
                "384-0": true,
                "384-1": true,
                "579-0": true,
                "646-0": true,
                "646-1": true,
                "646-2": true,
                "719-0": true,
                "719-1": true,
                "752-0": true,
                "755-0": true,
                "774-0": true,
                "774-7": true,
                "789-0": true,
                "790-0": true,
                "791-0": true,
                "792-0": true,
                "794-0": true,
                "796-0": true,
                "800-0": true,
                "800-1": true,
                "800-2": true,
                "800-3": true,
                "801-0": true,
                "801-1": true,
                "805-0": true,
                "806-0": true,
                "807-0": true
            };
            
            index.pokemons.forEach((pokemon) => {
                pokemon.models.forEach((model, offset) => {
                    if (!availables[pokemon.id + "-" + offset]) {
                        return;
                    }
                    if (pokemon.id !== 808) {
                        let mapWord = (word) => {
                            let text = ({
                                "female": "母",
                                "alolan": "阿罗拉",
                                "mega": "超进化", "mega X": "X超进化", "mega Y": "Y超进化",
                                "hat": "帽子1", "hat 2": "帽子2", "hat 3": "帽子3", "hat 4": "帽子4", "hat 5": "帽子5", "hat 6": "帽子6", "hat 7": "帽子7",
                                "sunny": "晴天", "rainy": "雨天", "snowy": "雪天",
                                "primal": "始源",
                                "attack": "攻击", "defense": "防御", "speed": "速度",
                                "plant": "植物", "sandy": "沙土", "trash": "垃圾",
                                "bloom": "开花",
                                "west": "西海岸", "east": "东海岸",
                                "heat": "微波炉", "wash": "洗衣机", "frost": "冰箱", "fan": "电风扇", "mow": "除草机",
                                "origin": "起源",
                                "sky": "天空",
                                "red": "红", "blue": "蓝", "yellow": "黄", "white": "白", "orange": "橙", "black": "黑", 
                                "forever": "永恒",
                                "zen": "禅定",
                                "spring": "春天", "summer": "夏天", "autumn": "秋天", "winter": "冬天",
                                "incarnate": "化身", "therian": "灵兽",
                                "ordinary": "觉悟", 
                                "pirouette": "歌声", "aria": "舞步",
                                "water": "水", "electric": "电", "fire": "火", "ice": "冰",
                                "ash": "牵绊",
                                "wild": "野生",
                                "heart": "爱心", "star": "星型", "diamond": "菱形", "lady": "淑女", "dowager": "贵妇", "gentleman": "绅士", "queen": "女王", "actor": "歌舞伎", "king": "国王",
                                "mini": "迷你", "small": "小型", "normal": "正常", "big": "大型",
                                "confined": "惩戒", "unbound": "解放",
                                "boss": "霸主",
                                "baile": "热辣", "pom-Pom": "啪滋", "pa'u": "呼拉", "sensu": "轻盈",
                                "midday": "白昼", "midnight": "黑夜", "dusk": "黄昏",
                                "solo": "单独", "school": "鱼群",
                                "red meteor": "红色流星", "orange meteor": "橙色流星", "yellow meteor": "黄色流星", "green meteor": "绿色流星", "aqua meteor": "青色流星", "blue meteor": "蓝色流星", "purple meteor": "紫色流星",
                                "red core": "红色核心", "orange core": "橙色核心", "yellow core": "黄色核心", "green core": "绿色核心", "aqua core": "青色核心", "blue core": "蓝色核心", "purple core": "紫色核心",
                                "weak": "现形",
                                "dusk Mane": "黄昏之鬃",  "dawn Wings": "拂晓之翼", "ultra": "究极",
                                "500 Years Ago": "500年前"
                            })[word];
                            if (!text) {
                                return word[0].toUpperCase() + word.slice(1);
                            } else {
                                return text;
                            }
                        };
                        let sprite = index.getSprite(pokemon.id, offset);
                        let name = `No.${("000" + pokemon.id).slice(-3)} ${pokemon.name} ${offset + 1} (${model.natural}, ${model.decoration})`;
                        if (sprite.features) {
                            name = `No.${("000" + pokemon.id).slice(-3)} ${pokemon.name} (${sprite.features.map(mapWord).join(", ")})`;
                        } else if (offset === 0) {
                            name = `No.${("000" + pokemon.id).slice(-3)} ${pokemon.name}`;
                        }
                        ol.append(
                            $("<li>").attribute({
                                "id": `pokemon-${pokemon.id}-${offset}`,
                                "title": [
                                    `flags: [${model.natural}, ${model.decoration}]`,
                                    `file_${("00000" + (model.file * 9 + 1)).slice(-5)}.pc`,
                                    `file_${("00000" + (model.file * 9 + 2)).slice(-5)}.pc`,
                                    `file_${("00000" + (model.file * 9 + 3)).slice(-5)}.pc`,
                                    `file_${("00000" + (model.file * 9 + 4)).slice(-5)}.pc`,
                                    `file_${("00000" + (model.file * 9 + 5)).slice(-5)}.pc`,
                                    `file_${("00000" + (model.file * 9 + 6)).slice(-5)}.pc`,
                                    `file_${("00000" + (model.file * 9 + 7)).slice(-5)}.pc`,
                                    `file_${("00000" + (model.file * 9 + 8)).slice(-5)}.pc`,
                                    `file_${("00000" + (model.file * 9 + 9)).slice(-5)}.pc`
                                ].join("\n")
                            })
                            .addFeatures(model.issue ? "issue" : "normal")
                            .addFeatures("model-" + offset)
                            .append(
                                $("<span>").attribute("id", "pokemon-sprite").addFeatures("sprite-icon", sprite.icon),
                                $("<span>").text(name)
                            ).on("gesture:tap-ended", function (/*event*/) {
                                loadPokemon(pokemon.id, offset).rejected(function (error) {
                                    $.error(error);
                                });
                            }));
                    }
                });
            });
            
            let ids = [1, 0];
            if (/^#pokemon\-[0-9]+\-[0-9]+$/.test(window.location.hash)) {
                ids = [parseInt(window.location.hash.split("-")[1]),
                       parseInt(window.location.hash.split("-")[2])];
                
            }
            
            loadPokemon(ids[0], ids[1]).rejected(function (error) {
                $.error(error);
            });
            
        }).rejected(function (error) {
            $.error(error);
        });
        
    };
    
})(this, this.$);
