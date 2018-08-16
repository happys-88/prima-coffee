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

        var WholesaleView = EditableView.extend({
            templateName: 'modules/page-footer/footer-forms/wholesale-form',
            autoUpdate: [
                'email',
                'name',
                'business'
            ],
            setError: function(msg) {
                this.model.set('isLoading', false);
                this.trigger('error', { message: msg || 'Something went wrong!! Please try after sometime!' });
            },
            submitRequest: function() {
                var self = this;
                var labels = HyprLiveContext.locals.labels;
                var name = self.model.get('name');
                var email = self.model.get('email');
                var business = self.model.get('business');
                
                if (!self.model.validate()) {
                    console.log("Validated");
                    api.request("POST", "/commonRoute",
                    {
                        requestFor:'wholesaleForm',
                        name:name,
                        email:email,
                        business: business
                    }).then(function (response){
                    // console.log("Tax Estimation : "+JSON.stringify(response));
                        var errorMessage = labels.emailMessage;
                        if(response[0]) {
                            /*if(response[0] !== 'one' && response[0].indexOf('ITEM_ALREADY_EXISTS') < 0) {
                                console.log("Error : "+response[0]);
                                errorMessage  = labels.contactUsError;
                                $("#commerceialFormError").html(errorMessage);
                                $("#commerceialFormError").show(); 
                            } else*/ if(response[0] !== 'two') {
                                console.log("Error : "+response[0]);
                                errorMessage  = labels.contactUsError;
                                $("#wholesaleFormError").html(errorMessage);
                                $("#wholesaleFormError").show();    
                            } else {
                                $("#wholesaleFormError").html(errorMessage);
                                $('#wholesaleForm').each(function(){
                                    this.reset();
                                });
                                $("#wholesaleFormError").show().delay(4000).fadeOut();    
                            }
                        }
                    });
                } else {
                    $('#wholesaleFormError').html("Invalid form submission");
                    console.log("Error : ");
                }
                
            },
            render: function() {
                Backbone.MozuView.prototype.render.apply(this);
            }
        });

        var validationfields = {
            'email': [{
                required: true,
                msg: Hypr.getLabel('fieldEmpty')
            },
            {
                pattern: 'email',
                msg: Hypr.getLabel('emailMissing')
            }],
            'name': {
                required: true,
                msg: Hypr.getLabel("fieldEmpty")
            },
            'business': {
                required: true,
                msg: Hypr.getLabel('fieldEmpty')
            }
        };
        var Model = Backbone.MozuModel.extend({
            validation: validationfields
        });
        var $wholesaleFormEl = $('#wholesaleForm');
        var wholesaleFormView = window.view = new WholesaleView({
            el: $wholesaleFormEl,
            model: new Model({})
        });
        wholesaleFormView.render();
    });