var CachePool=require("./cache_pool.js"),prepareMap=function(e,a){e.working=!0,Object.defineProperty(e,"has",{value:a.has.bind(a)}),Object.defineProperty(e,"get",{value:function(e,r,t,n){if(a.has(e))return a.get(e);if(t){var p=t();return a.set(e),p}return null}}),Object.defineProperty(e,"keys",{value:function(){for(var e=[],r=a.keys(),t=r.next();!t.done;)e.push(t.value),t=r.next();return e}}),Object.defineProperty(e,"put",{value:a.set.bind(a)}),Object.defineProperty(e,"remove",{value:a.delete.bind(a)}),Object.defineProperty(e,"fetch",{value:function(r){var t=[];return e.keys().forEach(function(e){var n=a.get(e);r(e,n)&&t.push({id:e,value:n})}),t}}),Object.defineProperty(e,"count",{enumerable:!0,get:function(){return a.size}})},WeakMap=function(){prepareMap(this,new global.WeakMap)},Map=function(){prepareMap(this,new global.Map)},WeakRefMap=function(){prepareMap(this,new global.WeakRefMap)};module.exports={CachePool:CachePool,Map:Map,WeakMap:WeakMap,WeakRefMap:WeakRefMap};