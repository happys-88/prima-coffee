define([
	'modules/jquery-mozu',
	'underscore',
	"modules/backbone-mozu",
	'hyprlive',
	"bxslider",
	"modules/api",
	"modules/models-product",
	"pages/cart",
	"modules/models-cart",
	"hyprlivecontext",
	'yotpo'
], function ($, _, Backbone, Hypr, bxslider, api, ProductModel, cart, cartModel, HyprLiveContext, yotpo) {
	var slider;
	var productCrossSellView = Backbone.MozuView.extend({
	    templateName: 'modules/product/product-crosssells',  
	    productCarousel: function () {
			//this.render();
			yotpo.showYotpoRatingStars(); 
			var minSlides,
				maxSlides,
				slideWidth,
				slideMargin,
				windowWidth=$( window ).width();
			if(windowWidth<=767){
				minSlides=2;
				maxSlides=2;
				slideMargin= 10;
				slideWidth= 333;
			}else{
				minSlides=4;
				maxSlides=12;
				slideWidth= 333;
				slideMargin=15;
			}
	        slider = $('#crossSellSlider').bxSlider({ 
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

	var getProduct = require.mozuData("product");       
	var cartModels = cartModel.Cart.fromCurrent();
	var indexcartnewproduct;
	var prodCodeCrossSell = [];
	var variantion=[];
	var yotpoBottomlineBaseUrl = HyprLiveContext.locals.themeSettings.yotpoBottomlineBaseUrl;
	var yotpoApiKey = HyprLiveContext.locals.themeSettings.yotpoApiKey;
	var bottomline = HyprLiveContext.locals.themeSettings.bottomline;
	if(typeof getProduct.properties!= "undefined"){
		$.each(getProduct.properties, function( index, value ) {
			if(value.attributeFQN == "tenant~product-crosssell"){
				$.each(value.values, function( index, value ){ 
					var currentProduct = $(this);
					prodCodeCrossSell.push(value.value); 
					if(value.value.lastIndexOf("-")!=-1){
						variantion.push(value.value.slice(0,value.value.lastIndexOf("-")));
					}else{
						variantion.push(value.value);
					}         
				});
			}
		});

	    if(prodCodeCrossSell.length>0){
			var Crosssellurl = "";
			var CrosssellgenerateURL = "";
			var items=[];
			var product = ProductModel.Product.fromCurrent();

			$.each(prodCodeCrossSell, function( index, value ) {
				Crosssellurl = "productCode eq "+ "'" + value + "'"+ " or ";
				CrosssellgenerateURL= CrosssellgenerateURL + Crosssellurl;
				if(variantion[index]!== value){
					api.request("GET", "/api/commerce/catalog/storefront/products/"+variantion[index]+"?"+"variationProductCode="+value ).then(function(body){
						items.push(body); 
					}); 
				}
			});

			CrosssellgenerateURL = CrosssellgenerateURL.slice(0, -3);
			var upsellUrl= "/api/commerce/catalog/storefront/products/?filter=(" + CrosssellgenerateURL + ")"; 
			var crosssellview;
			var crosssell = {
				crosssellcall:function(){
					api.request("GET", upsellUrl ).then(function(body){
						$.each(body.items, function( index, value ) {
							items.push(value);
						});	
						product.set("items",items);
						
						crosssellview = new productCrossSellView({
							model:product,
							el: $('#product-crosssells')
						});
				
						crosssellview.render();
						crosssellview.productCarousel();

						yotpo.showYotpoRatingStars(); 

					});
	   			}
			};

			crosssell.crosssellcall();

			$(window).resize(function(){
				slider.destroySlider(); 
				crosssellview.productCarousel();
			});  
		} 
	}
}); 



