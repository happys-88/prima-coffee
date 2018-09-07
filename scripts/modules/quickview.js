define([
    'modules/jquery-mozu',
    'underscore',
    'modules/api',
    'modules/backbone-mozu',
    'hyprlivecontext',
    'modules/models-product',
    'bxslider',
    "pages/cart",
    "modules/models-cart",
    "modules/page-header/global-cart",
    "modules/cart-monitor",
    "hyprlive",
    "modules/block-ui",
    'yotpo'

], function($, _, api, Backbone, HyprLiveContext, ProductModels, bxslider, cart, cartModel, GlobalCart, CartMonitor, Hypr, blockUiLoader, yotpo) { 
$(document).on('click', '.mz-quick-view', function (event) {
    var $Elem = $(event.currentTarget);
    var prdCode = $Elem.attr("data-mz-productcode-quickview");
    var slider; 
    api.request("GET", "/api/commerce/catalog/storefront/products/" + prdCode).then(function (body) {
        var quickview = Backbone.MozuView.extend({
            templateName: 'modules/product/quickview',
            additionalEvents: {
                'click .addtocart': 'AddToCart',
                "click [data-mz-product-option='tenant~color']": "colorswatch",
                "change [data-mz-value='quantity']": "onQuantityChange",
                "change .mz-productoptions-option": "onOptionChange",
                "click [data-mz-qty-minus]": "quantityMinus",
                "click [data-mz-qty-plus]": "quantityPlus",
                "click .bx-controls-direction a":"clickOnNextOrprevious",
                "keyup [id=qty-field]":"updateqtyManual",
                "click .login-for-lowprice" : "closeQuickviewModal"

            },
            initialize: function() {
                this.productThumbSlider();
                // code for stock
                var properties = this.model.get('properties');

                var shippingMessage;
                var availabilityMessage;
                var expectedShipMessage;
                var shippingProps = _.filter(properties, function(property){ return property.attributeFQN == "tenant~availability" || property.attributeFQN == "tenant~expected-ship-date-message"; });
                if (shippingProps) {
                    for (var y = 0; y < shippingProps.length; y++) {
                        var shippingProp = shippingProps[y];
                        if (shippingProp.attributeFQN == "tenant~availability") {
                            availabilityMessage = shippingProp.values[0].stringValue;
                        } else if (shippingProp.attributeFQN == "tenant~expected-ship-date-message") {
                            expectedShipMessage = shippingProp.values[0].stringValue;
                        }
                    }
                }

                var prop = _.find(properties, function(property){ return property.attributeFQN == 'tenant~field_display_oos1'; });
                if (prop) {
                    this.model.set('fieldDisplayOOSProp', true);
                    this.model.set('fieldDisplayOOSPropVal', prop);
                } else {
                    this.model.set('fieldDisplayOOSProp', false);
                }
                var variationTotalStock = 0;
                variationTotalStock = parseInt(variationTotalStock, 10);
                var someOptionsInStock = false;
                var productUsage = this.model.get('productUsage');
                if (productUsage == 'Configurable') {
                    var pVariations = this.model.get('variations');
                    if (pVariations && pVariations.length > 0) {
                        for (var x = 0; x < pVariations.length; x++) {
                            var stockAvailable = pVariations[x].inventoryInfo.onlineStockAvailable;
                            stockAvailable = parseInt(stockAvailable, 10);
                            if (stockAvailable > 0) {
                                variationTotalStock += stockAvailable;
                            } else {
                                if (!someOptionsInStock) {
                                    someOptionsInStock = true;
                                }
                            }
                        }
                    }
                    if (variationTotalStock === 0) {
                        someOptionsInStock = false;
                    }
                    this.model.set('variationTotalStock', variationTotalStock);
                    this.model.set('someOptionsInStock', someOptionsInStock);
                }

                var inventory = this.model.get('inventoryInfo');
                if (variationTotalStock === 0 && inventory.onlineStockAvailable) {
                    variationTotalStock = inventory.onlineStockAvailable;
                }
                if (variationTotalStock === 0 && prop) {
                    shippingMessage = expectedShipMessage;
                } else {
                    shippingMessage = availabilityMessage;
                }
                this.model.set('shippingMessage',shippingMessage);

                var options = JSON.parse(JSON.stringify(this.model.get('options')));
                var count = 0;
                count = parseInt(count, 10);
                for (var j = 0; j < options.length; j++) {
                    var option = options[j];
                    if (option.attributeFQN == "tenant~size" || option.attributeFQN == "tenant~color" || option.attributeDetail.dataType == "ProductCode") {
                        count++;
                    } 
                }
                this.model.set('hideAddon', true);
                this.model.set('showColorIcon', false);
                if (count == options.length) {
                    this.model.set('showColorIcon', true);
                }
            },
            render: function () {
                this.refreshStock();
                Backbone.MozuView.prototype.render.call(this);
                this.productThumbSlider();
               // return this;
            },
            refreshStock: function () {
                var fieldDisplayOOSProp = this.model.get('fieldDisplayOOSProp');
                var inventoryInfo = this.model.get('inventoryInfo');
                var manageStock = inventoryInfo.manageStock;
                var stockMessage;
                var itemDiscontinued = false;
                if (!manageStock) {
                    if (fieldDisplayOOSProp) {
                        var fieldDisplayOOSPropValue = this.model.get('fieldDisplayOOSPropVal');
                        var prValue = fieldDisplayOOSPropValue.values[0];
                        if (prValue.value === '4') {
                            stockMessage = Hypr.getLabel('itemDiscontinued');
                            itemDiscontinued = true;
                        } else {
                            stockMessage = Hypr.getLabel('inStock');
                        }
                    } else {
                        stockMessage = Hypr.getLabel('inStock');
                    }
                } else {
                    var productUsage = this.model.get('productUsage');
                    var outOfStockBehavior = inventoryInfo.outOfStockBehavior;
                    var onlineStockAvailable = inventoryInfo.onlineStockAvailable;
                    if (fieldDisplayOOSProp) {
                        var fieldDisplayOOSPropVal = this.model.get('fieldDisplayOOSPropVal');
                        var propValue = fieldDisplayOOSPropVal.values[0];
                        
                        if (propValue.value == '1') {
                            if (productUsage == 'Configurable') {
                               var someOptionsInStock = this.model.get('someOptionsInStock');
                               if (onlineStockAvailable === undefined) {
                                    if (someOptionsInStock) {
                                        stockMessage = Hypr.getLabel('someOptionInStock');
                                    } else {
                                        onlineStockAvailable = this.model.get('variationTotalStock');
                                        if (onlineStockAvailable < 10 && onlineStockAvailable > 0) {
                                            stockMessage = Hypr.getLabel('stockThreshold').replace("{0}", onlineStockAvailable);
                                        } else if (onlineStockAvailable >= 10) {
                                            stockMessage = Hypr.getLabel('inStock');
                                        } else {
                                            if (outOfStockBehavior == 'AllowBackOrder') {
                                                //If we need to show message in case of AllowBackOrder
                                                // stockMessage = Hypr.getLabel('inStock');
                                            } else {
                                                stockMessage = Hypr.getLabel('outOfStock');
                                            }
                                        }
                                    }
                               } else {
                                    if (onlineStockAvailable < 10 && onlineStockAvailable > 0) {
                                        stockMessage = Hypr.getLabel('stockThreshold').replace("{0}", onlineStockAvailable);
                                    } else if (onlineStockAvailable >= 10) {
                                        stockMessage = Hypr.getLabel('inStock');
                                    } else {
                                        if (outOfStockBehavior == 'AllowBackOrder') {
                                            // stockMessage = Hypr.getLabel('inStock');
                                        } else {
                                            stockMessage = Hypr.getLabel('outOfStock');
                                        }
                                    }
                               }
                            } else {
                                if (onlineStockAvailable < 10 && onlineStockAvailable > 0) {
                                    stockMessage = Hypr.getLabel('stockThreshold').replace("{0}", onlineStockAvailable);
                                } else if (onlineStockAvailable >= 10) {
                                    stockMessage = Hypr.getLabel('inStock');
                                } else {
                                    if (outOfStockBehavior == 'AllowBackOrder') {
                                        // stockMessage = Hypr.getLabel('inStock');
                                    } else {
                                        stockMessage = Hypr.getLabel('outOfStock');
                                    }
                                    
                                }
                            }
                        } else if (propValue.value == '0' || propValue.value == '2' || propValue.value == '3') {
                            if (productUsage == 'Configurable' && onlineStockAvailable === undefined) {
                               onlineStockAvailable = this.model.get('variationTotalStock');
                            }
                            if (onlineStockAvailable < 10 && onlineStockAvailable > 0) {
                                stockMessage = Hypr.getLabel('stockThreshold').replace("{0}", onlineStockAvailable);
                            } else if (onlineStockAvailable >= 10) {
                                if (propValue.value == '0') {
                                    stockMessage = Hypr.getLabel('distributorStock');
                                } else {
                                    stockMessage = Hypr.getLabel('inStock');
                                }
                            } else {
                                if (outOfStockBehavior == 'AllowBackOrder') {
                                    /*if (propValue.value === '0') {
                                        stockMessage = Hypr.getLabel('distributorStock');
                                    } else {
                                        stockMessage = Hypr.getLabel('inStock');
                                    }*/
                                } else {
                                    if (propValue.value == '2') {
                                        stockMessage = Hypr.getLabel('preOrderOnly');
                                    } else if (propValue.value == '3') {
                                        stockMessage = Hypr.getLabel('builtToOrder');
                                    } else {
                                        stockMessage = Hypr.getLabel('outOfStock');
                                    }
                                    
                                }
                            }
                        } else if (propValue.value == '4') {
                            stockMessage = Hypr.getLabel('itemDiscontinued');
                            itemDiscontinued = true;
                        }
                    } else {
                        if (outOfStockBehavior == 'AllowBackOrder') {
                            // stockMessage = Hypr.getLabel('inStock');
                        } else {
                            if (onlineStockAvailable < 10 && onlineStockAvailable > 0) {
                                stockMessage = Hypr.getLabel('stockThreshold').replace("{0}", onlineStockAvailable);
                            } else if (onlineStockAvailable >= 10) {
                                stockMessage = Hypr.getLabel('inStock');
                            } else {
                                stockMessage = Hypr.getLabel('outOfStock');
                            }
                        }
                    }
                }
                this.model.set('checkItem', false);
                if (!itemDiscontinued) {
                    $('#add-to-cart').prop('disabled', false);
                    this.model.set('checkItem', true);
                }

                this.model.set('stockMessage', stockMessage);
            },
            productThumbSlider: function () {
                if( this.model.get("content").get("productImages").length > 1 || this.model.attributes.dataurl){
                    slider = $('#quick-slider').bxSlider({
                        minSlides: 1,
                        maxSlides: 1,
                        slideWidth: 600,
                        pager:false
                    });
                }

                window.slider = slider; 
            }, 
            onQuantityChange: _.debounce(function (e) {
                var $qField = $(e.currentTarget),
                    newQuantity = parseInt($qField.val(), 10);
                if (!isNaN(newQuantity)) {
                    this.model.updateQuantity(newQuantity);
                }
            }, 500),
            onOptionChange: function (e) {
                this.model.unset('addToCartErr');              
                return this.configure($(e.currentTarget));

            },
            configure: function ($optionEl) {
                var newValue = $optionEl.val(),
                    oldValue,
                    id = $optionEl.data('mz-product-option'),

                    optionEl = $optionEl[0],
                    isPicked = (optionEl.type !== "checkbox" && optionEl.type !== "radio") || optionEl.checked,
                    option = this.model.get('options').get(id);
                  
                if (option) {
                    if (option.get('attributeDetail').inputType === "YesNo") {
                        option.set("value", isPicked);
                    } else if (isPicked) {
                        oldValue = option.get('value');

                        if (oldValue !== newValue && !(oldValue === undefined && newValue === '')) {
                            option.set('value', newValue);
                        }
                    }
                }

                if(typeof this.model.get('productCode') !== 'undefined') {
                    //Set url value here
                    if(id !="tenant~color"){
                        this.model.set({
                            "dataurl": null
                        });
                    }
                }
            },
            updateqtyManual: function () {
                if(typeof this.model.get('productCode') !== 'undefined') {
                    var _qtyObj = $('[data-mz-validationmessage-for="quantity"]'),
                        _qtyCountObj = $('.mz-productdetail-qty');
                    _qtyObj.text('');
                    var value = parseInt(_qtyCountObj.val(), 10);
                    if (isNaN(value)) {
                        $(".mz-productdetail-addtocart").addClass("is-disabled");
                    }
                    if (value === 0) {
                        _qtyObj.text("Quantity can't be zero.");
                        return;
                    }
                    if (typeof this.model.attributes.inventoryInfo.onlineStockAvailable !== 'undefined' && this.model.attributes.inventoryInfo.onlineStockAvailable < value) {

                        $(".mz-productdetail-addtocart").addClass("is-disabled");
                        
                        if (this.model.attributes.inventoryInfo.onlineStockAvailable > 0){
                            $('[data-mz-validationmessage-for="quantity"]').text("*Only " + this.model.attributes.inventoryInfo.onlineStockAvailable + " left in stock.");
                        }
                           
                    }else{
                            if (!isNaN(value)) {
                            this.model.updateQuantity(value);
                            $(".mz-productdetail-addtocart").removeClass("is-disabled");
                        }

                   }
                }
                   
               
            },
            quantityMinus: function () {
                if(typeof this.model.get('productCode') !== 'undefined') {
                    if(this.model.get('checkItem') === false) { return; }
                    var _qtyObj = $('[data-mz-validationmessage-for="quantity"]'),
                        _qtyCountObj = $('.mz-productdetail-qty');
                    _qtyObj.text('');

                    var value = parseInt(_qtyCountObj.val(), 10);
                    if (value == 1) {
                        _qtyObj.text("Quantity can't be zero.");
                        return;
                    }
                    value--;
                    this.model.updateQuantity(value);
                    _qtyCountObj.val(value);
                }
            },
            quantityPlus: function () {
                if(typeof this.model.get('productCode') !== 'undefined'){
                    if(this.model.get('checkItem') === false) { return; }
                    var _qtyObj = $('[data-mz-validationmessage-for="quantity"]'),
                        _qtyCountObj = $('.mz-productdetail-qty');
                    _qtyObj.text('');
                    var value = parseInt(_qtyCountObj.val(), 10);
                    value++;
                    this.model.updateQuantity(value);        
                    _qtyCountObj.val(value);
                }
            },
            AddToCart: function (event) {
                blockUiLoader.globalLoader(); 
                this.model.addToCart();
                var quickviewModel = this.model;
                this.model.on('addedtocart', function (cartitem) {
                    $('#quickViewModal').modal('hide');
                    blockUiLoader.unblockUi(); 
                });
                var me = this;
                this.model.on('addedtocarterror', function (error) {
                    if (error.message.indexOf('Validation Error: The following items have limited quantity or are out of stock') > -1) {
                        quickviewModel.set('addToCartErr', Hypr.getLabel('outOfStockError'));
                    } else {
                        quickviewModel.set('addToCartErr', error.message);
                    }
                    quickviewModel.set('quantity', 1);
                    me.render();
                    blockUiLoader.unblockUi(); 
                });
            },
            closeQuickviewModal: function() {
                //$('#quickViewModal').modal('hide');
                $('.modal.in').modal().hide();
            },
            colorswatch: function (event) {
                if(typeof this.model.get('productCode') !== 'undefined') {

                var $thisElem = $(event.currentTarget);
                event.stopImmediatePropagation();
                var colorValue = $thisElem.val();
                var colorcode = $thisElem.attr("data-mz-option");
                var productcode = $thisElem.attr("data-mz-prodduct-code");
                var sitecontext = HyprLiveContext.locals.siteContext;
                var cdn = sitecontext.cdnPrefix;
                var siteID = cdn.substring(cdn.lastIndexOf('-') + 1);
                var imagefilepath = cdn + '/cms/' + siteID + '/files/' + productcode + '_' + colorcode +'_v1' +'.jpg';
                this.model.set({
                    "dataurl": imagefilepath
                });
              }
            },
            clickOnNextOrprevious: function(){
                if(typeof this.model.get('productCode') !== 'undefined'){
                    $("img[onerror*='this.src']").parent().remove();
                    if($(".bx-pager-item").length > imagecount){
                        $(".bx-pager-item").eq(2).remove();
                    }
                    if(this.model.get("content").get("productImages").length === 0){ 
                        slider.destroySlider();
                    }
                }
            } 
        });
       
        var product = new ProductModels.Product(body);
        var imagecount= product.get("content").get("productImages").length;
        var Quickview = new quickview({
            model: product,
            el: $('#quickViewModal')
        });
        Quickview.render();

        yotpo.showYotpoRatingStars(".mz-product-quick-view");   
    
        product.on('addedtocart', function (cartitem) {
            GlobalCart.update();
        });
        
        $('#quickViewModal').on('hidden.bs.modal', function (e) { 
            $(".destroy").remove();
            product.clear();
        });
    });

});

});