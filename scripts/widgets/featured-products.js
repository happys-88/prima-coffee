require([
    'modules/jquery-mozu',
    'bxslider'
],
function ($, bxSlider) { 
    $(document).ready(function(){
        var eachSlide = $(".mz-featured-products .mz-productlist-list").find(".mz-productlist-item"), 
            minSlides,
            slideWidth, 
            windowWidth = $( window ).width();  
        if(windowWidth <= 767){
            minSlides = 2;
            slideWidth = 150;  
        }else{
            if(windowWidth >=768 && windowWidth <=1024 ){
                minSlides = 4;
                slideWidth = 170; 
            }
            else{
                minSlides = 6;
                slideWidth = 275;     
            } 
            
        }
        
        if(eachSlide.length > 6){  
            $(".mz-featured-products .mz-productlist-list").bxSlider({
                auto: false,
                speed: 600,  
                minSlides: minSlides, 
                maxSlides: 12, 
                slideWidth: slideWidth,  
                moveSlides: 1,
                slideMargin: 0,
                infiniteLoop: false,
                controls: false,
                pager: true,
                touchEnabled: true,
                onSliderLoad: function() {
                    $(".slider").css("visibility", "visible"); 
                }
            });       
        }
       
    });
});