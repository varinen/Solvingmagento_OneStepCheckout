var failureUrl = '/checkout/cart/',
    //Prototype objects
    $,
    $$,
    Event,
    Element,
    Validation,
    Class,
    //externally set variables:
    billingRegionUpdater,
    checkout,
    buttonUpdateText,
    buttonSaveText,
    buttonWaitText,
    //create the constructor
    Checkout   = Class.create();

Checkout.prototype = {
    checkoutContainer: null,
    columnLeft: null,
    columnCenter: null,
    columnRight: null,
    columnUp: null,
    columnBottom: null,
    buttonUpdateText: '',
    buttonWaitText: '',
    steps: {},
    initialize: function (steps) {

        'use strict';

        this.steps            = steps || {};
        this.columnLeft       = $('osc-column-left');
        this.columnCenter     = $('osc-column-center');
        this.columnRight      = $('osc-column-right');
        this.columnUp         = $('osc-column-up');
        this.columnBottom     = $('osc-column-bottom');
        //localized values can be set in the review/button.phtml template
        this.buttonUpdateText = buttonUpdateText || 'Update order before placing';
        this.buttonSaveText   = buttonSaveText || 'Place order';
        this.buttonWaitText   = buttonWaitText || 'Please wait...';

        this.moveTo(this.steps.login, 'up');
        this.moveTo(this.steps.billing, 'left');
        this.moveTo(this.steps.shipping, 'center');
        this.moveTo(this.steps.review, 'bottom');

        if (this.steps.shipping
                && this.steps.shipping.stepContainer
                && this.steps.shipping.stepContainer.visible()
                ) {
            this.moveTo(this.steps.shipping_method, 'right');
            this.moveTo(this.steps.payment, 'right');
        } else {
            this.moveTo(this.steps.shipping_method, 'center');
            this.moveTo(this.steps.payment, 'center');
        }
        this.observeChanges();

    },
    /**
     * Any change to the checkout inputs will replace the submit order button with the order preview button
     */
    observeChanges: function () {
        'use strict';
        $$('div.osc-column-wrapper input').each(
            function (element) {
                Event.observe(
                    $(element),
                    'change',
                    function () {
                        if (checkout.steps.review) {
                            checkout.steps.review.readyToSave = false;
                            if ($('order_submit_button')) {
                                $('order_submit_button').title = checkout.buttonUpdateText;
                                $('order_submit_button').down().down().update(checkout.buttonUpdateText);
                            }
                        }
                    }
                );
            }
        );
    },

    moveTo: function (element, id) {
        'use strict';
        var destination = this['column' + (id.charAt(0).toUpperCase() + id.slice(1))],
            parent;
        if (element && element.stepContainer && destination) {
            parent = element.stepContainer.up();
            if (destination !== parent) {
                destination.insert(element.stepContainer);
                parent.remove(element.stepContainer);
            }
        }

    },

    /**
     * Action in case of a failed (e.g., 404) ajax request
     */
    ajaxFailure: function () {
        'use strict';
        location.href = failureUrl;
    },

    /**
     * Validates the form data in an address step
     *
     * @param type billing or shipping
     *
     * @returns {boolean}
     */
    validateAddress: function (type) {
        'use strict';

        if (type  !== 'billing' && type !== 'shipping') {
            return false;
        }
        if (!window[type]) {
            return false;
        }

        if (!window[type].stepContainer) {
            //the step is not shown, no validation required
            return true;
        }
        var validationResult         = false,
            newAddressFormValidation = false,
            validator                = new Validation('co-' + type + '-form');

        newAddressFormValidation = validator.validate();

        $$('div.advice-required-entry-' + type + '-address-id').each(
            function (element) {
                $(element).hide();
            }
        );
        if ($$('input[name="' + type + '_address_id"]')
                && $$('input[name="' + type + '_address_id"]').length > 0
                ) {
            $$('input[name="' + type + '_address_id"]').each(
                function (element) {
                    if ($(element).checked) {
                        validationResult = true;
                    }
                }
            );
            if (!validationResult) {
                $$('div.advice-required-entry-' + type + '-address-id').each(
                    function (element) {
                        $(element).show();
                    }
                );
            }
        } else {
            validationResult = true;
        }
        return (newAddressFormValidation && validationResult);
    },

    /**
     * Checks if the checkout method is selected, when the selection is there
     *
     * @returns {boolean}
     */
    validateCheckoutMethod: function () {
        'use strict';

        var valid = true;
        $$('div.advice-required-entry-checkout_method').each(
            function (element) {
                $(element).hide();
            }
        );
        if ($$('input[name="checkout_method"]').length > 0) {
            valid = false;
            $$('input[name="checkout_method"]').each(
                function (element) {
                    if ($(element).checked) {
                        valid = true;
                    }
                }
            );

            if (!valid) {
                $$('div.advice-required-entry-checkout_method').each(
                    function (element) {
                        $(element).show();
                    }
                );
            }
        }

        return valid;
    },

    /**
     * Shipping Method step validation
     *
     * @returns {boolean}
     */
    validateShippingMethod: function () {
        'use strict';

        var valid = true;
        $$('li div.advice-required-entry-shipping_method').each(
            function (element) {
                $(element).hide();
            }
        );

        if ($$('input[name="shipping_method"]').length > 0) {
            valid = false;
            $$('input[name="shipping_method"]').each(
                function (element) {
                    if ($(element).checked) {
                        valid = true;
                    }
                }
            );

            if (!valid) {
                $$('li div.advice-required-entry-shipping_method').each(
                    function (element) {
                        $(element).show();
                    }
                );
            }
        }

        return valid;
    },
    /**
     * Payment Method step validation
     *
     * @returns {boolean}
     */
    validatePaymentMethod: function () {
        'use strict';

        var valid     = true,
            validator = new Validation('co-payment-form');

        $$('dt div.advice-required-entry-payment_method').each(
            function (element) {
                $(element).hide();
            }
        );

        if ($$('input[name="payment[method]"]').length > 0) {
            valid = false;
            $$('input[name="payment[method]"]').each(
                function (element) {
                    if ($(element).checked) {
                        valid = true;
                    }
                }
            );

            if (!valid) {
                $$('dt div.advice-required-entry-payment_method').each(
                    function (element) {
                        $(element).show();
                    }
                );
            }
        }

        return valid && validator.validate();
    },
    /**
     * Shipping Address step validation
     *
     * @returns {boolean}
     */
    validateBillingAddress: function () {
        'use strict';

        return this.validateAddress('billing');
    },

    /**
     * Billing Address step validation
     *
     * @returns {boolean}
     */
    validateShippingAddress: function () {
        'use strict';

        return this.validateAddress('shipping');
    },

    /**
     * validates the final step
     *
     * @param  validateSteps flag indicating that all checkout steps must be validated as well
     * @returns {boolean}
     */
    validateReview: function (validateSteps) {
        'use strict';

        var valid = false;

        if ($('shipping:same_as_billing') && $('shipping:same_as_billing').checked && this.steps.shipping) {
            this.steps.shipping.setSameAsBilling(true);
        }

        /**
         * Validate previous steps, excluding shipping method and payment method
         */
        if (validateSteps) {
            valid = this.validateCheckoutSteps(
                ['CheckoutMethod', 'BillingAddress', 'ShippingAddress', 'ShippingMethod', 'PaymentMethod']
            );
        } else {
            valid = true;
        }

        return valid;
    },

    /**
     * Validates the checkout steps
     *
     * @param steps an array with elements comprising the checkout step names.
     *              word capitalized: e.g. BillingAddress, or CheckoutMethod
     *
     * @returns {boolean}
     */
    validateCheckoutSteps: function (steps) {
        'use strict';

        var step, result = true;

        for (step in steps) {
            if (steps.hasOwnProperty(step)) {
                if (this['validate' + steps[step]]) {
                    result = this['validate' + steps[step]]() && result;
                }
            }
        }

        return result;
    },

    /**
     * Toggles the display state of loading elements
     *
     * @param element id of the target loader
     * @param mode    flag indicating hiding or showing of the element
     */
    toggleLoading: function (element, mode) {
        'use strict';

        if ($(element) && mode) {
            Element.show($(element));
        } else if ($(element)) {
            Element.hide($(element));
        }
    },

    setResponse: function (response) {
        'use strict';

        var step;

        if (response.error) {
            if ((typeof response.message) === 'string') {
                alert(response.message);
            } else {
                if (window.billingRegionUpdater) {
                    billingRegionUpdater.update();
                }
                alert(response.message.join("\n"));
            }
        } else if (response.redirect) {
            location.href = response.redirect;
            return true;
        }

        for (step in response.update_step) {
            if (response.update_step.hasOwnProperty(step)) {
                if ($('checkout-load-' + step)) {
                    $('checkout-load-' + step).update(response.update_step[step]);
                }
                /**
                 * Add validation advice and register click handlers on the newly loaded elements
                 */
                if (step === 'shipping_method' && this.steps.shipping_method) {
                    this.steps.shipping_method.methodsUpdated();
                }

                if (step === 'payment_method' && this.steps.payment) {
                    this.steps.payment.addValidationAdvice();
                    if (this.steps.payment.currentMethod) {
                        this.steps.payment.switchMethod(this.steps.payment.currentMethod);
                    }
                }
            }
        }

        this.observeChanges();
    }
};
