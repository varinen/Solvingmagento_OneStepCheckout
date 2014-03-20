var
    //Prototype objects
    $,
    $$,
    Event,
    Element,
    Class,
    //external object
    MethodStep,
    //create constructor
    Login = Class.create(),
    property;

Login.prototype = {
    stepContainer: null,
    stepId: 'checkout_method',
    /**
     * Required initialization
     *
     * @param id step id
     */
    initialize: function (id, saveMethodUrl) {
        'use strict';

        this.saveMethodsUrl = saveMethodUrl || '/checkout/onestep/saveMethod';
        this.onSave         = this.methodSaved.bindAsEventListener(this);
        this.stepContainer  = $('checkout-step-' + id);

        /**
         * Observe the customer choice regarding an existing address
         */
        $$('input[name="checkout_method"]').each(
            function (element) {
                Event.observe(
                    $(element),
                    'click',
                    this.saveMethod.bindAsEventListener(this)
                );
            }.bind(this)
        );
    },

    /**
     * Saves the checkout method to the quote
     *
     * @param event
     */
    saveMethod: function (event) {
        'use strict';

        var value = Event.element(event).value;
        this.postData(
            this.saveMethodsUrl,
            {checkout_method: value},
            'div.advice-required-entry-' + this.stepId
        );
    }
};

/**
 * Extend *_method step object prototypes with shared properties
 */
for (property in MethodStep) {
    if (MethodStep.hasOwnProperty(property)) {
        if (!Login.prototype[property]) {
            Login.prototype[property] = MethodStep[property];
        }
    }
}
