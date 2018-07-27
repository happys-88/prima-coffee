
	define(['modules/jquery-mozu', 'underscore', 'modules/backbone-mozu', "modules/models-product"], function ($, _, Backbone, ProductModel) {
	var url = "https://api.yotpo.com/v1/widget/4X91rXasdFWFBX4Rnh5WEr4NnvMwpFpjxzNFLubD/products/promoted_products";
		var slider;
		$.get(url, function(data, status){ 
		_.defer( function() {			
			var product = new ProductModel.Product(data.response); 
			var ReviewsView = Backbone.MozuView.extend({
				templateName: "modules/product/promoted-products",
				render: function () {
					var me = this;
					Backbone.MozuView.prototype.render.apply(this);
					this.productCarousel();
				},
				productCarousel: function () {
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
					 slider=$("#PromotedProductSlider").bxSlider({
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
					window.slider = slider;
				}
				
			});

			var productView = new ReviewsView({
					model: product,
					el: $("#promotedProds")
            });
			window.productView = productView;
			productView.render();
			$(window).resize(function () {
				slider.destroySlider();
				productView.productCarousel();
			});
		});
	});
});
