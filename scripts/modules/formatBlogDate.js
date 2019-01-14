define(['modules/jquery-mozu', 
	'underscore', 
	'modules/backbone-mozu', 
	'hyprlive',  
	'hyprlivecontext'], function ($, _, Backbone, Hypr, HyprLiveContext) {
		$(".post-date").each(function() {
            var currentProduct = $(this).attr("id");
            var date = $(this).attr("date");
            console.log("Data : "+currentProduct);
             
            var fullDate = new Date(date),
	        day = fullDate.getDate(), 
	        month = "January,February,March,April,May,June,July,August,September,October,November,December"
	      .split(",")[fullDate.getMonth()];

	      var displayDate = day+nth(day) +" "+month+" "+fullDate.getFullYear();
	      // console.log("Date : "+displayDate);
	      var id = "#"+currentProduct;
	      console.log("ID : "+id);
	      $(id).html(displayDate);
        });
        
	    function nth(d) {
	      if(d>3 && d<21) return 'th'; // thanks kennebec
	      switch (d % 10) {
	            case 1:  return "st";
	            case 2:  return "nd";
	            case 3:  return "rd";
	            default: return "th";
	        }
	    } 

	});