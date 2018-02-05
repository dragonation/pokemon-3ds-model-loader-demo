((global, $) => {
    
    const Loader = require("./loader.js");
    
    const PC = require("./pc.js");
    
    const Index = function Index(url) {
        
        let index = this;
        
        this.url = url;
        
        let names = [];
        
        let issues = {};
        
        let async = $.async(function () {
             
            $.request("./resources/models/chinese.txt", this.test);
            
        }).then(function (result) {
            
            names = result.split("\n").map((line) => line.trim());
           
            $.request("./resources/models/issues.txt", this.test);
            
        }).then(function (result) {
            
            result.split("\n").filter((line) => line.trim() && line.trim()[0] !== "#").forEach((line) => {
                issues[line] = true;
            });
            
            $.request(url + "/file_00000.bin", {
                "responseDataType": "binary"
            }, this.test);
              
        }).then(function (result) {
                
            let reader = new Loader.Reader(new DataView(result));
            
            index.pokemons = [];
            
            let id = 0;
            while (id < names.length) {
                let file = reader.readUint16();
                let count = reader.readUint8();
                let flags = reader.readUint8();
                index.pokemons[id] = {
                    "id": id + 1,
                    "name": names[id],
                    "file": file,
                    "hasGenderDifference": (flags & 0x2) !== 0,
                    "hasExtraModels": (flags & 0x4) !== 0,
                    "modelsCount": count,
                    "models": []
                };
                ++id;
            }
            
            id = 0;
            let file = 0;
            let offset = 0;
            while (reader.index < reader.end) {
                let pokemon = index.pokemons[id];
                let flags = [reader.readUint8(), reader.readUint8()];
                pokemon.models.push({
                    "file": pokemon.file + pokemon.models.length,
                    "natural": flags[0],
                    "decoration": flags[1],
                    "issue": issues.hasOwnProperty("pokemon-" + (id + 1) + "-" + offset)
                });
                ++file;
                ++offset;
                if (pokemon.file + pokemon.modelsCount <= file) {
                    delete pokemon.modelsCount;
                    ++id;
                    offset = 0;
                }
            }
            
            this.next(index);
            
        });
        
        this.then = async.then.bind(async);
        this.rejected = async.rejected.bind(async);
        this.finished = async.finished.bind(async);
        this.pipe = async.pipe.bind(async);
        
    };
    
    Index.prototype.loadPokemon = function (id, offset) {
        
        let index = this;
        
        let getFileName = (id) => {
            return index.url + "/file_" + ("00000" + id).slice(-5) + ".pc?date=" + Date.now();
        };
        
        let pokemon = index.pokemons[id - 1];
        
        // natural => 
        //     0: all is correct
        //     1: motions needs fill
        //     2: textures needs fill
        //     4: models needs fill
        //     7: no content except extras, (no model, no motion, no textures)
        //     8: extras needs fill
        let loadPackage = (file, flag) => {
            
            let finalPC = new PC();
            
            let ids = [file];
            let newOffset = 0;
            while ((pokemon.models[offset + newOffset].natural & flag) !== 0) {
                --newOffset;
            }
            if (newOffset !== 0) {
                ids.push(file + 9 * newOffset);
            }
            
            return $.async.all(ids, function (id) {
                
                new Loader(getFileName(id)).load().then(function (pc) {
                 
                    pc.files.forEach((file, index) => {
                        if (file) {
                            finalPC.files[index] = file;
                        } else if (!finalPC.files.hasOwnProperty(index)) {
                            finalPC.files[index] = null;
                        }
                    });
                    
                    this.next();
                    
                }).pipe(this);
                
            }).resolve(finalPC);
            
        };
        
        return this.then(function () {
            
            let origin = (pokemon.file + offset) * 9 + 1;
            
            let pcs = {
                "files": []
            };
            
            $.async.all([
                ["model", 4], 
                ["textures.normal", 4], 
                ["textures.shiny", 4], 
                ["textures.shadow", 4],
                ["motions.fighting", 1], 
                ["motions.pet", 1], 
                ["motions.map", 1], 
                ["motions.acting", 1],
                ["extra", 8]
            ], function ([usage, flag], index) {
                 
                loadPackage(origin + index, flag).then(function (pc) {
                    
                    pcs.files[index] = pc;
                    
                    let root = pcs;
                    usage.split(".").forEach((key, index, list) => {
                        if (index < list.length - 1) {
                            if (!root.hasOwnProperty(key)) {
                                root[key] = {};
                            }
                            root = root[key];
                        } else {
                            root[key] = pc;
                        }
                    });
                    
                    this.next();
                    
                }).pipe(this);
               
            }).resolve(pcs).pipe(this);
            
        });
        
    };
    
    Index.prototype.getSprite = function (id, offset) {
        
        if (!offset) {
            offset = 0;
        }
        
        let suffix = null;
        if (Index.sprites[id]) {
            suffix = Index.sprites[id][offset];
            if (suffix === undefined) {
                suffix = Index.sprites[id][0];
            }
        }
        
        return {
            "icon": "sprite-icon-" + ("00" + id).slice(-3) + (suffix ? suffix : ""),
            "features": Index.features[id] ? Index.features[id][offset] : null
        };
        
    };
    
    Index.sprites = {
        "3": { "2": "M" },
        "6": { "1": "MX", "2": "MY" },
        "9": { "1": "M" },
        "15": { "1": "M" },
        "18": { "1": "M" },
        "19": { "2": "A" },
        "20": { "2": "A", "3": "A" },
        "25": { "2": "O", "3": "H", "4": "S", "5": "U", "6": "K", "7": "A", "8": "P" },
        "26": { "2": "A" },
        "27": { "1": "A" },
        "28": { "1": "A" },
        "37": { "1": "A" },
        "38": { "1": "A" },
        "50": { "1": "A" },
        "51": { "1": "A" },
        "52": { "1": "A" },
        "53": { "1": "A" },
        "65": { "2": "M" },
        "74": { "1": "A" },
        "75": { "1": "A" },
        "76": { "1": "A" },
        "80": { "1": "M" },
        "88": { "1": "A" },
        "89": { "1": "A" },
        "94": { "1": "M" },
        "103": { "1": "A" },
        "105": { "1": "A", "2": "A" },
        "115": { "1": "M" },
        "127": { "1": "M" },
        "130": { "2": "M" },
        "142": { "1": "M" },
        "150": { "1": "MX", "2": "MY" },
        "181": { "1": "M" },
        "201": { 
            "1": "B",  "2": "C", "3": "D", "4": "E", "5": "F", "6": "G",
            "7": "H", "8": "I", "9": "J", "10": "K", "11": "L", "12": "M",
            "13": "N", "14": "O", "15": "P", "16": "Q", "17": "R", "18": "S", 
            "19": "T", "20": "U", "21": "V", "22": "W", "23": "X", "24": "Y",
            "25": "Z", "26": "EX", "27": "QU"
        },
        "208": { "2": "M" },
        "212": { "2": "M" },
        "214": { "2": "M" },
        "229": { "2": "M" },
        "248": { "1": "M" },
        "254": { "1": "M" },
        "257": { "2": "M" },
        "260": { "1": "M" },
        "282": { "1": "M" },
        "302": { "1": "M" },
        "303": { "1": "M" },
        "306": { "1": "M" },
        "308": { "2": "M" },
        "310": { "1": "M" },
        "319": { "1": "M" },
        "323": { "2": "M" },
        "334": { "1": "M" },
        "351": { "1": "S", "2": "R", "3": "H" },
        "354": { "1": "M" },
        "359": { "1": "M" },
        "362": { "1": "M" },
        "373": { "1": "M" },
        "376": { "1": "M" },
        "380": { "1": "M" },
        "381": { "1": "M" },
        "382": { "1": "P" },
        "383": { "1": "P" },
        "384": { "1": "M" },
        "386": { "1": "A", "2": "D", "3": "S" },
        "412": { "1": "G", "2": "S" },
        "413": { "1": "G", "2": "S" },
        "421": { "1": "S" },
        "422": { "1": "E" },
        "423": { "1": "E" },
        "428": { "1": "M" },
        "445": { "2": "M" },
        "448": { "1": "M" },
        "460": { "2": "M" },
        "475": { "1": "M" },
        "479": { "1": "O", "2": "W", "3": "R", "4": "F", "5": "L" },
        "487": { "1": "O" },
        "492": { "1": "S" },
        "521": { "1": "F" },
        "531": { "1": "M" },
        "550": { "1": "B" },
        "555": { "1": "Z" },
        "585": { "1": "S", "2": "A", "3": "W" },
        "586": { "1": "S", "2": "A", "3": "W" },
        "592": { "1": "F" },
        "593": { "1": "F" },
        "641": { "1": "T" },
        "642": { "1": "T" },
        "645": { "1": "T" },
        "646": { "1": "W", "2": "B" },
        "647": { "1": "R" },
        "648": { "1": "P" },
        "658": { "2": "A" },
        "666": { 
            "0": "Icy",
            "1": "Pol",
            "2": "Tun",
            "3": "Con",
            "4": "Gar",
            "5": "Ele",
            "6": "",
            "7": "Mod",
            "8": "Mar",
            "9": "Arc",
            "10": "Hig",
            "11": "San",
            "12": "Riv",
            "13": "Mon",
            "14": "Sav",
            "15": "Sun",
            "16": "Oce",
            "17": "Jun",
            "18": "Fan",
            "19": "Pok"
        },
        "668": { "1": "F" },
        "669": { 
            "1": "Y",
            "2": "O",
            "3": "B",
            "4": "W",
        },
        "670": { 
            "1": "Y",
            "2": "O",
            "3": "B",
            "4": "W",
            "5": "E",
        },
        "671": { 
            "1": "Y",
            "2": "O",
            "3": "B",
            "4": "W",
        },
        "676": {
            "1": "He",
            "2": "St",
            "3": "Di",
            "4": "De",
            "5": "Ma",
            "6": "Da",
            "7": "La",
            "8": "Ka",
            "9": "Ph"
        },
        "678": { "1": "F" },
        "681": { "1": "B" },
        "716": { "1": "N" },
        "718": { "1": "T", "2": "T", "3": "T", "4": "C" },
        "719": { "1": "M" },
        "720": { "1": "U" },
        "741": { "1": "Po", "2": "Pa", "3": "Se" },
        "745": { "1": "Mn", "2": "D" },
        "746": { "1": "Sc" },
        "774": { "7": "R", "8": "O", "9": "Y", "10": "G", "11": "B", "12": "I", "13": "V" },
        "800": { "1": "DM", "2": "DW", "3": "U" },
        "801": { "1": "O" }
    };
    
    Index.features = {
        "3": { "1": ["female"], "2": ["mega"] },
        "6": { "1": ["mega X"], "2": ["mega Y"] },
        "9": { "1": ["mega"] },
        "12": { "1": ["female"] },
        "15": { "1": ["mega"] },
        "18": { "1": ["mega"] },
        "19": { "1": ["female"], "2": ["alolan"] },
        "20": { "1": ["female"], "2": ["alolan"], "3": ["boss"] },
        "25": { 
            "1": ["female"], 
            "2": ["hat"], 
            "3": ["hat 2"], 
            "4": ["hat 3"], 
            "5": ["hat 4"], 
            "6": ["hat 5"], 
            "7": ["hat 6"], 
            "8": ["hat 7"], 
        },
        "26": { "1": ["female"], "2": ["alolan"] },
        "27": { "1": ["alolan"] },
        "28": { "1": ["alolan"] },
        "37": { "1": ["alolan"] },
        "38": { "1": ["alolan"] },
        "41": { "1": ["female"] },
        "42": { "1": ["female"] },
        "44": { "1": ["female"] },
        "45": { "1": ["female"] },
        "50": { "1": ["alolan"] },
        "51": { "1": ["alolan"] },
        "52": { "1": ["alolan"] },
        "53": { "1": ["alolan"] },
        "64": { "1": ["female"] },
        "65": { "1": ["female"], "2": ["mega"] },
        "74": { "1": ["alolan"] },
        "75": { "1": ["alolan"] },
        "76": { "1": ["alolan"] },
        "80": { "1": ["mega"] },
        "84": { "1": ["female"] },
        "85": { "1": ["female"] },
        "88": { "1": ["alolan"] },
        "89": { "1": ["alolan"] },
        "94": { "1": ["mega"] },
        "97": { "1": ["female"] },
        "103": { "1": ["alolan"] },
        "105": { "1": ["alolan"], "2": ["alolan", "boss"] },
        "111": { "1": ["female"] },
        "112": { "1": ["female"] },
        "115": { "1": ["mega"] },
        "118": { "1": ["female"] },
        "119": { "1": ["female"] },
        "123": { "1": ["female"] },
        "127": { "1": ["mega"] },
        "129": { "1": ["female"] },
        "130": { "1": ["female"], "2": ["mega"] },
        "142": { "1": ["mega"] },
        "150": { "1": ["mega X"], "2": ["mega Y"] },
        "154": { "1": ["female"] },
        "165": { "1": ["female"] },
        "166": { "1": ["female"] },
        "178": { "1": ["female"] },
        "181": { "1": ["mega"] },
        "185": { "1": ["female"] },
        "186": { "1": ["female"] },
        "190": { "1": ["female"] },
        "194": { "1": ["female"] },
        "195": { "1": ["female"] },
        "198": { "1": ["female"] },
        "201": { 
            "0": ["a"],
            "1": ["b"],
            "2": ["c"],
            "3": ["d"],
            "4": ["e"],
            "5": ["f"],
            "6": ["g"],
            "7": ["h"],
            "8": ["i"],
            "9": ["j"],
            "10": ["k"],
            "11": ["l"],
            "12": ["m"],
            "13": ["n"],
            "14": ["o"],
            "15": ["p"],
            "16": ["q"],
            "17": ["r"],
            "18": ["s"],
            "19": ["t"],
            "20": ["u"],
            "21": ["v"],
            "22": ["w"],
            "23": ["x"],
            "24": ["y"],
            "25": ["z"],
            "26": ["!"],
            "27": ["?"]
        },
        "202": { "1": ["female"] },
        "203": { "1": ["female"] },
        "207": { "1": ["female"] },
        "208": { "1": ["female"], "2": ["mega"] },
        "212": { "1": ["female"], "2": ["mega"] },
        "214": { "1": ["female"], "2": ["mega"] },
        "215": { "1": ["female"] },
        "217": { "1": ["female"] },
        "221": { "1": ["female"] },
        "224": { "1": ["female"] },
        "229": { "1": ["female"], "2": ["mega"] },
        "232": { "1": ["female"] },
        "248": { "1": ["mega"] },
        "254": { "1": ["mega"] },
        "255": { "1": ["female"] },
        "256": { "1": ["female"] },
        "257": { "1": ["female"], "2": ["mega"] },
        "260": { "1": ["mega"] },
        "267": { "1": ["female"] },
        "269": { "1": ["female"] },
        "272": { "1": ["female"] },
        "274": { "1": ["female"] },
        "275": { "1": ["female"] },
        "282": { "1": ["mega"] },
        "302": { "1": ["mega"] },
        "303": { "1": ["mega"] },
        "306": { "1": ["mega"] },
        "307": { "1": ["female"] },
        "308": { "1": ["female"], "2": ["mega"] },
        "310": { "1": ["mega"] },
        "315": { "1": ["mega"] },
        "316": { "1": ["female"] },
        "317": { "1": ["female"] },
        "319": { "1": ["mega"] },
        "322": { "1": ["female"] },
        "323": { "1": ["female"], "2": ["mega"] },
        "332": { "1": ["female"] },
        "334": { "1": ["mega"] },
        "350": { "1": ["female"] },
        "351": { "1": ["sunny"], "2": ["rainy"], "3": ["snowy"] },
        "354": { "1": ["mega"] },
        "359": { "1": ["mega"] },
        "362": { "1": ["mega"] },
        "369": { "1": ["female"] },
        "373": { "1": ["mega"] },
        "376": { "1": ["mega"] },
        "380": { "1": ["mega"] },
        "381": { "1": ["mega"] },
        "382": { "1": ["primal"] },
        "383": { "1": ["primal"] },
        "384": { "1": ["mega"] },
        "386": { "1": ["attack"], "2": ["defense"], "3": ["speed"] },
        "396": { "1": ["female"] },
        "397": { "1": ["female"] },
        "398": { "1": ["female"] },
        "399": { "1": ["female"] },
        "400": { "1": ["female"] },
        "401": { "1": ["female"] },
        "402": { "1": ["female"] },
        "403": { "1": ["female"] },
        "404": { "1": ["female"] },
        "405": { "1": ["female"] },
        "407": { "1": ["mega"] },
        "412": { "0": ["plant"], "1": ["sandy"], "2": ["trash"] },
        "413": { "0": ["plant"], "1": ["sandy"], "2": ["trash"] },
        "415": { "1": ["female"] },
        "417": { "1": ["female"] },
        "418": { "1": ["female"] },
        "419": { "1": ["female"] },
        "421": { "1": ["bloom"] },
        "422": { "0": ["west"], "1": ["east"] },
        "423": { "0": ["west"], "1": ["east"] },
        "424": { "1": ["female"] },
        "428": { "1": ["mega"] },
        "443": { "1": ["female"] },
        "444": { "1": ["female"] },
        "445": { "1": ["female"], "2": ["mega"] },
        "448": { "1": ["mega"] },
        "449": { "1": ["female"] },
        "450": { "1": ["female"] },
        "453": { "1": ["female"] },
        "454": { "1": ["female"] },
        "456": { "1": ["female"] },
        "457": { "1": ["female"] },
        "459": { "1": ["female"] },
        "460": { "1": ["female"], "2": ["mega"] },
        "461": { "1": ["female"] },
        "464": { "1": ["female"] },
        "465": { "1": ["female"] },
        "473": { "1": ["female"] },
        "475": { "1": ["mega"] },
        "479": { "1": ["heat"], "2": ["wash"], "3": ["frost"], "4": ["fan"], "5": ["mow"] },
        "487": { "1": ["origin"] },
        "492": { "1": ["sky"] },
        "493": { }, // TODO: check
        "521": { "1": ["female"] },
        "531": { "1": ["mega"] },
        "550": { "0": ["red"], "1": ["blue"] },
        "555": { "1": ["zen"] },
        "585": { "0": ["spring"], "1": ["summer"], "2": ["autumn"], "3": ["winter"] },
        "586": { "0": ["spring"], "1": ["summer"], "2": ["autumn"], "3": ["winter"] },
        "592": { "1": ["female"] },
        "593": { "1": ["female"] },
        "641": { "0": ["incarnate"], "1": ["therian"] },
        "642": { "0": ["incarnate"], "1": ["therian"] },
        "645": { "0": ["incarnate"], "1": ["therian"] },
        "646": { "1": ["white"], "2": ["black"] },
        "647": { "1": ["ordinary"], "2": ["resolute"] },
        "648": { "1": ["aria"], "0": ["pirouette"] },
        "649": { "1": ["water"], "2": ["electric"], "3": ["fire"], "4": ["ice"] },
        "658": { "1": ["female"], "2": ["ash"] }, // TODO: check female
        "666": { }, // TODO: check
        "668": { "1": ["female"] },
        "669": { "0": ["red"], "1": ["yellow"], "2": ["orange"], "3": ["blue"], "4": ["white"] },
        "670": { "0": ["red"], "1": ["yellow"], "2": ["orange"], "3": ["blue"], "4": ["white"], "5": ["forever"] },
        "671": { "0": ["red"], "1": ["yellow"], "2": ["orange"], "3": ["blue"], "4": ["white"] },
        "676": { 
            "0": ["wild"], 
            "1": ["heart"], "2": ["star"], "3": ["diamond"], 
            "4": ["lady"], "5": ["dowager"], 
            "6": ["gentleman"],
            "7": ["queen"], "8": ["actor"], "9": ["king"] },
        "678": { "1": ["female"] },
        "681": { "0": ["defense"], "1": ["attack"] },
        "710": { "0": ["mini"], "1": ["small"], "2": ["normal"], "3": ["big"] },
        "711": { "0": ["mini"], "1": ["small"], "2": ["normal"], "3": ["big"] },
        "718": { "0": ["50%"], "1": ["10%"], "2": ["10%", "?"], "3": ["10%", "?"], "4": ["100%"] },
        "719": { "1": ["mega"] },
        "720": { "0": ["confined"], "1": ["unbound"] },
        "735": { "1": ["boss"] },
        "738": { "1": ["boss"] },
        "741": { "0": ["baile"], "1": ["pom-Pom"], "2": ["pa'u"], "3": ["sensu"] },
        "743": { "1": ["female"] },
        "745": { "0": ["midday"], "1": ["midnight"], "2": ["dusk"] },
        "746": { "0": ["solo"], "1": ["school"] },
        "752": { "1": ["boss"] },
        "754": { "1": ["boss"] },
        "758": { "1": ["boss"] },
        "773": {}, // TODO: check
        "774": {
            "0": ["red meteor"],
            "1": ["orange meteor"],
            "2": ["yellow meteor"],
            "3": ["green meteor"],
            "4": ["aqua meteor"],
            "5": ["blue meteor"],
            "6": ["purple meteor"],
            "7": ["red core"],
            "8": ["orange core"],
            "9": ["yellow core"],
            "10": ["green core"],
            "11": ["aqua core"],
            "12": ["blue core"],
            "13": ["purple core"]
        },
        "777": { "1": ["boss"] },
        "778": { "1": ["weak"], "2": ["weak", "?"], "3": ["weak", "?"] },
        "784": { "1": ["boss"] },
        "800": { "1": ["dusk Mane"], "2": ["dawn Wings"], "3": ["ultra"] },
        "801": { "1": ["500 Years Ago"] }
    };
    
    module.exports = Index;
    
})(this, this.$);
