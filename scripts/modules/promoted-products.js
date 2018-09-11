
	define(['modules/jquery-mozu', 
	'underscore', 
	'modules/backbone-mozu',
	"modules/models-product",
    'yotpo'],
	function ($, _, Backbone, ProductModel, yotpo) {
	var url = "https://api.yotpo.com/v1/widget/4X91rXasdFWFBX4Rnh5WEr4NnvMwpFpjxzNFLubD/products/promoted_products";
		var slider;
		$.get(url, function(data, status){ 
		_.defer( function() {			
			var product = new ProductModel.Product(data.response); 
			var ReviewsView = Backbone.MozuView.extend({
				templateName: "modules/product/promoted-products",
				productCarousel: function () {
					var minSlides,
						maxSlides,
						slideWidth,
						slideMargin,
						pager,
						controls,
						windowWidth = $(window).width();
					if (windowWidth <= 767) {
						minSlides = 2;
						maxSlides = 2;
						slideMargin = 10;
						slideWidth = 333;
						pager = true;
						controls = false;
					} else {
						minSlides = 4;
						maxSlides = 12;
						slideWidth = 333;
						slideMargin = 15;
						pager = false;
						controls = true;
					}
					 slider=$("#PromotedProductSlider").bxSlider({
						minSlides: minSlides,
						maxSlides: maxSlides,
						moveSlides: 1,
						slideWidth: slideWidth,
						slideMargin: slideMargin,
						responsive: true,
						pager: pager,
						controls: controls,
						speed: 1000,
						infiniteLoop: false,
						touchEnabled: true,
						stopAutoOnClick: true,
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
			productView.productCarousel();
			yotpo.showYotpoRatingStars(".mz-recentproductlist-item");
			$(window).resize(function () {
				slider.destroySlider();
				productView.productCarousel();
				//yotpo.showYotpoRatingStars();
			});
		});
	});
});
