
	define(['modules/jquery-mozu', 'underscore', 'modules/backbone-mozu', "modules/models-product"], function ($, _, Backbone, ProductModel) {
	// var prdCode=$thisElem.attr("data-mz-productcode");
	var url = "https://api.yotpo.com/v1/widget/4X91rXasdFWFBX4Rnh5WEr4NnvMwpFpjxzNFLubD/products/promoted_products";
		$.get(url, function(data, status){ 
			         //console.log("Data Promoted Product: " + JSON.stringify(data) + "\nStatus: " + status);
			
		_.defer( function() {
			// var data = response;
			// prod_model.set({reviews: res});
			// newMod.set({reviews: res});
			//console.log("MODEL VAL : "+JSON.stringify(data.response));
			
			var product = new ProductModel.Product(data.response); 

			var ReviewsView = Backbone.MozuView.extend({
				templateName: "modules/product/promoted-products",
				render: function () {
					var me = this;
					Backbone.MozuView.prototype.render.apply(this);
					this.productCarousel();
				},
				productCarousel: function () {
					//this.render();
					var minSlides,
						maxSlides,
						slideWidth,
						slideMargin,
						windowWidth = $(window).width();
					if (windowWidth <= 767) {
						minSlides = 2;
						maxSlides = 2;
						slideMargin = 10;
						slideWidth = 333;
					} else {
						minSlides = 4;
						maxSlides = 12;
						slideWidth = 333;
						slideMargin = 15;
					}
					$("#PromotedProductSlider").bxSlider({
						minSlides: minSlides,
						maxSlides: maxSlides,
						moveSlides: 1,
						slideWidth: slideWidth,
						slideMargin: slideMargin,
						responsive: true,
						pager: false,
						speed: 1000,
						infiniteLoop: false,
						onSliderLoad: function() {
						$(".slider").css("visibility", "visible");
						}
                   });
				}
				
			});

			var productView = new ReviewsView({
					model: product,
					el: $("#promotedProds")
            });
			window.productView = productView;
			productView.render();
			//  productView.productCarousel();
			$(window).resize(function () {
				productView.render();
			}); 
			//view.render();
		});
	});
});
