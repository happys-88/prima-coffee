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

        var ContactUsView = EditableView.extend({
            templateName: 'modules/contact-us/contact',
            autoUpdate: [
                'name',
                'email',
                'subject',
                'order',
                'message'
            ],
            setError: function(msg) {
                this.model.set('isLoading', false);
                this.trigger('error', { message: msg || 'Something went wrong!! Please try after sometime!' });
            },
            contactUsSubmit: function() {
                $("#submitMsg").hide();
                var self = this;
                var name = self.model.get('name');
                var email = self.model.get('email');
                var subject = self.model.get('subject');
                var ordernumber = self.model.get('order');
                var message = self.model.get('message');
                console.log(self.model);
                if (!self.model.validate()) {
                    api.request("POST", "/commonRoute",
                    {
                        requestFor:'contactUsMail',
                        name:name,
                        ordernumber:ordernumber,
                        email:email,
                        subject: subject,
                        message: message
                    }).then(function (response){
                        var labels = HyprLiveContext.locals.labels;
                        var errorMessage =labels.emailMessage;
                        if(response[0]) {
                            if(response[0] !== 'one' && response[0].indexOf('ITEM_ALREADY_EXISTS') < 0) {
                                console.log("Error : "+response[0]);
                                errorMessage  = labels.contactUsError;
                                $("#submitMsg").html(errorMessage);
                                $("#submitMsg").show(); 
                            } else if(response[1] !== 'two') {
                                console.log("Error : "+response[1]);
                                errorMessage  = labels.contactUsError;
                                $("#submitMsg").html(errorMessage);
                                $("#submitMsg").show();    
                            } else if (response[2] === 'mailfailed') {
                                $('#contactUsForm').each(function(){
                                    this.reset();
                                });
                                errorMessage  = labels.mailError;
                                $("#submitMsg").html(errorMessage);
                                $("#submitMsg").show();
                            } else {
                                $("#submitMsg").html(errorMessage);
                                $('#contactUsForm').each(function(){
                                    this.reset();
                                });
                                $("#submitMsg").show().delay(4000).fadeOut();    
                            }
                        } else {
                             console.log("Error : ");
                             errorMessage  = "Invalid form submission";
                             $("#submitMsg").html(errorMessage);
                             $("#submitMsg").show();
                        }
                        
                    }, function(err) {
                        console.log("Failure : "+JSON.stringify(err));
                        self.setError();
                    });
                } else {
                    self.setError("Invalid form submission");
                }
                self.model.set('isLoading', true);
            },
            render: function() {
                Backbone.MozuView.prototype.render.apply(this);
            }
        });

        var validationfields = {
            'name': {
                required: true,
                msg: Hypr.getLabel('genericRequired')
            },
            'email': [{
                required: true,
                msg: Hypr.getLabel('genericRequired')
            },
            {
                pattern: 'email',
                msg: Hypr.getLabel('emailMissing')
            }],
            'subject': {
                required: true,
                msg: Hypr.getLabel('genericRequired')
            },
            'message': {
                required: true,
                msg: Hypr.getLabel('genericRequired')
            }
        };
        if (HyprLiveContext.locals.themeSettings.enableCaptcha) {
            _.extend(validationfields, {
                'recaptcha_widget_div': {
                    required: function(val, attr, computed) {
                        return window.recaptchaResponse === undefined;
                    },
                    msg: Hypr.getLabel('captchaStatusMessage')
                }
            });
        }
        var Model = Backbone.MozuModel.extend({
            validation: validationfields
        });
        var $contactUsEl = $('.contact');
        var contactUsView = window.view = new ContactUsView({
            el: $contactUsEl,
            model: new Model({})
        });
        contactUsView.render();
    });