(function(){

    var listToTry = [] ;

    var memory = {};


    var startup = function(){
        console.dir(memory);
        console.dir(listToTry);
        var anchor = window.location.hash;
        var list = anchor.replace('#','').split('&');
        var queryString = {};
        _.each(list,function(item){
           var s = item.split('=');
            queryString[s[0]] = s[1] ;
        });

        checkMemory(queryString.domain,queryString.token,queryString.panel);


        var listToDisplay = [];
        _.each(listToTry,function(item){
            var url = item ;
            _.each(queryString,function(qsItem,qsKey){
                url = url.replace('#'+qsKey+'#',qsItem);
            });
            listToDisplay.push(url);
        });
        var optionsStirng = '' ;
        _.each(listToDisplay,function(item){
            optionsStirng += '<li class="uriItem"> <label><input class="submit" type="radio" name="uri" value="'+item+'" >'+item.replace('*token*',queryString.token)+'</label></li>' ;
        });
        $('#urlChooserList').html(optionsStirng);
        $('#token').val(queryString.token);
        $('#domain').val(queryString.domain);
        $('input.submit').on('change',submitForm);

        $('#urlFormChooser').on('submit',submitForm);


        $('.schemeSelector input').on('change',function(){
            if($(this).val() !== 'https://'){
                $('.shemeSansS').addClass('selected');
                $('.shemeAvecS').removeClass('selected');
            }else{
                $('.shemeSansS').removeClass('selected');
                $('.shemeAvecS').addClass('selected');
            }
        });
        $('.schemeSelector input:checked').trigger('change');

        $('.add').on('click',function(){
            go('options.html');
        });
    };


    var submitForm = function(e){
        var d = $('#urlFormChooser').serializeArray();
        var data = {} ;
        _.each(d,function(item){
            data[item.name] = item.value ;
        });
        e.preventDefault();
        if(typeof data.remember !== 'undefined'){
            addMemory(data.domain,data.scheme+data.uri,function(){
                go(generateUrl(data.scheme+data.uri,data.token,data.panel));
            });
        }else{
            go(generateUrl(data.scheme+data.uri,data.token,data.panel));
        }
    };


    var checkMemory = function(domain,token,panel){
        _.each(memory,function(item,key){
            if(key == domain){
                go(generateUrl(item,token,panel));
            }
        });
    };

    var generateUrl = function (uri,token,panel){
        uri = uri.replace('*token*',token);
        console.dir(panel);
        if(panel !== ''){
            uri +='?panel='+panel
        }
        return uri ;
    };

    var addMemory = function(domain,uri,callback){
        console.debug('remember : '+domain+ ' '+uri);
        memory[domain] = uri ;
        var textMemory = [];
        console.dir(memory);
        _.each(memory,function(item,key){
            textMemory.push(key+'|'+item);
        });
        textMemory = textMemory.join("\n");

        window.storeConfigurationKey('profilerUrlTemplateMemory',textMemory,callback);
    };


    /**
     * Load URL and put hte page into loading mode
     * @param url
     */
    var go = function(url){
        console.debug('GO : '+url);
        $('body').addClass('isloading');
        window.location = url ;
    };

    //Starter
    window.getConfigurationKey('profilerUrlTemplate',function(profilerUrlTemplate){

        listToTry = profilerUrlTemplate.split("\n");
        window.getConfigurationKey('profilerUrlTemplateMemory',function(profilerUrlTemplateMemory){
            var lines = profilerUrlTemplateMemory.split("\n");
            _.each(lines,function(item){
                if(item!==''){
                    var elements = item.split('|');
                    memory[elements[0]] = elements[1];
                }
            });
            startup();
        });
    });

})();