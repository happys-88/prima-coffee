define([
    "modules/jquery-mozu",
     "underscore", "hyprlive", 
     "modules/backbone-mozu", 
     "hyprlivecontext",
     "modules/api", 
     "modules/models-product",
     "pages/cart",
     "modules/models-cart", 
     "modules/cart-monitor", 
     "modules/page-header/global-cart"], 
     function ($, _, Hypr, Backbone, HyprLiveContext, api, ProductModel, cart, cartModel, CartMonitor, GlobalCart) {  
    $(document).on("click",".mz-option-add-to-cart", function (event) {
        var $thisElem = $(event.currentTarget);
        var productCode = $thisElem.attr("data-mz-productcode");
        openOptionModalPopup(productCode);
    });
    var eventCount = 1;
    eventCount = parseInt(eventCount, 10);
    function openOptionModalPopup(productCode) {

       api.request("GET", "/api/commerce/catalog/storefront/products/"+productCode).then(function(body){
            var product = new ProductModel.Product(body);
            var optionView = new OptionView({
                model: product,
                el: $('#optionModal')
            });
            optionView.render();
            $('#optionModal').on('hidden.bs.modal', function (e) {
                $(".modal-dialog-options").remove();
                product.clear();    
            });
        }); 
    }

    $(document).on("click",".mz-addon-add-to-cart", function (event) {
        var $thisElem = $(event.currentTarget);
        var productCode = $thisElem.attr("data-mz-productcode");
        openAddonModalPopup(productCode);
    });

    function openAddonModalPopup(productCode){

       api.request("GET", "/api/commerce/catalog/storefront/products/"+productCode).then(function(body){
            var product = new ProductModel.Product(body);
            var addonView = new AddonView({
                model: product,
                el: $('#addonModal')
            });
            addonView.addToCart();
            //addonView.render();
            $('#addonModal').on('hidden.bs.modal', function (e) {
                $(".modal-dialog-addons").remove();
                product.clear();    
            });
        }); 
    }

    var OptionView = Backbone.MozuView.extend({
        templateName: 'modules/product/product-options-popup',
        additionalEvents: {
            'click .addtocart': 'addToCart',
            "change [data-mz-value='quantity']": "onQuantityChange",
            "change .mz-productoptions-option": "onOptionChange",
            "click [data-mz-qty-minus]": "quantityMinus",
            "click [data-mz-qty-plus]": "quantityPlus",
            "click [data-mz-removeItem]":"removeItem",
            "click .addtocartaddon":"addToCartUpdate"
        },
        initialize: function () {
            // handle preset selects, etc
            var me = this;
            this.$('[data-mz-product-option]').each(function () {
                var $this = $(this), isChecked, wasChecked;
                if ($this.val()) {
                    switch ($this.attr('type')) {
                        case "checkbox":
                        case "radio":
                            isChecked = $this.prop('checked');
                            wasChecked = !!$this.attr('checked');
                            if ((isChecked && !wasChecked) || (wasChecked && !isChecked)) {
                                me.configure($this);
                            }
                            break;
                        default:
                            me.configure($this);
                    }
                }
            });
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

            var prodPrice = this.model.get('price');
            if (prodPrice.attributes) {
                var priceType = prodPrice.attributes.priceType;
                if (priceType == 'MAP') {
                    this.model.set('mapPrice', prodPrice.attributes.price);
                }  
            }
            
        },
        render: function () {
            this.refreshOptions();
            this.refreshStock();
            Backbone.MozuView.prototype.render.call(this);
        },
        refreshStock: function () {
            var fieldDisplayOOSProp = this.model.get('fieldDisplayOOSProp');
            var inventoryInfo = this.model.get('inventoryInfo');
            var manageStock = inventoryInfo.manageStock;
            var stockMessage;
            if (!manageStock) {
                stockMessage = Hypr.getLabel('inStock');
            } else {
                var productUsage = this.model.get('productUsage');
                var outOfStockBehavior = inventoryInfo.outOfStockBehavior;
                var onlineStockAvailable = inventoryInfo.onlineStockAvailable;
                if (fieldDisplayOOSProp) {
                    var fieldDisplayOOSPropVal = this.model.get('fieldDisplayOOSPropVal');
                    var propValue = fieldDisplayOOSPropVal.values[0];
                    
                    if (propValue.value == '1') {
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
                                    //If we need to show message in case of AllowBackOrder
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
                                //If we need to show message in case of AllowBackOrder
                                /*if (propValue.value == '0') {
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
                    }
                } else {
                    if (productUsage == 'Configurable' && onlineStockAvailable === undefined) {
                       onlineStockAvailable = this.model.get('variationTotalStock');
                    }
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
            }
            this.model.set('stockMessage', stockMessage);
        },
        refreshOptions: function() {
            var selectedCount = 0;
            selectedCount = parseInt(selectedCount, 10);

            var options = JSON.parse(JSON.stringify(this.model.get('options')));
            var hasAddon = false;

            for (var i = 0; i < options.length; i++) {
                var stockCount = 0;
                stockCount = parseInt(stockCount, 10);
                var option = options[i];
                if(option.attributeDetail.dataType == 'ProductCode') {
                    var optionValues = option.values;
                    for (var j = 0; j < optionValues.length; j++) {
                        var optionValue = optionValues[j];
                        if (optionValue.bundledProduct.inventoryInfo.onlineStockAvailable > 0) {
                            if (!hasAddon) {
                                hasAddon = true;
                            }
                            stockCount++;
                            break;
                        }
                    }
                    for (var k = 0; k < optionValues.length; k++) {
                        if (optionValues[k].isSelected) {
                            selectedCount++;
                            break;
                        }
                    }
                }
                var opt = this.model.get('options').get(option.attributeFQN);
                opt.set('stockCount', stockCount);
            }
            if(selectedCount === 0){
                this.model.set('addToCartButton','disabled');
            } else {
                this.model.set('addToCartButton','');
            }
            this.model.set('hasAddon', hasAddon);  
        },
        onQuantityChange: _.debounce(function (e) {
            var $qField = $(e.currentTarget),
              newQuantity = parseInt($qField.val(), 10);
            if (!isNaN(newQuantity)) {
                this.model.updateQuantity(newQuantity);
            }
        },500),
        onOptionChange: function (e) {
            this.model.unset('addToCartErr');
            this.model.unset('addToCartErrr');
            this.configure($(e.currentTarget));
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
        quantityMinus: function() {
            if(typeof this.model.get('productCode') !== 'undefined') {
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
        quantityPlus: function() {
            if(typeof this.model.get('productCode') !== 'undefined'){
                var _qtyObj = $('[data-mz-validationmessage-for="quantity"]'),
                    _qtyCountObj = $('.mz-productdetail-qty');
                _qtyObj.text('');
                var value = parseInt(_qtyCountObj.val(), 10);
                value++;
                this.model.updateQuantity(value);        
                _qtyCountObj.val(value);
            }
        },
        removeItem: function() {
            if(require.mozuData('pagecontext').isEditMode) {
                return false;
            }
            var totalQuant = this.model.get('totalQuant');
            var newQuant =  this.model.get('quantity');
            totalQuant = parseInt(totalQuant, 10);
            newQuant = parseInt(newQuant, 10);
            var prevQuant = parseInt(totalQuant - newQuant, 10);
            var cartItemId = this.model.get('cartItemId');
            
            var method;
            var url;
            if(prevQuant > 0){
                method = "PUT";
                url = "/api/commerce/carts/current/items/"+cartItemId+"/"+prevQuant;
            } else if(prevQuant === 0){
                method = "DELETE";
                url = "/api/commerce/carts/current/items/"+cartItemId;
            }
            if(method) {
               api.request( method, url ).then(function () {
                    $('#optionModal').modal('hide');
                    GlobalCart.update();
                }); 
            }
        },
        addToCartUpdate: function() {
            if(require.mozuData('pagecontext').isEditMode) {
                return false;
            }
            var me = this.model;
            var cartItemId = this.model.get('cartItemId');
            var totalQuant = this.model.get('totalQuant');
            var newQuant =  this.model.get('quantity');
            totalQuant = parseInt(totalQuant, 10);
            newQuant = parseInt(newQuant, 10);
            var prevQuant = parseInt(totalQuant - newQuant, 10);
            var method;
            var url;
            if(prevQuant > 0){
                method = "PUT";
                url = "/api/commerce/carts/current/items/"+cartItemId+"/"+prevQuant;
            } else if(prevQuant === 0){
                method = "DELETE";
                url = "/api/commerce/carts/current/items/"+cartItemId;
            }

            if(method) {
               api.request( method, url ).then(function () {
                    me.addToCart();
                }); 
            }
        },
        addToCart: function (event) {
            var count = 0;
            count = parseInt(count, 10);
            this.model.addToCart();
            var optionModel = this.model;
            var me = this;
            
            this.model.on('addedtocart', function (cartitem) {
                var events = optionModel._events.addedtocart;
                if (eventCount === events.length) {
                    if (optionModel.get('addonsPopup') === true) {
                        GlobalCart.update('redirect_to_cart');
                    } else {
                        optionModel.set('addonsPopup', true);
                        optionModel.set('cartItemId',cartitem.data.id);
                        optionModel.set('totalQuant',cartitem.data.quantity);
                        var selectedOptions = optionModel.get('selectedOptions');
                        if (selectedOptions && selectedOptions.length > 0) {
                            for (var i = 0; i < selectedOptions.length; i++) {
                                var selectedOption = selectedOptions[i];
                                var option = optionModel.get('options').get(selectedOption.id);
                                option.set('value', selectedOption.value);
                            }
                        }
                        me.render();
                        if (cartitem && cartitem.prop('id')) {
                            CartMonitor.addToCount(optionModel.get('quantity'));
                            GlobalCart.update();
                        }    
                    }
                } else {
                    eventCount++;
                }
            });
            this.model.on('addedtocarterror', function (error) {
                if (optionModel.get('addonsPopup') === true) {
                    var selectedOptions = [];
                    var n = 0;
                    n = parseInt(n, 10);
                    var options = JSON.parse(JSON.stringify(optionModel.get('options')));
                    for (var i = 0; i < options.length; i++) {
                        var ooption = options[i];
                        if (ooption.attributeDetail.dataType == 'ProductCode') {
                            selectedOptions[n] = {id:ooption.attributeFQN, value:ooption.value};
                            var option = optionModel.get('options').get(ooption.attributeFQN);
                            option.set('value', null);
                        }
                    }
                    optionModel.set('selectedOptions', selectedOptions);
                    optionModel.set('addonsPopup', false);
                    optionModel.addToCart();
                    if (error.message.indexOf('Validation Error: The following items have limited quantity or are out of stock') > -1) {
                        optionModel.set('addToCartErrr', Hypr.getLabel('outOfStockError'));
                    } else {
                        optionModel.set('addToCartErrr', error.message);
                    }
                } else {
                    if (error.message.indexOf('Validation Error: The following items have limited quantity or are out of stock') > -1) {
                        optionModel.set('addToCartErr', Hypr.getLabel('outOfStockError'));
                    } else {
                        optionModel.set('addToCartErr', error.message);
                    }
                    me.render();
                }
            });
        }
    });

    var AddonView = Backbone.MozuView.extend({
        templateName: 'modules/product/product-addons-popup',
        additionalEvents: {
            'click .addtocart': 'addToCart',
            "change .mz-productoptions-option": "onOptionChange",
            "click [data-mz-removeItem]":"removeItem",
            "click .addtocartaddon":"addToCartUpdate"
        },
        initialize: function () {
        // handle preset selects, etc
        var me = this;
        this.$('[data-mz-product-option]').each(function () {
            var $this = $(this), isChecked, wasChecked;
            if ($this.val()) {
                switch ($this.attr('type')) {
                    case "checkbox":
                    case "radio":
                        isChecked = $this.prop('checked');
                        wasChecked = !!$this.attr('checked');
                        if ((isChecked && !wasChecked) || (wasChecked && !isChecked)) {
                            me.configure($this);
                        }
                        break;
                    default:
                        me.configure($this);
                }
            }
        });
         var prodPrice = this.model.get('price');
        if (prodPrice.attributes) {
            var priceType = prodPrice.attributes.priceType;
            if (priceType == 'MAP') {
                this.model.set('mapPrice', prodPrice.attributes.price);
            }  
        }
        },
        render: function () {
            this.refreshOptions();
            Backbone.MozuView.prototype.render.call(this);
        },
        refreshOptions: function() {

            var selectedCount = 0;
            selectedCount = parseInt(selectedCount, 10);

            var options = JSON.parse(JSON.stringify(this.model.get('options')));
            var hasAddon = false;

            for (var i = 0; i < options.length; i++) {
                var stockCount = 0;
                stockCount = parseInt(stockCount, 10);
                var option = options[i];
                if(option.attributeDetail.dataType == 'ProductCode') {
                    var optionValues = option.values;
                    for (var j = 0; j < optionValues.length; j++) {
                        var optionValue = optionValues[j];
                        if (optionValue.bundledProduct.inventoryInfo.onlineStockAvailable > 0) {
                            if (!hasAddon) {
                                hasAddon = true;
                            }
                            stockCount++;
                            break;
                        }
                    }
                    for (var k = 0; k < optionValues.length; k++) {
                        if (optionValues[k].isSelected) {
                            selectedCount++;
                            break;
                        }
                    }
                }
                var opt = this.model.get('options').get(option.attributeFQN);
                opt.set('stockCount', stockCount);
            }
            if(selectedCount === 0){
                this.model.set('addToCartButton','disabled');
            } else {
                this.model.set('addToCartButton','');
            }
            this.model.set('hasAddon', hasAddon);
        },
        onOptionChange: function (e) {
            this.model.unset('addToCartErr');
            this.model.unset('addToCartErrr');
            this.configure($(e.currentTarget));
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
        removeItem: function() {
            if(require.mozuData('pagecontext').isEditMode) {
                return false;
            }
            var totalQuant = this.model.get('totalQuant');
            var newQuant =  this.model.get('quantity');
            totalQuant = parseInt(totalQuant, 10);
            newQuant = parseInt(newQuant, 10);
            var prevQuant = parseInt(totalQuant - newQuant, 10);
            var cartItemId = this.model.get('cartItemId');
            
            var method;
            var url;
            if(prevQuant > 0){
                method = "PUT";
                url = "/api/commerce/carts/current/items/"+cartItemId+"/"+prevQuant;
            } else if(prevQuant === 0){
                method = "DELETE";
                url = "/api/commerce/carts/current/items/"+cartItemId;
            }
            if(method) {
               api.request( method, url ).then(function () {
                    $('#addonModal').modal('hide');
                    GlobalCart.update();
                }); 
            }
        },
        addToCartUpdate: function() {
            if(require.mozuData('pagecontext').isEditMode) {
                return false;
            }
            var me = this.model;
            var cartItemId = this.model.get('cartItemId');
            var totalQuant = this.model.get('totalQuant');
            var newQuant =  this.model.get('quantity');
            totalQuant = parseInt(totalQuant, 10);
            newQuant = parseInt(newQuant, 10);
            var prevQuant = parseInt(totalQuant - newQuant, 10);
            
            var method;
            var url;
            if(prevQuant > 0){
                method = "PUT";
                url = "/api/commerce/carts/current/items/"+cartItemId+"/"+prevQuant;
            } else if(prevQuant === 0){
                method = "DELETE";
                url = "/api/commerce/carts/current/items/"+cartItemId;
            }

            if(method) {
               api.request( method, url ).then(function () {
                    me.addToCart();
                }); 
            }
        },
        addToCart: function (event) {

            this.model.addToCart();
            var optionModel = this.model;
            var me = this;

            this.model.on('addedtocart', function (cartitem) {
                if (optionModel.get('addonsPopup') === true) {
                    GlobalCart.update('redirect_to_cart');
                } else {
                    optionModel.set('addonsPopup', true);
                    optionModel.set('cartItemId',cartitem.data.id);
                    optionModel.set('totalQuant',cartitem.data.quantity);
                    var selectedOptions = optionModel.get('selectedOptions');
                    if (selectedOptions && selectedOptions.length > 0) {
                        for (var i = 0; i < selectedOptions.length; i++) {
                            var selectedOption = selectedOptions[i];
                            var option = optionModel.get('options').get(selectedOption.id);
                            option.set('value', selectedOption.value);
                        }
                    }
                    me.render();
                    if (cartitem && cartitem.prop('id')) {
                        CartMonitor.addToCount(optionModel.get('quantity')); 
                        GlobalCart.update();
                    }
                }
            });
            this.model.on('addedtocarterror', function (error) {
                if (optionModel.get('addonsPopup') === true) {
                    var selectedOptions = [];
                    var n = 0;
                    n = parseInt(n, 10);
                    var options = JSON.parse(JSON.stringify(optionModel.get('options')));
                    for (var i = 0; i < options.length; i++) {
                        var ooption = options[i];
                        if (ooption.attributeDetail.dataType == 'ProductCode') {
                            selectedOptions[n] = {id:ooption.attributeFQN, value:ooption.value};
                            var option = optionModel.get('options').get(ooption.attributeFQN);
                            option.set('value', null);
                        }
                    }
                    optionModel.set('selectedOptions', selectedOptions);
                    optionModel.set('addonsPopup', false);
                    optionModel.addToCart();
                    if (error.message.indexOf('Validation Error: The following items have limited quantity or are out of stock') > -1) {
                        optionModel.set('addToCartErrr', Hypr.getLabel('outOfStockError'));
                    } else {
                        optionModel.set('addToCartErrr', error.message);
                    }
                } else {
                    if (error.message.indexOf('Validation Error: The following items have limited quantity or are out of stock') > -1) {
                        optionModel.set('addToCartErr', Hypr.getLabel('outOfStockError'));
                    } else {
                        optionModel.set('addToCartErr', error.message);
                    }
                    me.render();
                }
            });
        }
    });
});