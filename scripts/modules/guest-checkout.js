require(["modules/jquery-mozu", "underscore", "hyprlive", "modules/backbone-mozu", 'hyprlivecontext'], function ($, _, Hypr, Backbone, HyprLiveContext) {
	var model;
	var SignUpModel = Backbone.Model.extend({
		defaults: {
			email : ''
		},
	    validation: {
	    	/*email: {
	            required: true,
	            pattern: 'email'
	        }*/
	    },
		validate: function(attrs) {
	        var invalid=[];
	        if (attrs.email!=="abcd@gmail.com") invalid.push("Invalid Email");
	        if (invalid.length>0) return invalid;
	    }
	});

	var GuestCheckoutView = Backbone.MozuView.extend({
		templateName: 'modules/checkout/checkout-as-guest',
		initialize: function () { 
			model = new SignUpModel();
			 Backbone.Validation.bind(this);
		},
		checkoutAsGuest: function(){
			 // var data = this.$el.serializeObject();
			var me = this;
			var email = $('#guestEmail').val();
			var pattern =/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
   			if(pattern.test(email)) {
   				var url = HyprLiveContext.locals.pageContext.url;
   				var domain = url.split('?')[0];
   				url = domain + '/checkout';
   				sessionStorage.setItem("guestEmail", email);
   	   			window.location = url;
   			} else {
   				$('#guestEmailError').removeClass('hide');
   			}
		}

	});
	
	var Mod = Backbone.MozuModel.extend({});
	// var dummyModel = new SignUpModel();
	var dummyModel = new Mod();
	var view = new GuestCheckoutView({
		model: dummyModel,
		el: $('#guestForm')
	});
	view.render();

	$(document).ready(function() {
		$("#guestEmail").keypress(function(e) {
			if(e.which == 13) {
		        event.preventDefault();
		        $("#checkoutAsGuestBtn").click();     
		    }  
		});
	});

});