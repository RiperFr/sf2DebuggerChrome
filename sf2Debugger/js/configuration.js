(function () {

    const callConfigurationReload = function () {
        chrome.extension.sendRequest(
            {
                method: "reloadConfiguration",
                data: {}
            }
        );
    };
    /**
         * Store data into Configuration
         * @param data
         * @param callback
         */
    const storeConfiguration = function (data, callback) {
        if (data == null) {
            chrome.storage.sync.remove('configuration', function () {
                callConfigurationReload.apply(this);
                callback.apply(this);
            })
        } else {
            chrome.storage.sync.set({'configuration': data}, function () {
                callConfigurationReload.apply(this);
                callback.apply(this);
            });
        }

    };
    /**
     * Retrieve all configuration data saved in chrome storage
     * @param callback
     */
    const getConfiguration = function (callback) {
        chrome.storage.sync.get('configuration', function (data) {
            if (typeof data.configuration !== 'undefined') {
                callback.apply(this, [data.configuration]);
            } else {
                callback.apply(this, []);
            }
        });
    };
    const defaultValues = [
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
        },
        {
            name: "reverseList",
            value: true
        },
        {
            name: 'profilerUrlTemplate',
            value:
                '#domain#/index.php/_profiler/*token*' + "\n" +
                '#domain#/_profiler/*token*'

        },
        {
            name: 'profilerUrlTemplateMemory',
            value: ''
        }

    ];


    const startup = function () {
        getConfiguration(function (configurations) {
            if (typeof configurations !== 'undefined' && configurations.length <= 0) {

            } else if (typeof configurations == 'undefined') {
                storeConfiguration({}, function () {
                    chrome.tabs.create({'url': 'options.html'});
                });
            }
        });
    };

    const getDefaultValue = function (key) {
        let to = null;
        _.each(defaultValues, function (item) {
            if (item.name == key) {
                to = item.value;
            }
        });

        return to;
    };
    const getDefaultConfiguration = function () {
        return defaultValues;
    };


    /**
     * Retrieve a configuration key from chrome storage
     * @param keyName
     * @param callback
     */
    const getConfigurationKey = function (keyName, callback) {
        getConfiguration(function (configurations) {
            let br = false;
            if (configurations && configurations.length >= 1) {
                _.each(configurations, function (item) {
                    if (br === true) {
                        return; // do not call callback twice
                    }
                    if (item.name == keyName) {
                        callback.apply(this, [item.value]);
                        br = true; //avoid calling callback twice
                    }
                });
            }
            if (br === false) {
                callback.apply(this, [getDefaultValue(keyName)]);
            }
        })
    };


    const extractConfiguration = function (keyName, config) {
        let result = null;
        _.each(config, function (item) {
            if (item.name == keyName) {
                result = item.value;

                return result;
            }
        });
        if (result == null) {
            return getDefaultValue(keyName)
        }
        return result;
    };


    /**
     * Store only one key in Configuration.
     * @param key
     * @param data
     * @param callback
     */
    const storeConfigurationKey = function (key, data, callback) {
        getConfiguration(function (config) {
            var done = false;
            _.each(config, function (item, indice) {
                if (item.name == key) {
                    config[indice].value = data;
                    done = true;
                }
            });
            if (done == false) {
                config.push({
                    name: key,
                    value: data
                });
            }
            storeConfiguration(config, callback);
        })
    };

    window.getConfigurationKey = getConfigurationKey;
    window.getConfiguration = getConfiguration;
    window.getDefaultConfiguration = getDefaultConfiguration;

    window.storeConfiguration = storeConfiguration;
    window.storeConfigurationKey = storeConfigurationKey;

    window.extractConfiguration = extractConfiguration;


    startup();
})();
