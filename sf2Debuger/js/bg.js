(function(){

    var tabStatus = {};
    var db = {} ;

    /**
     * Display the app icon into tha address bar of the corresponding tab
     * @param tabId
     * @param details
     * @param tabStatus
     */
    function enableIcon(tabId,details,tabStatus) {
        var status  = getTabSFF(tabId);
        if(status){
            chrome.pageAction.show(tabId);
            var token = getMainToken(tabId);
            chrome.pageAction.setTitle({
                tabId:tabId,
                title: "SF2 debug token: "+token.value+" url: "+token.url
            });
        }else{
            chrome.pageAction.hide(tabId);
        }
    }
    // Listen for any changes to the URL of any tab.
    chrome.tabs.onUpdated.addListener(enableIcon);


    /**
     * Manage event when the user click on the pageAction icon
     * @param details
     */
    var onPageActionClicked = function(details){
        var tabId= details.id;
        token = getMainToken(tabId);
        if(token !== null){
            var matches = token.url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
            var domain = matches && matches[1];
            var url = 'http://'+domain+'/_profiler/'+token.value ;
            chrome.windows.create({'url': url, 'type': 'popup'});
            /*chrome.tabs.create({
                'url': url,
                "windowId":null
            });*/
        }
        console.dir(arguments);
    };
    chrome.pageAction.onClicked.addListener(onPageActionClicked);



    /**
     * database management
     * ----------------------------------------
     */



    var setTabSFD = function (tabId,status){
        tabStatus[tabId] = status;
        if(status == false){
            db[tabId] = [] ;
        }
    };
    var getTabSFF = function(tabId){
        return tabStatus[tabId] ? true : false ;
    };
    var addToken = function(tabId,data){
        if(typeof db[tabId] == "undefined" ){
            db[tabId] = [] ;
        }
        db[tabId].push(data)  ;
    };
    var clearToken = function(tabId){
        db[tabId] = [] ;
    };

    var getTokens = function(tabId){
        if(typeof db[tabId] != "undefined" ){
            return db[tabId] ;
        }else{
            return [] ;
        }
    };

    var getMainToken = function(tabId){
        var tokens = getTokens(tabId);
        if(tokens.length>0){
            return tokens[0];
        }else{
            return null;
        }
    };
    /**
     * database management
     * ----------------------------------------
     */


    /**
     * Parse all headers and return the tokenId if present
     * @param headers
     * @returns {null}
     */
    var getTokenFromHeaders= function(headers){
        var token = null ;
        _.each(headers,function(item){
            if(item.name == "X-Debug-Token"){
                token = item.value ;
            }
        });
        return token ;
    };

    //Capture main_frame onlu (xxhr request not captured here)
    function startup(){
        var todo = function(data){
            var tabId = data.tabId ;
            var responseHeaders = data.responseHeaders  ;
            var url = data.url ;
            var type = data.type ;
            var token = getTokenFromHeaders(responseHeaders);

            var tokenData = {
                type:type,
                url : url,
                value:token
            };
            clearToken();
            if(token !== null){
                setTabSFD(tabId,true);
                addToken(tabId,tokenData);
            }else{
                setTabSFD(tabId,false);
            }
        };
        var filters= {
            urls:["<all_urls>"],
            types:["main_frame"]//,"xmlhttprequest"]
        };
        chrome.webRequest.onHeadersReceived.addListener(todo,filters,['responseHeaders']);
        //chrome.extension.onRequest.addListener(todo);
    }

    startup();

})();
