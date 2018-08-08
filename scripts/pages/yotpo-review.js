define([
	"modules/jquery-mozu", 
	"underscore",
	"hyprlive",  
	"modules/backbone-mozu", 
	"hyprlivecontext",
	"modules/models-product", 
	"modules/api",
	"yotpo"
], 
function ($, _, Hypr, Backbone, HyprLiveContext, ProductModel, api, yotpo) {  

	$(document).ready(function(){
		var singleImgContainer = $(".yotpo-single-image-container");
	    var size_li = $(singleImgContainer).size();
	    var galleryThumbnails = 8;
	    $(".yotpo-single-image-container").addClass("hidden-thumbnails");
	    $('.yotpo-single-image-container:lt('+galleryThumbnails+')').removeClass("hidden-thumbnails"); 
	    $('.yotpo-load-more-button').click(function () {
	    	$(".yotpo-single-image-container").removeClass("hidden-thumbnails");
	   	});

	    var product = ProductModel.Product.fromCurrent();
	    var prodType = product.attributes.productType;
	    if(prodType === 'content') {
		    // Popular Articles  
		    api.request("POST", "/commonRoute",{"requestFor":"popularArticles", "pubId":HyprLiveContext.locals.themeSettings.addThisPubId}).then(function (response){
	            var artContent = '';
	            if(response.statusCode === 200) {   
	            	if(response.body.length > 0) {         	
		            	_.each(response.body, function(article) {
		            		artContent = artContent +'<li><a href='+article.url+'>'+article.title+'</a></li>';	
		            	});            	
	            	} else {
	            		artContent = "Articles not found";	
	            	}
	            } else {
	            	artContent = "Articles not found";
	            }
	            $('#popular-articles').html(artContent);
	        }, function(err) {
	            console.log("Failure : "+JSON.stringify(err));
	        }); 
	   }

	   	// Instagram Feed for learning center 
	   	var galleryThumbnailsLC = 4; 
	   	$(".yotpo-single-image-container").addClass("hidden-thumbnails");
	    $('.yotpo-single-image-container:lt('+galleryThumbnailsLC+')').removeClass("hidden-thumbnails");

	    if(prodType !== 'content') {
	    	console.log("Product");
		    // Show yotpo review & question count 
		    var getProductCode = $("#customProductCode").val(); 
			var yotpoApiKey = HyprLiveContext.locals.themeSettings.yotpoApiKey;
			var yotpoBaseUrl = HyprLiveContext.locals.themeSettings.yotpoBaseUrl;
			var reviewUrl=""+yotpoBaseUrl+"/"+yotpoApiKey+"/products/"+getProductCode+"/reviews"+"";  

			$.get(reviewUrl, function(data, status){
				if(data.status.code == 200){
					var totalReviewCount = data.response.bottomline.total_review;
					$(".yotpo-review-ques-ansr").find("#review-count").text("("+totalReviewCount+")");  
				}
			}); 
			
			var yotpoQuestionBaseUrl = HyprLiveContext.locals.themeSettings.yotpoQuestionBaseUrl;
			var questionUrl = ""+yotpoQuestionBaseUrl+"/"+yotpoApiKey+"/"+getProductCode+"/questions"+""; 

			$.get(questionUrl, function(data, status){
				if(data.status.code == 200 || (typeof data.response.questions !== 'undefined' && data.response.questions.length > 0)){
					var totalReviewCount = data.response.total_questions; 
					$(".yotpo-review-ques-ansr").find("#ques-count").text("("+totalReviewCount+")"); 
				}  
		    });
		}
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

		// Show yotpo ratings for featured products
		yotpo.showYotpoRatingStars(".mz-productlist-item");      
	});  

}); 
 
