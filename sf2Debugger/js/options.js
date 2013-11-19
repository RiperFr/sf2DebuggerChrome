(function () {


    /**
     * startup the page
     */
    var startup = function () {
        var form = $('form[name=options]').first();
        disableForm(form); //block any user interaction
        initForm(form,window.getDefaultConfiguration());
        window.getConfiguration(function (config) {
            initForm(form, config);
            enableForm(form); //re-enable all userInteraction
            form.on('submit', function (event) {
                event.stopPropagation();
                submitForm(form); //Do main job (saving configuration)
                return false;
            })
        });
    };


    /**
     *  init a form with data passed in argument
     *  @param form a jQuery form element
     *  @param {Array}
     */
    var initForm = function (form, data) {
        _.each(data, function (item) {
            var formValue = unCleanDataForForm(item.value);
            console.debug('Setting form field ' + item.name + ' with value:' + formValue);
            form.find('*[name=' + item.name + ']').val(formValue);
        });
    };

    /**
     * Enable all field into the form
     * @param form
     */
    var enableForm = function (form) {
        form.find(':input').prop("disabled", false); //enable all field (input,textArea, select ...)
    };


    /**
     * disable all form field into the form to avoid any modification or submit
     * @param form
     */
    var disableForm = function (form) {
        form.find(':input').prop("disabled", true);  //disable all field (input,textArea, select ...)
    };


    /**
     * Save all configuration from form and close the current tab (with configuration window)
     * @param form
     */
    var submitForm = function (form) {
        disableForm(form); // be sure the user do not submit twice
        var data = getDataFromForm(form);
        console.dir(data);
        window.storeConfiguration(data, function () {
            alert(chrome.i18n.getMessage('options_configuration_saved'));
            enableForm(form);
            /*chrome.tabs.query(
                {currentWindow: true, active: true},
                function (tabArray) {
                    tabId = tabArray[0].id;
                    chrome.tabs.remove(tabId);
                }
            );*/
        });
    };

    /**
     * Parse form fields to retrieve an array of objects {name/value}
     * @param form (jquery form)
     * @returns {Array}
     */
    var getDataFromForm = function (form) {
        enableForm(form);
        var data = form.serializeArray();
        disableForm(form);
       /*var fields = string.split("&");

        var data = [];
        _.each(fields, function (item) {
            var split = item.split('=');
            data.push({
                name: split[0],
                value: cleanFormData(split[1])
            });
        });*/
        return data;
    };


    /**
     * Transform some data into there primitives (true,false,null ...)
     * @param data
     * @returns {*}
     */
    var cleanFormData = function (data) {
        if (data === 'null') {
            return null;
        }
        if (data == 'true') {
            return true;
        }
        if (data == 'false') {
            return false;
        }
        if (data == ''){
            return ' ' ;
        }
        return data ;
    };

    var unCleanDataForForm = function(data){
        if (data == null) {
            return 'null';
        }
        if (data == true) {
            return 'true';
        }
        if (data === false) {
            return 'false';
        }
        if(_.isArray(data)){
            return data.join('\n');
        }



        return data ;
    };


    startup();

})();