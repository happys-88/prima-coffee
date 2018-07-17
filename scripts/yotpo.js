define([
    "modules/jquery-mozu",
    "hyprlive",
    "modules/backbone-mozu",
    "hyprlivecontext",
    "modules/api"
], 
function ($, Hypr, Backbone, HyprLiveContext, api) {
  var YotPo = {
    update: function() {
        var productCodes = [];

        // Show Yotpo Ratings 
        var yotpoApiKey = HyprLiveContext.locals.themeSettings.yotpoApiKey;
        var bottomline = HyprLiveContext.locals.themeSettings.bottomline;
        var yotpoBottomlineBaseUrl = HyprLiveContext.locals.themeSettings.yotpoBottomlineBaseUrl;

        $(".mz-productlist-list .mz-productlist-item").each(function(index, value) { 
            var currentProduct = $(this);
            var productCode = $(this).find(".mz-productlisting").data("mz-product");
            productCodes[index] = productCode;
            var ratingURL = ""+yotpoBottomlineBaseUrl+"/"+yotpoApiKey+"/"+productCode+"/"+bottomline+"";
            var ratingElement = $(currentProduct).find("#product-rating").find(".yotpo-stars");  
            var yotpoStars = '<span class="yotpo-icon rating-star yotpo-icon-empty-star"></span><span class="yotpo-icon rating-star yotpo-icon-empty-star"></span><span class="yotpo-icon rating-star yotpo-icon-empty-star"></span><span class="yotpo-icon rating-star yotpo-icon-empty-star"></span><span class="yotpo-icon rating-star yotpo-icon-empty-star"></span>' ;     

            $.get(ratingURL, function(data, status){ 
                var ratingAverageScore = data.response.bottomline.average_score,
                    ratingTotalCount = data.response.bottomline.total_reviews,
                    starRating = ratingAverageScore.toString().split('.'), 
                    decimalNumber = (ratingAverageScore - Math.floor(ratingAverageScore)) !== 0,
                    fullStarsToShow = " ",
                    halfStarsToShow = " " ; 
                
                $(ratingElement).html(yotpoStars);

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

            }).done(function() {  
          
            }).fail(function() {
                $(ratingElement).html(yotpoStars);    
            });
        });
        if (productCodes.length > 0) {
            var str = "";
            for (var i = 0; i < productCodes.length; i++) {
                if (i == productCodes.length-1) {
                    str += "productCode eq "+ "'" + productCodes[i] + "'";
                } else {
                    str += "productCode eq "+ "'" + productCodes[i] + "'"+ " or ";
                }
            }
            
            api.request("GET", "/api/commerce/catalog/storefront/products/?filter=(" + str + ")&pageSize="+productCodes.length ).then(function(response){
                var items = response.items;
                var productData = [];
                for (var i = 0; i < items.length; i++) {
                    var item = items[i];
                    var itemOptions = item.options;
                    var itemVariations = item.variations;
                    var hasStock = false;
                    var hasOptions = false;
                    if (itemVariations) {
                        for (var k = 0; k < itemVariations.length; k++) {
                            var itemVariation = itemVariations[k];
                            var itemInventoryInfo = itemVariation.inventoryInfo;
                            if (itemInventoryInfo.onlineStockAvailable > 0) {
                                hasStock = true;
                            }
                        }
                    } else {
                        var itemInventoryInfoo = item.inventoryInfo;
                        if (itemInventoryInfoo.onlineStockAvailable > 0) {
                            hasStock = true;
                        }
                    }
                    if (itemOptions) {
                        for (var l = 0; l < itemOptions.length; l++) {
                            if (itemOptions[l].attributeDetail.dataType != 'ProductCode') {
                                hasOptions = true;
                            }
                        }
                    }
                    productData[i] = {productCode:item.productCode,hasOptions:hasOptions,hasStock:hasStock};
                }
                $(".mz-productlist-list .mz-productlist-item").each(function(index, value) {
                    var currentProduct = $(this);
                    var shippingMessage = $(currentProduct).find(".shipping-messages");
                    var seePriceInCart = $(currentProduct).find(".see-price-in-cart");
                    var prodCode = $(this).find(".mz-productlisting").data("mz-product");
                    var prod = findElement(productData, prodCode);
                    var button = $(this).find('[data-mz-productcode="'+prodCode+'"]');
                    if (prod.hasStock === true) {
                        button.prop('disabled', false);
                        shippingMessage.show();
                        seePriceInCart.show();
                    }
                    if (prod.hasOptions === true) {
                        button.addClass('mz-option-add-to-cart');
                        button.attr("data-target", "#optionModal");
                    } else {
                        button.addClass('mz-addon-add-to-cart');
                        button.attr("data-target", "#addonModal");
                    }

                });
            });
            
        }
    }
  };
  YotPo.update();
  return YotPo;
});
function findElement(arr, element) {
    var product = arr.find(function(el) {
      return el.productCode == element;
    });
    return product;
}