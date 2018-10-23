define(['modules/jquery-mozu',
        "modules/api",
        'modules/models-cart',
        'hyprlivecontext',
        'underscore'],
function($, Api, CartModels, hyprlivecontext, _) {

    window.paypalCheckoutReady = function() {

      var siteContext = hyprlivecontext.locals.siteContext,
          externalPayment = _.findWhere(siteContext.checkoutSettings.externalPaymentWorkflowSettings, {"name" : "PayPalExpress2"}),
          merchantAccountId = _.findWhere(externalPayment.credentials, {"apiName" : "merchantAccountId"}),
          environment = _.findWhere(externalPayment.credentials, {"apiName" : "environment"}),
          id = CartModels.Cart.fromCurrent().id,
          isCart = window.location.href.indexOf("cart") > 0;
          var urlLoc = window.location;
          if(window.order) {
            id = window.order.id;
          }
          
        window.paypal.checkout.setup(merchantAccountId.value, {
            environment: environment.value,
            click: function(event) {
                window.paypal.checkout.closeFlow();
                event.preventDefault();
                var url = "../paypal/token?id=" + id + (!document.URL.split('?')[1] ? "": "&" + document.URL.split('?')[1].replace("id="+id,"").replace("&&", "&"));
                if (isCart)
                  url += "&isCart="+ isCart;
                window.paypal.checkout.initXO();
                $.ajax({
                    url: url,
                    type: "GET",
                    async: true,

                    //Load the minibrowser with the redirection url in the success handler
                    success: function (token) {
                      
                        var url = window.paypal.checkout.urlPrefix + token.token;
                        //Loading Mini browser with redirect url, true for async AJAX calls
                        window.paypal.checkout.startFlow(url);
                    },
                    error: function (responseData, textStatus, errorThrown) {
                      
                        console.log("Error in ajax post " + JSON.stringify(responseData));
                        //Gracefully Close the minibrowser in case of AJAX errors
                        window.paypal.checkout.closeFlow();
                    }
                });
            },
            button: ['btn_xpressPaypal']
        });
    };
    var paypal = {
      scriptLoaded: false,
     loadScript: function() {
      var self = this;
       if (this.scriptLoaded) return;
        this.scriptLoaded = true;
      $.getScript("//www.paypalobjects.com/api/checkout.js").done(function(scrit, textStatus){

      }).fail(function(jqxhr, settings, exception) {
        console.log(jqxhr);
      });
    }
   };
   return paypal;
});
