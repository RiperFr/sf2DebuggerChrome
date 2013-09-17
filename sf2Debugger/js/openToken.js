(function () {


    var createProfilerLink = function (token,target,callback) {
        var matches = token.url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
        var domain = matches && matches[1];
        var url = 'http://' + domain + '/_profiler/' + token.value;
        if(target == null){
            window.getConfigurationKey('defaultPage', function (defaultPage) {
                if(defaultPage !== null){
                    url += '?panel='+defaultPage ;
                }
                callback.apply(this,[url]);
            });
        }else{
            url += '?panel='+target ;
            callback.apply(this,[url]);
        }
    };


    /**
     * Open a new popup/tab with the profiler in it
     * @param token
     */
    var openToken = function (token,target) {
        if(typeof target == 'undefined'){
            target = null ;
        }
        createProfilerLink(token,target,function(url){
            window.getConfigurationKey('profilerDestination', function (profilerDestination) {
                console.dir(profilerDestination);
                if (profilerDestination == 'popup') {
                    chrome.windows.create({'url': url, 'type': 'popup'});
                } else {
                    chrome.tabs.create({'url': url});
                }

            });
        });

    };


    window.openToken = openToken;

})();