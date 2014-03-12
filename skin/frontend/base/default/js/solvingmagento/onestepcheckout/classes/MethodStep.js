var
    //Prototype objects
    $,
    $$,
    Ajax,
    Element,
    //external object
    checkout;


/**
 * A base object for checkout method, shipping method, and payment method steps
 *
 * @type {{}}
 */
var MethodStep = {
    stepId: null,

    /**
     * Adds validation advice DOM elements to radio buttons
     */
    addValidationAdvice: function () {
        'use strict';

        var advice, clone;
        //destroy already existing elements
        $$('li div.advice-required-entry-' + this.stepId).each(
            function (element) {
                Element.remove(element);
            }
        );
        if ($(this.stepId + '-advice-source')) {
            advice = $(this.stepId + '-advice-source').firstDescendant();
            if (advice) {

                $$('input[name="' + this.stepId + '"]').each(
                    function (element) {
                        clone = Element.clone(advice, true);
                        $(element).up().appendChild(clone);
                    }
                );
            }
        }

    },

    /**
     * Hides the login step loader
     */
    stopLoader: function () {
        'use strict';

        if (checkout) {
            checkout.toggleLoading(this.stepId + '-please-wait', false);
        }

    },

    /**
     * Shows the loging step loader
     */
    startLoader: function () {
        'use strict';

        if (checkout) {
            checkout.toggleLoading(this.stepId + '-please-wait', true);
        }

    },

    /**
     * Saves the checkout method to the quote
     *
     * @param event
     */
    postData: function (postUrl, parameters, validatonAdvice) {
        'use strict';

        $$(validatonAdvice).each(
            function (element) {
                $(element).hide();
            }
        );

        this.startLoader();

        var request = new Ajax.Request(
            postUrl,
            {
                method:     'post',
                onComplete: this.stopLoader.bind(this),
                onFailure:  checkout.ajaxFailure.bind(checkout),
                onSuccess:  this.onSave,
                parameters: parameters
            }
        );
        //placate jslint
        if (request.nothing === undefined) {
            request.nothing = 0;
        }
    },

    /**
     * Placeholder handler for the method saved event
     */
    methodSaved: function () {
        'use strict';
        if (this.nothing === undefined) {
            this.nothing = 0;
        }
    },

    /**
     * Updates the payment method step with html represeting a selection of available payment methods
     *
     * @param transport
     *
     * @returns {boolean}
     */
    updateMethods: function (transport) {
        'use strict';

        var response = {};
        if (transport && transport.responseText) {
            response = JSON.parse(transport.responseText);
        }
        //the response is extected to contain the update HTMl for the payment step
        if (checkout) {
            checkout.setResponse(response);
        }
    }
};
