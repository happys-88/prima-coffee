define(['modules/jquery-mozu', 'underscore', 'modules/backbone-mozu', 'hyprlive','modules/api', 'modules/models-checkout',
    'hyprlivecontext'], function ($, _, Backbone, Hypr, api,
        CheckoutModels, HyprLiveContext) {

    	$(document).ready(function () {
	    	var checkoutData = require.mozuData('checkout');
	    	var ShippingItemsDetail = Backbone.MozuView.extend({
				templateName: "modules/checkout/checkout-shipping-items-detail",
				render: function() {
					Backbone.MozuView.prototype.render.call(this);
					return this;
				}
			});

	    	var chkModel = new Backbone.Model(checkoutData);
			var view = new ShippingItemsDetail({
				model: chkModel,
				el: $('#itemsDetail')
			});
			view.render();
	    });
    });