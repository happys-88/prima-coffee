define([
    "modules/jquery-mozu",
    "hyprlive",
    "modules/backbone-mozu",
    "hyprlivecontext",
    "modules/api"
], 
function ($, Hypr, Backbone, HyprLiveContext, api) {
    // Show Yotpo Ratings
    var yotpoApiKey = HyprLiveContext.locals.themeSettings.yotpoApiKey;
    var bottomline = HyprLiveContext.locals.themeSettings.bottomline;
    var yotpoBottomlineBaseUrl = HyprLiveContext.locals.themeSettings.yotpoBottomlineBaseUrl; 

    var YotPo = {
    update: function() {
        var productCodes = [];

        // Show Yotpo Ratings 
        $(".mz-productlist-list .mz-productlist-item").each(function(index, value) {  
            var currentProduct = $(this);
            var productCode = $(this).find(".mz-productlisting").data("mz-product");
            productCodes[index] = productCode;
            var ratingURL = ""+yotpoBottomlineBaseUrl+"/"+yotpoApiKey+"/"+productCode+"/"+bottomline+"";
            YotPo.yotpoReviewMethod(ratingURL, currentProduct);
            
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
                    var stockCount = 0;
                    stockCount = parseFloat(stockCount);
                    var item = items[i];
                    var itemOptions = item.options;
                    var itemVariations = item.variations;
                    var hasOptions = false;
                    var hasVariations = false;
                    if (itemVariations) {
                        for (var k = 0; k < itemVariations.length; k++) {
                            var itemVariation = itemVariations[k];
                            if (itemVariation.inventoryInfo.onlineStockAvailable > 0) {
                                stockCount += itemVariation.inventoryInfo.onlineStockAvailable;
                                hasVariations = true;
                            }
                        }
                    } else {
                        var itemInventoryInfoo = item.inventoryInfo;
                        if (item.inventoryInfo.onlineStockAvailable > 0) {
                            stockCount = item.inventoryInfo.onlineStockAvailable;
                        }
                    }
                    if (itemOptions) {
                        for (var l = 0; l < itemOptions.length; l++) {
                            if (itemOptions[l].attributeDetail.dataType != 'ProductCode') {
                                hasOptions = true;
                            }
                        }
                    }
                    productData[i] = {productCode:item.productCode,hasOptions:hasOptions,hasVariations:hasVariations,stockCount:stockCount};
                }
                $(".mz-productlist-list .mz-productlist-item").each(function(index, value) {
                    var currentProduct = $(this);
                    var shippingMessage = $(currentProduct).find(".shipping-messages");
                    var seePriceInCart = $(currentProduct).find(".see-price-in-cart");
                    var prodCode = $(this).find(".mz-productlisting").data("mz-product");
                    var prod = findElement(productData, prodCode);
                    var button = $(this).find('[data-mz-productcode="'+prodCode+'"]');
                    if (prod.stockCount > 0) {
                        button.prop('disabled', false);
                        shippingMessage.show();
                        seePriceInCart.show();
                    }
                    if (prod.hasVariations) {
                        var stockThreshold = Hypr.getLabel('stockThreshold');
                        var outOfStock = Hypr.getLabel('outOfStock');
                        var inStock = Hypr.getLabel('inStock');
                        if(prod.stockCount < 10 && prod.stockCount > 0) {
                            $(this).find("#"+prodCode+"").show();
                            $(this).find("#stock-messages-"+prodCode+"").hide();
                            $(this).find("#"+prodCode+"").html(stockThreshold.replace("{0}", prod.stockCount));
                        } else if(prod.stockCount === 0) {
                            $(this).find("#"+prodCode+"").show();
                            $(this).find("#"+prodCode+"").html(outOfStock);
                        } else {
                            $(this).find("#"+prodCode+"").show();
                            $(this).find("#stock-messages-"+prodCode+"").hide();
                            $(this).find("#"+prodCode+"").html(inStock);
                        }
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
    },
    showYotpoRatingStars: function(listClassName){ 
        if(listClassName === ".mz-productlist-item"){ 
            listClassName = listClassName; 
        }else{
            listClassName = ".mz-productlist-item-slider";          
        } 
          
        $(listClassName).each(function(index, value) {      
            var currentProduct = $(this);
            var productCode = $(this).data("mz-product"); 
            var ratingURL = ""+yotpoBottomlineBaseUrl+"/"+yotpoApiKey+"/"+productCode+"/"+bottomline+"";
            YotPo.yotpoReviewMethod(ratingURL, currentProduct);  
        }); 
    },
    yotpoReviewMethod: function(ratingURL, currentProduct){ 
        var ratingElement, yotpoStars;   
        ratingElement = $(currentProduct).find("#product-rating").find(".yotpo-stars");    
        yotpoStars = '<span class="yotpo-icon rating-star yotpo-icon-empty-star"></span><span class="yotpo-icon rating-star yotpo-icon-empty-star"></span><span class="yotpo-icon rating-star yotpo-icon-empty-star"></span><span class="yotpo-icon rating-star yotpo-icon-empty-star"></span><span class="yotpo-icon rating-star yotpo-icon-empty-star"></span>' ;     
        $(ratingElement).html(yotpoStars);   
        $.get(ratingURL, function(data, status){ 
            if(status === "success" && typeof ratingURL !=="undefined"){ 
                var ratingAverageScore = data.response.bottomline.average_score,
                    ratingTotalCount = data.response.bottomline.total_reviews,
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

