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
                "change [data-mz-value='quantity']": "onQuantityChange",
                "keyup input[data-mz-value='quantity']": "onQuantityChange1",
                "change .mz-productoptions-option": "onOptionChange",
                "click [data-mz-qty-minus]": "quantityMinus",
                "click [data-mz-qty-plus]": "quantityPlus",
                "click #quickViewModal .bx-controls-direction a":"clickOnNextOrprevious",
                // "keyup [id=qty-field]":"updateqtyManual",
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
                    if (expectedShipMessage && expectedShipMessage.length > 0) {
                        shippingMessage = expectedShipMessage;
                    } else {
                        if (prop.values[0].value == '1') {
                            shippingMessage = Hypr.getLabel("temporarilyOutOfStockMessage");
                        } else {
                            shippingMessage = availabilityMessage;
                        }
                    }
                }
                this.model.set('shippingMessage',shippingMessage);
                this.model.set("availabilityMessage", availabilityMessage);
                this.model.set("expectedShipMessage", expectedShipMessage);
                
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
            },
            refreshStock: function () {
                var fieldDisplayOOSProp = this.model.get('fieldDisplayOOSProp');
                var inventoryInfo = this.model.get('inventoryInfo');
                var manageStock = inventoryInfo.manageStock;
                var stockMessage;
                var shippingMessage;
                var color;
                var itemDiscontinued = false;
                if (fieldDisplayOOSProp) {
                    var fieldDisplayOOSPropValue = this.model.get('fieldDisplayOOSPropVal');
                    var prValue = fieldDisplayOOSPropValue.values[0];
                    if (prValue.value == '4') {
                        stockMessage = Hypr.getLabel('itemDiscontinued');
                        itemDiscontinued = true;
                    }
                }
                if (!itemDiscontinued) {
                    if (!manageStock) {
                        /*stockMessage = Hypr.getLabel('inStock');*/
                    } else {
                        var productUsage = this.model.get('productUsage');
                        var outOfStockBehavior = inventoryInfo.outOfStockBehavior;
                        var onlineStockAvailable = inventoryInfo.onlineStockAvailable;
                        var someOptionsInStock = this.model.get('someOptionsInStock');
                        var variationTotalStock = this.model.get('variationTotalStock');
                        if (onlineStockAvailable === undefined) {
                            if (variationTotalStock > 0 && !someOptionsInStock) {
                                if (variationTotalStock < 15) {
                                    stockMessage = Hypr.getLabel('inStock');
                                    shippingMessage = Hypr.getLabel('stockThreshold').replace("{0}", variationTotalStock);
                                } else {
                                    stockMessage = Hypr.getLabel('inStock');
                                    shippingMessage = Hypr.getLabel('inStockMessage');
                                }
                            } else if (someOptionsInStock) {
                                stockMessage = Hypr.getLabel('someOptionInStock');
                                shippingMessage = Hypr.getLabel('someOptionInStockMessage');
                            } else {
                                if (fieldDisplayOOSProp) {
                                    shippingMessage = this.model.get('shippingMessage');
                                    var fieldDisplayOOSPropVal = this.model.get('fieldDisplayOOSPropVal');
                                    var prVal = fieldDisplayOOSPropVal.values[0];
                                    if (prVal.value == '1') {
                                        color = "red";
                                        stockMessage = Hypr.getLabel('outOfStock');
                                    } else if (prVal.value == '0') {
                                        stockMessage = Hypr.getLabel('distributorStock');
                                    } else if (prVal.value == '2') {
                                        stockMessage = Hypr.getLabel('preOrderOnly');
                                    } else if (prVal.value == '3') {
                                        stockMessage = Hypr.getLabel('builtToOrder');
                                    }
                                }
                            }
                        } else if (onlineStockAvailable < 15 && onlineStockAvailable > 0) {
                            stockMessage = Hypr.getLabel('inStock');
                            shippingMessage = Hypr.getLabel('stockThreshold').replace("{0}", onlineStockAvailable);
                        } else if (onlineStockAvailable > 14) {
                            stockMessage = Hypr.getLabel('inStock');
                            shippingMessage = Hypr.getLabel('inStockMessage');
                        } else {
                            if (fieldDisplayOOSProp) {
                                var fieldDisplayOOSPropVall = this.model.get('fieldDisplayOOSPropVal');
                                var prVall = fieldDisplayOOSPropVall.values[0];
                                if (productUsage == "Configurable") {
                                    var expectedShipMessage = this.model.get("expectedShipMessage");
                                    if (expectedShipMessage && expectedShipMessage.length > 0) {
                                        shippingMessage = expectedShipMessage;
                                    } else {
                                        if (prVall.value == '1') {
                                            shippingMessage = Hypr.getLabel("temporarilyOutOfStockMessage");
                                        } else {
                                            shippingMessage = this.model.get("availabilityMessage");
                                        }
                                    }
                                } else {
                                    shippingMessage = this.model.get('shippingMessage');
                                }
                                if (prVall.value == '1') {
                                    color = "red";
                                    stockMessage = Hypr.getLabel('outOfStock');
                                } else if (prVall.value == '0') {
                                    stockMessage = Hypr.getLabel('distributorStock');
                                } else if (prVall.value == '2') {
                                    stockMessage = Hypr.getLabel('preOrderOnly');
                                } else if (prVall.value == '3') {
                                    stockMessage = Hypr.getLabel('builtToOrder');
                                }
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
                this.model.set('helperMessage', shippingMessage);
                this.model.set('messageColor', color);
            },
            productThumbSlider: function () {
                if( this.model.get("content").get("productImages").length > 1){
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
            onQuantityChange1: _.debounce(function (e) {
            e.target.value = e.target.value.replace(/[^\d]/g, '');
            var Quantity = e.currentTarget.value;
            Quantity = Quantity.trim();
            var lastValue ='';
              var reg = /^[A-Za-z]+$/;
            if (Quantity !== '' &&  (!isNaN(Quantity) || reg.test(Quantity))){              
                if(((e.which >= 48 && e.which <= 57) || (e.which >= 96 && e.which <= 105)) && (Quantity > 0)){
                     this.model.updateQuantity(Quantity);
                     this.model.set("currentVal", Quantity);
                } else if (Quantity!== 'NaN'  && (!reg.test(Quantity))) {
                    if (Quantity > 0){
                     this.model.updateQuantity(Quantity);
                     this.model.set("currentVal", Quantity);
                    }else{
                        lastValue =  this.model.get("currentVal");
                        if(lastValue === undefined){
                            lastValue ='1';
                        }
                        $('.mz-productdetail-qty').val(lastValue);
                        this.model.updateQuantity(lastValue);
                    }
                }else{
                    lastValue =  this.model.get("currentVal");
                    if(lastValue === undefined){
                            lastValue ='1';
                        }
                     $('.mz-productdetail-qty').val(lastValue);
                     this.model.updateQuantity(lastValue);
                }
            }else {
                $('.mz-productdetail-qty').val('1');
                this.model.updateQuantity('1');
            }
        },500),
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

                
            },
            /*updateqtyManual: function () {
                if(typeof this.model.get('productCode') !== 'undefined') {
                    var _qtyObj = $('[data-mz-validationmessage-for="quantity"]'),
                        _qtyCountObj = $('.mz-productdetail-qty');
                    _qtyObj.text('');
                    var value = parseInt(_qtyCountObj.val(), 10);
                    if (value === 0) {
                        _qtyObj.text("Quantity can't be zero.");
                        return;
                    }
                    if (!isNaN(value)) {
                        this.model.updateQuantity(value);
                    }
                }
            },*/
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
            clickOnNextOrprevious: function(){
                if(typeof this.model.get('productCode') !== 'undefined'){
                    $("#quickViewModal img[onerror*='this.src']").parent().remove();
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