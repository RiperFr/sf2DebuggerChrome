(function ()
{
    _.templateSettings = {
        interpolate: /\{\{(.+?)\}\}/g
    };

    var templates = {
        tokenList        : _.template('<div class="tokenHeader"><span>'+chrome.i18n.getMessage('tokenDetected')+' : <b>{{tokenCount}}</b></span></div><ul class="tokenList">{{ tokenList }}</ul>'),
        tokenListItem    : _.template('' +
            '<li class="tokenListItem">' +
            '   <span class="tokenUrl">{{ url }}</span>' +
            '   <span class="tokenType">{{ type }}</span>' +
            '   <span class="tokenValue">{{ value }}</span>' +
            '   <span class="tokenProfiler">{{profilerLinkTemplate}}</span>' +
            '</li>'),
        tokenProfilerLink: _.template('' +
            '<a href="#" class="open-profiler pure-button pure-button-xsmall pure-button-secondary" data-token=\'{{profilerTokenSerial}}\' >Profiler</a>')
    };


    var constructList = function (tokens)
    {
        console.dir(chrome.i18n.getMessage('tokenDetected'));
        data = [];
        _.each(tokens, function (item, key)
        {
            var oneToken = _.clone(item);
            oneToken.profilerLinkTemplate = templates.tokenProfilerLink(oneToken);
            data.push(oneToken);
        });
        var tokenList = '';
        _.each(data, function (item)
        {
            tokenList += templates.tokenListItem(item);
        });

        var dom = document.getElementById('tokenList');
        dom.innerHTML = templates.tokenList({tokenList: tokenList,tokenCount:tokens.length});

        //manage click on openProfiler button
        $(dom).on('click','.open-profiler',function(jEvent){
            var data = null;
            _.each(jEvent.target.attributes, function(item){
                if(item.nodeName == 'data-token'){
                    data = item.nodeValue;
                }
            });
            if(data == null){
                alert('An error occurred');
            }else{
                var token = JSON.parse(data);
                window.openToken(token);
            }
        })
    };


    var startup = function ()
    {
        chrome.tabs.query(
            {currentWindow: true, active: true},
            function (tabArray)
            {
                tabId = tabArray[0].id;
                chrome.extension.sendRequest(
                    {
                        method: "getTokens",
                        data  : {
                            tabId: tabId
                        }
                    }
                );
            }
        );

    };
    var setTokens = function (tokens)
    {
        console.debug('setTokens');
        constructList(tokens);
    };


    chrome.extension.onRequest.addListener(
        function (request, sender, sendResponse)
        {
            console.debug('message received');
            console.dir(request);
            if (!request.action)
            {
                return;
            }
            switch (request.action)
            {
                case 'setTokens' :
                    setTokens(request.data);
            }

        }
    );

    startup();
})();