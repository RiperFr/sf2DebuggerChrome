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
                name : 'profilerDestination',
                value : 'popup'
            },
            {
                name : 'alwaysDisplayPopup',
                value : true
            }
        ];

        getConfiguration(function (configurations) {
            if (configurations.length <= 0) {
                storeConfiguration(defaultValues);
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
            if(configurations.length >=1){
                _.each(configurations,function(item){
                    if(item.name == keyName){
                        callback.apply(this, [item.value]);
                        return ; //avoid calling callback twice
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