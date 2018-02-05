!function(){var r=global.$;__filename;r(function(){var a=function(){r.require([{path:"/library/node.mew_util/template.js",map:{format:"format"}},{path:"/library/node.mew_util/uuid.js",map:{uuid:"createUUID"}},{path:"/library/node.mew_util/comparator.js",map:{comparator:"generatePathComparator","comparator.number":"numberComparator","comparator.date":"dateComparator","comparator.string":"stringComparator","comparator.natural":"naturalComparator","comparator.natural.insensitive":"insensitiveNaturalComparator"}},{path:"/library/node.mew_util/foundation.js",map:{accelerated:"isAccelerated",is:"isKindOf","is.nil":"isNull",as:"convert","as.possible":"couldBeAcceptedAs",simplify:"simplify",objectize:"objectize",jsonize:"jsonize",keys:"keys",property:"getProperty",index:"getIndex",merge:"merge","merge.advanced":"advancedMerge","merge.simple":"simpleMerge","iterate.array":"iterateArray","iterate.object":"iterateObject","format.date":"formatDate","format.resolve":"matchArguments"}},{path:"/library/node.mew_util/storage.js",map:{}},{path:"/library/node.mew_util/home.js",map:{}},{path:"/library/node.mew_util/logger.js",map:{}},{path:"/library/node.mew_util/async.js",map:{async:""}},{path:"/library/node.mew_util/lock.js",map:{lock:"lock"}},{path:"/library/node.mew_util/timer.js",map:{delay:"delay",schedule:"schedule",plan:"plan",timer:"timer"}},{path:"/library/node.mew_util/memory/cache_pool.js",map:{}},{path:"/library/node.mew_util/memory/dict.js",map:{}},{path:"/library/node.mew_util/memory/json.js",map:{}},{path:"/library/node.mew_util/memory/kv.js",map:{}},{path:"/library/node.mew_util/hash.js",map:{}},{path:"/library/node.mew_util/memory.js",map:{}},{path:"/library/node.mew_util/mimes.js",map:{}},{path:"/library/node.mew_util/os.js",map:{}},{path:"/library/node.mew_util/ruler.js",map:{}},{path:"/library/node.mew_util/index.js",map:{}},"/library/query.extension/foundation.js","/library/query.extension/logger.js","/library/query.extension/memory.js","/library/query.extension/dom3.js","/library/query.dom/foundation.js","/library/query.dom/browser.js","/library/query.dom/interpolation.js","/library/query.dom/position.js","/library/query.dom/animation.js","/library/query.dom/reinit.js","/library/query.command/foundation.js","/library/query.command/dom.js","/library/query.command/keyboard.js","/library/query.command/placeholder.js","/library/ui.template/foundation.js","/library/ui.template/animation.js","/library/ui.template/html.js","/library/ui.template/logical.js","/library/ui.gesture/gesture.js","/library/ui.gesture/placeholder.js","/library/ui.activity/selection.js","/library/ui.activity/garden.js","/library/ui.activity/local.js","/library/ui.activity/list.js","/library/ui.activity/clipboard.js","/library/ui.activity/requestor.js",{path:"/library/ui.kitty/agent.js",map:{}},{path:"/library/ui.kitty/browser.js",map:{}},{path:"/library/ui.kitty/content.js",map:{}},{path:"/library/ui.kitty/kitty.js",map:{}},{path:"/library/ui.kitty/memory.js",map:{}},{path:"/library/ui.kitty/mew.js",map:{}},{path:"/library/ui.kitty/mewchan.js",map:{}},{path:"/library/ui.kitty/play.js",map:{}},"/library/ui.kitty/query.js","/library/query.space/index.js"],function(a){if(a)throw a;var e=[r.meta("query","starter")];if(!e[0])throw new Error("Starter script not found");r.metas("query.ready","script").forEach(function(r){e.push(r)}),r.require(e.map(function(r){return"."===r[0]?r.slice(1):r}),function(r){if(r)throw r})})},e=r.metas("query.resource","package").map(function(r){return"."===r[0]?require.root+"/"+r:r}),t=function(){e.length>0?r.resources.loadPackage(e.shift(),function(r){if(r)throw r;t()}):a()};let i=r.meta("query","bundle");i?("."===i[0]&&(i=require.root+"/"+i),r.resources.loadBundles(i,function(r){if(r)throw r;t()})):t()})}();