define([
    'modules/jquery-mozu',
    'bxslider',
    'lazyload'
],
    function ($, bxSlider, lazyload) {
        $(".mz-featured-products").prop("hidden", false);
        var url = window.location.pathname;
        var n = url.indexOf("/learn");
        $("img.lazy").lazyload({
            placeholder: "https://upload.wikimedia.org/wikipedia/commons/b/b1/Loading_icon.gif"
        });
        $(document).on('click touchstart', 'a[class="bx-next"]', function () {
            $("img.lazy").lazyload();
        });
      
      if(n==-1){
        var slider;
        var slide = {
            productCarousel: function () {
               
                var minSlides,
                    maxSlides,
                    slideWidth,
                    slideMargin,
                    windowWidth = $(window).width();
                if (windowWidth >= 480 || windowWidth <= 767) {
                    minSlides = 2;
                    maxSlides = 2;
                    slideMargin = 10;
                    slideWidth = 333;
                }
                if (windowWidth < 480) {
                    minSlides = 1;
                    maxSlides = 1;
                    slideMargin = 10;
                    slideWidth = 333;
                }
                if (windowWidth > 767) {
                    minSlides = 4;
                    maxSlides = 12;
                    slideWidth = 333;
                    slideMargin = 15;
                }
                slider = $(".mz-featured-products .mz-productlist-list").bxSlider({
                    auto: false,
                    speed: 600,
                    minSlides: minSlides,
                    maxSlides: 12,
                    slideWidth: slideWidth,
                    moveSlides: 1,
                    slideMargin: slideMargin,
                    infiniteLoop: false,
                    controls: true,
                    pager: false,
                    touchEnabled: true,
                    preloadImages: "all",
                    onSliderLoad: function () {
                        $(".slider").css("visibility", "visible");
                    }
                });
                window.slider = slider;
            }
        };
        slide.productCarousel();
        $(window).resize(function () {
            slider.destroySlider();
            slide.productCarousel();
        });
     }
    });