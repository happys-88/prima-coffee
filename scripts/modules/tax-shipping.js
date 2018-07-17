define(['modules/jquery-mozu', 'underscore', 'modules/backbone-mozu', 'hyprlive', "modules/models-cart", "hyprlivecontext", "modules/api"], function ($, _, Backbone, Hypr, CartModels, HyprLiveContext, api) {

	
		var StateModel = Backbone.Model.extend();

		var states = new StateModel();

		var cartModel = require.mozuData("cart");
		var total;	
		api.get("cart").then(function(body){
			total = body.data.total;
        }); 

		var stateData = new CartModels.Cart(states); 
		var TaxView = Backbone.MozuView.extend({
			templateName: "modules/cart/tax-shipping",
			additionalEvents: {
				"change [data-mz-value=usShipping]":"poupulateShipping"
			},
			poupulateShipping: function(){
				var instance_total = total;
				alert("Hello : "+instance_total);
				var tax = 15;
				instance_total = Number(instance_total)+Number(tax);
				alert("Total : "+JSON.stringify(this.model));
				
				/*cartModel.apiModel.updateCart({"total":115}).then(function(o) {
					alert("Value set : "+o);
					window.location = (HyprLiveContext.locals.siteContext.siteSubdirectory||'') + "/cart";
				});*/
				/*api.request("PUT", "api/commerce/carts/current", {
  
				   "total": 25
				     
				   }).then(function(body){
				     console.log(body);
				   });*/

				/*api.request("POST", "/api/commerce/carts/current", {
				    "total": instance_total
			   	}).then(function(){
			     window.location = (HyprLiveContext.locals.siteContext.siteSubdirectory||'') + "/cart";
			   	});*/
			}
		});

		var view = new TaxView({
			model: stateData,
			el: $('#stateOptions')
		});
		view.render();
	});
	