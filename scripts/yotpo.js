define([
    "modules/jquery-mozu",
    "underscore",
    "hyprlive",
    "modules/backbone-mozu",
    "hyprlivecontext",
    "modules/api",
    'modules/block-ui' 
], 
function ($, _, Hypr, Backbone, HyprLiveContext, api, blockUiLoader) {

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
            var strTwo = "";
            var strThree = "";
            var x = 0;
            var y = 0;
            var z = 0;
            x = parseInt(x, 10);
            y = parseInt(y, 10);
            z = parseInt(z, 10);
            for (var i = 0; i < productCodes.length; i++) {
                if (i > 67) {
                    if (i === productCodes.length-1) {
                        strThree += "productCode eq "+ "'" + productCodes[i] + "'";
                    } else {
                        strThree += "productCode eq "+ "'" + productCodes[i] + "'"+ " or ";
                    }
                } else if (i > 33) {
                    y++;
                    if (i === productCodes.length-1 || i === 67) {
                        strTwo += "productCode eq "+ "'" + productCodes[i] + "'";
                    } else {
                        strTwo += "productCode eq "+ "'" + productCodes[i] + "'"+ " or ";
                    }
                } else {
                    x++;
                    if (i === productCodes.length-1 || i === 33) {
                        str += "productCode eq "+ "'" + productCodes[i] + "'";
                    } else {
                        str += "productCode eq "+ "'" + productCodes[i] + "'"+ " or ";
                    }
                }
            }
            var items;
            if (str.length) {
                api.request("GET", "/api/commerce/catalog/storefront/products/?filter=(" + str + ")&pageSize="+x ).then(function(response){
                    items = response.items;
                    if (strTwo.length) {
                        api.request("GET", "/api/commerce/catalog/storefront/products/?filter=(" + strTwo + ")&pageSize="+y ).then(function(resp){
                            items.push.apply(items,resp.items);
                            if (strThree.length) {
                                api.request("GET", "/api/commerce/catalog/storefront/products/?filter=(" + strThree + ")&pageSize="+z ).then(function(res){
                                    items.push.apply(items,res.items);
                                    YotPo.enableButtons(items);
                                });
                            } else {
                               YotPo.enableButtons(items);
                               blockUiLoader.unblockUi(); 
                            }
                        });
                    } else {
                       YotPo.enableButtons(items);
                       blockUiLoader.unblockUi(); 
                    }
                });
            } else {
                blockUiLoader.unblockUi();
            } 
            
        }
    },
    enableButtons: function(items) {
        blockUiLoader.unblockUi();
        var productData = [];
        for (var i = 0; i < items.length; i++) {
            var fieldDisplayOOSProp = false;
            var fieldDisplayOOSPropVal;
            var stockCount = 0;
            stockCount = parseInt(stockCount, 10);
            var item = items[i];
            var itemOptions = item.options;
            var itemVariations = item.variations;
            var hasOptions = false;
            var manageStock = item.inventoryInfo.manageStock;
            var outOfStockBehavior = item.inventoryInfo.outOfStockBehavior;
            var properties = item.properties;
            var prop = _.find(properties, function(property){ return property.attributeFQN == 'tenant~field_display_oos1'; });
            if (prop) {
                fieldDisplayOOSProp = true;
                fieldDisplayOOSPropVal = prop.values[0];
            }
            if (itemVariations) {
                for (var k = 0; k < itemVariations.length; k++) {
                    var itemVariation = itemVariations[k];
                    if (itemVariation.inventoryInfo.onlineStockAvailable > 0) {
                        stockCount += itemVariation.inventoryInfo.onlineStockAvailable;
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
            productData[i] = {productCode:item.productCode,hasOptions:hasOptions,stockCount:stockCount,manageStock:manageStock,fieldDisplayOOSProp:fieldDisplayOOSProp,fieldDisplayOOSPropVal:fieldDisplayOOSPropVal,outOfStockBehavior:outOfStockBehavior};
        }
        var stockThreshold = Hypr.getLabel('stockThreshold');
        var outOfStock = Hypr.getLabel('outOfStock');
        var inStock = Hypr.getLabel('inStock');
        var itemDiscontinued = Hypr.getLabel('itemDiscontinued');
        $(".mz-productlist-list .mz-productlist-item").each(function(index, value) {
            var currentProduct = $(this);
            var shippingMessage = $(currentProduct).find(".shipping-messages");
            var prodCode = $(this).find(".mz-productlisting").data("mz-product");
            var prod = findElement(productData, prodCode);
            var button = $(this).find('[data-mz-productcode="'+prodCode+'"]');
            
            if (prod.fieldDisplayOOSProp && prod.fieldDisplayOOSPropVal.value == '4') {
                $(this).find(".stock-message").html(itemDiscontinued);
            } else {
                button.prop('disabled', false);
                if (prod.manageStock === false) {
                    $(this).find(".stock-message").html(inStock);
                    shippingMessage.show();
                } else {
                    if(prod.stockCount < 10 && prod.stockCount > 0) {
                        $(this).find(".stock-threshold-message").html(stockThreshold.replace("{0}", prod.stockCount));
                        shippingMessage.show();
                    } else if(prod.stockCount >= 10) {
                        $(this).find(".stock-message").html(inStock);
                        shippingMessage.show();
                    } else {
                        if (prod.outOfStockBehavior == 'AllowBackOrder') {
                            //If we need to show message in case of AllowBackOrder
                            // $(this).find(".stock-message").html(inStock);
                        } else {
                            $(this).find(".out-of-stock-message").html(outOfStock);
                        }
                        
                    }
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
    },
    showYotpoRatingStars: function(listClassName){
        if ((listClassName === ".mz-productlist-item") || (listClassName === ".mz-product-quick-view") || (listClassName === ".mz-recentproductlist-item")){  
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