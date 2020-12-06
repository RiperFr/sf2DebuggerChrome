(function () {
    const createProfilerLink = function (token, target, callback) {
        const matches = token.url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
        const domain = matches && matches[1];
        let url = 'suchi.html#domain=' + domain + '&token=' + token.value;
        if (target == null) {
            window.getConfigurationKey('defaultPage', function (defaultPage) {
                if (defaultPage !== null && defaultPage !== 'null') {
                    url += '&panel=' + defaultPage;
                } else {
                    url += '&panel=';
                }
                callback.apply(this, [url]);
            });

            return;
        }

        url += '?panel=' + target;
        callback.apply(this, [url]);
    };

    window.openToken = (token, target) => {
        if (typeof target == 'undefined') {
            target = null;
        }
        createProfilerLink(token, target, function (url) {
            window.getConfigurationKey('profilerDestination', function (profilerDestination) {
                if (token.popup === true || profilerDestination == 'popup') {
                    chrome.windows.create({'url': url, 'type': 'popup'});
                } else {
                    chrome.tabs.create({'url': url});
                }
            });
        });
    };
})();
