define([
	"modules/jquery-mozu",
	"underscore",
	"hyprlive",
	"modules/backbone-mozu",
	"hyprlivecontext",
	"modules/api"  
],  

function ($, _, Hypr, Backbone, HyprLiveContext, api) {
	$(document).ready(function(){ 
	    var orderId = location.hash.substring(1);
    	api.request("GET", '/api/commerce/orders/'+orderId).then(function(body){ 
		var dataitems=_.pluck(body.items, 'productDiscounts');
		var coupon= _.pluck(_.flatten(dataitems),'couponCode');
		var impact=_.pluck(_.flatten(dataitems),'impact');
		var unqimpact=[];
		var impactsum=0;
		var unqcoupon=_.uniq(coupon);
		for(var i=0;i<unqcoupon.length; i++){
		impactsum=0;
		for(var j=0;j<coupon.length; j++){
			if(unqcoupon[i]==coupon[j]){
				impactsum=impactsum+impact[j];
							}
						}
		unqimpact.push(impactsum);
		}	
		var discountcoupon= _.object(unqcoupon,unqimpact);
			var print = Backbone.MozuModel.extend({}); 
			var printmodel = new print(body);
			printmodel.set({
			 	"discount": discountcoupon
			 });	
			$('#print-order').empty().append(Hypr.getTemplate('modules/my-account/print-order').render({ model: printmodel.toJSON() }));      
		});

		// Print the content of order history 
        $(document).on('click','#printInvoice', function(){  
         	window.print();   
        });

        $(".mz-printorder .mz-checkout-footer").show();  

	}); 
});  
 
