define(['modules/api',
        'modules/backbone-mozu',
        'underscore',
        'modules/jquery-mozu',
        'hyprlivecontext',
        'hyprlive',
        "modules/block-ui",
        'modules/editable-view'
    ],
    function(api, Backbone, _, $, HyprLiveContext, Hypr, blockUiLoader, EditableView) {

        var PriceRequestView = EditableView.extend({
            templateName: 'modules/page-footer/footer-forms/price-guarantee-form',
            autoUpdate: [
                'sku',
                'price',
                'url',
                'zipcode',
                'name',
                'contact'
            ],
            setError: function(msg) {
                this.model.set('isLoading', false);
                this.trigger('error', { message: msg || 'Something went wrong!! Please try after sometime!' });
            },
            submitRequest: function() {
                var self = this;
                var labels = HyprLiveContext.locals.labels;
                var sku = self.model.get('sku'),
                    price = self.model.get('price'),
                    url = self.model.get('url'),
                    zipcode = self.model.get('zipcode'),
                    name = self.model.get('name'),
                    contact = self.model.get('contact');
                var mailBody = "Sku : "+sku;
                
                if (!self.model.validate()) {
                    api.request("POST", "/commonRoute", {'requestFor':'pricerequest','sku':sku, 'price': price, 
                        'url':url, 'zipcode':zipcode, 'name':name, 'contact':contact}).then(function (response){
                        var errorMessage = labels.emailMessage;
                        if(response[0]) {
                            if(response[0] !== 'one' && response[0].indexOf('ITEM_ALREADY_EXISTS') < 0) {
                                console.log("Error : "+response[0]);
                                errorMessage  = labels.contactUsError;
                                $("#priceRequestError").html(errorMessage);
                                $("#priceRequestError").show(); 
                            } else if(response[1] !== 'two') {
                                console.log("Error : "+response[1]);
                                errorMessage  = labels.contactUsError;
                                $("#priceRequestError").html(errorMessage);
                                $("#priceRequestError").show();    
                            } else {
                                $("#priceRequestError").html(errorMessage);
                                $('#priceGuarranteeForm').each(function(){
                                    this.reset();
                                });
                                $("#priceRequestError").show().delay(4000).fadeOut();    
                            }
                        }
                    });
                } else {
                    $('#priceRequestError').html("Invalid Form Submission");
                    console.log(" Error : Invalid ");
                }
                
            },
            render: function() {
                Backbone.MozuView.prototype.render.apply(this);
            }
        });

        var validationfields = {
            'sku': {
                required: true,
                // msg: Hypr.getLabel('emailMissing')
                msg: Hypr.getLabel("fieldEmpty")
            },
            'price': {
                required: true,
                msg: Hypr.getLabel("fieldEmpty")
            },
            'url': {
                required: true,
                msg: Hypr.getLabel("fieldEmpty")
            },
            'zipcode': {
                required: true,
                msg: Hypr.getLabel("fieldEmpty")
            },
            'name': {
                required: true,
                msg: Hypr.getLabel("fieldEmpty")
            },
            'contact': [{
                required: true,
                msg: Hypr.getLabel("fieldEmpty")
            }]
        };
        var Model = Backbone.MozuModel.extend({
            validation: validationfields
        });
        var $requestFormEl = $('#requestForm');
        var requestFormView = window.view = new PriceRequestView({
            el: $requestFormEl,
            model: new Model({})
        });
        requestFormView.render();
    });