
	define(['modules/jquery-mozu', 'underscore', 'modules/backbone-mozu', 'hyprlive', "modules/models-product", "modules/api"], function ($, _, Backbone, Hypr, ProductModel, api) {
	alert("Hello");
	// var prdCode=$thisElem.attr("data-mz-productcode");
	var url = "https://api.yotpo.com/v1/widget/4X91rXasdFWFBX4Rnh5WEr4NnvMwpFpjxzNFLubD/products/promoted_products";
		$.get(url, function(data, status){ 
			         //console.log("Data Promoted Product: " + JSON.stringify(data) + "\nStatus: " + status);
			
		_.defer( function() {
			// var data = response;
			// prod_model.set({reviews: res});
			// newMod.set({reviews: res});
			console.log("MODEL VAL : "+JSON.stringify(data.response));
			
			var product = new ProductModel.Product(data.response); 

			var ReviewsView = Backbone.MozuView.extend({
				templateName: "modules/product/promoted-products"
				
			});

			var view = new ReviewsView({
				model: product,
				el: $('#promotedProds') 
			});
			view.render();
		});
	});
});
