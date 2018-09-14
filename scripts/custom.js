define([ 
	"modules/jquery-mozu",
	"modules/api",
	"hyprlivecontext",
	"bxslider"
], function( $, api, HyprLiveContext, bxslider) { 
	
	//home slider
	$('#mz-home-slider .slider').bxSlider({
		auto: true,
		useCSS: false,
		speed: 1000,  
		minSlides: 1,
		maxSlides: 1,
		moveSlides: 1,
		slideMargin: 0,
		infiniteLoop: true,
		pager: true,
		touchEnabled: true,
        stopAutoOnClick: true,
		onSliderLoad: function() {
			$(".slider").css("visibility", "visible");
		}
	});
	//home slider ends

	// My Account Tabbing Redirection
	if(window.location.pathname == "/myaccount"){
		//Account section scroll to top after site left nav choose
		$(".mz-scrollnav-item").click(function (e) {
			$("html, body").animate({ scrollTop: 0 }, 600);
				if (e.currentTarget.className !== 'mz-scrollnav-item active') {
					$(".mz-messagebar").empty();
				}
		}); 

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
		//overlay 

		$(document).on('click', '.mz-hamburger-icon', function () {
			if($(".overlay").hasClass("active")){
				$(".overlay").removeClass("active");
			}else{
				$(".overlay").addClass("active");
			}
		});
		$(document).on('click', '.overlay', function () {
			$(this).removeClass("active");
			$('nav').removeClass("in");
		}); 
		$(document).on('click', '.mz-pagenumbers-number', function () {
			$("body, html").animate({
				scrollTop: 0
			}, 1200);
		});
		$('.mz-searchbox-button').click(function(e) {
			var elm = e.currentTarget;
			var searchType = elm.getAttribute('data-mz-searchType'); 	
			localStorage.setItem("searchType", searchType);
		});
		
		$("#subscribeEmail").keydown(function(e) {
			if (e.which === 13) {
                $("#subscribeEmailButton").trigger("click");
            }
        });
        $("#subscribeEmailButton").click(function(e){
			var email = $("#subscribeEmail").val();
			var labels = HyprLiveContext.locals.labels;
			var errorMessage = labels.subscribeMsg;
			var pattern =/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
   			if(pattern.test(email)) {
   				$("#errorMsg").hide();
   				$("#subscribeEmail").val('');
   				$("#errorMsg").html(errorMessage);
   				$("#errorMsg").show().delay(2000).fadeOut();
   				api.request("POST", "/mailchimp", {'accountId':email, deals:"PCNewsLetter"}).then(function (response){
                   console.log("Success");    
                }, function(err) {
                    console.log("Error : "+JSON.stringify(err));
                });
   			} else {
   				errorMessage = labels.emailMissing;
   				$("#errorMsg").html(errorMessage);
   				$("#errorMsg").show();
   			}
		});

		$("#newsletterEmail").keydown(function(e) {
            if (e.which === 13) {
                $("#newsletter").trigger("click");
            }
        });
		$("#newsletter").click(function(e){
			var email = $("#newsletterEmail").val();
			var pattern =/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
   			if(pattern.test(email)) {
   				$("#errorEmail").hide();
   				$("#newsletterEmail").val('');
   				$("#thanksMsg").show().delay(2000).fadeOut();
   				api.request("POST", "/mailchimp", {'accountId':email, deals:"PCNewsLetter"}).then(function (response){
                   console.log("Success");    
                }, function(err) {
                    console.log("Error : "+JSON.stringify(err));
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
		    if (scroll >= 200) {
		    	$(".mz-back-to-top-btn").fadeIn();
		    } else{
		    	$(".mz-back-to-top-btn").fadeOut(); 
		    }

		});

		// Back To Top
		$(document).on('click','.mz-back-to-top-btn', function(){
	        scrollToTop(); 
	    });

		// Refine By Toggle in Mobile
		$(document).on('click','.mz-facets-dropdown', function(){ 
			$(this).toggleClass("mz-facets-dropdown-open");
		    $(".mz-faceting-section").toggleClass("mz-faceting-section-open");
		});
		
		var navHeight = $(".mz-sitenav").outerHeight();
		$(".mz-sitenav-sub-container").css('top', navHeight);
			
		$(window).resize(function(){	
			// Global Nav Dropdown function
			calculatingSubPosition(); 
		});

		$(".mz-sitenav-item .mz-sitenav-link").css('height', navHeight); 

		// Brand Gateway 
		$(".brand-letter a").on('click', function(e){
		    var id = $(this).attr("name");
		    var position = $(id +" .brand-letter").offset().top-$(".mz-sticky-header").outerHeight( true );
		   		$('body,html').animate({
		       		scrollTop : position                  
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

		$(document).on('click',"select[data-mz-value='savedPaymentMethodId']", function(){
  			var defaultcardselect = $("[data-mz-value='savedPaymentMethodId']").val();
	        if(defaultcardselect===""){
	            var first= $("[data-mz-value='savedPaymentMethodId']").val($("[data-mz-value='savedPaymentMethodId'] option:nth(1)").val());
	        }
      	});

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

		if(!HyprLiveContext.locals.user.isAuthenticated){
			localStorage.setItem("previousTime", null); 
		}

		$('input[type="checkbox"]').click(function () {
			$(".mz-certificate-upload").toggle();
		});  
			

	});
}); 