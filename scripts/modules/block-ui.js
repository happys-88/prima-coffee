define([
    'modules/jquery-mozu',
    'blockui'
], function($, blockui) {
    var blockUiLoader = {
        globalLoader: function() {
            $.blockUI({
                baseZ: 1100,
                message: '<i class="fa fa-spinner fa-spin"></i>',
                css: {
                    border: 'none',
                    padding: '15px',
                    backgroundColor: 'transparent',
                    '-webkit-border-radius': '10px',
                    '-moz-border-radius': '10px',
                    opacity: 1,
                    color: '#fff',
                    fontSize: '60px'
                }
            });
        }, 
        unblockUi: function() { 
            $.unblockUI();
        }
    };
    return blockUiLoader;
});