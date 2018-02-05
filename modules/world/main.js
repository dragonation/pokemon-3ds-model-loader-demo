((e,t)=>{const r=require("../three/main.js"),i=require("../three/stats.js"),a=require("../three/orbit.controls.js"),n=function(e,i,a,n){const o=new r.LoadingManager;o.onProgress=function(e,r){var i=e.replace(/[\/\\]+/g,"/");t.debug("Loading resource["+r+"]: "+i)},Object.defineProperties(this,{scene:{value:e},clock:{value:i},camera:{value:a},renderer:{value:n},loaders:{value:{manager:o}},tickers:{value:[]}}),this.addTicker(()=>this.render())};n.prototype.addTicker=function(e){this.tickers.push(e)},n.prototype.removeTicker=function(e){const r=this.tickers.indexOf(e);-1!==r?this.tickers.splice(r,1):t.warn("Ticker not found")},n.prototype.simulate=function(){const t=()=>{e.requestAnimationFrame(t);var r=this.clock.getDelta();try{this.tickers.forEach(e=>e(r))}catch(e){console.error(e)}};e.requestAnimationFrame(t)},n.prototype.load=function(e,r){return t.async(function(){const i=e.split("?")[0].split("/").slice(-1)[0].split(".").slice(0,-1).join("."),a="."+e.split("?")[0].split(".").slice(-1)[0];this.loaders[a].load(e,e=>{let t=e;r&&(t=r(t)),this.scene.add(t),this.next(t)},e=>{t.debug("Model["+i+"] "+Math.round(e.loaded/e.total*100)+"% downloaded")},this.reject)})},n.prototype.createShaderMaterial=function(e,i,a,n){return t.async(function(){const o=()=>{if(n.fragmentShader&&n.vertexShader){const t=new r.ShaderMaterial(n);e&&(t.name=e),this.next(t)}};i&&(this.loaders[".frag"]||(this.loaders[".frag"]=new r.FileLoader),this.loaders[".frag"].load(i,e=>{n.fragmentShader=e,o()},e=>{t.debug("Shader Fragment["+i.split("?")[0].split("/").slice(-1)[0]+"] "+Math.round(e.loaded/e.total*100)+"% downloaded")},this.reject)),a&&(this.loaders[".vert"]||(this.loaders[".vert"]=new r.FileLoader),this.loaders[".vert"].load(a,e=>{n.vertexShader=e,o()},e=>{t.debug("Shader Vertex["+a.split("?")[0].split("/").slice(-1)[0]+"] "+Math.round(e.loaded/e.total*100)+"% downloaded")},this.reject))})},n.prototype.addSkeletonHelper=function(e){const t=new r.SkeletonHelper(e);return t.material.linewidth=2,this.scene.add(t),e.skeletonHelper=e,t},n.prototype.render=function(){this.renderer.clear(),this.renderer.render(this.scene,this.camera)},n.prototype.updateRender=function(e){const t=this.render.bind(this);this.render=function(){e.call(this,t)}},n.create=function(e){e||(e={});let o=e.container;const s=(o=t(o?e.container:"body")).size().width,d=o.size().height,l=new r.Scene;let c=e.camera;c&&t.is(c,r.Camera)||(c=new r.PerspectiveCamera(45,s/d,10,1e4),e.camera&&(c.position.x=e.camera.x,c.position.y=e.camera.y,c.position.z=e.camera.z));const h=new r.Clock;let u=e.renderer;u&&t.is(u,r.WebGLRenderer)||((u=new r.WebGLRenderer(t.merge.simple({antialias:1===t.browser.pixelate,alpha:!0},e.renderer))).setPixelRatio(window.devicePixelRatio),u.setSize(s,d),e.renderer&&!t.is.nil(e.renderer.autoclear)?u.autoClear=e.renderer.autoclear:u.autoClear=!1,e.renderer&&!t.is.nil(e.renderer.autosort)&&(u.sortObjects=e.renderer.autosort),e.renderer&&e.renderer.clearColor?u.setClearColor(e.renderer.clearColor,0):u.setClearColor(12105912,1),e.renderer&&!t.is.nil(e.renderer.gamma)?(u.gammaInput=e.renderer.gamma,u.gammaOutput=e.renderer.gamma):(u.gammaInput=!0,u.gammaOutput=!0)),o.append(t(u.domElement));const p=new n(l,h,c,u);let m=e.lights;if(m||(p.ambientLight=new r.AmbientLight(16777215,1),p.ambientLight.position.set(0,0,0),p.directionalLight=new r.DirectionalLight(16777215,.3),p.directionalLight.position.set(-.7,1,1),m=[p.ambientLight,p.directionalLight]),m.forEach(e=>{l.add(e)}),e.stats){const e=new i;o.append(t(e.dom)),p.addTicker(()=>{e.update()}),p.stats=e}if(e.grids){const e=new r.GridHelper(50,50,3158064,3158064);e.position.set(0,-.04,0),l.add(e),p.grids=e}if(e.controls){const e=new a(c,u.domElement);e.target.set(0,0,0),e.update(),p.controls=e}return e.pause||p.simulate(),p},module.exports=n})(this,this.$);