define(["modules/jquery-mozu", "underscore", "hyprlive", "modules/backbone-mozu", "hyprlivecontext", "modules/api", "modules/models-product", "pages/cart", "modules/models-cart", "modules/cart-monitor","modules/page-header/global-cart"], function ($, _, Hypr, Backbone, HyprLiveContext, api, ProductModel, cart, cartModel, CartMonitor, GlobalCart) {  
    $(document).on("click",".mz-option-add-to-cart", function (event) {
        var $thisElem = $(event.currentTarget);
        var productCode = $thisElem.attr("data-mz-productcode");
        openOptionModalPopup(productCode);
    });

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
            'click .colorswatch': "colorswatch",
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

        if(typeof this.model.get('variations') !== "undefined" ) {
                   var variations = this.model.get('variations');
                    var sum = 0;
                    if(variations.length !== 0) { 
                        var stockArray = [];
                        for(var i=0; i<variations.length; i++) {
                            stockArray.push(variations[i].inventoryInfo.onlineStockAvailable);
                            sum += variations[i].inventoryInfo.onlineStockAvailable;
                        }
                        this.model.set({'totalCount': sum});
                        var inStock =_.contains(stockArray, 0);
                        this.model.set({'containsZero': inStock});
                    }                    
                } else {
                    this.model.set({'totalCount': this.model.attributes.inventoryInfo.onlineStockAvailable});
                }

        },
        render: function () {
            Backbone.MozuView.prototype.render.call(this);
        },
        refreshOptions: function() {
            var options = JSON.parse(JSON.stringify(this.model.get('options')));

            for (var i = 0; i < options.length; i++) {
                var count = 0;
                count = parseInt(count, 10);
                var option = options[i];
                if(option.attributeDetail.dataType == 'ProductCode') {
                    var optionValues = option.values;
                    for (var j = 0; j < optionValues.length; j++) {
                        var optionValue = optionValues[j];
                        if (optionValue.bundledProduct.inventoryInfo.onlineStockAvailable > 0) {
                            count++;
                            break;
                        }
                    }
                }
                option.stockCount = count;
                options[i] = option;
            }
            this.model.set('optionArr',options);
        },
        onQuantityChange: _.debounce(function (e) {
            var $qField = $(e.currentTarget),
              newQuantity = parseInt($qField.val(), 10);
            if (!isNaN(newQuantity)) {
                this.model.updateQuantity(newQuantity);
            }
        },500),
        onOptionChange: function (e) {
            
            this.model.set('addToCartErr', '');
            var $optionEl = $(e.currentTarget);
            var productCode = $optionEl.val();
            var attributeFQN = $optionEl.data('mz-product-option');
            this.model.set('selected'+attributeFQN,productCode);
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
            var selectedCount = 0;
            selectedCount = parseInt(selectedCount, 10);
            var options = JSON.parse(JSON.stringify(this.model.get('options')));
            for (var i = 0; i < options.length; i++) {
                var optionn = options[i];
                var optionValues = optionn.values;
                if(optionn.attributeDetail.dataType == 'ProductCode') {
                    for (var j = 0; j < optionValues.length; j++) {
                        var optionValue = optionValues[j];
                        if (optionValue.isSelected === true) {
                            selectedCount++;
                        }
                    }
                }
            }
            if(selectedCount === 0){
                this.model.set('addToCartButton','disabled');
            } else {
                this.model.set('addToCartButton','');
            }
            this.refreshOptions();
        },
        quantityMinus: function() {
            if(typeof this.model.get('productCode') !== 'undefined') {
                if(!this.model.get('purchasableState').isPurchasable) {
                    return;
                }
                var _qtyObj = $('[data-mz-validationmessage-for="quantity"]'),
                    _qtyCountObj = $('.mz-productdetail-qty');
                _qtyObj.text('');
                var value = parseInt(_qtyCountObj.val(), 10);
                if (typeof this.model.attributes.inventoryInfo.onlineStockAvailable !== 'undefined') {
                    if (this.model.attributes.inventoryInfo.onlineStockAvailable >= value)
                    $(".mz-productdetail-addtocart").removeClass("is-disabled");
                }
                if (value == 1) {
                    _qtyObj.text("Quantity can't be zero.");
                   // $('.modal-body').animate({ scrollTop: $('.tab_container')[0].scrollHeight }, 'slow');
                    return;
                }
                value--;
                this.model.updateQuantity(value);
                _qtyCountObj.val(value);
            }
        },
        quantityPlus: function() {
            if(typeof this.model.get('productCode') !== 'undefined'){
                if(!this.model.get('purchasableState').isPurchasable) {
                    return;
                }
                var _qtyObj = $('[data-mz-validationmessage-for="quantity"]'),
                _qtyCountObj = $('.mz-productdetail-qty');
            _qtyObj.text('');
            var value = parseInt(_qtyCountObj.val(), 10);


            if (value == 99) {
                _qtyObj.text("Quantity can't be greater than 99.");
                return;
            }
            value++;
            if (typeof this.model.attributes.inventoryInfo.onlineStockAvailable !== 'undefined' && this.model.attributes.inventoryInfo.onlineStockAvailable < value) {
                $(".mz-productdetail-addtocart").addClass("is-disabled");
                if (this.model.attributes.inventoryInfo.onlineStockAvailable > 0)
                $(".mz-productdetail-addtocart").removeClass("is-disabled");
                    $('[data-mz-validationmessage-for="quantity"]').text("*Only " + this.model.attributes.inventoryInfo.onlineStockAvailable + " left in stock.");
                    return;
            }
            
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
            var options = JSON.parse(JSON.stringify(me.get('options')));
            for (var i = 0; i < options.length; i++) {
                var option = options[i];
                if (option.attributeDetail.dataType == 'ProductCode') {
                   var optionValues = option.values;
                    for (var j = 0; j < optionValues.length; j++) {
                        if (optionValues[j].isSelected === true) {
                            if (optionValues[j].bundledProduct.inventoryInfo.onlineStockAvailable < newQuant ) {
                                me.set('addToCartErr', Hypr.getLabel('outOfStockError'));
                                return this.render();
                            }
                        }
                    } 
                }
            }
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
                    me.set('addToCartErr', '');
                    me.addToCart();
                    me.on('addedtocart', function (cartitem) {
                        GlobalCart.update('redirect_to_cart');
                    });
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
                optionModel.set('addonsPopup', true);
                optionModel.set('cartItemId',cartitem.data.id);
                optionModel.set('totalQuant',cartitem.data.quantity);
                optionModel.set('hasAddon', false);
                optionModel.set('prodPrice', 'prodPrice');
                var price = JSON.parse(JSON.stringify(optionModel.get('price')));
                optionModel.set('oldPrice', price.price);
                optionModel.set('oldSalePrice', price.salePrice);
                var options = JSON.parse(JSON.stringify(optionModel.get('options')));

                for (var i = 0; i < options.length; i++) {
                    var count = 0;
                    count = parseInt(count, 10);
                    var option = options[i];
                    if(option.attributeDetail.dataType == 'ProductCode') {
                        if (optionModel.get('hasAddon') === false) {
                            optionModel.set('hasAddon', true);
                        }
                        var optionValues = option.values;
                        for (var j = 0; j < optionValues.length; j++) {
                            var optionValue = optionValues[j];
                            if (optionValue.bundledProduct.inventoryInfo.onlineStockAvailable > 0) {
                                count++;
                                break;
                            }
                        }
                    }
                    option.stockCount = count;
                    options[i] = option;
                }
                optionModel.set('options',options);

                optionModel.set('addToCartButton','disabled');
                me.render();
                if (cartitem && cartitem.prop('id')) {
                    CartMonitor.addToCount(optionModel.get('quantity'));
                    GlobalCart.update();
                }
            });
            this.model.on('addedtocarterror', function (error) {
                if (error.message.indexOf('Validation Error: The following items have limited quantity or are out of stock') > -1) {
                    optionModel.set('addToCartErr', Hypr.getLabel('outOfStockError'));
                } else {
                    optionModel.set('addToCartErr', error.message);
                }
                me.render();
            });
        }
    });
    var AddonView = Backbone.MozuView.extend({
        templateName: 'modules/product/product-addons-popup',
        additionalEvents: {
            'click .addtocart': 'addToCart',
            'click .colorswatch': "colorswatch",
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
        },
        render: function () {
            Backbone.MozuView.prototype.render.call(this);
        },
        refreshOptions: function() {
            var options = JSON.parse(JSON.stringify(this.model.get('options')));

            for (var i = 0; i < options.length; i++) {
                var count = 0;
                count = parseInt(count, 10);
                var option = options[i];
                if(option.attributeDetail.dataType == 'ProductCode') {
                    var optionValues = option.values;
                    for (var j = 0; j < optionValues.length; j++) {
                        var optionValue = optionValues[j];
                        if (optionValue.bundledProduct.inventoryInfo.onlineStockAvailable > 0) {
                            count++;
                            break;
                        }
                    }
                }
                option.stockCount = count;
                options[i] = option;
            }
            this.model.set('optionArr',options);
        },
        onQuantityChange: _.debounce(function (e) {
            var $qField = $(e.currentTarget),
              newQuantity = parseInt($qField.val(), 10);
            if (!isNaN(newQuantity)) {
                this.model.updateQuantity(newQuantity);
            }
        },500),
        onOptionChange: function (e) {
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
            var selectedCount = 0;
            selectedCount = parseInt(selectedCount, 10);
            var options = JSON.parse(JSON.stringify(this.model.get('options')));
            for (var i = 0; i < options.length; i++) {
                var optionn = options[i];
                var optionValues = optionn.values;
                if(optionn.attributeDetail.dataType == 'ProductCode') {
                    for (var j = 0; j < optionValues.length; j++) {
                        var optionValue = optionValues[j];
                        if (optionValue.isSelected === true) {
                            selectedCount++;
                        }
                    }
                }
            }
            if(selectedCount === 0){
                this.model.set('addToCartButton','disabled');
            } else {
                this.model.set('addToCartButton','');
            }
            this.refreshOptions();
        },
        quantityMinus: function() {
            if(typeof this.model.get('productCode') !== 'undefined') {
                if(!this.model.get('purchasableState').isPurchasable) {
                    return;
                }
                var _qtyObj = $('[data-mz-validationmessage-for="quantity"]'),
                    _qtyCountObj = $('.mz-productdetail-qty');
                _qtyObj.text('');
                var value = parseInt(_qtyCountObj.val(), 10);
                if (typeof this.model.attributes.inventoryInfo.onlineStockAvailable !== 'undefined') {
                    if (this.model.attributes.inventoryInfo.onlineStockAvailable >= value)
                    $(".mz-productdetail-addtocart").removeClass("is-disabled");
                }
                if (value == 1) {
                    _qtyObj.text("Quantity can't be zero.");
                   // $('.modal-body').animate({ scrollTop: $('.tab_container')[0].scrollHeight }, 'slow');
                    return;
                }
                value--;
                this.model.updateQuantity(value);
                _qtyCountObj.val(value);
            }
        },
        quantityPlus: function() {
            if(typeof this.model.get('productCode') !== 'undefined'){
                if(!this.model.get('purchasableState').isPurchasable) {
                    return;
                }
                var _qtyObj = $('[data-mz-validationmessage-for="quantity"]'),
                _qtyCountObj = $('.mz-productdetail-qty');
            _qtyObj.text('');
            var value = parseInt(_qtyCountObj.val(), 10);


            if (value == 99) {
                _qtyObj.text("Quantity can't be greater than 99.");
                return;
            }
            value++;
            if (typeof this.model.attributes.inventoryInfo.onlineStockAvailable !== 'undefined' && this.model.attributes.inventoryInfo.onlineStockAvailable < value) {
                $(".mz-productdetail-addtocart").addClass("is-disabled");
                if (this.model.attributes.inventoryInfo.onlineStockAvailable > 0)
                $(".mz-productdetail-addtocart").removeClass("is-disabled");
                    $('[data-mz-validationmessage-for="quantity"]').text("*Only " + this.model.attributes.inventoryInfo.onlineStockAvailable + " left in stock.");
                    return;
            }
            
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
            var options = JSON.parse(JSON.stringify(me.get('options')));
            for (var i = 0; i < options.length; i++) {
                var option = options[i];
                if (option.attributeDetail.dataType == 'ProductCode') {
                   var optionValues = option.values;
                    for (var j = 0; j < optionValues.length; j++) {
                        if (optionValues[j].isSelected === true) {
                            if (optionValues[j].bundledProduct.inventoryInfo.onlineStockAvailable < newQuant ) {
                                me.set('addToCartErrr', Hypr.getLabel('outOfStockError'));
                                return this.render();
                            }
                        }
                    } 
                }
            }
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
                    me.on('addedtocart', function (cartitem) {
                        GlobalCart.update('redirect_to_cart');
                    });
                }); 
            }
        },
        addToCart: function (event) {
            
            this.model.addToCart();
            this.model.set('addonsPopup', true);
            var optionModel = this.model;
            var me = this;
            var selectedCount = 0;
            selectedCount = parseInt(selectedCount, 10);
            this.model.on('addedtocart', function (cartitem) {
                optionModel.set('cartItemId',cartitem.data.id);
                optionModel.set('totalQuant',cartitem.data.quantity);
                optionModel.set('hasAddon', false);
                optionModel.set('prodPrice', 'prodPrice');
                var price = JSON.parse(JSON.stringify(optionModel.get('price')));
                if (price.priceType == 'MAP') {
                    optionModel.set('oldCatalogListPrice', price.catalogListPrice);
                    optionModel.set('oldCatalogSalePrice', price.catalogSalePrice);
                } else {
                    optionModel.set('oldPrice', price.price);
                    optionModel.set('oldSalePrice', price.salePrice);
                }
                var options = JSON.parse(JSON.stringify(optionModel.get('options')));

                for (var i = 0; i < options.length; i++) {
                    var count = 0;
                    count = parseInt(count, 10);
                    var option = options[i];
                    if(option.attributeDetail.dataType == 'ProductCode') {
                        if (optionModel.get('hasAddon') === false) {
                            optionModel.set('hasAddon', true);
                        }
                        var optionValues = option.values;
                        for (var j = 0; j < optionValues.length; j++) {
                            var optionValue = optionValues[j];
                            if (optionValue.bundledProduct.inventoryInfo.onlineStockAvailable > 0) {
                                count++;
                                break;
                            }
                        }
                    }
                    option.stockCount = count;
                    options[i] = option;
                }
                optionModel.set('options',options);
                optionModel.set('addToCartButton','disabled');
                me.render();
                if (cartitem && cartitem.prop('id')) {
                    CartMonitor.addToCount(optionModel.get('quantity'));
                    GlobalCart.update();
                }
            });
            this.model.on('addedtocarterror', function (error) {
                if (error.message.indexOf('Validation Error: The following items have limited quantity or are out of stock') > -1) {
                    optionModel.set('addToCartErr', Hypr.getLabel('outOfStockError'));
                } else {
                    optionModel.set('addToCartErr', error.message);
                }
                me.render();
            });
        }
    });
});