define([
	'modules/jquery-mozu',
	"modules/views-collections"
], function($, CollectionViewFactory) { 
    $(document).ready(function() {
       	var str = location.href;
    	var n = str.indexOf("searchPage=globalSearch");
	    if(n!==-1){
	        window.facetingViews = CollectionViewFactory.createFacetedCollectionViews({
                $body: $('[data-mz-search]'),
                template: "search-interior"
            });
	    }else{
	    	window.facetingViews = CollectionViewFactory.createFacetedCollectionViews({
                $body: $('[data-mz-search]'),
                template: "search-interior-lc"  
            }); 
	    }    
    });
});