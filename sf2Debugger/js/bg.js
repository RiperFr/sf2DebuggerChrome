(function () {

    var db = {};
    var Configuration = {};

    /**
     * Display the app icon into tha address bar of the corresponding tab
     * @param tabId
     */
    var handleIconDisplay = function (tabId) {
        var quantity = getTokenQuantity(tabId);
        var status = (quantity > 0 ? true : false);
        if (status) {
            chrome.pageAction.show(tabId);
            chrome.pageAction.setPopup({
                tabId: tabId,
                popup: "tokenSelection.html"
            });
            updatePageAction(tabId);
        } else {
            chrome.pageAction.hide(tabId);
        }
    };


    /**
     * Only update the counter on the page action
     * @param tabId
     */
    var updatePageAction = function (tabId) {
        var tokenQuantity = getTokenQuantity(tabId);
        chrome.pageAction.setTitle({
            tabId: tabId,
            title: tokenQuantity + " Token(s)"
        });
    };

    // Listen for any changes to the URL of any tab.
    chrome.tabs.onUpdated.addListener(handleIconDisplay);


    chrome.extension.onRequest.addListener(
        function (request, sender, sendResponse) {
            if (!request.method) {
                return;
            }

            switch (request.method) {
                case 'getTokens' :
                    var tabId = request.data.tabId;
                    var tokens = getTokens(tabId);
                    sendPopupMessage('setTokens', _.clone(tokens));
                    break;
                case 'clearTabDb' :
                    var tabId = request.data.tabId;
                    clearToken(tabId);
                    updatePageAction(tabId);
                    break;
                case 'reloadConfiguration' :
                    loadConfiguration(function(){});
            }


        }
    );

    var sendPopupMessage = function (action, data) {
        chrome.extension.sendMessage({action: action, data: data});
    };

    /**
     * Manage event when the user click on the pageAction icon
     * @param details
     */
    /*var onPageActionClicked = function (details) {
        var tabId = details.id;
        getMainToken(tabId, function (token) {
            if (token !== null) {
                getTokenQuantity(tabId, function (tokenQuantity) {
                    if (tokenQuantity >= 1) { //Multiple token, we display the popup for selection

                    } else { // only one token (we open the profiler directly if the configuration say so)
                        window.getConfigurationKey('alwaysDisplayPopup', function (alwaysDisplayPopup) {
                            if (!alwaysDisplayPopup) {
                                window.openToken(token);
                            }
                        });

                    }
                });

            }
        });

    };*/

    //chrome.pageAction.onClicked.addListener(onPageActionClicked);



    /**
     * database management
     * ----------------------------------------
     */

    var setTabConfiguration = function (tabId, key, value) {
        initTabDb(tabId);
        db[tabId].configuration[key] = value;
    };

    var getTabConfiguration = function (tabId, key) {
        initTabDb(tabId);
        var to = null;
        if (typeof db[tabId].configuration[key] !== "undefined") {
            to = db[tabId].configuration[key];
        }
        return to ;
    };

    var initTabDb = function (tabId) {
        if (typeof db[tabId] == "undefined") {
            db[tabId] = {
                tokens: [],
                configuration: {}
            };
        }
    };

    var addToken = function (tabId, data) {
        initTabDb(tabId);
        data.popup = false ;
        var profilerTokenSerial = JSON.stringify(data);
        data.popup = true ;
        var profilerTokenSerialPopup = JSON.stringify(data);
        data.popup = false ;
        data.profilerTokenSerial = profilerTokenSerial ;
        data.profilerTokenSerialPopup = profilerTokenSerialPopup ;
        db[tabId].tokens.push(data);
        updatePageAction(tabId);
        sendPopupMessage("TokenListUpdated", {});
    };
    var clearToken = function (tabId) {
        initTabDb(tabId);
        db[tabId].tokens = [];
        updatePageAction(tabId);
        sendPopupMessage("TokenListUpdated", {});
        console.debug("Clear token");
    };

    var getTokens = function (tabId) {
        var to = [];
        if (typeof db[tabId] != "undefined") {
            to = db[tabId].tokens;
        }
        return to ;
    };

    var getTokenQuantity = function (tabId) {
        var to = 0;
        if (typeof db[tabId] != "undefined") {
            to = db[tabId].tokens.length;
        }
        return to ;
    };

    var getMainToken = function (tabId) {
        var tokens = getTokens(tabId);
        if (tokens.length > 0) {
            return tokens[0];
        } else {
            return null;
        }
    };
    /**
     * /database management
     * ----------------------------------------
     */



    /**
     * Parse all headers and return the tokenId if present
     * @param headers
     * @returns {null}
     */
    var getTokenFromHeaders = function (headers) {
        var token = null;
        var headerName = window.extractConfiguration('headerName',Configuration);
        _.each(headers, function (item) {
            if (item.name == headerName) {
                token = item.value;
            }
        });
        return token;
    };

    var getStatusFromStatusLine = function (statusLine) {
        var exploded = statusLine.split(" ");
        var code =  exploded[1];
        var codeLevel = parseInt(code[0]+'00'); //We set a codeLevel with only the Hundred for level.
        return {
            code: exploded[1],
            message: exploded[2],
            httpVersion: exploded[0],
            codeLevel : codeLevel
        }
    };

    /**
     * Load the entire configuration. Will be updated periodically and on configuration save
     * @param callBack
     */
    function loadConfiguration(callBack){
        if(!callBack){
            callBack = function(){};
        }
        window.getConfiguration(function(config){
           Configuration = config ;
           callBack.apply(this);
        });
    }


    var forgeInternalToken = function(frameData){
        var data = frameData ;
        var responseHeaders = data.responseHeaders;
        var token = getTokenFromHeaders(responseHeaders);

        if(token == null){
            return null ;
        }
        var statusLine = data.statusLine;
        var url = data.url;
        var type = data.type;
        var status = getStatusFromStatusLine(statusLine);
        return  {
            type: type,
            url: url,
            status: status.code,
            statusMessage : status.message,
            httpVersion : status.httpVersion,
            statusLine : statusLine,
            date:new Date(),
            codeLevel : status.codeLevel,
            value: token
        };
    };

    //Capture main_frame onlu (xxhr request not captured here)
    function startup() {
        console.debug('startup');

        /**
         * Handle main frame
         * @param data
         */
        var main_frame = function (data) {
            var tabId = data.tabId;
            var autoClearTab = window.extractConfiguration('autoClearTab',Configuration);
            var tokenData = forgeInternalToken(data);
            console.dir(typeof autoClearTab);
            console.dir(tokenData);
            console.dir(getTokens(tabId).length);
            if (tokenData !== null) {
                //We check if the tabHistory must be cleared or kept
                if (autoClearTab === 'true' && getTokens(tabId).length > 0) {
                    clearToken(tabId);
                }
                addToken(tabId, tokenData);
                handleIconDisplay(tabId);
            }
        };

        /**
         * Handle sub frame. do not clear token list
         * @param data
         */
        var sub_frame = function (data) {
            var tabId = data.tabId;
            var tokenData = forgeInternalToken(data);
            if (tokenData !== null) {
                addToken(tabId, tokenData);
                handleIconDisplay(tabId);
            }
        };


        loadConfiguration(function(){
            var filters_main_frame = {
                urls: ["<all_urls>"],
                types: ["main_frame"]
            };
            chrome.webRequest.onHeadersReceived.addListener(main_frame, filters_main_frame, ['responseHeaders']);
            var filters_sub_frame = {
                urls: ["<all_urls>"],
                types: ["xmlhttprequest", "sub_frame"]
            };
            chrome.webRequest.onHeadersReceived.addListener(sub_frame, filters_sub_frame, ['responseHeaders']);
        });

    }
    startup();
})();
