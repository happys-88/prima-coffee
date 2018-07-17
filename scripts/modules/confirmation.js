require(["modules/jquery-mozu", "underscore", 'modules/api', "hyprlive", "modules/backbone-mozu", "modules/models-checkout", "modules/views-messages", 'hyprlivecontext', 'modules/preserve-element-through-render'], function ($, _, api, Hypr, Backbone, CheckoutModels, messageViewFactory, HyprLiveContext, preserveElements) {
    
	var SignupGuest = Backbone.MozuView.extend({
			templateName: "modules/checkout/confirmation-signup",
			additionalEvents: {
				"click [data-mz-value=submitAccount]":"signup"
			},
            validate: function (payload) {
				var filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
				if(!filter.test(payload.account.emailAddress)) return this.displayMessage(Hypr.getLabel('emailMissing')), false;
				if (!payload.account.emailAddress) return this.displayMessage(Hypr.getLabel('emailMissing')), false;
	            if (!payload.password) return this.displayMessage(Hypr.getLabel('passwordMissing')), false;
	            if (payload.password !== $('#confirmPasswordSignUp').val()) return this.displayMessage(Hypr.getLabel('passwordsDoNotMatch')), false;
	            return true;
	        },
            displayMessage: function (msg) {
	            // this.setLoading("false");
                $('#errorMessageSignUp').html('<span class="mz-validationmessage">' + msg + '</span>');
	        },
            displayApiMessage: function (xhr) {
                if(typeof xhr.message !== 'undefined' && xhr.message !== '') {
                    var errorMsg = xhr.message;
                    if(errorMsg.toLowerCase().indexOf('missing') > -1 ) {
                        var val = errorMsg.split(':');
                        errorMsg = val[1].trim();
                        errorMsg = errorMsg.substr(errorMsg.indexOf(' ')+1, errorMsg.length);
                    }
                    $('#errorMessageSignUp').html('<span class="mz-validationmessage">' + errorMsg + '</span>');
                }
            },
			signup: function () {
            var self = this,
                email = $('#emailAddressSignup').val(),
                firstName = '',
                lastName = '',
                password = $('#passwordSignup').val(),
                payload = {
                    account: {
                        emailAddress: email,
                        userName: email,
                        firstName: firstName,
                        lastName: lastName,
                        contacts: [{
                            email: email,
                            firstName: firstName,
                            lastNameOrSurname: lastName
                        }]
                    },
                    password: $('#passwordSignup').val()
                };
            if (this.validate(payload)) {   
            	//var user = api.createSync('user', payload);
                // this.setLoading(true);
                return api.action('customer', 'createStorefront', payload).then(function () {
                    $('#createAccountSignUp').hide();
                    $('#accountCreatedSignUp').show();
                }, self.displayApiMessage);
            }
        } 
		});

    var DealsView = Backbone.MozuView.extend({
            templateName: "modules/checkout/subscribe-deals",
            subscribeDeals: function(){
                var deals = $('#PSDeals').is(':checked') ? $('#PSDeals').val() : '';
                deals = $('#PSNewsLetter').is(':checked') ? deals+","+$('#PSNewsLetter').val() : deals+","+'';
                deals = $('#PSBlogs').is(':checked') ? deals+","+$('#PSBlogs').val() : deals+","+'';
                var email = $('#emailId').val();
                if(deals !== '') {
                    api.request("POST", "/mailchimp", {'accountId':email, 'deals':deals}).then(function (response){
                       console.log("Response 22 : "+JSON.stringify(response));    
                    }, function(err) {
                        console.log("Failure : "+JSON.stringify(err));
                    });
                    /*$.get("/mailchimp", {accountId:email, deals:deals},  function(res){ 
                       console.log("Success!!");   
                    }).fail(function(err) {
                        console.log("Failure "+JSON.stringify(err));   
                    });*/
                }
            }
        });

    $(document).ready(function () {
		var orderData = require.mozuData('order');
		var orderModel = Backbone.Model.extend(); 
		var order = new orderModel(orderData);
		var view = new SignupGuest({
			model: order,
			el: $('#guestUserSignUp')
		});
		view.render();
        var emailOrder = new orderModel(orderData);
        var dealsView = new DealsView({
            model: order,
            el: $('#confirmationDeals')
        });
        dealsView.render();  
    });
});