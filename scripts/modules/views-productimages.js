define(['modules/jquery-mozu', 'underscore', "modules/backbone-mozu", 'hyprlive', "elevatezoom", "bxslider", "modules/api", "modules/models-product", "hyprlivecontext"], function ($, _, Backbone, Hypr, elevatezoom, bxslider, api, ProductModel, HyprLiveContext) {
    var sitecontext = HyprLiveContext.locals.siteContext;
    var cdn = sitecontext.cdnPrefix;
    var siteID = cdn.substring(cdn.lastIndexOf('-') + 1);
    var noimgsrc = "https:"+cdn + '/cms/' + siteID + '/files/' +'no-image.jpg';
    var ProductPageImagesView = Backbone.MozuView.extend({
        templateName: 'modules/product/product-images',
        events: {
            'click [data-mz-productimage-thumb]': 'switchImage',
            'click .mz-productimages-thumbs a img': 'elevatezoom'
            
        },
        //.mz-productimages-thumbimage
        initialize: function (event) { 
            this.productThumbSlider();
            $('.zoomContainer').remove();
            this.elevatezoom(event);   
            // preload images
            var imageCache = this.imageCache = {},
                cacheKey = Hypr.engine.options.locals.siteContext.generalSettings.cdnCacheBustKey;
            _.each(this.model.get('content').get('productImages'), function (img) {
                var i = new Image();
                i.src = img.imageUrl + '?max=' + Hypr.getThemeSetting('productImagesContainerWidth') + '&_mzCb=' + cacheKey;
                if (img.altText) {
                    i.alt = img.altText;
                }
                imageCache[img.sequence.toString()] = i;
            });
        },
        elevatezoom: function (event) {
            var zoomConfig = { zoomType: "inner", cursor: "crosshair", zoomWindowFadeIn: 600, zoomWindowFadeOut: 600 };       
            var zoomImage = $('.mz-productimages-mainimage');
            var elm = $(event.currentTarget);  
            $('.zoomContainer').remove();
            zoomImage.removeData('elevateZoom'); 
            zoomImage.data('zoom-image', elm.data('zoom-image'));
            zoomImage.elevateZoom(zoomConfig);
          },
          elevateZoomAfter: function (src) {
            var zoomConfig = { zoomType: "inner", cursor: "crosshair", zoomWindowFadeIn: 600, zoomWindowFadeOut: 600 };       
            var zoomImage = $('.mz-productimages-mainimage');    
            $('.zoomContainer').remove();
            zoomImage.removeData('elevateZoom'); 
            zoomImage.data('zoom-image', src);
            zoomImage.elevateZoom(zoomConfig);
          },
          productThumbSlider: function () { 
            if (this.model.get("mainImage") !== null && this.model.get("content").get("productImages").length>1){
            $('.bxslider').bxSlider({ 
                minSlides: 1,
                maxSlides: 1,
                auto: false,
                pager:false,
                useCSS: false,
                onSliderLoad: function() {
                   // $("#product-detail-slider").css("visibility", "visible");
                }
              });
            }  
          },
        switchImage: function (e) {
            $('.zoomContainer').remove();
            var $thumb = $(e.currentTarget);
            this.selectedImageIx = $thumb.data('mz-productimage-thumb');
           var switchSrc = $thumb.attr("href");
            $(".mz-productimages-thumb").removeClass("active-thumb");    
            $thumb.addClass("active-thumb");   
            this.updateMainImage(switchSrc);
            return false; 
        },
        updateMainImage: function (switchSrc) { 
            if(this.model.get("mainImage")!==null){
                $('.zoomContainer').remove();
                var src = this.model.get("mainImage").imageUrl;
                if (switchSrc) {
                $('.zoomContainer').remove();
                this.$('[data-mz-productimage-main]').prop('src', switchSrc).prop('alt', switchSrc);   
                }
                
                if(typeof switchSrc === "undefined"){
                   // 
                    if(this.model.get("showColorIcon")){
                        $('.zoomContainer').remove();
                        this.elevateZoomAfter(src);
                    }else{
                        $('.zoomContainer').remove();
                        this.elevateZoomAfter(src); 
                    }

                }
                
            }else{
               
                this.$('[data-mz-productimage-main]').prop('src', noimgsrc).prop('alt', "no image");
            }
            
        },
        render: function () {
            Backbone.MozuView.prototype.render.apply(this, arguments);
            this.updateMainImage();
            this.productThumbSlider();
        }
    });
    return {
        ProductPageImagesView: ProductPageImagesView
    };

});