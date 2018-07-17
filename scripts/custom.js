define([ 
	"modules/jquery-mozu",
	"bxslider" 
], function( $, bxslider) { 
	
	//home slider
	$('#mz-home-slider .slider').bxSlider({
		auto: false,
		useCSS: false,
		speed: 1000,  
		minSlides: 1,
		maxSlides: 1,
		moveSlides: 1,
		slideMargin: 0,
		infiniteLoop: false,
		pager: true,
		hideControlOnEnd: true,
		touchEnabled: true,
		onSliderLoad: function() {
			$(".slider").css("visibility", "visible");
		}
	});
	//home slider ends

	// My Account Tabbing Redirection
	if(window.location.pathname == "/myaccount"){
		var hash=window.location.hash;
		if(hash !==""){
			$("li.mz-scrollnav-item").removeClass("active");
			$("#accordion div").removeClass("in").removeClass("active");
			$("a").attr( "href" );
			var href="a[href="+"'"+ hash +"'"+"]";
			$(href).parent(".mz-scrollnav-item").addClass("active");
			$(hash).addClass("in").addClass("active");
		}
	}
	$(document).on('click','.dropdown-menu a', function(e){ 
		e.stopImmediatePropagation();
		var str = $(this).attr("href");
		var n = str.indexOf("#");
		changehash(str.slice(n));
    });
	function changehash(hash){	
		//var hash=window.location.hash;
		$("li.mz-scrollnav-item").removeClass("active");
		$("#accordion div").removeClass("in").removeClass("active");
		$("a").attr( "href" );
		var href="a[href="+"'"+ hash +"'"+"]";
		$(href).parent(".mz-scrollnav-item").addClass("active");
		$(hash).addClass("in").addClass("active");
	}
	
	$(document).ready(function(){ 

		$("#newsletter").click(function(e){
			var email = $("#newsletterEmail").val();
			var pattern =/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
   			if(pattern.test(email)) {
   				$("#errorEmail").hide();
   				$("#newsletterEmail").val('');
   				$("#thanksMsg").show().delay(2000).fadeOut();
   				$.get("/mailchimp", {accountId:email, deals:"PSNewsLetter"},  function(res){ 
                   console.log("Response : "+res);   
                }).fail(function(err) {
                    console.log("Failure "+JSON.stringify(err));   
                });
   			} else {
   				$("#errorEmail").show();
   			}
		});

		// Check if sitenav-item has dropdown
		$(".mz-sitenav-list .mz-sitenav-item").each(function(){
            if($(this).find("div.mz-sitenav-sub-container").length !== 0){
                $(this).addClass("has-dropdown"); 
            }
        }); 

        // Check if sitenav-item has dropdown - Learning Center
		$(".mz-sitenav-lc .mz-sitenav-item").each(function(){
            if($(this).find(".mz-sitenav-sub-sub").length !== 0){
                $(this).addClass("has-dropdown"); 
            }
        }); 
		
		// Global Navigation - Calculate the position of dropdown
		function calculatingSubPosition() {
            $(".mz-sitenav-sub-container").each(function() {
	            var currentElemnt = $(this),
	            	currentDropWidth = currentElemnt.outerWidth(),
	                rightReference = $("#store-branding").offset().left + $(".mz-header-bottom .container").outerWidth(),
	                currentParentOffset = currentElemnt.parents(".mz-sitenav-item").offset().left, 
	                leftOrigin = $(".mz-sitenav-list").offset().left;
	                
	                //console.log(leftOrigin); 
	                //console.log(currentDropWidth + "--" + currentParentOffset);   
	              
	            if (currentParentOffset + currentDropWidth >= rightReference) {
	                currentElemnt.addClass("menu-right");
	            } else {
	                currentElemnt.removeClass("menu-right"); 
	            }
	        });
        }

        calculatingSubPosition();

        // Declaration of scrollToTop function 
        function scrollToTop(){
        	$("body, html").animate({ 
	            scrollTop: 0
	        }, 600); 
        }
		
		if ($(this).scrollTop() > 200) {  
	        $("#scroll-to-top").show();
	    }
		// Sticky Nav Header
		$(window).scroll(function() {    
		    var scroll = $(window).scrollTop();  

		    if (scroll >= 34) {
		        $("body").addClass("header-fixed");
		        $(".mz-sticky-header").addClass("fixed"); 
		        $("#page-content").addClass("fixed-header");		        
		    } else {
		        $(".mz-sticky-header").removeClass("fixed"); 
		        $("body").removeClass("header-fixed");
		        $("#page-content").removeClass("fixed-header"); 
		        $(".mz-back-to-top-btn").fadeOut();
		    }  

		    if (scroll >= 200) {
		    	$(".mz-back-to-top-btn").fadeIn();
		    } else{
		    	$(".mz-back-to-top-btn").fadeOut(); 
		    }

		});

		// Back To Top
		$(".mz-back-to-top-btn").click(function(){
	        scrollToTop(); 
	    });

		// Refine By Toggle in Mobile
		$(document).on('click','.mz-facets-dropdown', function(){ 
			$(this).toggleClass("mz-facets-dropdown-open");
		    $(".mz-faceting-section").toggleClass("mz-faceting-section-open");
		});
		
		var navHeight = $(".mz-sitenav").outerHeight();
		//alert(navHeight); 
		$(".mz-sitenav-sub-container").css('top', navHeight);
			
		$(window).resize(function(){	
			// Global Nav Dropdown function
			calculatingSubPosition(); 
		});

		$(".mz-sitenav-item .mz-sitenav-link").css('height', navHeight); 

		// Brand Gateway 
		$(".brand-letter a").on('click', function(e){
		    var id = $(this).attr("name");
		    var position = $(id).position();
		    $('body,html').animate({
		    	scrollTop : position.top                       
		    }, 500);
		    
		});

		// Blog Facets
		$(document).on('click','.mz-facet-row', function(){    
			$(this).toggleClass("active");    
		});
		$("#lcBlogFacets .mz-facet-row").each(function(){
			$(document).on('click','.mz-facet-title', function(){   
				$(this).parent(".mz-facet-row").toggleClass("active");   
			});

			// Hide facet dropdown when clicks outside 
			$(document).mouseup(function (e){
			  var currentFacetRow = $(".mz-facet-row"); 
			  if (!currentFacetRow.is(e.target) && currentFacetRow.has(e.target).length === 0) {
				currentFacetRow.removeClass("active");  
			  }
			}); 
		});

		/*$(".mz-table-cart .mz-carttable-items").find(".mz-carttable-item").each(function(){ 
			var getCartItemHeight = $(this).outerHeight(); 
			console.log(getCartItemHeight);   
		});*/ 

		// Category Slider in mobile
		var windowWidth = $(window).width();
		if(windowWidth <= 767){ 
			$('#shopByCategorySlider').bxSlider({  
		        minSlides: 1,    
	            moveSlides: 1,
	            slideWidth: 300,    
	            slideMargin: 0,  
	            responsive: true,
	            controls: false,  
	            speed: 1000, 
	            infiniteLoop: false,
	            hideControlOnEnd: true,
		        onSliderLoad: function() {
		            $(".slider").css("visibility", "visible"); 
		        }  
			});  
		}  
		
		// Checkout Changes
		setTimeout(function(){ 
			$("#checkout-form").find("#step-shipping-address.is-complete").addClass("mz-shipping-address-complete");
		}, 1000);
		setTimeout(function(){
			$("#checkout-form").find("#step-shipping-method.is-complete").addClass("mz-shipping-method-complete");
		}, 1000);

		$(document).on('click','#step-shipping-method .mz-button', function(){
		    $("#step-shipping-address").addClass("mz-shipping-address-complete");
		    $("#step-shipping-method").addClass("mz-shipping-method-complete");
		    $("#step-shipping-method").removeClass("again-is-incomplete");
		});

		$(document).on('click','#step-shipping-method .mz-summary-edit', function(){
		    $("#step-shipping-address").removeClass("mz-shipping-address-complete").removeClass("is-complete").addClass("is-incomplete");
		    $("#step-shipping-method").removeClass("mz-shipping-method-complete").addClass("again-is-incomplete");
		});

		$(document).on('click','#step-shipping-address .mz-button', function(){
		    $("#step-shipping-address").addClass("address-updated");
		});

		$(document).on('click','#addressEdit', function(){
		    $("#step-shipping-method .mz-button").css('display', 'none');
		});

		// Featured Products Slider in blog detail
		if(windowWidth <= 767){ 
			//var sliderElement = $(".mz-blog-content-detail .featured-products").find(".mz-productlist-list");

			$('#productSliderMobile').bxSlider({      
		        minSlides: 1,    
	            moveSlides: 1,
	            slideWidth: 300,       
	            slideMargin: 0,  
	            responsive: true,
	            pager: false,   
	            controls: true,   
	            speed: 1000, 
	            infiniteLoop: false,
	            hideControlOnEnd: true,
		        onSliderLoad: function() {
		            $(".slider").css("visibility", "visible"); 
		        }  
			});  
		}

		// Learning Center Toggle Button
		if(windowWidth <= 1024){      
			$(".mz-mobilenav-lcenter .toggle-btn").click(function(){  
				$(this).toggleClass("active");       
			}); 
		}

		// Global Cart Continue btn
		// $(document).on('click','#continueShoppingGlobalCart', function(){   
		//     window.history.back();    
	    // });    

	});
}); 