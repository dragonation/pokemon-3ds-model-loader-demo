!function(){var e=document.URL.split("#")[0].split("?")[0].split("/");e.pop(),e=e.join("/");try{Object.defineProperty(this.constructor.prototype,"global",{enumerable:!1,get:function(){return this}})}catch(e){this.global=this}try{Object.defineProperty(global,"Global",{enumerable:!0,value:global.constructor})}catch(e){global.Global=global.constructor}var t=function(e){e=parseInt(e),isFinite(e)||(e=0);try{var t=new Error("937b84bb-7953-4443-be30-34ba130b98e7").stack.split("\n"),n=null;return n=-1!==t[0].indexOf("937b84bb-7953-4443-be30-34ba130b98e7")?t[2+e]:t[1+e],")"===(n="    at "===n.substring(0,7)?n.split("at").slice(1).join("at"):(n=n.split("@")).length>1?n.slice(1).join("@"):n[0])[n.length-1]&&(n=n.split("(").slice(1).join("(").slice(0,-1)),n.trim()}catch(e){var r=document.URL+":0:0";if("complete"!==document.readyState){var o=document.getElementsByTagName("script"),i=o[o.length-1];i.src&&(r=i.src+":0:0")}return r}};try{Object.defineProperty(Global.prototype,"__dirname",{enumerable:!1,configurable:!0,get:function(){return t(1).split(":").slice(0,-2).join(":").split("/").slice(0,-1).join("/")}})}catch(e){global.__dirname=document.URL.split("/").slice(0,-1).join("/")}try{Object.defineProperty(Global.prototype,"__filename",{enumerable:!1,configurable:!0,get:function(){return t(1).split(":").slice(0,-2).join(":")}})}catch(e){global.__filename=document.URL}try{Object.defineProperty(Global.prototype,"__line",{enumerable:!1,configurable:!0,get:function(){return parseInt(t(1).split(":").slice(-2,-1)[0])}})}catch(e){global.__line=0}try{Object.defineProperty(Global.prototype,"__column",{enumerable:!1,configurable:!0,get:function(){return parseInt(t(1).split(":").slice(-1)[0])}})}catch(e){global.__column=0}var n={},r={},o=function(t,l,a,s){var c=this;if(a&&(n[l]=this),this.parent=t,this.id=l,this.filename=l,this.loaded=!1,this.children=[],this.exports={},this._compile=function(e,t){var n=Object.keys(i),r=n.map(function(t){return i[t](c,e)});"/"===t[0]&&(t=require.root+t);var o="(function () { return function ("+n.join(", ")+") { "+e+" }; })();";-1!==navigator.userAgent.indexOf("Chrome")?o+=" //# sourceURL="+t:o+="//@ sourceURL="+t;var l=null;try{l=global.eval(o)}catch(e){throw console.error("Invalid JS file: "+t),e}l.apply(global,r)},this.require=function(t,n){return r.hasOwnProperty(t)||(/^[a-z0-9\-_]+$/.test(t)&&(t="/library/node."+t+"/index.js"),"."===t.charAt(0)&&(t=this.id.split("/").slice(0,-1).join("/")+"/"+t),t=t.replace(/\/+/g,"/").replace(/\/\.\//g,"/").replace(/\/[^\/]+\/\.\.\//g,"/").replace(/^(file|http|https|ui):\//,function(e){return"file:/"===e?e+"//":e+"/"}),e+"/"===t.substring(0,e.length+1)&&(t=t.substring(e.length))),o.get(this,t,n).exports}.bind(this),this.require.root=e,global.document&&(0!==Array.prototype.filter.call(document.querySelectorAll("script"),function(t){return"/"===l[0]?t.src===e+l:t.src===l}).length||document.URL.split("#")[0].split("?")[0]===l)||r[l])r[l]=!0;else{r[l]=!0;var u=require("path").extname(l);u&&o._extensions.hasOwnProperty(u)||(u=".js"),o._extensions[u](c,l,t,s)}};o.get=function(e,t,r){return n.hasOwnProperty(t)?(r&&r(null,n[t].exports),n[t]):(null===e&&(e=n[__filename]),new o(e,t,!0,r))},o._extensions={};var i={};o.getter=function(e,t){i[e]=t},o.getter("module",function(e){return e}),o.getter("require",function(e){return e.require}),o.getter("exports",function(e){return e.exports}),o.getter("__filename",function(e){return e.id}),o.getter("__dirname",function(e){return e.id.split("/").slice(0,-1).join("/")});var l=function(e,n){var r=t(1+n).split(":").slice(0,-2).join(":");return r?o.get(e,r):p};try{Object.defineProperty(Global.prototype,"module",{enumerable:!1,configurable:!0,get:function(){return l(null,1)}})}catch(e){global.module=l(null,1)}try{Object.defineProperty(Global.prototype,"require",{enumerable:!1,configurable:!0,get:function(){return l(null,1).require}})}catch(e){global.require=l(null,1).require}try{Object.defineProperty(Global.prototype,"exports",{enumerable:!1,configurable:!0,get:function(){return l(null,1).exports},set:function(e){l(null,1).exports=e}})}catch(e){global.exports=l(null,1).exports}var a=function(e,t){r[e]=!0;var n=new o(module,e,!0);Object.keys(t).forEach(function(e){n.exports[e]=t[e]})},s=function(){throw new Error("Not implemented")},c=function(){arguments[arguments.length-1](new Error("Not implemented"))},u=global.document.URL.split("#")[0].split("?")[0],p=o.get(null,u),f=(new Date).getTime();a("<anonymous>",{}),a("module",o),a("os",{tmpdir:function(){return null},endianness:function(){return"BE"},type:function(){return"browser"},hostname:function(){return"browser"},platform:function(){return"browser"},arch:function(){return"js"},release:function(){return"0.1.0"},uptime:function(){return((new Date).getTime()-f)/1e3},loadavg:function(){return[0,0,0]},totalmem:function(){return 1/0},freemem:function(){return 1/0},cpus:function(){return[{model:"Browser Javascript CPU",speed:1/0,times:{user:0,nice:0,sys:0,idle:0,irq:0}}]}}),a("util",{inherits:function(e,t){e.super_=t,e.prototype=Object.create(t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}})}}),a("path",{normalize:function(e){var t=e.split("://");return t.length>1?t[0]+"://"+t.slice(1).join("://").replace(/\/+/g,"/").replace(/\/.\//g,"/").replace(/\/[^\/]\/..\//g,"/"):t.join("://").replace(/\/+/g,"/").replace(/\/.\//g,"/").replace(/\/[^\/]\/..\//g,"/")},join:function(){return this.normalize(Array.prototype.join.call(arguments,"/"))},resolve:function(){for(var e=null,t=0;t<arguments.length;)e=-1!==arguments[t].indexOf("://")?arguments[t]:e+"/"+arguments[t],++t;return this.normalize(e)},isAbsolute:function(e){return-1!==arguments[looper].indexOf("://")},relative:function(e,t){if(basePathComponents=e.split("/"),pathComponents=t.split("/"),pathComponents[0]!==basePathComponents[0]||pathComponents[1]!==basePathComponents[1]||pathComponents[2]!==basePathComponents[2])return t;for(var n=3;n<basePathComponents.length&&pathComponents[n]===basePathComponents[n];)++n;for(var r=[];n<pathComponents.length;)n<basePathComponents.length&&r.unshift(".."),r.push(pathComponents[n]),++n;return r.join("/")},dirname:function(e){return e.split("/").slice(0,-1).join("/")},basename:function(e,t){var n=e.split("/").slice(-1)[0];return t&&n.substring(n.length-t.length,n.length)===t&&(n=n.substring(0,n.length-t.length)),n},extname:function(e){var t=e.split("/").slice(-1)[0].split(".");return t.length>1&&(t[0].length>0||t.length>2)?"."+t[t.length-1]:""},sep:"/",delimiter:":"}),a("fs",{Stats:s,FSWatcher:s,ReadStream:s,WriteStream:s,exists:function(e,t){t(!1)},existsSync:function(e){return!1},readFile:c,readFileSync:function(e){var t=require("path").resolve(process.cwd(),e),n=global.$?global.$["!space"]("query"):null;if(n&&n.resources&&n.resources.load&&n.resources.hasCache(t)){var r=null;return n.resources.load(t,function(e,n){if(e)throw e;if(n[t].error)throw n[t].error;r=n[t].content}),r}var o=null;return o=window.XDomainRequest?new XDomainRequest:window.XMLHttpRequest?new XMLHttpRequest:new ActiveXObject("Microsoft.XMLHTTP"),o.timeout=3e4,o.open("GET",t,!1),o.send(),o.responseText},writeFile:c,writeFileSync:s,truncate:c,truncateSync:s,unlink:c,unlinkSync:s,stat:c,statSync:s,lstat:c,lstatSync:s,readdir:c,readdirSync:s,mkdir:c,mkdirSync:s,rmdir:c,rmdirSync:s,rename:c,renameSync:s,link:c,linkSync:s,symlink:c,symlinkSync:s,readlink:c,readlinkSync:s,chmod:c,chmodSync:s,lchmod:c,lchmodSync:s,chown:c,chownSync:s,lchown:c,lchownSync:s,access:c,accessSync:s,utimes:c,utimesSync:s,realpath:c,realpathSync:s,open:c,openSync:s,read:c,readSync:s,write:c,writeSync:s,close:c,closeSync:s,append:c,appendSync:s,ftruncate:c,ftruncateSync:s,fstat:c,fstatSync:s,fsync:c,fsyncSync:s,fchmod:c,fchmodSync:s,fchown:c,fchownSync:s,futimes:c,futimesSync:s,createReadStream:s,createWriteStream:s,watch:s,watchFile:s,unwatchFile:s});var d=u.split("/").slice(0,-1).join("/"),m=0,h=function(e){setTimeout(e,0)};if(window.Worker){var g=[];window.addEventListener("message",function(e){e.source===window&&e.data&&"deb93a6f-d613-44f5-b82c-c58e8b0a3e2f"===e.data.signature&&e.stopPropagation();var t=g;g=[],t.forEach(function(e){try{e.job.apply(window,e.arguments)}catch(e){setTimeout(function(){throw e})}})}),h=function(e){g.push({job:e,arguments:[].slice.call(arguments,1)}),window.postMessage({signature:"deb93a6f-d613-44f5-b82c-c58e8b0a3e2f"},"*")}}a("process",{cwd:function(){return d},chdir:s,exit:s,kill:s,abort:s,umask:511,getgid:function(){return 0},getuid:function(){return 0},setgid:s,setuid:s,hrtime:function(){var e=(new Date).getTime(),t=(e-m)/1e3;return m=e,[Math.floor(t),t-Math.floor(t)]},uptime:function(){return((new Date).getTime()-f)/1e3},nextTick:h,getgroups:s,setgroups:s,initgroups:s,memoryUsage:s,env:{HOME:d},pid:0,arch:"js",platform:"browser",title:"browser",version:"0.1.0",argv:["browser",u],execArgv:[],execPath:"browser",stdin:null,stderr:null,stdout:null,exitCode:0,config:{},versions:{},mainModule:p.exports}),a("crypto",{}),require("module")._extensions[".js"]=function(t,n,r,o){var i=function(e){t._compile(e,n)},l=global.$?global.$["!space"]("query"):null;if(l&&l.resources&&l.resources.load&&(o||l.resources.hasCache(n)))l.resources.load(n,function(e,r){e&&o&&o(e),r[n].error?o&&o(r[n].error):(t._compile(r[n].content,n),o&&o(null,t.exports))});else{var a=null;if(a=window.XDomainRequest?new XDomainRequest:window.XMLHttpRequest?new XMLHttpRequest:new ActiveXObject("Microsoft.XMLHTTP"),o){var s=function(){if(4===a.readyState)switch(a.status%100){case 0:case 2:i(a.responseText),o(null,t.exports);break;default:o(new Error("Failed to module "+path))}};a.addEventListener?a.addEventListener("readystatechange",s):a.onreadystatechange=s}if(/^[0-9a-z\-]+:/i.test(n)?a.open("GET",n,!!o):"/"!==n[0]?a.open("GET",e+"/"+n,!!o):a.open("GET",e+n,!!o),a.send(),!o)switch(a.status%100){case 0:case 2:t._compile(a.responseText,n);break;default:throw new Error("Module not found "+n)}}},global.process=n.process.exports}();