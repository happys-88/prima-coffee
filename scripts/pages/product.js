require(["modules/jquery-mozu", 
    "underscore", 
    "hyprlive", 
    "modules/backbone-mozu", 
    "modules/cart-monitor", 
    "modules/models-product", 
    "modules/views-productimages", 
    "modules/product/recently-viewed-products", 
    "hyprlivecontext",
    "modules/api",
    "modules/page-header/global-cart",
    'modules/block-ui'  
], function ($, _, Hypr, Backbone, CartMonitor, ProductModels, ProductImageViews, RVIModel, HyprLiveContext, api, GlobalCart, blockUiLoader) {
    blockUiLoader.globalLoader();
    var ProductView = Backbone.MozuView.extend({
        templateName: 'modules/product/product-detail',
        additionalEvents: {
            "click [data-mz-product-option]": "onOptionChange",
            "blur [data-mz-product-option]": "onOptionChange",
            "change [data-mz-value='quantity']": "onQuantityChange",
            "keyup input[data-mz-value='quantity']": "onQuantityChange1",
            "click [data-mz-qty=minus]": "quantityMinus",
            "click [data-mz-qty=plus]": "quantityPlus"
        },
        render: function () {
            this.refreshStock();
            blockUiLoader.unblockUi();
            var me = this;
            Backbone.MozuView.prototype.render.apply(this);
            this.productCarousel();
            this.$('[data-mz-is-datepicker]').each(function (ix, dp) {
                $(dp).dateinput().css('color', Hypr.getThemeSetting('textColor')).on('change  blur', _.bind(me.onOptionChange, me));
            });
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
                    if (prValue.value == '4') {
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
                    } else if (propValue.value == '4') {
                        stockMessage = Hypr.getLabel('itemDiscontinued');
                        itemDiscontinued = true;
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
            this.model.set('checkItem', false);
            if (!itemDiscontinued) {
                $('#add-to-cart').prop('disabled', false);
                this.model.set('checkItem', true);
            }

            this.model.set('stockMessage', stockMessage);
        },
        productCarousel: function () { 
            var minSlides, 
                maxSlides,
                slideWidth,
                slideMargin,
                page,
                controls,
                windowWidth = $(window).width(),
                minSlideItems,
                sequence; 
                 if(typeof this.model.get("addon-sequence")=="undefined" ){
                     sequence= 0;
                  }
                  else{
                        if(this.model.get("addon-sequence")<=3){
                            sequence=0;
                        }
                        if(this.model.get("addon-sequence")>3){
                            sequence=parseInt(this.model.get("addon-sequence"), 10) - 3;
                        }
               }
            if(windowWidth <= 991){  
                minSlides = 2;
                maxSlides = 2;
                slideMargin = 20;
                slideWidth = 300; 
                page = true;
                controls = false;
                minSlideItems = $("#addonslider .addon-product").length; 
            }else{
                minSlides = 4;
                maxSlides = 12;
                slideWidth = 333;  
                slideMargin = 25;      
                page = false;
                controls = true;
                minSlideItems = $("#addonslider .addon-product").length;   
            }
            
            if((minSlides==2 && minSlideItems>2) || (minSlides==4 && minSlideItems>4)){ 
                $('#addonslider').bxSlider({  
                    minSlides: minSlides,
                    maxSlides: maxSlides,
                    moveSlides: 1,
                    slideWidth: slideWidth,
                    slideMargin: slideMargin,
                    responsive: true,
                    pager: page,
                    controls:controls,
                    speed: 1000,
                    infiniteLoop: false,
                    startSlide: sequence,
                    onSliderLoad: function() {
                        $(".slider").css("visibility", "visible");
                    }  
                });
            } 
            
        },
        onOptionChange: function (e) {
            this.model.set("addon-sequence", $(e.currentTarget).attr("data-addon-sequence")-1);
            return this.configure($(e.currentTarget));
        },
        onQuantityChange: _.debounce(function (e) {
            var $qField = $(e.currentTarget),
              newQuantity = parseInt($qField.val(), 10);
            if (!isNaN(newQuantity)) {
                this.model.updateQuantity(newQuantity);
            }
        },500),
        onQuantityChange1: _.debounce(function (e) {
            e.target.value = e.target.value.replace(/[^\d]/g, '');
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
                     this.model.set("currentVal", Quantity);
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
        quantityMinus: _.debounce(function () {
            if (this.model.get('checkItem') === false) { return; }
            var _qtyCountObj = $('.mz-productdetail-qty');
            var _qtyObj = $('[data-mz-validationmessage-for="quantity"]');
            var value = parseInt(_qtyCountObj.val(), 10);
            _qtyObj.text('');
            if (value == 1) {
                _qtyObj.text("Quantity can't be zero.");
                return;
            }
            value--;
            this.model.updateQuantity(value);
            _qtyCountObj.val(value);
        },500),
        quantityPlus: _.debounce(function () {
            if (this.model.get('checkItem') === false) { return; }
            var _qtyCountObj = $('.mz-productdetail-qty');
            var _qtyObj = $('[data-mz-validationmessage-for="quantity"]');
            _qtyObj.text('');
            var value = parseInt(_qtyCountObj.val(), 10);
            value++;
            this.model.updateQuantity(value);
            _qtyCountObj.val(value);      
        },500),
        configure: function ($optionEl) {
            var newValue = $optionEl.val(),
                oldValue,
                id = $optionEl.data('mz-product-option'),
                optionEl = $optionEl[0],
                isPicked = (optionEl.type !== "checkbox" && optionEl.type !== "radio") || optionEl.checked,
                option = this.model.get('options').get(id);

                var newValArr = [];
                var n = 0;
                n = parseInt(n, 10);
                if (option.get('attributeDetail').dataType == "ProductCode") {
                    if (!isPicked) {
                        var oldVal = option.get('value');
                        if (oldVal !== undefined && oldVal.length > 0) {
                            var no = 0;
                            no = parseInt(no, 10);

                            var c = 0;
                            c = parseInt(c, 10);

                            var length = oldVal.length;
                            var valIndex = oldVal.indexOf(newValue);
                            while(no < length) {
                                if (no !== valIndex) {
                                    newValArr[c] = oldVal[no];
                                    c++;
                                }
                                no++; 
                            }
                            if (newValArr.length > 0) {
                                newValue = [];
                                newValue = newValArr;                                
                            } else {
                                newValue = 'null';
                            }
                        }
                        isPicked = true;
                        n++;
                    }
                }
            if (option) {
                if (option.get('attributeDetail').inputType === "YesNo") {
                    option.set("value", isPicked);
                } else if (isPicked) {
                    if (n === 0) {
                        oldValue = option.get('value');
                        if (option.get('attributeDetail').dataType == "ProductCode") {
                            var val = newValue;
                            if (oldValue !== undefined && oldValue.length > 0) {
                                newValue = [];
                                for (var i = 0; i < oldValue.length; i++) {
                                    newValue[i] = oldValue[i];
                                }
                                newValue[oldValue.length] = val;
                            } else {
                                newValue = [];
                                newValue[0] = val;
                            }
                        }
                    } else {
                        oldValue = option.get('value');
                    }
                    if (oldValue !== newValue && !(oldValue === undefined && newValue === '')) {
                        option.set('value', newValue);
                    }
                }
            }
            var options = JSON.parse(JSON.stringify(this.model.get('options')));
            var addons = this.model.get('addons');
            if (addons) {
                for (var k = 0; k < options.length; k++) {
                    var addonValues = addons[k].values;
                    var optionValues = options[k].values;
                    for (var j = 0; j < optionValues.length; j++) {
                        var addonValue = addonValues[j];
                        var optionValue = optionValues[j];
                        optionValue.productUrl = addonValue.productUrl;
                        optionValue.imageFilePath = addonValue.imageFilePath;
                        optionValue.imageData = addonValue.imageData;
                        optionValue.itemDiscontinued = addonValue.itemDiscontinued;
                        optionValue.dataSequence = addonValue.dataSequence;
                        optionValues[j] = optionValue;
                    }
                    options[k].values = optionValues;
                }
                this.model.set('addons', options);
            }
        },
        addToCart: function () {
            this.model.addToCart();
        },
        addToWishlist: function () {
            this.model.addToWishlist();
        },
        checkLocalStores: function (e) {
            var me = this;
            e.preventDefault();
            this.model.whenReady(function () {
                var $localStoresForm = $(e.currentTarget).parents('[data-mz-localstoresform]'),
                    $input = $localStoresForm.find('[data-mz-localstoresform-input]');
                if ($input.length > 0) {
                    $input.val(JSON.stringify(me.model.toJSON()));
                    $localStoresForm[0].submit();
                }
            });

        },
        findStockProperty: function(properties) {
            return _.find(properties, function(property){ return property.attributeFQN == 'tenant~field_display_oos1'; });
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
                var variations = this.model.get('variations');
                if (variations && variations.length > 0) {
                    for (var x = 0; x < variations.length; x++) {
                        var stockAvailable = variations[x].inventoryInfo.onlineStockAvailable;
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
            var hasOptions = false;
            var c = 0;
            c = parseInt(c, 10);
            var prodModel = this.model;
            var productCodes = [];
            var options = JSON.parse(JSON.stringify(this.model.get('options')));
            var count = 0;
            count = parseInt(count, 10);
            for (var j = 0; j < options.length; j++) {
                var option = options[j];
                if (option.attributeFQN == "tenant~size" || option.attributeFQN == "tenant~color" || option.attributeDetail.dataType == "ProductCode") {
                    count++;
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
                if (!hasOptions && option.attributeDetail.dataType != "ProductCode") {
                    hasOptions = true;
                }
            }
            if (count == options.length) {
                this.model.set('showColorIcon', true);
            }
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
                    var addonCount = 0;
                    addonCount = parseInt(addonCount, 10);
                    for (var j = 0; j < options.length; j++) {
                        var option = options[j];
                        if (option.attributeDetail.dataType == "ProductCode") {
                            var optionValues = option.values;
                            for (var k = 0; k < optionValues.length; k++) {
                                var optionValue = optionValues[k];
                                var productCode;
                                var colorCode;
                                if(optionValue.stringValue.indexOf(':') !== -1) {
                                    productCode = optionValue.value.slice(0,optionValue.value.lastIndexOf("-"));
                                    if (optionValue.stringValue.indexOf('color') !== -1) {
                                        var colorStr = optionValue.stringValue.slice(optionValue.stringValue.indexOf('color'));
                                        if (colorStr.indexOf(',') !== -1) {
                                            colorCode = ((colorStr.split(':')[1]).split(',')[0]).trim();
                                        } else if (colorStr.indexOf(')') !== -1) {
                                            colorCode = ((colorStr.split(':')[1]).split(')')[0]).trim();
                                        }
                                        var sitecontext = HyprLiveContext.locals.siteContext;
                                        var cdn = sitecontext.cdnPrefix;
                                        var siteID = cdn.substring(cdn.lastIndexOf('-') + 1);
                                        optionValue.imageFilePath = cdn + '/cms/' + siteID + '/files/' + productCode + '_' + colorCode +'_v1'+'.jpg';

                                    } 
                                } else {
                                    productCode = optionValue.value;
                                } 
                                
                                var product = findElement(items, productCode);
                                var productImages = product.content.productImages;
                                if (productImages.length > 0) {
                                    optionValue.imageData = productImages[0];
                                }

                                optionValue.productUrl = "/"+productCode+"/p/"+productCode;
                                addonCount++;
                                var stockProperty = me.findStockProperty(product.properties);
                                optionValue.itemDiscontinued = false;
                                if (stockProperty) {
                                    var stockPropertyVal = stockProperty.values[0];
                                    if (stockPropertyVal.value == '4') {
                                        optionValue.itemDiscontinued = true;
                                        addonCount--;
                                    }
                                }
                            optionValue.dataSequence = addonCount;
                                optionValues[k] = optionValue;
                            }
                            option.values = optionValues;
                            options[j] = option;
                        }
                    
                    }
                    prodModel.set('addonCount', addonCount);
                    prodModel.set('addons', options);
                    prodModel.set('hasOptions', hasOptions);
                    me.render();
                });
            } else {
                this.model.set('hasOptions', hasOptions);
                // this.render();
            }
            
            
        }
    });

    RVIModel.renderRVI('#rvi-container');
    function findElement(arr, element) {
        var product = arr.find(function(el) {
          return el.productCode == element;
        });
        return product;
    }
    $(document).ready(function () {
        $('#indexreviews').hide();  
        $('#disqus-comments-noscript').hide(); 
        $("#blognewsletterEmail").keydown(function(e) {
            if (e.which === 13) {
                $("#blognewsletter").trigger("click");
            }
        });
        $("#blognewsletter").click(function(e){
            var email = $("#blognewsletterEmail").val();
            var pattern =/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            if(pattern.test(email)) {
                $("#blogerrorEmail").hide();
                $("#blognewsletterEmail").val('');
                $("#blogthanksMsg").show().delay(2000).fadeOut();
                api.request("POST", "/mailchimp", {'accountId':email, deals:"PCBlogs"}).then(function (response){
                   console.log("Success");    
                }, function(err) {
                    console.log("Error : "+JSON.stringify(err));
                });
            } else {
                $("#blogerrorEmail").show();
            }
        });

        var product = ProductModels.Product.fromCurrent();
        var currentProductCode = product.attributes.productCode;
        if(typeof product.attributes.categories !== "undefined"){
            $.each(product.attributes.categories, function( index, value ) {
                if(index === 0) {
            var currentCategoryCode = value.categoryId;
                    $.each(product.attributes.properties, function( index, value ) {                
                        var preUrl;
                        var hostname = window.location.hostname;
                        var flag1 = false;
                        var flag2 = false;
                        var nxtUrl;
                        api.request("GET", "/api/commerce/catalog/storefront/products/?filter=categoryId eq "+currentCategoryCode+"").then(function(body){
                            $.each(body.items, function(index, item){
                                var productCode = item.productCode;
                                var seoFriendlyUrl = item.content.seoFriendlyUrl;
                                if(currentProductCode === productCode){
                                    flag1 = true;
                                }
                                else{
                                    if(!flag1){
                                        preUrl = "http://"+hostname+"/"+seoFriendlyUrl+"/p/"+productCode+"";
                                    }
                                    else{
                                        if(!flag2){
                                            nxtUrl = "http://"+hostname+"/"+seoFriendlyUrl+"/p/"+productCode+"";
                                            flag2 = true;
                                            return false;
                                        } 
                                    }
                                }
                            }); 
                            
                            if(!_.isUndefined(preUrl)){
                                $("#prev-url").attr("href", preUrl).removeClass("is-disabled");
                            } 
                            else{
                                $("#prev-url").addClass("is-disabled");
                            }
                            if(!_.isUndefined(nxtUrl)){
                                $("#next-url").attr("href", nxtUrl).removeClass("is-disabled");  
                            }
                            else{
                                $("#next-url").addClass("is-disabled");  
                            }
                        });
                    });
                    return false;
                }
                });
        }
            
        product.on('addedtocart', function (cartitem) {
            if (cartitem && cartitem.prop('id')) {
                $('.mz-errors').remove();
                //product.isLoading(true);
                CartMonitor.addToCount(product.get('quantity'));
                $('html,body').animate({
                    scrollTop: $('header').offset().top
                }, 1000);
                GlobalCart.update();
                //product.set('quantity', 1);
                $("#global-cart").show().delay(3000).hide(0,function() { 
                    $(this).css("display", "");
                  });
                //window.location.href = (HyprLiveContext.locals.siteContext.siteSubdirectory||'') + "/cart"; 
            } else {
                product.trigger("error", { message: Hypr.getLabel('unexpectedError') });
            }
        });
        product.on('addedtocarterror', function (error) {
            product.set('continueToCart', false);
            if (error.message.indexOf('Validation Error: The following items have limited quantity or are out of stock') > -1) {
                $('.mz-errors').find('.mz-message-item').html(Hypr.getLabel('outOfStockError'));
            } else if(error.message.indexOf('Missing or invalid parameter: variationProductCode Product is configurable. Variation code must be specified') > -1) {
                $('.mz-errors').find('.mz-message-item').html(Hypr.getLabel('variationError'));
            }
        });
        product.on('addedtowishlist', function (cartitem) {
            $('#add-to-wishlist').prop('disabled', 'disabled').text(Hypr.getLabel('addedToWishlist'));
        });

        var productImagesView = new ProductImageViews.ProductPageImagesView({
            el: $('[data-mz-productimages]'),
            model: product
        });

        var productView = new ProductView({
            el: $('#product-detail'),
            model: product,
            messagesEl: $('[data-mz-message-bar]')
        });

        window.productView = productView;
        productView.render();
      //  productView.productCarousel();
        $(window).resize(function(){
            productView.render(); 
        }); 

    });

});
