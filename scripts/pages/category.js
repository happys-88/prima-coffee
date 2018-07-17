require([
	'modules/jquery-mozu',
	"modules/views-collections",
	"modules/api", 
	"modules/models-product",
    "hyprlivecontext",
    "modules/api",
    "yotpo"
], function( $, CollectionViewFactory, Api, ProductModel, HyprLiveContext, api, yotpo) { 
    $(document).ready(function() {
        window.facetingViews = CollectionViewFactory.createFacetedCollectionViews({
            $body: $('[data-mz-category]'),
            template: "category-interior"
        });
    });  
});  