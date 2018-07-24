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
            templateName: 'modules/common/price-guarantee-form',
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
                var sku = self.model.get('sku'),
                    price = self.model.get('price'),
                    url = self.model.get('url'),
                    zipcode = self.model.get('zipcode'),
                    name = self.model.get('name'),
                    contact = self.model.get('contact');
                console.log("MOdel : "+self.model.get('sku'));
                if (!self.model.validate()) {
                    console.log("vlaida : "+JSON.stringify(self.model.validate()));
                    api.request("POST", "/commonRoute", {'requestFor':'pricerequest','sku':sku, 'price': price, 
                        'url':url, 'zipcode':zipcode, 'name':name, 'contact':contact},{'modelBody':this.model}).then(function (response){
                    // console.log("Tax Estimation : "+JSON.stringify(response));
                        if(response.statusCode == 200) {
                            console.log("OK");
                        } else {
                            console.log("KO");
                        }
                    });
                } else {
                    self.setError();
                    console.log("No error : ");
                }
                /*var firstName = self.model.get('firstname');
                var lastName = self.model.get('lastname');
                var email = self.model.get('email');
                var selectedTopic = self.model.get('selectedTopic');
                var message = self.model.get('message');
                console.log(self.model);
                if (!self.model.validate()) {
                    console.log("Hello success!!");
                } else {
                    self.setError("Invalid form submission");
                }*/
                
            },
            render: function() {
                Backbone.MozuView.prototype.render.apply(this);
            }
        });

        var validationfields = {
            'sku': {
                required: true,
                // msg: Hypr.getLabel('emailMissing')
                msg: 'Sku missing'
            },
            'price': {
                required: true,
                msg: 'Price missing'
            },
            'url': {
                required: true,
                msg: "Url missing"
            },
            'zipcode': {
                required: true,
                msg: "zipcode missing"
            },
            'name': {
                required: true,
                msg: "Name missing"
            },
            'contact': {
                required: true,
                msg: "Contact missing"
            }
        };
        var Model = Backbone.MozuModel.extend({
            validation: validationfields
        });
        var $contactUsEl = $('#requestForm');
        var requestFormView = window.view = new PriceRequestView({
            el: $contactUsEl,
            model: new Model({})
        });
        requestFormView.render();
    });