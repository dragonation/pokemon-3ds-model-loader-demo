!function(){if(!window.Node){var e=function(){};e.isFake=!0,e.ELEMENT_NODE=1,e.ATTRIBUTE_NODE=2,e.TEXT_NODE=3,e.CDATA_SECTION_NODE=4,e.ENTITY_REFERENCE_NODE=5,e.ENTITY_NODE=6,e.PROCESSING_INSTRUCTION_NODE=7,e.COMMENT_NODE=8,e.DOCUMENT_NODE=9,e.DOCUMENT_TYPE_NODE=10,e.DOCUMENT_FRAGMENT_NODE=11,e.NOTATION_NODE=12,e.DOCUMENT_POSITION_DISCONNECTED=1,e.DOCUMENT_POSITION_PRECEDING=2,e.DOCUMENT_POSITION_FOLLOWING=4,e.DOCUMENT_POSITION_CONTAINS=8,e.DOCUMENT_POSITION_CONTAINED_BY=16,e.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC=32,window.Node=e}if(!window.Element){var t=function(){};t.isFake=!0,window.Element=t}if(!window.KeyboardEvent){var n=function(){};n.DOM_KEY_LOCATION_STANDARD=0,n.DOM_KEY_LOCATION_LEFT=1,n.DOM_KEY_LOCATION_RIGHT=2,n.DOM_KEY_LOCATION_NUMPAD=3,window.KeyboardEvent=n}if(!window.DOMParser){var o=function(){};o.prototype.parseFromString=function(e,t){var n=new ActiveXObject("Microsoft.XMLDOM");return n.async="false",n.loadXML(e),n},window.DOMParser=o}document.createElementNS||(document.createElementNS=function(e,t){var n=document.createElement(t),o=t.indexOf(":");return-1===o?n.setAttribute("xmlns",e):n.setAttribute("xmlns:"+t.substring(0,o),e),n}),document.getSelection||(document.getSelection=function(){return null});try{var r=document.createStyleSheet(),i=function(e,t){var n=document.all,o=n.length,i=[];r.addRule(e,"foo:bar");for(var c=0;c<o&&i.length<=t;){var u=n[c];"bar"===u.currentStyle.foo&&i.push(u),++c}return r.removeRule(0),i};document.querySelectorAll||(document.querySelectorAll=function(e){return i(e,1/0)}),document.querySelector||(document.querySelector=function(e){return i(e,1)[0]||null}),t.prototype.matches||t.prototype.matchesSelector||t.prototype.webkitMatchesSelector||t.prototype.mozMatchesSelector||t.prototype.msMatchesSelector||(t.prototype.matches=function(e){r.addRule(e,"foo:bar");var t=!1;return"bar"===this.currentStyle.foo&&(t=!0),r.removeRule(0),t})}catch(e){}window.getComputedStyle||(window.getComputedStyle=function(e){var t=e.currentStyle,n={},o=Object.keys(t);return o.forEach(function(e,o){n[e]=t[e];var r=e.replace(/[A-Z]/g,function(e){return"-"+e.toLowerCase()});"ms-"===r.substring(0,3)&&(r="-"+r),n[r]=t[e],n[o]=r}),n.length=o.length,n});var c=Symbol("eventListeners");window.addEventListener||(window.addEventListener=document.addEventListener=function(e,t){var n=this;n[c]||(n[c]=[]),n[c].unshift([n,e,t,function(e){t instanceof Function&&(e.currentTarget=n,e.preventDefault=function(){e.returnValue=!1},e.stopPropagation=function(){e.cancelBubble=!0},e.target=e.srcElement||n,t.call(n,e))}]),this.attachEvent("on"+e,n[c][0][3])}),window.removeEventListener||(window.removeEventListener=document.removeEventListener=function(e,t){if(this[c])for(var n,o=0;n=this[c][o];++o)if(n[0]==this&&n[1]==e&&n[2]==t)return this.detachEvent("on"+e,this[c].splice(o,1)[0][3])}),window.dispatchEvent||(window.dispatchEvent=document.dispatchEvent=function(e){return this.fireEvent("on"+e.type,e)})}();