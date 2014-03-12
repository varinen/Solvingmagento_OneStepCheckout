var
    window,
    //Prototype objects
    $,
    $$,
    Ajax,
    Class,
    Event,
    Form,
//external object
    MethodStep,
    checkout,
//create constructor
    Review = Class.create(),
    property;


Review.prototype = {
    readyToSave: false,
    getStepUpdateUrl: null,
    stepId: 'review',
    forms: [],
    initialize: function (id, getStepUpdateUrl, submitOrderUrl, successUrl) {
        'use strict';

        this.stepContainer    = $('checkout-step-' + id);
        this.getStepUpdateUrl = getStepUpdateUrl || '/checkout/onestep/updateOrderReview';
        this.submitOrderUrl   = submitOrderUrl  || '/checkout/onestep/submitOrder';
        this.successUrl       = successUrl || '/checkout/onestep/success';
        this.onUpdate         = this.reviewUpdated.bindAsEventListener(this);
        this.onSuccess        = this.orderSubmitAfter.bindAsEventListener(this);
        this.readyToSave      = false;
        this.forms            = [
            'co-billing-form',
            'co-shipping-form',
            'co-shipping-method-form',
            'co-payment-form',
            'checkout-agreements'
        ];

        // update the review without validating previous steps
        Event.observe($('checkout-review-update'), 'click', this.updateReview.bindAsEventListener(this, false));

        //update with validating before submitting the order
        Event.observe($('order_submit_button'), 'click', this.submit.bindAsEventListener(this));
    },

    /**
     * Submits all checkout forms to update the review step or to place an order
     */
    submit: function () {
        'use strict';

        var checkoutMethod,
            request,
            parameters = '',
            postUrl   = this.getStepUpdateUrl,
            onSuccess = this.onUpdate,
            i;

        /**
         * Submit order instead of upating only
         */
        if (this.readyToSave) {
            postUrl   = this.submitOrderUrl;
            onSuccess = this.onSuccess;
        }

        if (checkout && checkout.validateReview(true)) {
            this.startLoader();

            this.readyToSave = true;

            for (i = 0; i < this.forms.length; i += 1) {
                if ($(this.forms[i])) {
                    parameters += '&' + Form.serialize(this.forms[i]);
                }
            }

            if (checkout.steps.login && checkout.steps.stepContainer) {
                checkoutMethod = 'register';
                $$('input[name="checkout_method"]').each(function (element) {
                    if ($(element).checked) {
                        checkoutMethod = $(element).value;
                    }
                });
                parameters += '&checkout_method=' + checkoutMethod;
            }
            parameters = parameters.substr(1);

            request = new Ajax.Request(
                postUrl,
                {
                    method:     'post',
                    onComplete: this.stopLoader.bind(this),
                    onSuccess:  onSuccess,
                    onFailure:  checkout.ajaxFailure.bind(checkout),
                    parameters: parameters
                }
            );
            //placate jslint
            if (request.nothing === undefined) {
                request.nothing = 0;
            }
        }
    },

    /**
     * Updates the review step
     *
     * @param event
     * @param noValidation
     */
    updateReview: function (event, noValidation) {
        'use strict';

        var parameters = '',
            i,
            request,
            valid = false;

        noValidation = !!noValidation;

        valid = (checkout && checkout.validateReview(!noValidation));

        if (valid) {
            this.startLoader();

            for (i = 0; i < this.forms.length; i += 1) {
                if ($(this.forms[i])) {
                    parameters += '&' + Form.serialize(this.forms[i]);
                }
            }

            parameters = parameters.substr(1);

            request = new Ajax.Request(
                this.getStepUpdateUrl,
                {
                    method:     'post',
                    onComplete: this.stopLoader.bind(this),
                    onSuccess:  this.onUpdate,
                    onFailure:  checkout.ajaxFailure.bind(checkout),
                    parameters: parameters
                }
            );
        }

        //placate jslint
        if (event.nothing === undefined) {
            event.nothing = 0;
        }
        if (request.nothing === undefined) {
            request.nothing = 0;
        }
    },

    /**
     * Updates the HTMl of the review step
     *
     * @param transport
     *
     * @returns {boolean}
     */
    reviewUpdated: function (transport) {
        'use strict';

        var response = {};

        if (transport && transport.responseText) {
            response = JSON.parse(transport.responseText);
        }

        if (!response.error && this.readyToSave) {
            if ($('order_submit_button')) {
                $('order_submit_button').title = checkout.buttonSaveText;
                $('order_submit_button').down().down().update(checkout.buttonSaveText);
            }
        } else {
            this.readyToSave = false;
            if ($('order_submit_button')) {
                $('order_submit_button').title = checkout.buttonUpdateText;
                $('order_submit_button').down().down().update(checkout.buttonUpdateText);
            }
        }
        //the response is extected to contain the update HTMl for the payment step
        if (checkout) {
            checkout.setResponse(response);
        }
    },

    /**
     * Shows the loging step loader
     */
    startLoader: function () {
        'use strict';

        $('order_submit_button').disable();
        $('review-submit-please-wait').show();
        if (checkout) {
            $('order_submit_button').down().down().update(checkout.buttonWaitText);
            checkout.toggleLoading(this.stepId + '-please-wait', true);
        }

    },

    /**
     * Hides the login step loader
     */
    stopLoader: function () {
        'use strict';

        $('order_submit_button').enable();
        $('review-submit-please-wait').hide();

        if (checkout) {
            checkout.toggleLoading(this.stepId + '-please-wait', false);
        }

    },

    /**
     * Processes the controller response to the submit order request
     *
     * @param transport
     */
    orderSubmitAfter: function (transport) {
        'use strict';

        var response = {};

        if (transport && transport.responseText) {
            response = JSON.parse(transport.responseText);
        }
        if (response.success) {
            this.isSuccess = true;
            window.location = this.successUrl;
        } else {
            this.stopLoader();
            this.readyToSave = false;
            if ($('order_submit_button')) {
                $('order_submit_button').title = checkout.buttonUpdateText;
                $('order_submit_button').down().down().update(checkout.buttonUpdateText);
            }
        }
        if (checkout) {
            checkout.setResponse(response);
        }
    }
};


/**
 * Extend *_method step object prototypes with shared properties
 */
for (property in MethodStep) {
    if (MethodStep.hasOwnProperty(property)) {
        if (!Review.prototype[property]) {
            Review.prototype[property] = MethodStep[property];
        }
    }
}
