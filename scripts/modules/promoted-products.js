
	define(['modules/jquery-mozu', 
	'underscore', 
	'modules/backbone-mozu',
    'yotpo',
    'hyprlivecontext'],
	function ($, _, Backbone, yotpo, HyprLiveContext) {

	var yotpoApiKey = HyprLiveContext.locals.themeSettings.yotpoApiKey;
    var bottomline = HyprLiveContext.locals.themeSettings.bottomline;
    var yotpoBaseUrl = HyprLiveContext.locals.themeSettings.yotpoBaseUrl; 
    var url = ""+yotpoBaseUrl+"/"+yotpoApiKey+"/products/promoted_products";
    console.log("PROMOTED : "+url);
		var slider;
		$.get(url, function(data, status){ 
		_.defer( function() {	
			var Product = Backbone.MozuModel.extend();		
			var product = new Product(data.response); 
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
				},
				showYotpoRatingStars: function(ratingURL, currentProduct){
					var ratingElement, yotpoStars;  
					var  currentProductid="#"+currentProduct+" #product-rating" +" .yotpo-stars";
					ratingElement = $(currentProductid);    
					yotpoStars = '<span class="yotpo-icon rating-star yotpo-icon-empty-star"></span><span class="yotpo-icon rating-star yotpo-icon-empty-star"></span><span class="yotpo-icon rating-star yotpo-icon-empty-star"></span><span class="yotpo-icon rating-star yotpo-icon-empty-star"></span><span class="yotpo-icon rating-star yotpo-icon-empty-star"></span>' ;     
					$(ratingElement).html(yotpoStars);   
							var ratingAverageScore = ratingURL,
								starRating,
								decimalNumber;
								if (ratingAverageScore.toString().indexOf('.') > -1) {
									starRating = ratingAverageScore.toString().split('.');
									decimalNumber = true;
								} else {
									decimalNumber = false;
								} 
								var fullStarsToShow = " ",
								halfStarsToShow = " " ; 
				
							if(decimalNumber){  
								fullStarsToShow = starRating[0]; 
								halfStarsToShow = starRating[1]; 
								$(ratingElement).find('.yotpo-icon:lt('+fullStarsToShow+')').removeClass("yotpo-icon-empty-star").addClass("yotpo-icon-star");
								if(halfStarsToShow>=5 && halfStarsToShow<=9){ 
									$(ratingElement).find('.yotpo-icon:eq('+fullStarsToShow+')').removeClass("yotpo-icon-empty-star").addClass("yotpo-icon-half-star");    
								}   
							
							} else{ 
								fullStarsToShow = ratingAverageScore;    
								$(ratingElement).find('.yotpo-icon:lt('+fullStarsToShow+')').removeClass("yotpo-icon-empty-star").addClass("yotpo-icon-star");       
							} 
				 }
				
			});

			var productView = new ReviewsView({
					model: product,
					el: $("#promotedProds")
            });
			window.productView = productView;
			productView.render();
			productView.productCarousel();
				for (var i=0; i<product.get("products").length; i++) {
                      productView.showYotpoRatingStars(product.get("products")[i].average_score,product.get("products")[i].products_app_id);
                }
			$(window).resize(function () {
				slider.destroySlider();
				productView.productCarousel();
				
			});
		});
	});
});
