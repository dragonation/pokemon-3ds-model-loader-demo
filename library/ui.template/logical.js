$(function(){var t={};$.template.tags[$.template.namespaceURI].if=function(t,e,n,i){var a=$(document.createDocumentFragment()),o=$.template.createPlaceholder(),s=$.template.createPlaceholder();a.append(o,s);var r=null,p=[],l=!0,m=new function(){};return m.fill=function(e){var a={};return $.async.all(["test","-animation","-animation-in","-animation-out","-easing","-easing-in","-easing-out","-duration","-duration-in","-duration-out"],function(o){$.template.getAttribute(t,o,e,n,i).then(function(t){a[o.replace(/^\-/,"")]=t,this.next()}).pipe(this)}).then(function(){var m=!!a.test;if(m!==r){r=m,p=[];var c=$(o).parent().between(o,s),h=c.clone().unshift(o).push(s),u=$.template.createAnimationNodes(t,h,n,l);if(!m){var f=$.dom.getCollapsedMargins(h),d=$("<div>").addFeatures("template-margin-placeholder").style({"margin-left":f.left+"px","margin-top":f.top+"px",display:u.property("templateDisplay")}).text("　");u.property("templateSnapshotNode").prepend(d)}c.detach();var g=u.property("templateAnimation");!$.is.nil(a["animation-in"])&&m?g=a["animation-in"]:$.is.nil(a["animation-out"])||m?$.is.nil(a.animation)||(g=a.animation):g=a["animation-out"];var x=u.property("templateAnimationDuration");!$.is.nil(a["duration-in"])&&m?x=parseInt(a["duration-in"]):$.is.nil(a["duration-out"])||m?$.is.nil(a.duration)||(x=parseInt(a.duration)):x=parseInt(a["duration-out"]),isFinite(x)||(x=u.property("templateAnimationDuration"));var y=u.property("templateAnimationEasing");!$.is.nil(a["easing-in"])&&m?y=a["easing-in"]:$.is.nil(a["easing-out"])||m?$.is.nil(a.easing)?!$.is.nil(u.property("templateAnimationEasingIn"))&&m?y=u.property("templateAnimationEasingIn"):$.is.nil(u.property("templateAnimationEasingOut"))||m||(y=u.property("templateAnimationEasingOut")):y=a.easing:y=a["easing-out"],u.properties("templateAnimationEasing",y),u.properties("templateAnimationEasingIn",y),u.properties("templateAnimationEasingOut",y);var A=n.animations[g];A||(A=$.template.animations[g]);var v=[],E=A(x,u,function(){return m?$.async.all($(t).children(),function(t){$.template.templateNode(t,e,n,i).then(function(t,e,n){t&&$(s).parent().insert(t,s),e&&($.is(e,Array)||(e=[e]),e.forEach(function(t){p.push(t)})),n&&$(n).forEach(function(t){v.push(t)}),this.next()}).pipe(this)}).then(function(){$.template.archiveAnimationNodes(u),$.template.updateAnimationNodesDisplay(u),this.next()}):($.template.archiveAnimationNodes(u),$.async.resolve())},n).then(function(){$.template.detachAnimationNodes(u),this.next()}).rejected(function(t){$.template.detachAnimationNodes(u)});v.push(E),this.next(v)}else{v=[];$.async.all(p,function(t){var n=this;t.fill(e).then(function(t){$.is.nil(t)||$(t).forEach(function(t){v.push(t)}),this.next(),n.next()}).rejected(function(t){n.reject(t)})}).then(function(){this.next(v)}).pipe(this)}}).then(function(t){l=!1,this.next(t)})},$.async(function(){m.fill(e).pipe(this)}).then(function(t){$.template.trimNodeWhitespaces(a.first()),this.next(a.children(),m,t)})},$.template.tags[$.template.namespaceURI].map=function(t,e,n,i){var a=$(document.createDocumentFragment()),o=$.template.createPlaceholder(),s=$.template.createPlaceholder(),r=[];r.ids={};var p=!0;a.append(o,s);var l=new function(){};return l.fill=function(e){var a={},l=[];return l.ids={},$.async.all(["list","filter","-sort-field","-sort-order","-sort-type","-index-name","-item-name","-list-name","-item-animation","-item-animation-in","-item-animation-out","-item-easing","-item-easing-in","-item-easing-out","-item-duration","-item-duration-in","-item-duration-out"],function(o){$.template.getAttribute(t,o,e,n,i).then(function(t){a[o.replace(/^\-/,"")]=t,this.next()}).pipe(this)}).then(function(){if($.as.possible(a.list,"array-like")){var m=$(o).parent().between(o,s),c=$.dom.getCollapsedMargins(m),h=$("<div>").addFeatures("template-margin-placeholder").style({"margin-left":c.left+"px","margin-top":c.top+"px",display:$.template.getAnimationDisplay($(t),m)}).text("　"),u=a.list.slice(0);if(a["sort-field"]){var f=a["sort-type"];f||(f="insensitive-natural"),u.sort($.comparator(a["sort-field"],f)),"desc"===a["sort-order"]&&u.reverse()}$.async.all(u,function(o,s){l[s]={item:o,parameters:$.template.createSandbox(e,{})},a["item-name"]&&(l[s].parameters[a["item-name"]]=u[s]),a["index-name"]&&(l[s].parameters[a["index-name"]]=s),a["list-name"]&&(l[s].parameters[a["list-name"]]=u),$(t).attribute("id-getter")?$.template.getAttribute(t,"id-getter",l[s].parameters,n,i).then(function(t){var e=t.call("",null,l[s].parameters,n);if(!$.is.nil(e)){if(l.ids.hasOwnProperty(e))return void this.reject(new Error("Duplicated ID has been found"));l[s].id=e,l.ids[e]=s,l[s].hasOwnProperty("id")&&r.ids.hasOwnProperty(l[s].id)&&(l[s].lastIndex=r.ids[l[s].id],r[l[s].lastIndex].kept=!0)}this.next()}).pipe(this):this.next()}).then(function(){var e=[];r.forEach(function(t){var e=$(t.startPlaceholder).parent().between(t.startPlaceholder,t.endPlaceholder);t.offset=e.offset();var n=e.parent().first();n&&(t.size={width:n.clientWidth,height:n.clientHeight}),t.margins=$.dom.getCollapsedMargins(e,$(o).parent())});var s=[],m=l.length+r.length,c=function(t){s.push(t),s.length===m&&(l.forEach(function(t){var e=$(t.startPlaceholder).parent().between(t.startPlaceholder,t.endPlaceholder);t.offset=e.offset();var n=e.parent().first();n&&(t.size={width:n.clientWidth,height:n.clientHeight}),t.margins=$.dom.getCollapsedMargins(e,$(o).parent())}),$(o).parent().insert(h,$(o).next()),s.forEach(function(t){t()}))},u=[],f=function(t){u.push(t),u.length===m&&(h.detach(),u.forEach(function(t){t()}))},d=$.template.createPlaceholder();$(o).parent().insert(d,$(o).next()),$.async.all(l,function(o,s){if(o.hasOwnProperty("lastIndex")){--m;var l=r[o.lastIndex],h=l.startPlaceholder,u=l.endPlaceholder;o.startPlaceholder=h,o.endPlaceholder=u,o.fillers=l.fillers;g=$(h).parent().between(h,u).clone().unshift(h).push(u);$(d).parent().insert(g,d),(x=$.template.createAnimationNodes(t,g,n,p)).properties("templateSnapshotNode").lifted().children().detach(),e.push($.async(function(){c(this.next)}).then(function(){$.template.archiveAnimationNodes(x);var t=this;x.addFeatures("template-position-absolute"),x.removeFeatures("template-animation-"+x.property("templateAnimation")),x.addFeatures("template-animation-map-item-adjustment");var e={"margin-left":"-"+l.margins.left+"px","margin-top":"-"+l.margins.top+"px"};if(isFinite(l.offset.x)&&(e.left=l.offset.x+"px"),isFinite(l.offset.y)&&(e.top=l.offset.y+"px"),isFinite(l.size.width)&&(e.width=l.size.width+"px"),isFinite(l.size.height)&&(e.height=l.size.height+"px"),(o.offset.x!==l.offset.x||o.offset.y!==l.offset.y||o.margins.left!==l.margins.left||o.margins.top!==l.margins.top)&&isFinite(o.offset.x)&&isFinite(o.offset.y)&&isFinite(l.offset.x)&&isFinite(l.offset.y)){var n={"margin-left":"-"+o.margins.left+"px","margin-top":"-"+o.margins.top+"px"};isFinite(o.offset.x)&&(n.left=o.offset.x+"px"),isFinite(o.offset.y)&&(n.top=o.offset.y+"px"),isFinite(o.size.width)&&(n.width=o.size.width+"px"),isFinite(o.size.height)&&(n.height=o.size.height+"px"),x.properties("templateContentNode").lifted().style(e).animate(n,{duration:x.property("templateAnimationDuration")}).then(function(e){t.next(),this.next()})}else x.properties("templateContentNode").lifted().style(e),"none"===x.property("templateAnimation")?this.next():$.delay(x.property("templateAnimationDuration"),this.next)}).then(function(){f(this.next)}).then(function(){$.template.detachAnimationNodes(x),this.next()}).rejected(function(t){f(function(){$.template.detachAnimationNodes(x)})})),$.async.all(o.fillers,function(t){t.fill(o.parameters).then(function(t){t&&$(t).forEach(function(t){e.push(t)}),this.next()}).pipe(this)}).pipe(this)}else{var h=$.template.createPlaceholder(),u=$.template.createPlaceholder(),g=$(h,u);$(d).parent().insert(g,d),o.startPlaceholder=h,o.endPlaceholder=u,o.fillers=[];var x=$.template.createAnimationNodes(t,g,n,p),y=x.property("templateAnimation");$.is.nil(a["item-animation-in"])?$.is.nil(a["item-animation"])||(y=a["item-animation"]):y=a["item-animation-in"];var A=x.property("templateAnimationDuration");$.is.nil(a["item-duration-in"])?$.is.nil(a["item-duration"])||(A=parseInt(a["item-duration"])):A=parseInt(a["item-duration-in"]),isFinite(A)||(A=x.property("templateAnimationDuration"));var v=x.property("templateAnimationEasing");$.is.nil(a["item-easing-in"])?$.is.nil(a["item-easing"])?$.is.nil(x.property("templateAnimationEasingIn"))||(v=x.property("templateAnimationEasingIn")):v=a["item-easing"]:v=a["item-easing-in"],x.properties("templateAnimationEasing",v),x.properties("templateAnimationEasingIn",v),x.properties("templateAnimationEasingOut",v);var E=n.animations[y];E||(E=$.template.animations[y]),e.push(E(A,x,function(){return $.async.all($(t).children(),function(t){$.template.templateNode(t,o.parameters,n,i).then(function(t,n,i){t&&$(u).parent().insert(t,u),n&&($.is(n,Array)||(n=[n]),n.forEach(function(t){o.fillers.push(t)})),i&&$(i).forEach(function(t){e.push(t)}),this.next()}).pipe(this)}).then(function(){$.template.updateAnimationNodesDisplay(x),this.next()}).then(function(){c(this.next)}).then(function(){if($.template.archiveAnimationNodes(x),isFinite(o.offset.x)&&isFinite(o.offset.y)){x.addFeatures("template-position-absolute"),x.removeFeatures("template-animation-"+x.property("templateAnimation")),x.addFeatures("template-animation-map-item-adjustment");var t={"margin-left":"-"+o.margins.left+"px","margin-top":"-"+o.margins.top+"px"};isFinite(o.offset.x)&&(t.left=o.offset.x+"px"),isFinite(o.offset.y)&&(t.top=o.offset.y+"px"),isFinite(o.size.width)&&(t.width=o.size.width+"px"),isFinite(o.size.height)&&(t.height=o.size.height+"px"),x.style(t)}this.next()})},n).then(function(){f(this.next)}).then(function(){$.template.detachAnimationNodes(x),this.next()}).rejected(function(t){f(function(){$.template.detachAnimationNodes(x)})})),this.next()}}).all(r,function(i,o){if(!i.kept){var s=i.startPlaceholder,r=i.endPlaceholder,l=$(s).parent().between(s,r).clone().unshift(s).push(r),m=$.template.createAnimationNodes(t,l,n,p);l.detach();var h=m.property("templateAnimation");$.is.nil(a["item-animation-out"])?$.is.nil(a["item-animation"])||(h=a["item-animation"]):h=a["item-animation-out"];var u=m.property("templateAnimationDuration");$.is.nil(a["item-duration-out"])?$.is.nil(a["item-duration"])||(u=parseInt(a["item-duration"])):u=parseInt(a["item-duration-out"]),isFinite(u)||(u=m.property("templateAnimationDuration"));var d=m.property("templateAnimationEasing");$.is.nil(a["item-easing-out"])?$.is.nil(a["item-easing"])?$.is.nil(m.property("templateAnimationEasingOut"))||(d=m.property("templateAnimationEasingOut")):d=a["item-easing"]:d=a["item-easing-out"],m.properties("templateAnimationEasing",d),m.properties("templateAnimationEasingIn",d),m.properties("templateAnimationEasingOut",d);var g=n.animations[h];g||(g=$.template.animations[h]),e.push(g(u,m,function(){return $.async(function(){c(this.next)}).then(function(){$.template.archiveAnimationNodes(m),m.addFeatures("template-position-absolute"),m.removeFeatures("template-animation-"+m.property("templateAnimation")),m.addFeatures("template-animation-map-item-adjustment");var t={"margin-left":"-"+i.margins.left+"px","margin-top":"-"+i.margins.top+"px"};isFinite(i.offset.x)&&(t.left=i.offset.x+"px"),isFinite(i.offset.y)&&(t.top=i.offset.y+"px"),isFinite(i.size.width)&&(t.width=i.size.width+"px"),isFinite(i.size.height)&&(t.height=i.size.height+"px"),m.style(t),this.next()})},n).then(function(){f(this.next)}).then(function(){$.template.detachAnimationNodes(m),this.next()}).rejected(function(t){f(function(){$.template.detachAnimationNodes(m)})}))}this.next()}).then(function(){$(d).detach(),this.next(e)}).pipe(this)}).pipe(this)}else this.reject(new Error("Invalid list to map template, it should be array-like"))}).then(function(t){p=!1,r=l,this.next(t)})},$.async(function(){l.fill(e).pipe(this)}).then(function(t){$.template.trimNodeWhitespaces(a.first()),this.next(a.children(),l,t)})},$.template.tags[$.template.namespaceURI].switch=function(t,e,n,i){var a=$(t).children().filter(function(t){return t.nodeType===Node.ELEMENT_NODE&&t.namespaceURI===$.template.namespaceURI&&"case"===(t.localName||t.baseName)}),o=$(document.createDocumentFragment()),s=$.template.createPlaceholder(),r=$.template.createPlaceholder();o.append(s,r);var p=null,l=[],m=!0,c=new function(){};return c.fill=function(e){var o={},c=null,h=null;return $.async.all(["-animation","-easing","-duration"],function(a){$.template.getAttribute(t,a,e,n,i).then(function(t){o[a.replace(/^\-/,"")]=t,this.next()}).pipe(this)}).then(function(){$.is.nil($(t).attribute("condition"))?(c=!0,this.next()):$.template.getAttribute(t,"condition",e,n,i).then(function(t){c=t,this.next()}).pipe(this)}).all(a,function(t,a){h?this.next():$(t).attribute("value")?$.template.getAttribute(t,"value",e,n,i).then(function(e){e===c&&(h=t),this.next()}).pipe(this):(h=t,this.next())}).then(function(){if(p!==h){p=h,l=[];var t=$(s).parent().between(s,r),a=t.clone().unshift(s).push(r),c=$.template.createAnimationNodes(h,a,n,m);t.detach();var u=c.property("templateAnimation");$.is.nil(o["item-animation-in"])?$.is.nil(o["item-animation"])||(u=o["item-animation"]):u=o["item-animation-in"];var f=c.property("templateAnimationDuration");$.is.nil(o["item-duration-in"])?$.is.nil(o["item-duration"])||(f=parseInt(o["item-duration"])):f=parseInt(o["item-duration-in"]),isFinite(f)||(f=c.property("templateAnimationDuration"));var d=c.property("templateAnimationEasing");$.is.nil(o["item-easing-in"])?$.is.nil(o["item-easing"])?$.is.nil(c.property("templateAnimationEasingIn"))||(d=c.property("templateAnimationEasingIn")):d=o["item-easing"]:d=o["item-easing-in"],c.properties("templateAnimationEasing",d),c.properties("templateAnimationEasingIn",d),c.properties("templateAnimationEasingOut",d);var g=n.animations[u];g||(g=$.template.animations[u]);var x=[],y=g(f,c,function(){return $.async.all($(h).children(),function(t){$.template.templateNode(t,e,n,i).then(function(t,e,n){t&&$(r).parent().insert(t,r),e&&($.is(e,Array)||(e=[e]),e.forEach(function(t){l.push(t)})),n&&$(n).forEach(function(t){x.push(t)}),this.next()}).pipe(this)}).then(function(){$.template.archiveAnimationNodes(c),$.template.updateAnimationNodesDisplay(c),this.next()})},n).then(function(){$.template.detachAnimationNodes(c),this.next()}).rejected(function(t){$.template.detachAnimationNodes(c)});x.push(y),this.next(x)}else{x=[];$.async.all(l,function(t){var n=this;t.fill(e).then(function(t){$.is.nil(t)||$(t).forEach(function(t){x.push(t)}),this.next(),n.next()}).rejected(function(t){n.reject(t)})}).then(function(){this.next(x)}).pipe(this)}}).then(function(t){m=!1,this.next(t)})},$.async(function(){c.fill(e).pipe(this)}).then(function(t){$.template.trimNodeWhitespaces(o.first()),this.next(o.children(),c,t)})},$.template.tags[$.template.namespaceURI].html=function(t,e,n,i){var a=$(document.createDocumentFragment()),o=$.template.createPlaceholder(),s=$.template.createPlaceholder();a.append(o,s);var r=null,p=!0,l=new function(){};return l.fill=function(e){var a={};return $.async.all(["content","-animation","-easing","-duration"],function(o){$.template.getAttribute(t,o,e,n,i).then(function(t){a[o.replace(/^\-/,"")]=t,this.next()}).pipe(this)}).then(function(){if(r!=a.content){r=a.content;var e=$(o).parent().between(o,s),i=e.clone().unshift(o).push(s),l=$.template.createAnimationNodes(t,i,n,p);e.detach();var m=l.property("templateAnimation");$.is.nil(a.animation)||(m=a.animation);var c=l.property("templateAnimationDuration");$.is.nil(a.duration)||(c=parseInt(a.duration)),isFinite(c)||(c=l.property("templateAnimationDuration"));var h=l.property("templateAnimationEasing");$.is.nil(a.easing)||(h=a.easing),l.properties("templateAnimationEasing",h),l.properties("templateAnimationEasingIn",h),l.properties("templateAnimationEasingOut",h);var u=n.animations[m];u||(u=$.template.animations[m]);var f=u(c,l,function(){return $.async(function(){$.is.nil(a.content)||$(s).parent().insert($.parse("html",a.content),s),$.template.archiveAnimationNodes(l),$.template.updateAnimationNodesDisplay(l),this.next()})},n).then(function(){$.template.detachAnimationNodes(l),this.next()}).rejected(function(t){$.template.detachAnimationNodes(l)});this.next(f)}else this.next()}).then(function(t){p=!1,this.next(t)})},$.async(function(){l.fill(e).pipe(this)}).then(function(t){$.template.trimNodeWhitespaces(a.first()),this.next(a.children(),l,t)})},$.template.tags[$.template.namespaceURI].script=function(t,e,n,i){var a=$(t).text(),o=new function(){};return o.fill=function(t){i.calls.hasOwnProperty(a)||(i.calls[a]=$.format.compile(a,n));var e=null;try{$.format.run(a,i.calls[a],t,n)}catch(t){e=t}return e?$.async.reject(e):$.async.resolve()},$.async(function(){o.fill(e).pipe(this)}).then(function(){this.next([],o)})},$.template.tags[$.template.namespaceURI].template=function(t,e,n,i){return $.async(function(){$.template.getAttribute(t,"-name",e,n,i).then(function(e){i.templates.hasOwnProperty(e)?this.reject(new Error("Duplicated template "+e+" has been registered")):(i.templates[e]=t,this.next())}).pipe(this)})},$.template.tags[$.template.namespaceURI].apply=function(t,e,n,i){var a=$(document.createDocumentFragment()),o=$.template.createPlaceholder(),s=$.template.createPlaceholder();a.append(o,s);var r=[],p=!0,l=null,m=new function(){};return m.fill=function(e){var a={},m=$.template.createSandbox(e,{});return $.async.all($(t).attribute(),function(a){$.is.nil(a.namespaceURI)&&"data-"===a.localName.substring(0,5)?$.template.getAttribute(t,a.localName,e,n,i).then(function(t){m[a.localName.slice(5)]=t,this.next()}).pipe(this):this.next()}).all(["-template","-animation","-easing","-duration"],function(o){$.template.getAttribute(t,o,e,n,i).then(function(t){a[o.replace(/^\-/,"")]=t,this.next()}).pipe(this)}).then(function(){var e=i.templates[a.template];if(p||e!==l){p=!0,l=e,r=[];var c=$(o).parent().between(o,s),h=c.clone().unshift(o).push(s),u=$.template.createAnimationNodes(t,h,n,p);c.detach();var f=u.property("templateAnimation");$.is.nil(a.animation)||(f=a.animation);var d=u.property("templateAnimationDuration");$.is.nil(a.duration)||(d=parseInt(a.duration)),isFinite(d)||(d=u.property("templateAnimationDuration"));var g=u.property("templateAnimationEasing");$.is.nil(a.easing)||(g=a.easing),u.properties("templateAnimationEasing",g),u.properties("templateAnimationEasingIn",g),u.properties("templateAnimationEasingOut",g);var x=n.animations[f];x||(x=$.template.animations[f]);var y=[],A=x(d,u,function(){return $.async.all($(e).children(),function(t){$.template.templateNode(t,m,n,i).then(function(t,e,n){t&&$(s).parent().insert(t,s),e&&($.is(e,Array)||(e=[e]),e.forEach(function(t){r.push(t)})),n&&$(n).forEach(function(t){y.push(t)}),this.next()}).pipe(this)}).then(function(){$.template.archiveAnimationNodes(u),$.template.updateAnimationNodesDisplay(u),this.next()})},n).then(function(){$.template.detachAnimationNodes(u),this.next()}).rejected(function(t){$.template.detachAnimationNodes(u)});y.push(A),this.next(y)}else{y=[];$.async.all(r,function(t){var e=this;t.fill(m).then(function(t){$.is.nil(t)||$(t).forEach(function(t){y.push(t)}),this.next(),e.next()}).rejected(function(t){e.reject(t)})}).then(function(){this.next(y)}).pipe(this)}}).then(function(t){p=!1,this.next(t)})},$.async(function(){m.fill(e).pipe(this)}).then(function(t){$.template.trimNodeWhitespaces(a.first()),this.next(a.children(),m,t)})},$.template.tags[$.template.namespaceURI].include=function(e,n,i,a){var o=$(document.createDocumentFragment()),s=$.template.createPlaceholder(),r=$.template.createPlaceholder();o.append(s,r);var p=[],l=!0,m=null,c=new function(){};return c.fill=function(n){var o={},c=$.template.createSandbox(n,{});return $.async.all($(e).attribute(),function(t){$.is.nil(t.namespaceURI)&&"data-"===t.localName.substring(0,5)?$.template.getAttribute(e,t.localName,n,i,a).then(function(e){c[t.localName.slice(5)]=e,this.next()}).pipe(this):this.next()}).all(["-name","-animation","-easing","-duration","-css","-xhtml","-js","-json"],function(t){$.template.getAttribute(e,t,n,i,a).then(function(e){o[t.replace(/^\-/,"")]=e,this.next()}).pipe(this)}).then(function(){var t=function(t){return i.templateFile&&!/^[a-z\-]+:\/\//.test(t)&&"/"!==t.charAt(0)&&(t=(i.templateFile.split("/").slice(0,-1).join("/")+t).replace(/\/\.\//g,"/").replace(/\/[^\/]+\/\.\.\//g,"/")),/^[a-z\-]+:\/\//.test(t)||(t=(document.URL.split("#")[0].split("?")[0].split("/").slice(0,-1).join("/")+t).replace(/\/\.\//g,"/").replace(/\/[^\/]+\/\.\.\//g,"/")),t};if(o.name=t(o.name),!a.externals.hasOwnProperty(o.name)){var e={xhtml:o.xhtml,js:o.js,css:o.css};i.inclusionResolver&&(e=i.inclusionResolver(e)),e.xhtml||(e.xhtml=o.name+"/index.xhtml"),e.css||(e.css=o.name+"/style.css"),a.externals[o.name]=e}(e=a.externals[o.name]).js?$.require(t(e.js),function(t,n){t?this.reject(t):(e.tags=n.tags,e.animations=n.animations,this.next(e))}.bind(this),{}):this.next(e)}).then(function(e){var n=[];e.hasOwnProperty("template")||n.push(e.xhtml),t.hasOwnProperty(e.css)||n.push(e.css),n.length>0?$.resources.load(n,function(a,o){a?this.reject(a):(-1===n.indexOf(e.css)||t.hasOwnProperty(e.css)||(t[e.css]=$("<style>").attribute({src:e.css,type:"text/css"}),t[e.css].html(o[e.css].content),$("head").append(t[e.css])),-1===n.indexOf(e.xhtml)||e.hasOwnProperty("template")||(e.template=$.parse("xml",o[e.xhtml].content,{predefinedNamespaces:i.predefinedXMLNamespaces})),this.next(e))}.bind(this)):this.next(e)}).then(function(t){if(l||t.template!==m){l=!0,m=t.template,p=[];var n=$(s).parent().between(s,r),h=n.clone().unshift(s).push(r),u=$.template.createAnimationNodes(e,h,i,l);n.detach();var f=u.property("templateAnimation");$.is.nil(o.animation)||(f=o.animation);var d=u.property("templateAnimationDuration");$.is.nil(o.duration)||(d=parseInt(o.duration)),isFinite(d)||(d=u.property("templateAnimationDuration"));var g=u.property("templateAnimationEasing");$.is.nil(o.easing)||(g=o.easing),u.properties("templateAnimationEasing",g),u.properties("templateAnimationEasingIn",g),u.properties("templateAnimationEasingOut",g);var x=i.animations[f];x||(x=$.template.animations[f]);var y=[],A=x(d,u,function(){return $.async.all($(t.template).children(),function(t){$.template.templateNode(t,c,i,a).then(function(t,e,n){t&&$(r).parent().insert(t,r),e&&($.is(e,Array)||(e=[e]),e.forEach(function(t){p.push(t)})),n&&$(n).forEach(function(t){y.push(t)}),this.next()}).pipe(this)}).then(function(){$.template.archiveAnimationNodes(u),$.template.updateAnimationNodesDisplay(u),this.next()})},i).then(function(){$.template.detachAnimationNodes(u),this.next()}).rejected(function(t){$.template.detachAnimationNodes(u)});y.push(A),this.next(y)}else{y=[];$.async.all(p,function(t){var e=this;t.fill(c).then(function(t){$.is.nil(t)||$(t).forEach(function(t){y.push(t)}),this.next(),e.next()}).rejected(function(t){e.reject(t)})}).then(function(){this.next(y)}).pipe(this)}}).then(function(t){l=!1,this.next(t)})},$.async(function(){c.fill(n).pipe(this)}).then(function(t){$.template.trimNodeWhitespaces(o.first()),this.next(o.children(),c,t)})},$.template.tags[$.template.namespaceURI].outlet=function(t,e,n,i){var a=$(document.createDocumentFragment()),o=$.template.createPlaceholder(),s=$.template.createPlaceholder();a.append(o,s);var r=[],p=null,l=!0,m=new function(){};return m.fill=function(e){var a={},m=$.template.createSandbox(e,{});return $.async.all($(t).attribute(),function(a){$.is.nil(a.namespaceURI)&&"data-"===a.localName.substring(0,5)?$.template.getAttribute(t,a.localName,e,n,i).then(function(t){m[a.localName.slice(5)]=t,this.next()}).pipe(this):this.next()}).all(["-name","-animation","-easing","-duration"],function(o){$.template.getAttribute(t,o,e,n,i).then(function(t){a[o.replace(/^\-/,"")]=t,this.next()}).pipe(this)}).then(function(){if(l||p!==a.name){l=!0,r=[],p=a.name;var e=$(o).parent().between(o,s),c=e.clone().unshift(o).push(s),h=$.template.createAnimationNodes(t,c,n,l);e.detach();var u=h.property("templateAnimation");$.is.nil(a.animation)||(u=a.animation);var f=h.property("templateAnimationDuration");$.is.nil(a.duration)||(f=parseInt(a.duration)),isFinite(f)||(f=h.property("templateAnimationDuration"));var d=h.property("templateAnimationEasing");$.is.nil(a.easing)||(d=a.easing),h.properties("templateAnimationEasing",d),h.properties("templateAnimationEasingIn",d),h.properties("templateAnimationEasingOut",d);var g=n.animations[u];g||(g=$.template.animations[u]);var x=[],y=g(f,h,function(){return $.async(function(){n.outlets.hasOwnProperty(a.name)?n.outlets[a.name](t,m,n,i).then(function(t,e,n){t&&$(s).parent().insert(t,s),e&&($.is(e,Array)||(e=[e]),e.forEach(function(t){r.push(t)})),n&&$(n).forEach(function(t){x.push(t)}),this.next()}).pipe(this):this.reject(new Error("Outlet "+a.name+" not found"))}).then(function(){$.template.archiveAnimationNodes(h),$.template.updateAnimationNodesDisplay(h),this.next()})},n).then(function(){$.template.detachAnimationNodes(h),this.next()}).rejected(function(t){$.template.detachAnimationNodes(h)});x.push(y),this.next(x)}else{x=[];$.async.all(r,function(t){var e=this;t.fill(m).then(function(t){$.is.nil(t)||$(t).forEach(function(t){x.push(t)}),this.next(),e.next()}).rejected(function(t){e.reject(t)})}).then(function(){this.next(x)}).pipe(this)}}).then(function(t){l=!1,this.next(t)})},$.async(function(){m.fill(e).pipe(this)}).then(function(t){$.template.trimNodeWhitespaces(a.first()),this.next(a.children(),m,t)})},$.template.tags[$.template.namespaceURI].sandbox=function(t,e,n,i){var a=$(document.createDocumentFragment()),o=$.template.createPlaceholder(),s=$.template.createPlaceholder();a.append(o,s);var r=[],p=!0,l=new function(){};return l.fill=function(e){$.template.createSandbox(e,{});var a={};return $.async.all(["-animation","-easing","-duration"],function(o){$.template.getAttribute(t,o,e,n,i).then(function(t){a[o.replace(/^\-/,"")]=t,this.next()}).pipe(this)}).then(function(){if(p){r=[];var l=$(o).parent().between(o,s),m=l.clone().unshift(o).push(s),c=$.template.createAnimationNodes(t,m,n,p);l.detach();var h=c.property("templateAnimation");!$.is.nil(a["animation-in"])&&condition?h=a["animation-in"]:$.is.nil(a["animation-out"])||condition?$.is.nil(a.animation)||(h=a.animation):h=a["animation-out"];var u=c.property("templateAnimationDuration");!$.is.nil(a["duration-in"])&&condition?u=parseInt(a["duration-in"]):$.is.nil(a["duration-out"])||condition?$.is.nil(a.duration)||(u=parseInt(a.duration)):u=parseInt(a["duration-out"]),isFinite(u)||(u=c.property("templateAnimationDuration"));var f=c.property("templateAnimationEasing");!$.is.nil(a["easing-in"])&&condition?f=a["easing-in"]:$.is.nil(a["easing-out"])||condition?$.is.nil(a.easing)?!$.is.nil(c.property("templateAnimationEasingIn"))&&condition?f=c.property("templateAnimationEasingIn"):$.is.nil(c.property("templateAnimationEasingOut"))||condition||(f=c.property("templateAnimationEasingOut")):f=a.easing:f=a["easing-out"],c.properties("templateAnimationEasing",f),c.properties("templateAnimationEasingIn",f),c.properties("templateAnimationEasingOut",f);var d=n.animations[h];d||(d=$.template.animations[h]);var g=[],x=d(u,c,function(){return $.async.all($(t).children(),function(t){$.template.templateNode(t,e,n,i).then(function(t,e,n){t&&$(s).parent().insert(t,s),e&&($.is(e,Array)||(e=[e]),e.forEach(function(t){r.push(t)})),n&&$(n).forEach(function(t){g.push(t)}),this.next()}).pipe(this)}).then(function(){$.template.archiveAnimationNodes(c),$.template.updateAnimationNodesDisplay(c),this.next()})},n).then(function(){$.template.detachAnimationNodes(c),this.next()}).rejected(function(t){$.template.detachAnimationNodes(c)});g.push(x),this.next(g)}else{g=[];$.async.all(r,function(t){var n=this;t.fill(e).then(function(t){$.is.nil(t)||$(t).forEach(function(t){g.push(t)}),this.next(),n.next()}).rejected(function(t){n.reject(t)})}).then(function(){this.next(g)}).pipe(this)}}).then(function(t){p=!1,this.next(t)})},$.async(function(){l.fill(e).pipe(this)}).then(function(t){$.template.trimNodeWhitespaces(a.first()),this.next(a.children(),l,t)})}});