define([
    'modules/jquery-mozu',
    'bxslider'
],
function ($, bxSlider) { 
    var slider;
    var slide= {
        productCarousel:function(){
           // console.log("called");
            // var eachSlide = $(".mz-featured-products .mz-productlist-list").find(".mz-productlist-item"),
            //     minSlides,
            //     slideWidth,
            //     slideMargin,
            //     windowWidth = $(window).width();
            // if (windowWidth <= 767) {
            //     minSlides = 2;
            //     slideWidth = 333;
            //     slideMargin = 10;
            // } else {
            //     if (windowWidth >= 768 && windowWidth <= 1024) {
            //         minSlides = 4;
            //         slideWidth = 333;
            //         slideMargin = 15;
            //     }
            //     else {
            //         minSlides = 4;
            //         slideWidth = 333;
            //         slideMargin = 15;
            //     }

            // }
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
            if (windowWidth > 767){
                minSlides = 4;
                maxSlides = 12;
                slideWidth = 333;
                slideMargin = 15;
            }
                slider=$(".mz-featured-products .mz-productlist-list").bxSlider({
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
});