(function () {


    /**
     * startup the page
     */
    var startup = function () {
        localizePage();
        var form = $('form[name=options]').first();
        disableForm(form); //block any user interaction
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
            console.debug('Setting form field ' + item.name + ' with value:' + item.value);
            form.find('*[name=' + item.name + ']').val(item.value);
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
        window.storeConfiguration(data, function () {
            alert(chrome.i18n.getMessage('options_configuration_saved'));
            chrome.tabs.query(
                {currentWindow: true, active: true},
                function (tabArray) {
                    tabId = tabArray[0].id;
                    chrome.tabs.remove(tabId);
                }
            );
        });
    };

    /**
     * Parse form fields to retrieve an array of objects {name/value}
     * @param form (jquery form)
     * @returns {Array}
     */
    var getDataFromForm = function (form) {
        enableForm(form);
        var string = form.serialize();
        disableForm(form);
        var fields = string.split("&");

        var data = [];
        _.each(fields, function (item) {
            var split = item.split('=');
            data.push({
                name: split[0],
                value: cleanFormData(split[1])
            });
        });
        return data;
    };


    /**
     * Transform some data into there primitives (true,false,null ...)
     * @param data
     * @returns {*}
     */
    var cleanFormData = function (data) {
        if (data == 'null') {
            return null;
        }
        if (data == 'true') {
            return true;
        }
        if (data == 'false') {
            return false;
        }
        return data ;
    };

    var translate = function (messageID, args) {
        return chrome.i18n.getMessage(messageID, args);
    };

    var localizePage = function () {
        //translate a page into the users language
        $("[i18n]:not(.i18n-replaced)").each(function () {
            $(this).html(translate($(this).attr("i18n")));
        });
        $("[i18n_value]:not(.i18n-replaced)").each(function () {
            $(this).val(translate($(this).attr("i18n_value")));
        });
        $("[i18n_title]:not(.i18n-replaced)").each(function () {
            $(this).attr("title", translate($(this).attr("i18n_title")));
        });
        $("[i18n_placeholder]:not(.i18n-replaced)").each(function () {
            $(this).attr("placeholder", translate($(this).attr("i18n_placeholder")));
        });
        $("[i18n_replacement_el]:not(.i18n-replaced)").each(function () {
            // Replace a dummy <a/> inside of localized text with a real element.
            // Give the real element the same text as the dummy link.
            var dummy_link = $("a", this);
            var text = dummy_link.text();
            var real_el = $("#" + $(this).attr("i18n_replacement_el"));
            real_el.text(text).val(text).replaceAll(dummy_link);
            // If localizePage is run again, don't let the [i18n] code above
            // clobber our work
            $(this).addClass("i18n-replaced");
        });
    };

    startup();

})();