(function ()
{
    _.templateSettings = {
        interpolate: /\{\{(.+?)\}\}/g
    };

    var templates = {
        tokenList        : _.template('<div class="tokenHeader">' +
            '<span>'+chrome.i18n.getMessage('tokenDetected')+' : <b>{{tokenCount}}</b></span> ' +
            '<span title="Clear" class="icon icon_clear{{iconClear}} action-clear"></span> ' +
            '<span title="Options" class="icon icon_config action-config"></span> ' +
            '</div><ul class="tokenList">{{ tokenList }}</ul>'),
        tokenListItem    : _.template('' +
            '<li class="tokenListItem" >' +
            '   <span class="tokenUrl" data-detailsTarget="true" data-url="{{ url }}">{{ url }}</span>' +
            '   <span class="s-item status status_{{codeLevel}}" title="Status" data-hover="{{statusLine}}">{{status}}</span>' +
            '   <span class="s-item icon icon_date" title="Date" data-hover="{{date}}"></span>' +
            '   <span class="s-item icon icon_token" title="token" data-hover="Token : {{ value }}" ></span>' +
            '   <span class="s-item icon icon_type icon_{{ type }}" title="Request type" data-hover="Request type : {{type}}" ></span>' +
            '   <span class="tokenProfiler">{{profilerLinkTemplate}}</span>' +
            '</li>'),
        tokenProfilerLink: _.template('' +
            '<a href="#" class="open-profiler pure-button pure-button-xsmall pure-button-secondary" data-token=\'{{profilerTokenSerial}}\' >Profiler</a>')
    };


    var constructList = function (tokens)
    {
        data = [];
        _.each(tokens, function (item, key)
        {
            var oneToken = _.clone(item);
            oneToken.profilerLinkTemplate = templates.tokenProfilerLink(oneToken);
            data.push(oneToken);
        });
        var tokenList = '';
        window.getConfigurationKey('reverseList',function(reverseList){
            _.each(data, function (item)
            {
                item.date = new Date(item.date);
                if(reverseList){
                    tokenList = templates.tokenListItem(item)+tokenList;
                }else{
                    tokenList += templates.tokenListItem(item);
                }

            });

            var dom = document.getElementById('tokenList');
            var iconClear = '_full' ;
            if(tokens.length>0){
                iconClear = '_full'
            }else{
                iconClear = '_empty'
            }
            dom.innerHTML = templates.tokenList({tokenList: tokenList,tokenCount:tokens.length,iconClear:iconClear});
        });
    };


    var bind_events = function(){
        console.debug('bind events');
        var dom = document.body;
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
        });

        $(dom).on('click','.action-config',function(jEvent){
            chrome.tabs.create({'url': 'options.html'});
        });

        $(dom).on('click','.action-clear',function(jEvent){
            chrome.tabs.query(
                {currentWindow: true, active: true},
                function (tabArray)
                {
                    tabId = tabArray[0].id;
                    chrome.extension.sendRequest(
                        {
                            method: "clearTabDb",
                            data  : {
                                tabId: tabId
                            }
                        }
                    );
                }
            );
        });



        $(dom).on('mouseover','[data-hover]',function(jEvent){
            var target = $(jEvent.target) ;
            console.dir(target.data('hover'));
            var messageTarget = target.parent().find('[data-detailsTarget=true]') ;
            messageTarget.html(target.data('hover'));
            messageTarget.addClass('hoverFix');
        });
        $(dom).on('click','[data-hover]',function(jEvent){
            var target = $(jEvent.target) ;
            if (target.data('hoverFix') == 'true'){
                target.data('hoverFix','false');
                target.removeClass('hoverFix');
            }else{
                target.data('hoverFix','true');
                target.parent().find('.hoverFix').removeClass('hoverFix');
                var messageTarget = target.parent().find('[data-detailsTarget=true]') ;
                target.addClass('hoverFix');
                messageTarget.addClass('hoverFix');
            }
        });
        $(dom).on('mouseout','[data-hover]',function(jEvent){

            var target = $(jEvent.target) ;

            if (target.data('hoverFix') == 'true'){
                return ;
            }
            var messageTarget = target.parent().find('[data-detailsTarget=true]') ;
            var otherMatching = target.parent().find('.hoverFix[data-hover]') ;
            if (otherMatching.length>0){
                messageTarget.html(otherMatching.first().data('hover'));
            }else{
                messageTarget.html(messageTarget.data('url'));
                messageTarget.removeClass('hoverFix');
            }

        });
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


    chrome.extension.onMessage.addListener(
        function (request, sender, sendResponse)
        {
            if (!request.action)
            {
                return;
            }
            switch (request.action)
            {
                case 'setTokens' :
                    setTokens(request.data);
                    break;
                case 'TokenListUpdated' :
                    startup();
                    break;
            }

        }
    );

    startup();
    $('body').ready(function(){
        bind_events();
    });

})();