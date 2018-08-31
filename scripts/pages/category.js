require([
    'modules/jquery-mozu',
    "modules/views-collections" ,
    'modules/block-ui'
], function( $, CollectionViewFactory, blockUiLoader) {  
	blockUiLoader.globalLoader();
    $(document).ready(function() {
        window.facetingViews = CollectionViewFactory.createFacetedCollectionViews({
            $body: $('[data-mz-category]'),
            template: "category-interior"
        });
    });  
}); 