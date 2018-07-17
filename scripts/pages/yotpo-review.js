define(["modules/jquery-mozu", 
	"underscore", "hyprlive", 
	"modules/backbone-mozu", 
	"modules/cart-monitor", 
	"modules/views-productimages",  
	"hyprlivecontext",
	"modules/views-collections",
	"modules/models-product", 
	"modules/models-price", 
	"modules/api"], 
function ($, _, Hypr, Backbone, CartMonitor, ProductImageViews, HyprLiveContext, CollectionViewFactory, ProductModel, ProductPrice, api) {

	$(document).ready(function(){
		var singleImgContainer = $(".yotpo-single-image-container");
	    var size_li = $(singleImgContainer).size();
	    var galleryThumbnails = 8;
	    $(".yotpo-single-image-container").addClass("hidden-thumbnails");
	    $('.yotpo-single-image-container:lt('+galleryThumbnails+')').removeClass("hidden-thumbnails"); 
	    $('.yotpo-load-more-button').click(function () {
	    	$(".yotpo-single-image-container").removeClass("hidden-thumbnails");
	   	});

	   	// Instagram Feed for learning center 
	   	var galleryThumbnailsLC = 4; 
	   	$(".yotpo-single-image-container").addClass("hidden-thumbnails");
	    $('.yotpo-single-image-container:lt('+galleryThumbnailsLC+')').removeClass("hidden-thumbnails");

	    // Show yotpo review & question count 
	    var getProductCode = $("#customProductCode").val(); 
		var yotpoApiKey = HyprLiveContext.locals.themeSettings.yotpoApiKey;
		var yotpoBaseUrl = HyprLiveContext.locals.themeSettings.yotpoBaseUrl;
		var reviewUrl=""+yotpoBaseUrl+"/"+yotpoApiKey+"/products/"+getProductCode+"/reviews"+"";  

		$.get(reviewUrl, function(data, status){
			var totalReviewCount = data.response.bottomline.total_review;
			$(".yotpo-review-ques-ansr").find("#review-count").text("("+totalReviewCount+")");  
		}); 
		
		var yotpoQuestionBaseUrl = HyprLiveContext.locals.themeSettings.yotpoQuestionBaseUrl;
		var questionUrl = ""+yotpoQuestionBaseUrl+"/"+yotpoApiKey+"/"+getProductCode+"/questions"+""; 

		$.get(questionUrl, function(data, status){
			var totalReviewCount = data.response.total_questions; 
			$(".yotpo-review-ques-ansr").find("#ques-count").text("("+totalReviewCount+")");    
	    });

	    var headerHeight = $(".mz-sticky-header").height();

	    $(document).on('click', '#reviewLink', function(){  
	    	$('#yotpoReviewTabs a[href="#reviewTab"]').tab('show'); 
	    	$('body,html').animate({ 
		    	scrollTop : $("#yotpoReviewTabs").offset().top-headerHeight                      
		    }, 800);         
	    });

	    $(document).on('click', '#askQuestionLink', function(){ 
	    	$('#yotpoReviewTabs a[href="#questionTab"]').tab('show');
	    	$('body,html').animate({ 
		    	scrollTop : $("#yotpoReviewTabs").offset().top-headerHeight                      
		    }, 800);         
	    });

	    $('#yotpoReviewTabs a').click(function (e) { 
		  e.preventDefault();
		  $(this).tab('show');   
		});    
	});  

}); 
 
