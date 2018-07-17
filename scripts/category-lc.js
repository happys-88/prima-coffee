require([
	'modules/jquery-mozu',
	"modules/views-collections",
	"hyprlivecontext"
], function( $, CollectionViewFactory, HyprLiveContext) { 
    $(document).ready(function() {
    	window.facetingViewsLC = CollectionViewFactory.createFacetedCollectionViews({  
            $body: $('#lcCategoryContent'),   
            template: "modules/learning-center/category-interior-lc" 
        });
		
	}); 
}); 