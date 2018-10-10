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
            "keyup input[data-mz-value='quantity']": "onQuantityChange1",
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
            if(!HyprLiveContext.locals.user.isAuthenticated) {
                var prodPrice = this.model.get('price');
                if (prodPrice.attributes) {
                    var priceType = prodPrice.attributes.priceType;
                    if (priceType == 'MAP') {
                        this.model.set('mapPrice', prodPrice.attributes.price);
                    }  
                }
            }
            
            var options = JSON.parse(JSON.stringify(this.model.get('options')));
            var productCodes = [];
            var c = 0;
            c = parseInt(c, 10);
            for (var j = 0; j < options.length; j++) {
                var option = options[j];
                if (option.attributeDetail.dataType == "ProductCode") {
                    var optionValues = option.values;
                    for (var k = 0; k < optionValues.length; k++) {
                        var optionValue = optionValues[k];
                        var productCode;
                        if(optionValue.stringValue.indexOf(':') !== -1) {
                            productCode = optionValue.value.slice(0,optionValue.value.lastIndexOf("-"));
                        } else {
                            productCode = optionValue.value;
                        } 
                        if (!(_.contains(productCodes, productCode))) {
                            productCodes[c] = productCode;
                            c++;
                        }
                    }
                }
            }
            var prodModel = this.model;
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
                    prodModel.set('addonItems', items);
                    me.render();
                });
            }
        },
        findStockProperty: function(properties) {
            return _.find(properties, function(property){ return property.attributeFQN == 'tenant~field_display_oos1'; });
        },
        findElement: function(arr, element) {
            var product = arr.find(function(el) {
              return el.productCode == element;
            });
            return product;
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
            var addonCount = 0;
            addonCount = parseInt(addonCount, 10);
            var optionValCount = 0;
            optionValCount = parseInt(optionValCount, 10);
            var items = this.model.get('addonItems');
            var options = JSON.parse(JSON.stringify(this.model.get('options')));

            for (var i = 0; i < options.length; i++) {
                optionValCount = 0;
                var option = options[i];
                if(option.attributeDetail.dataType == 'ProductCode') {
                    var optionValues = option.values;
                    for (var k = 0; k < optionValues.length; k++) {
                        var optionValue = optionValues[k];
                        var productCode;
                        if(optionValue.stringValue.indexOf(':') !== -1) {
                            productCode = optionValue.value.slice(0,optionValue.value.lastIndexOf("-"));
                        } else {
                            productCode = optionValue.value;
                        } 
                        
                        var product = this.findElement(items, productCode);
                        addonCount++;
                        optionValCount++;
                        var stockProperty = this.findStockProperty(product.properties);
                        optionValue.itemDiscontinued = false;
                        if (stockProperty) {
                            var stockPropertyVal = stockProperty.values[0];
                            if (stockPropertyVal.value == '4') {
                                optionValue.itemDiscontinued = true;
                                addonCount--;
                                optionValCount--;
                            }
                        }
                        optionValues[k] = optionValue;
                    }
                    var opt = this.model.get('options').get(option.attributeFQN);
                    opt.set('values', optionValues);
                    opt.set('optionValCount', optionValCount);

                    for (var l = 0; l < optionValues.length; l++) {
                        if (optionValues[l].isSelected) {
                            selectedCount++;
                            break;
                        }
                    }
                }
            }
            if(selectedCount === 0){
                this.model.set('addToCartButton','disabled');
            } else {
                this.model.set('addToCartButton','');
            }
            if (addonCount > 0) {
                this.model.set('hasAddon', true);
            } else {
                this.model.set('hasAddon', false);
            }  
        },
        onQuantityChange: _.debounce(function (e) {
            var $qField = $(e.currentTarget),
              newQuantity = parseInt($qField.val(), 10);
            if (!isNaN(newQuantity)) {
                this.model.updateQuantity(newQuantity);
            }
        },500),onQuantityChange1: _.debounce(function (e) {
            var $qField = $(e.currentTarget),
              newQuantity = parseInt($qField.val(), 10);
              var Quantity = e.currentTarget.value;
              Quantity = Quantity.trim();
              var lastValue ='';
              var reg = /^[A-Za-z]+$/;
            if (Quantity !== '' &&  (!isNaN(newQuantity) || reg.test(newQuantity))){              
                if(((e.which >= 48 && e.which <= 57) || (e.which >= 96 && e.which <= 105))&& (newQuantity > 0)) {
                     this.model.updateQuantity(newQuantity);
                     this.model.set("currentVal", newQuantity);
                } else if (newQuantity!== 'NaN'  && (!reg.test(newQuantity))) {
                    if (newQuantity > 0){
                       this.model.updateQuantity(newQuantity);
                       this.model.set("currentVal", newQuantity);                     
                     }else {
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
            if (this.model.get('addToCartButton') == 'disabled') {
               this.model.set('addToCartErrr', Hypr.getLabel('selectAddonsError'));
               return this.render();
            }
            this.model.unset('addToCartErrr');
            eventCount = 1;
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
                        optionModel.set('hideOptionsPopup', true);
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
                            if (ooption.value) {
                                selectedOptions[n] = {id:ooption.attributeFQN, value:ooption.value};
                                n++;
                                var option = optionModel.get('options').get(ooption.attributeFQN);
                                option.set('value', null);
                            }
                        }
                    }
                    optionModel.set('selectedOptions', selectedOptions);
                    optionModel.set('addonsPopup', false);
                    optionModel.addToCart();
                    if (error.message.indexOf('Validation Error:') > -1) {
                        optionModel.set('addToCartErrr', error.message.replace('Validation Error:', ''));
                    } else {
                        optionModel.set('addToCartErrr', error.message);
                    }
                } else {
                    if (error.message.indexOf('Validation Error:') > -1) {
                        optionModel.set('addToCartErr', error.message.replace('Validation Error:', ''));
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
            if(!HyprLiveContext.locals.user.isAuthenticated) {
                var prodPrice = this.model.get('price');
                if (prodPrice.attributes) {
                    var priceType = prodPrice.attributes.priceType;
                    if (priceType == 'MAP') {
                        this.model.set('mapPrice', prodPrice.attributes.price);
                    }  
                }
            }
            var options = JSON.parse(JSON.stringify(this.model.get('options')));
            var productCodes = [];
            var c = 0;
            c = parseInt(c, 10);
            for (var j = 0; j < options.length; j++) {
                var option = options[j];
                if (option.attributeDetail.dataType == "ProductCode") {
                    var optionValues = option.values;
                    for (var k = 0; k < optionValues.length; k++) {
                        var optionValue = optionValues[k];
                        var productCode;
                        if(optionValue.stringValue.indexOf(':') !== -1) {
                            productCode = optionValue.value.slice(0,optionValue.value.lastIndexOf("-"));
                        } else {
                            productCode = optionValue.value;
                        } 
                        if (!(_.contains(productCodes, productCode))) {
                            productCodes[c] = productCode;
                            c++;
                        }
                    }
                }
            }
            var prodModel = this.model;
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
                    prodModel.set('addonItems', items);
                });
            }
        },
        findStockProperty: function(properties) {
            return _.find(properties, function(property){ return property.attributeFQN == 'tenant~field_display_oos1'; });
        },
        findElement: function(arr, element) {
            var product = arr.find(function(el) {
              return el.productCode == element;
            });
            return product;
        },
        render: function () {
            this.refreshOptions();
            Backbone.MozuView.prototype.render.call(this);
        },
        refreshOptions: function() {
            var selectedCount = 0;
            selectedCount = parseInt(selectedCount, 10);
            var addonCount = 0;
            addonCount = parseInt(addonCount, 10);
            var optionValCount = 0;
            optionValCount = parseInt(optionValCount, 10);
            var items = this.model.get('addonItems');
            var options = JSON.parse(JSON.stringify(this.model.get('options')));

            for (var i = 0; i < options.length; i++) {
                optionValCount = 0;
                var option = options[i];
                if(option.attributeDetail.dataType == 'ProductCode') {
                    var optionValues = option.values;
                    for (var k = 0; k < optionValues.length; k++) {
                        var optionValue = optionValues[k];
                        var productCode;
                        if(optionValue.stringValue.indexOf(':') !== -1) {
                            productCode = optionValue.value.slice(0,optionValue.value.lastIndexOf("-"));
                        } else {
                            productCode = optionValue.value;
                        } 
                        
                        var product = this.findElement(items, productCode);
                        addonCount++;
                        optionValCount++;
                        var stockProperty = this.findStockProperty(product.properties);
                        optionValue.itemDiscontinued = false;
                        if (stockProperty) {
                            var stockPropertyVal = stockProperty.values[0];
                            if (stockPropertyVal.value == '4') {
                                optionValue.itemDiscontinued = true;
                                addonCount--;
                                optionValCount--;
                            }
                        }
                        optionValues[k] = optionValue;
                    }
                    var opt = this.model.get('options').get(option.attributeFQN);
                    opt.set('values', optionValues);
                    opt.set('optionValCount', optionValCount);

                    for (var l = 0; l < optionValues.length; l++) {
                        if (optionValues[l].isSelected) {
                            selectedCount++;
                            break;
                        }
                    }
                }
            }
            if(selectedCount === 0){
                this.model.set('addToCartButton','disabled');
            } else {
                this.model.set('addToCartButton','');
            }
            if (addonCount > 0) {
                this.model.set('hasAddon', true);
            } else {
                this.model.set('hasAddon', false);
            }
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
            if (this.model.get('addToCartButton') == 'disabled') {
               this.model.set('addToCartErrr', Hypr.getLabel('selectAddonsError'));
               return this.render();
            }
            this.model.unset('addToCartErrr');
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
                            if (ooption.value) {
                                selectedOptions[n] = {id:ooption.attributeFQN, value:ooption.value};
                                n++;
                                var option = optionModel.get('options').get(ooption.attributeFQN);
                                option.set('value', null);
                            }
                        }
                    }
                    optionModel.set('selectedOptions', selectedOptions);
                    optionModel.set('addonsPopup', false);
                    optionModel.addToCart();
                    if (error.message.indexOf('Validation Error:') > -1) {
                        optionModel.set('addToCartErrr', error.message.replace('Validation Error:', ''));
                    } else {
                        optionModel.set('addToCartErrr', error.message);
                    }
                } else {
                    if (error.message.indexOf('Validation Error:') > -1) {
                        optionModel.set('addToCartErr', error.message.replace('Validation Error:', ''));
                    } else {
                        optionModel.set('addToCartErr', error.message);
                    }
                    me.render();
                }
            });
        }
    });
});