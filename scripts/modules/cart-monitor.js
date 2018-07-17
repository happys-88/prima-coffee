/**
 * Watches for changes to the quantity of items in the shopping cart, to update
 * cart count indicators on the storefront.
 */
define([
    'modules/jquery-mozu',
    'modules/api',
    'bootstrap',
    'hyprlive',
    'modules/page-header/global-cart'
    ], function( $, api, Bootstrap, Hypr, GlobalCart ) {
    var $cartCount,
        user = require.mozuData('user'),
        userId = user.userId,
        $document = $(document),
        CartMonitor = {
            setAmount: function(amount) {
                var localAmount = Hypr.engine.render("{{price|currency}}", { locals: { price: amount } });
                this.$amountEl.text(localAmount);
            },
            setCount: function(count) {
                $(".mz-cartmonitor").text(count); 
                //this.$el.text(count);
                //this.update(true);
            },
            addToCount: function(count) {
                this.update(true);
            },
            getCount: function() {
                return parseInt(this.$el.text(), 10) || 0;
            },
            update: function(showGlobalCart) {
                api.get('cartsummary').then(function(summary) {
                    $.cookie('mozucart', JSON.stringify(summary.data), { path: '/' });
                    savedCarts[userId] = summary.data;
                    $document.ready(function() {
                        CartMonitor.setCount(summary.data.totalQuantity);
                        CartMonitor.setAmount(summary.data.total);
                    });
                });

            }
        },
        savedCarts,
        savedCart;

    try {
        savedCarts = JSON.parse($.cookie('mozucart'));
    } catch (e) {}

    if (!savedCarts) savedCarts = {};
    savedCart = savedCarts || savedCarts[userId];

    //if (isNaN(savedCart.itemCount)) {
        CartMonitor.update();
       // 
    //}

    $document.ready(function() {
        CartMonitor.$el = $('[data-mz-role="cartcount"]').text(savedCart.totalQuantity || 0);
        CartMonitor.$amountEl = $('[data-mz-role="cartamount"]').text(savedCart.total || 0);
    });

    return CartMonitor;

});