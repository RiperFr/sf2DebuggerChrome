(function ()
{

    var tabStatus = {};
    var db = {};

    /**
     * Display the app icon into tha address bar of the corresponding tab
     * @param tabId
     * @param details
     * @param tabStatus
     */
    function enableIcon(tabId)
    {
        var status = getTokenQuantity(tabId) > 0 ? true : false;
        if (status)
        {
            chrome.pageAction.show(tabId);
            var token = getMainToken(tabId);
            updatePageAction(tabId);
        } else
        {
            chrome.pageAction.hide(tabId);
        }
    }

    // Listen for any changes to the URL of any tab.
    chrome.tabs.onUpdated.addListener(enableIcon);


    chrome.extension.onRequest.addListener(
        function (request, sender, sendResponse)
        {
            if (!request.method)
            {
                return;
            }

            switch (request.method)
            {
                case 'getTokens' :
                    var tabId = request.data.tabId;
                    var tokens = getTokens(tabId);
                    sendPopupMessage('setTokens', _.clone(tokens));
                    break;
            }


        }
    );

    var sendPopupMessage = function (action, data)
    {
        chrome.extension.sendRequest({action: action, data: data});
    };

    /**
     * Manage event when the user click on the pageAction icon
     * @param details
     */
    var onPageActionClicked = function (details)
    {
        var tabId = details.id;
        token = getMainToken(tabId);
        if (token !== null)
        {
            var tokenQuantity = getTokenQuantity(tabId);
            if (tokenQuantity > 1)
            { //Multiple token, we display the popup for selection

            } else
            { // only one token (we open the profiler directly if the configuration say so)
                window.getConfigurationKey('alwaysDisplayPopup', function (alwaysDisplayPopup) {
                    if(!alwaysDisplayPopup){
                        window.openToken(token);
                    }
                });

            }
        }
    };
    chrome.pageAction.onClicked.addListener(onPageActionClicked);




    var updatePageAction = function (tabId)
    {
        var tokenQuantity = getTokenQuantity(tabId);
        window.getConfigurationKey('alwaysDisplayPopup', function (alwaysDisplayPopup) {
            if (tokenQuantity > 1 || alwaysDisplayPopup == true)
            {
                chrome.pageAction.setPopup({
                    tabId: tabId,
                    popup: "tokenSelection.html"
                });
            }
        });


        chrome.pageAction.setTitle({
            tabId: tabId,
            title: tokenQuantity + " Token(s)"
        });

    };

    /**
     * database management
     * ----------------------------------------
     */



    var addToken = function (tabId, data)
    {
        if (typeof db[tabId] == "undefined")
        {
            db[tabId] = [];
        }
        data.profilerTokenSerial = JSON.stringify(data);
        db[tabId].push(data);
        updatePageAction(tabId);
    };
    var clearToken = function (tabId)
    {
        db[tabId] = [];
    };

    var getTokens = function (tabId)
    {
        if (typeof db[tabId] != "undefined")
        {
            return db[tabId];
        } else
        {
            return [];
        }
    };

    var getTokenQuantity = function (tabId)
    {
        if (typeof db[tabId] != "undefined")
        {
            return db[tabId].length;
        } else
        {
            return 0;
        }
    };

    var getMainToken = function (tabId)
    {
        var tokens = getTokens(tabId);
        if (tokens.length > 0)
        {
            return tokens[0];
        } else
        {
            return null;
        }
    };
    /**
     * database management
     * ----------------------------------------
     */


    var headerName = "X-Debug-Token";
    /**
     * Parse all headers and return the tokenId if present
     * @param headers
     * @returns {null}
     */
    var getTokenFromHeaders = function (headers)
    {
        var token = null;
        _.each(headers, function (item)
        {
            if (item.name == headerName)
            {
                token = item.value;
            }
        });
        return token;
    };

    /**
     * Get from configuration the current header. it will stay un-touch until first call of this function
     * @param callback
     */
    var fixHeaderName = function(callback){
        window.getConfigurationKey('headerName', function (configHeaderName) {
            headerName = configHeaderName ;
            callback.apply(this,[configHeaderName])
        });
    };

    //Capture main_frame onlu (xxhr request not captured here)
    function startup()
    {
        var main_frame = function (data)
        {
            var tabId = data.tabId;
            var responseHeaders = data.responseHeaders;
            var url = data.url;
            var type = data.type;
            clearToken(tabId); //anyway we clear the current status of the tab, and remove all token stored
            fixHeaderName(function(){ //We check the configuration for the tokenHeader

                var token = getTokenFromHeaders(responseHeaders);

                var tokenData = {
                    type : type,
                    url  : url,
                    value: token
                };

                if (token !== null)
                {
                    addToken(tabId, tokenData);
                }
            });

        };
        var filters_main_frame = {
            urls : ["<all_urls>"],
            types: ["main_frame"]
        };
        chrome.webRequest.onHeadersReceived.addListener(main_frame, filters_main_frame, ['responseHeaders']);


        var sub_frame = function (data)
        {
            var tabId = data.tabId;
            var responseHeaders = data.responseHeaders;
            var url = data.url;
            var type = data.type;
            var token = getTokenFromHeaders(responseHeaders);
            var tokenData = {
                type : type,
                url  : url,
                value: token
            };
            if (token !== null)
            {
                addToken(tabId, tokenData);
                enableIcon(tabId);
            }else{

            }
        };
        var filters_sub_frame = {
            urls : ["<all_urls>"],
            types: ["xmlhttprequest"]
        };
        chrome.webRequest.onHeadersReceived.addListener(sub_frame, filters_sub_frame, ['responseHeaders']);
    }

    startup();


})();
