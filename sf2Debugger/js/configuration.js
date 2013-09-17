(function () {


    var startup = function () {
        var defaultValues = [
            {
                name: 'headerName',
                value: 'X-Debug-Token'
            },
            {
                name: 'defaultPage',
                value: null
            },
            {
                name: 'profilerDestination',
                value: 'popup'
            },
            {
                name: 'alwaysDisplayPopup',
                value: true
            }
        ];

        getConfiguration(function (configurations) {
            console.dir(configurations);
            if (typeof configurations !== 'undefined' && configurations.length <= 0) {
                storeConfiguration(defaultValues, function () {
                });
            } else if (typeof configurations == 'undefined') {
                storeConfiguration(defaultValues, function () {
                });
            }
        });
    };


    /**
     * Retrieve a configuration key from chrome storage
     * @param keyName
     * @param callback
     */
    var getConfigurationKey = function (keyName, callback) {
        getConfiguration(function (configurations) {
            if (configurations && configurations.length >= 1) {
                _.each(configurations, function (item) {
                    if (item.name == keyName) {
                        callback.apply(this, [item.value]);
                        return; //avoid calling callback twice
                    }
                });
            }

        })
    };

    /**
     * Retrieve all configuration data saved in chrome storage
     * @param callback
     */
    var getConfiguration = function (callback) {
        chrome.storage.sync.get('configuration', function (data) {
            if (typeof data.configuration !== 'undefined') {
                callback.apply(this, [data.configuration]);
            } else {
                callback.apply(this, []);
            }
        });
    };


    /**
     * Store data into Configuration
     * @param data
     */
    var storeConfiguration = function (data, callback) {
        console.dir(data);
        chrome.storage.sync.set({'configuration': data}, function () {
            console.debug('Configuration saved');
            callback.apply(this);
        });
    };

    window.getConfigurationKey = getConfigurationKey;
    window.getConfiguration = getConfiguration;

    window.storeConfiguration = storeConfiguration;


    startup();
})();