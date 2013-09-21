(function () {

    var db = {};

    /**
     * Display the app icon into tha address bar of the corresponding tab
     * @param tabId
     */
    var enableIcon = function (tabId) {
        getTokenQuantity(tabId, function (quantity) {
            var status = (quantity > 0 ? true : false);
            if (status) {
                chrome.pageAction.show(tabId);
                updatePageAction(tabId,function(){

                });
            } else {
                chrome.pageAction.hide(tabId);
            }
        });
    };

    // Listen for any changes to the URL of any tab.
    chrome.tabs.onUpdated.addListener(enableIcon);


    chrome.extension.onRequest.addListener(
        function (request, sender, sendResponse) {
            if (!request.method) {
                return;
            }

            switch (request.method) {
                case 'getTokens' :
                    var tabId = request.data.tabId;
                    getTokens(tabId, function (tokens) {
                        sendPopupMessage('setTokens', _.clone(tokens));
                    });
                    break;
                case 'clearTabDb' :
                    var tabId = request.data.tabId;
                    clearToken(tabId,function(){
                        updatePageAction(tabId,function(){

                        })
                    });
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
    var onPageActionClicked = function (details) {
        var tabId = details.id;
        getMainToken(tabId, function (token) {
            if (token !== null) {
                getTokenQuantity(tabId, function (tokenQuantity) {
                    if (tokenQuantity > 1) { //Multiple token, we display the popup for selection

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

    };
    chrome.pageAction.onClicked.addListener(onPageActionClicked);


    var updatePageAction = function (tabId,callback) {
        if(typeof callback == 'undefined'){
            callback = function(){};
        }
        getTokenQuantity(tabId, function (tokenQuantity) {
            window.getConfigurationKey('alwaysDisplayPopup', function (alwaysDisplayPopup) {
                if (tokenQuantity > 1 || alwaysDisplayPopup == true) {
                    chrome.pageAction.setPopup({
                        tabId: tabId,
                        popup: "tokenSelection.html"
                    });
                }
                chrome.pageAction.setTitle({
                    tabId: tabId,
                    title: tokenQuantity + " Token(s)"
                });
                //console.debug('callbakc')
                callback.call(this);
                //console.debug('callbackCall')
            });

        });
    };

    /**
     * database management
     * ----------------------------------------
     */

    var setTabConfiguration = function (tabId, key, value, callback) {
        initTabDb(tabId, function () {
            db[tabId].configuration[key] = value;
            callback.call(this);
        });
    };

    var getTabConfiguration = function (tabId, key, callback) {
        //console.debug('getTabConfiguration for ' + tabId + ' key ' + key);
        initTabDb(tabId, function () {
            var to = null;
            if (typeof db[tabId].configuration[key] !== "undefined") {
                to = db[tabId].configuration[key];
            }
            callback.call(this, to);
        });
    };

    var initTabDb = function (tabId, callback) {
        //console.debug('InitTabDB ' + tabId);
        if (typeof db[tabId] == "undefined") {
            db[tabId] = {
                tokens: [],
                configuration: {}
            };
            window.getConfigurationKey('autoClearTab', function (autoClearTab) {
                //console.debug('here');
                setTabConfiguration(tabId, 'autoClearTab', autoClearTab, function () {
                    callback.call(this);
                    //console.debug('here inside')
                });
                //console.debug('here after')
            });
        }else{
            callback.call(this);
        }

    };

    var addToken = function (tabId, data, callback) {
        //console.debug('addToken');
        initTabDb(tabId, function () {
            data.profilerTokenSerial = JSON.stringify(data);
            db[tabId].tokens.push(data);
            updatePageAction(tabId,function(){
                sendPopupMessage("TokenListUpdated",{});
                callback.call(this);
            });
        });

    };
    var clearToken = function (tabId, callback) {
        initTabDb(tabId,function(){
            db[tabId].tokens = [];
            //console.debug('callback clearToken');
            sendPopupMessage("TokenListUpdated",{});
            callback.call(this);
        });
    };

    var getTokens = function (tabId, callback) {
        var to = [];
        if (typeof db[tabId] != "undefined") {
            to = db[tabId].tokens;
        }
        callback.call(this, to);
    };

    var getTokenQuantity = function (tabId, callback) {
        var to = 0;
        if (typeof db[tabId] != "undefined") {
            to = db[tabId].tokens.length;
        }
        callback.call(this, to);
    };

    var getMainToken = function (tabId, callback) {
        getTokens(tabId, function (tokens) {
            if (tokens.length > 0) {
                callback.call(this, tokens[0]);
            } else {
                callback.call(this, null);
            }
        });

    };
    /**
     * /database management
     * ----------------------------------------
     */


    var headerName = "X-Debug-Token";
    /**
     * Parse all headers and return the tokenId if present
     * @param headers
     * @returns {null}
     */
    var getTokenFromHeaders = function (headers) {
        var token = null;
        _.each(headers, function (item) {
            if (item.name == headerName) {
                token = item.value;
            }
        });
        return token;
    };

    /**
     * Get from configuration the current header. it will stay un-touch until first call of this function
     * @param callback
     */
    var fixHeaderName = function (callback) {
        window.getConfigurationKey('headerName', function (configHeaderName) {
            //console.debug('fixHeaderName');
            headerName = configHeaderName;
            //console.debug('fixHeaderName callback');
            callback.apply(this, [configHeaderName])
        });
    };

    //Capture main_frame onlu (xxhr request not captured here)
    function startup() {
        var main_frame = function (data) {
            var tabId = data.tabId;
            var responseHeaders = data.responseHeaders;
            var url = data.url;
            var type = data.type;
            //console.debug('main_frame get configClearTab')
            window.getConfigurationKey('autoClearTab', function (autoClearTab) {
                //console.debug('getConfigAutoClearTab read');
                var runJob = function () {
                    //console.debug('runJob');
                    //anyway we clear the current status of the tab, and remove all token stored
                    fixHeaderName(function () { //We check the configuration for the tokenHeader
                        //console.debug('fixHedername callback run');
                        var token = getTokenFromHeaders(responseHeaders);
                        var tokenData = {
                            type: type,
                            url: url,
                            value: token
                        };
                        if (token !== null) {
                            addToken(tabId, tokenData, function () {
                                //console.debug('Token added')
                            });
                            enableIcon(tabId);
                        }else{
                            //console.debug('No token');
                        }
                    });
                };

                //We check if the tabHistory must be cleared or kept
                if (autoClearTab === true) {
                    //console.debug('clearing tokens in tab '+tabId);
                    clearToken(tabId, runJob, function () {
                        runJob.call(this);
                    });
                } else {
                    getTabConfiguration(tabId, 'autoClearTab', function (TabScopeAutoClearTab) {
                        if (TabScopeAutoClearTab === true) {
                            //console.debug('clearing tokens in tab (tabConfig) '+tabId);
                            clearToken(tabId, runJob, function () {
                                runJob.call(this);
                            });
                        } else {
                            runJob.call(this);
                        }
                    })
                }
            });
        };
        var filters_main_frame = {
            urls: ["<all_urls>"],
            types: ["main_frame"]
        };
        chrome.webRequest.onHeadersReceived.addListener(main_frame, filters_main_frame, ['responseHeaders']);


        var sub_frame = function (data) {
            var tabId = data.tabId;
            var responseHeaders = data.responseHeaders;
            var url = data.url;
            var type = data.type;
            var token = getTokenFromHeaders(responseHeaders);
            var tokenData = {
                type: type,
                url: url,
                value: token
            };
            if (token !== null) {
                addToken(tabId, tokenData);
                enableIcon(tabId);
            } else {

            }
        };
        var filters_sub_frame = {
            urls: ["<all_urls>"],
            types: ["xmlhttprequest"]
        };
        chrome.webRequest.onHeadersReceived.addListener(sub_frame, filters_sub_frame, ['responseHeaders']);
    }

    startup();

})();
