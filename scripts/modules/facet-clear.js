define(['modules/jquery-mozu', 'modules/api'], function($, api) {

 return function makeClearUrl(url, facetField) {
            var uri_dec = decodeURIComponent(url);
            var finalURL = uri_dec;
            if(uri_dec.indexOf("=") >= 0) { 
                var params = uri_dec.split("=");
                var deprecateVals = params[1].split(",");
                var baseURl = params[0];

                var newParams="";
                var count = 0;
                for(var i = 0; i < deprecateVals.length; i++)
                {
                   if((deprecateVals[i].toLowerCase()).indexOf(facetField.toLowerCase()) == -1 ) {
                        if(i>0 && i < deprecateVals.length)
                            newParams = newParams+",";
                        newParams = newParams+deprecateVals[i];
                   }
                }
                newParams = newParams.replace(/^,|,$/g,'');
                finalURL = baseURl+"="+newParams;
                // Set directory URI as the redirection URL if no filters is present
                if(finalURL.split("=")[1] === '')
                   finalURL = finalURL.split("?")[0];
                
            }
            finalURL = encodeURI(finalURL);
            return finalURL;            
        };
    });