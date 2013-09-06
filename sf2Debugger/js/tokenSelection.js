(function ()
{
    _.templateSettings = {
        interpolate: /\{\{(.+?)\}\}/g
    };

    var templates = {
        tokenList        : _.template('<ul class="tokenList">{{ tokenList }}</ul>'),
        tokenListItem    : _.template('' +
            '<li class="tokenListItem">' +
            '   <span class="tokenUrl">{{ url }}</span>' +
            '   <span class="tokenType">{{ type }}</span>' +
            '   <span class="tokenValue">{{ value }}</span>' +
            '   <span class="tokenProfiler">{{profilerLinkTemplate}}</span>' +
            '</li>'),
        tokenProfilerLink: _.template('' +
            '<a href="{{profilerLink}}" target="_blank" >Profiler</a>')
    };


    var constructList = function (tokens)
    {
        console.debug('construct list');
        console.dir(arguments);
        data = [];
        _.each(tokens, function (item, key)
        {
            console.dir(arguments);
            var oneToken = _.clone(item);
            oneToken.profilerLinkTemplate = templates.tokenProfilerLink(oneToken);
            data.push(oneToken);
        });
        console.dir(data);
        var tokenList = '';
        _.each(data, function (item)
        {
            tokenList += templates.tokenListItem(item);
        });
        console.dir(tokenList) ;
        var dom = document.getElementById('tokenList');
        dom.innerHTML = templates.tokenList({tokenList: tokenList});
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

        jQuery('body').on('click','a',function(){
            console.dir(arguments);
        })

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