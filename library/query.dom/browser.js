$(function(){var e=$("<div>").style({width:"10000pt",height:"10000mm","pointer-events":"none",position:"absolute"});$(document.body).append(e);parseFloat(e.style("width"));var r=parseFloat(e.style("height"))/1e4;e.detach();var o=0;if(window.matchMedia)for(var t=.01;t<8;)window.matchMedia("(min-resolution: "+t+"dppx)").matches&&(o=t),window.matchMedia("(-webkit-min-resolution: "+t+"dppx)").matches&&(o=t),window.matchMedia("(min-device-pixel-ratio: "+t+")").matches&&(o=t),window.matchMedia("(-webkit-min-device-pixel-ratio: "+t+")").matches&&(o=t),t+=.01;else o=1;o=parseFloat(o.toFixed(5));var a=Math.min(window.screen.width,window.screen.height)/r,i=!0;try{document.createEvent("TouchEvent")}catch(e){i=!1}var n=$(document.body),d=navigator.userAgent.toLowerCase(),s=-1!==d.indexOf("mewgarden"),w=-1!==d.indexOf("micromessenger"),u=/(ipad|iphone|ipod)/g.test(d),m=-1!==d.indexOf("android"),c=-1!==d.indexOf("windows"),l=-1!==d.indexOf("linux"),b=-1!==d.indexOf("macintosh"),f=/ipad/g.test(d),h=/(iphone|ipod)/g.test(d),p=-1!==d.indexOf("chrome"),x=-1!==d.indexOf("msie")||-1!==d.indexOf("trident"),g=-1!==d.indexOf("edge"),y=-1!==d.indexOf("firefox"),v=u||-1!==d.indexOf("safari"),O=-1!==d.indexOf("presto");p&&(v=!1),(x||g)&&(p=!1,v=!1),(m||-1!==d.indexOf("mobile"))&&(a>120?(f=!0,h=!1):(f=!1,h=!0)),$.browser=p||m?{name:"chrome",layout:"blink"}:x?{name:"msie",layout:"trident"}:g?{name:"edge",layout:"trident"}:y?{name:"firefox",layout:"trident"}:v?{name:"safari",layout:"webkit"}:O?{name:"opera",layout:"presto"}:{name:"unknown",layout:"unknown"},$.browser.touchable=i,$.browser.garden=s?"mew":w?"wechat":"wild",$.browser.system=u?"ios":m?"android":c?"windows":l?"linux":b?"osx":"unknown",$.browser.ui=f?"tablet":h?"mobile":"desktop";try{$.browser.framed=window!==window.top}catch(e){$.browser.framed=!0}$.browser.realPixelate=o,$.browser.pixelate=Math.round(o),Object.defineProperty($.browser,"focused",{get:function(){return document.hasFocus()}}),$.browser.framed&&n.addFeatures("page-framed"),$.browser.touchable&&n.addFeatures("screen-touchable"),$.browser.garden&&n.addFeatures("garden-"+$.browser.garden),n.addFeatures("browser-"+$.browser.name,"system-"+$.browser.system,"layout-"+$.browser.layout,"ui-"+$.browser.ui,"garden-"+$.browser.garden,"pixelate-real-"+$.browser.realPixelate,"pixelate-"+$.browser.pixelate),$.browser.focused&&n.addFeatures("window-focused"),window.addEventListener("focus",function(e){n.addFeatures("window-focused")}),window.addEventListener("blur",function(e){n.removeFeatures("window-focused")})});