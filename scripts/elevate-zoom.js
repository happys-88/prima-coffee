define([
	"modules/jquery-mozu",
	"elevateZoom"
], function( $, elevatezoom) {
	$("#mz-image-zoom").elevateZoom({
		zoomType: "inner",
		cursor: "crosshair",
		responsive: true
	});
});  