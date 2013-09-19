(function () {

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
        },
        {
            name: "autoClearTab",
            value: true
        }
    ];

    var startup = function () {
        getConfiguration(function (configurations) {
            if (typeof configurations !== 'undefined' && configurations.length <= 0) {
                storeConfiguration(defaultValues, function () {
                });
            } else if (typeof configurations == 'undefined') {
                storeConfiguration(defaultValues, function () {
                });
            }
        });
    };

    var getDefaultValue = function (key) {
        var to = null;
        _.each(defaultValues, function (item) {
            if (item.name == key) {
                to = item.value;
            }
        });
        return to;
    };


    /**
     * Retrieve a configuration key from chrome storage
     * @param keyName
     * @param callback
     */
    var getConfigurationKey = function (keyName, callback) {
        getConfiguration(function (configurations) {
            var br = false ;
            if (configurations && configurations.length >= 1) {
                _.each(configurations, function (item) {
                    if(br === true){
                        return ; // do not call callback twice
                    }
                    if (item.name == keyName) {
                        callback.apply(this, [item.value]);
                        br = true; //avoid calling callback twice
                        //console.debug(item.name+' found') ;
                    }
                });
            }
            if(br === false){
                //console.debug('Default value used for configuration.'+keyName);
                callback.apply(this,[getDefaultValue(keyName)]);
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
     * @param callback
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