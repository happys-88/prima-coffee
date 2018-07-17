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
    		var impact = 0; 
			var m = 0;
			var discountarray;
			var couponwithimpact=[];
			var couponwithCode=[];
			
			$.each(body.couponCodes, function(i, item) {
				$.each(body.items, function(j, disc) {	
					$.each(disc.productDiscounts, function(k, item) {
						if(k>0){
							if(item.couponCode == body.couponCodes[i]){
								impact = impact+item.impact;
								couponwithimpact[m] = item.couponCode;
								couponwithCode[m] = impact;
								}
						}else{
							if(item.couponCode == body.couponCodes[i]){
								impact = impact+item.impact;
								couponwithimpact[m] = item.couponCode;
								couponwithCode[m] = impact;								
							}
						}
					 });
				});
				m = m+1;
			});
			var comp1 =_.compact(couponwithimpact);
			var comp2 =_.compact(couponwithCode);
			discountarray =_.object(comp1,comp2);
			var print = Backbone.MozuModel.extend({}); 
			var printmodel = new print(body);
			printmodel.set({
			 	"discount": discountarray
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
 
