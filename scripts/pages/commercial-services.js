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

        var CommercialServicesView = EditableView.extend({
            templateName: 'modules/page-footer/footer-forms/commercial-service-form',
            autoUpdate: [
                'email',
                'name',
                'comment'
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
                var comment = self.model.get('comment');
                
                if (!self.model.validate()) {
                    console.log("Validated");
                    api.request("POST", "/commonRoute",
                    {
                        requestFor:'commercialForm',
                        name:name,
                        email:email,
                        comment: comment
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
                                console.log("Error : "+response[1]);
                                errorMessage  = labels.contactUsError;
                                $("#commerceialFormError").html(errorMessage);
                                $("#commerceialFormError").show();    
                            } else {
                                $("#commerceialFormError").html(errorMessage);
                                $('#commercialForm').each(function(){
                                    this.reset();
                                });
                                $("#commerceialFormError").show().delay(4000).fadeOut();    
                            }
                        }
                    });
                } else {
                    $('#commerceialFormError').html("Invalid form submission");
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
                msg: Hypr.getLabel('genericRequired')
            },
            {
                pattern: 'email',
                msg: Hypr.getLabel('emailMissing')
            }],
            'name': {
                required: true,
                msg: Hypr.getLabel("fieldEmpty")
            }
        };
        var Model = Backbone.MozuModel.extend({
            validation: validationfields
        });
        var $commercialFormEl = $('#commercialForm');
        var commercialFormView = window.view = new CommercialServicesView({
            el: $commercialFormEl,
            model: new Model({})
        });
        commercialFormView.render();
    });