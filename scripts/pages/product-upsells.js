define([
	'modules/jquery-mozu',
	'underscore',
	"modules/backbone-mozu",
	'hyprlive',
	"bxslider",
	"modules/api",
	"modules/models-product",
	"pages/cart",
	 "modules/models-cart"
], function ($, _, Backbone, Hypr, bxslider, api, ProductModel, cart, cartModel) {
	var productUpSellView = Backbone.MozuView.extend({
	    templateName: 'modules/product/product-upsell',  
	    productCarousel: function () {
			this.render();
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
	        $('#UpSellSlider').bxSlider({ 
				minSlides: minSlides,
                maxSlides: maxSlides,
                moveSlides: 1,
                slideWidth: slideWidth,
                slideMargin: slideMargin,
                responsive: true,
                pager: false,
                speed: 1000,
                infiniteLoop: false,
                hideControlOnEnd: true,
		        onSliderLoad: function() {
		            $(".slider").css("visibility", "visible");
		        }  
			});
		}
	});

	var sell = require.mozuData("cart");    
	var cartModels = cartModel.Cart.fromCurrent();
	var indexcartnewproduct=-1; 
	var newaddedproductcode;
	
	if(sell.isEmpty!==true){
		var length = sell.changeMessages.length-1;
		for(var index = length; index >= 0; index--) {
			if(sell.changeMessages[index].verb !== "Merged"){
				newaddedproductcode = sell.changeMessages[index].metadata[0].productCode;
		  		break;
			}
	 	}
	 	
		$.each(sell.items, function( index, value ) {
			if(value.product.productCode==newaddedproductcode){
				indexcartnewproduct=index;
			} 
		 });
	 
		var prodCodeUpSell = [];
		var variantion=[];
			if(indexcartnewproduct!=-1){
				$.each(sell.items[indexcartnewproduct].product.properties, function( index, value ) {
					if(value.attributeFQN == "tenant~product-upsell"){
						$.each(value.values, function( index, value ){
			
							prodCodeUpSell.push(value.value);
							if(value.value.lastIndexOf("-")!=-1){
								variantion.push(value.value.slice(0,value.value.lastIndexOf("-")));
							}else{
								variantion.push(value.value);
							}
						});
					}
				});
		 	}
 
	   if(prodCodeUpSell.length>0){ 
				var Upsellurl = "";
				var upselgenerateURL = "";
				var items=[];
				var product = ProductModel.Product.fromCurrent();
				$.each(prodCodeUpSell, function( index, value ) {
					Upsellurl = "productCode eq "+ "'" + value + "'"+ " or ";
					upselgenerateURL= upselgenerateURL + Upsellurl;
					api.request("GET", "/api/commerce/catalog/storefront/products/"+variantion[index]+"?"+"variationProductCode="+value ).then(function(body){
						items.push(body); 
					});
				});
				
				upselgenerateURL = upselgenerateURL.slice(0, -3);
				
				var upsellUrl= "/api/commerce/catalog/storefront/products/?filter=(" + upselgenerateURL + ")";
				var Upsellview;
				var upsell={
					upsellcall:function(){
							api.request("GET", upsellUrl ).then(function(body){
								$.each(body.items, function( index, value ) {
									items.push(value);
								});					
								product.set("items",items);
							 Upsellview = new productUpSellView({
								model:product,
								el: $('#upsell')
							});
							
							Upsellview.render();
							Upsellview.productCarousel();
						});
					} 
	   };
	   upsell.upsellcall();
	   $(window).resize(function(){
		Upsellview.productCarousel();
	});
	 }
	}
	
  
	
});
