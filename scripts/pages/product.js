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
    "modules/page-header/global-cart" 
], function ($, _, Hypr, Backbone, CartMonitor, ProductModels, ProductImageViews, RVIModel, HyprLiveContext, api, GlobalCart) {

    var ProductView = Backbone.MozuView.extend({
        templateName: 'modules/product/product-detail',
        additionalEvents: {
            "click [data-mz-product-option]": "onOptionChange",
            "blur [data-mz-product-option]": "onOptionChange",
            "change [data-mz-value='quantity']": "onQuantityChange",
            "keyup input[data-mz-value='quantity']": "onQuantityChange",
            "click [data-mz-qty=minus]": "quantityMinus",
            "click [data-mz-qty=plus]": "quantityPlus"
        },
        render: function () {
            var me = this;
            Backbone.MozuView.prototype.render.apply(this);
            this.productCarousel();
            this.$('[data-mz-is-datepicker]').each(function (ix, dp) {
                $(dp).dateinput().css('color', Hypr.getThemeSetting('textColor')).on('change  blur', _.bind(me.onOptionChange, me));
            });
        },
        productCarousel: function () {
           
			var minSlides,
				maxSlides,
				slideWidth,
                slideMargin,
                page,
                controls,
                windowWidth=$( window ).width();
                console.log(windowWidth);
			if(windowWidth<=767){
				 minSlides=2;
				 maxSlides=2;
				 slideMargin= 5;
                 slideWidth= 333;
                 page=true;
                 controls=false;
			}else{
				 minSlides=4;
				 maxSlides=12;
				 slideWidth= 333;
                 slideMargin=15;
                 page=false;
                 controls=true;
			}
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
		        onSliderLoad: function() {
		            $(".slider").css("visibility", "visible");
		        }  
			});
		},
        onOptionChange: function (e) {
            return this.configure($(e.currentTarget));
        },
        onQuantityChange: _.debounce(function (e) {
            var $qField = $(e.currentTarget),
              newQuantity = parseInt($qField.val(), 10);
            if (!isNaN(newQuantity)) {
                this.model.updateQuantity(newQuantity);
            }
        },500),
        quantityMinus: _.debounce(function () {
            var _qtyCountObj = $('.mz-productdetail-qty');
            var value = parseInt(_qtyCountObj.val(), 10);
            if (value == 1) {
                return;
            }
            value--;
            this.model.updateQuantity(value);
            _qtyCountObj.val(value);
        },500),
        quantityPlus: _.debounce(function () {
            var _qtyCountObj = $('.mz-productdetail-qty');
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
            for (var k = 0; k < options.length; k++) {
                var addonValues = addons[k].values;
                var optionValues = options[k].values;
                for (var j = 0; j < optionValues.length; j++) {
                    var addonValue = addonValues[j];
                    var optionValue = optionValues[j];
                    optionValue.productUrl = addonValue.productUrl;
                    optionValue.imageFilePath = addonValue.imageFilePath;
                    optionValue.imageData = addonValue.imageData;
                    optionValues[j] = optionValue;
                }
                options[k].values = optionValues;
            }
            this.model.set('addons', options);
        },
        addToCart: function () {
            this.model.addToCart();
            this.model.on('addedtocart', function (cartitem) {
                $('.mz-errors').remove();
            });
            this.model.on('addedtocarterror', function (error) {
                if (error.message.indexOf('Validation Error: The following items have limited quantity or are out of stock') > -1) {
                    $('.mz-errors').find('.mz-message-item').html(Hypr.getLabel('outOfStockError'));
                } else if(error.message.indexOf('Missing or invalid parameter: variationProductCode Product is configurable. Variation code must be specified') > -1) {
                    $('.mz-errors').find('.mz-message-item').html(Hypr.getLabel('variationError'));
                }
            });
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
                                optionValues[k] = optionValue;
                            }
                            option.values = optionValues;
                            options[j] = option;
                        }
                    
                    }
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

        var product = ProductModels.Product.fromCurrent();
        var currentProductCode = product.attributes.productCode;
        if(typeof product.attributes.categories !== "undefined"){
            $.each(product.attributes.categories, function( index, value ) {
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
                });
        }
       var incr=0;
        $(document).on('click','[name=Color]', function(event){ 
            incr=0;
           
            if(product.get("mainImage")!==null){
                product.set({"color":true});
                var $thisElem = $(event.currentTarget);
                event.stopImmediatePropagation();
                var colorcode = $thisElem.attr("data-mz-option");
                var productcode = product.get("productCode");
                var sitecontext = HyprLiveContext.locals.siteContext;
                var cdn = sitecontext.cdnPrefix;
                var siteID = cdn.substring(cdn.lastIndexOf('-') + 1);
                var imagefilepath = cdn + '/cms/' + siteID + '/files/' + productcode + '_' + colorcode +'_v1'+'.jpg';
                console.log(imagefilepath);
                product.get("mainImage").imageUrl=imagefilepath;
                product.get("mainImage").src=imagefilepath;
                product.get("content").get("productImages")[0].src=imagefilepath;
                product.get("content").get("productImages")[0].imageUrl=imagefilepath;
                $.each(product.get("content").get("productImages"), function(i, item) {
                    var j=i+1;
                    var ver="_v"+j;
                    imagefilepath = cdn + '/cms/' + siteID + '/files/' + productcode + '_' + colorcode + ver+'.jpg';
                    item.color = false;
                    checkImage(imagefilepath, function(response) {
                        if (response) {
                            incr++;
                        }
                    });
                });
                if(incr===0){
                    product.get("content").get("productImages")[0].src=imagefilepath;
                    product.get("content").get("productImages")[0].imageUrl=imagefilepath;
                    product.get("content").get("productImages")[0].color = true;
                }
                
          }
          
    }); 
     function checkImage(imagefilepath, callback) {
        $.get(imagefilepath).done(function() {
            product.get("content").get("productImages")[incr].src=imagefilepath;
            product.get("content").get("productImages")[incr].imageUrl=imagefilepath;
            product.get("content").get("productImages")[incr].color = true;
            callback(true);
        }).error(function() {
            callback(false);
        });

    }
       
        product.on('addedtocart', function (cartitem) {
            if (cartitem && cartitem.prop('id')) {
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
