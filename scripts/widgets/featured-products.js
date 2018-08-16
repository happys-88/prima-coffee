define([
    'modules/jquery-mozu',
    'bxslider'
],
function ($, bxSlider) { 
        var eachSlide = $(".mz-featured-products .mz-productlist-list").find(".mz-productlist-item"), 
            minSlides,
            slideWidth, 
            windowWidth = $( window ).width();  
        if(windowWidth <= 767){
            minSlides = 2;
            slideWidth = 333;  
        }else{
            if(windowWidth >=768 && windowWidth <=1024 ){
                minSlides = 4;
                slideWidth = 333; 
            }
            else{
                minSlides = 4;
                slideWidth = 333;     
            } 
            
        }
        
        if(eachSlide.length > 4){  
            $(".mz-featured-products .mz-productlist-list").bxSlider({
                auto: false,
                speed: 600,  
                minSlides: minSlides, 
                maxSlides: 12, 
                slideWidth: slideWidth,  
                moveSlides: 1,
                slideMargin: 0,
                infiniteLoop: false,
                controls: true,
                pager: false,
                touchEnabled: true,
                onSliderLoad: function() {
                    $(".slider").css("visibility", "visible"); 
                }
            });       
        }
});