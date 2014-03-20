var
    //Prototype objects
    $,
    $$,
    Class,
    Event,
    Element,
    Form,
    //external objects
    shippingRegionUpdater,
    //Creae the constructor
    Shipping = Class.create();

Shipping.prototype = {
    stepContainer: null,

    /**
     * Required initialization
     *
     * @param id step id
     */
    initialize: function (id) {
        'use strict';

        this.stepContainer = $('checkout-step-' + id);
        if (!this.stepContainer) {
            return;
        }
        /**
         * Observe the customer choice regarding an existing address
         */
        $$('input[name="shipping_address_id"]').each(
            function (element) {
                Event.observe(
                    $(element),
                    'change',
                    this.newShippingAddress.bindAsEventListener(this)
                );
            }.bind(this)
        );

        /**
         * Observe the state of the "use billing address for shipping" option
         * when initializing the shipping step
         */
        $$('input[name="billing[use_for_shipping]"]').each(
            function (element) {
                if (!!element.checked) {
                    $('shipping:same_as_billing').checked = !!element.value;
                }
            }
        );

        /**
         * Start observing the change of the "use billing address for shipping" option
         */
        $$('input[name="billing[use_for_shipping]"]').each(
            function (element) {
                Event.observe(
                    $(element),
                    'change',
                    this.toggleSameAsBilling.bindAsEventListener(this)
                );
            }.bind(this)
        );

        /**
         * Set the shipping form to the data of the billing one in case the customer
         * select the "use billing address" checkbox
         */
        Event.observe(
            $('shipping:same_as_billing'),
            'change',
            function (event) {
                if (Event.element(event).checked) {
                    this.setSameAsBilling(true);
                    $('billing:use_for_shipping_yes').checked = true;
                    $('billing:use_for_shipping_no').checked  = false;
                }
            }.bind(this)
        );
    },

    /**
     * Toggles the new shipping address form display depending on customer's
     * decision to use an existing address or to enter a new one.
     * Works for logged in customers only
     */
    newShippingAddress: function () {
        'use strict';

        var value;

        $$('input[name="shipping_address_id"]').each(
            function (element) {
                if (!!element.checked) {
                    value = !!parseInt(element.value, 10);
                    var billingId = element.id.replace(/^shipping/, 'billing');
                    if (!$(billingId).checked) {
                        $('shipping:same_as_billing').checked     = false;
                        $('billing:use_for_shipping_yes').checked = false;
                        $('billing:use_for_shipping_no').checked  = true;
                    }
                }
            }
        );
        //undefined value means no selection for shipping_address_id, also no "New Address - hide form
        if (!value && value !== undefined) {
            //   $('shipping:same_as_billing').checked = false;
            Element.show('shipping-new-address-form');
        } else {
            Element.hide('shipping-new-address-form');
        }
    },

    /**
     * Responds to the customer's selecting the option "use billing address for shipping".
     * Copies the content of the billing address form into the shipping form if yes.
     *
     * Resets the shipping address form if no.
     */
    toggleSameAsBilling: function () {
        'use strict';

        var value = false;

        $$('input[name="billing[use_for_shipping]"]').each(
            function (element) {
                if (!!element.checked) {
                    value = !!parseInt(element.value, 10);
                }
            }
        );

        //value === true : same as billing
        //value === false : different shipping address

        if (value) {
            this.setSameAsBilling(true);
        } else {
            this.resetAddress();
        }
    },

    /**
     * Copies the data from the billing form into the shipping one
     *
     * @param flag flag to copy the data or not
     */
    setSameAsBilling: function (flag) {
        'use strict';

        var arrElements,
            elemIndex,
            billingId;

        if (flag) {
            arrElements = Form.getElements($('co-shipping-form'));
            for (elemIndex in arrElements) {
                if (arrElements.hasOwnProperty(elemIndex)) {
                    if (arrElements[elemIndex].id) {
                        billingId = arrElements[elemIndex].id.replace(/^shipping/, 'billing');
                        if ((billingId === 'billing:region_id') && shippingRegionUpdater) {
                            shippingRegionUpdater.update();
                        }
                        arrElements[elemIndex].value = ($(billingId) && $(billingId).value) ? $(billingId).value : '';
                        if ($(billingId) && !!$(billingId).checked) {
                            arrElements[elemIndex].checked = true;
                        }
                        if ($(billingId)
                                && ($(billingId).name === 'billing_address_id')
                                && (!$(billingId).value)
                                ) {
                            this.newShippingAddress();
                        }
                    }
                }
            }
        } else {
            $('shipping:same_as_billing').checked = false;
        }
    },

    /**
     * Sets shipping form input values to nothing (except shipping_address_id radio options)
     */
    resetAddress: function () {
        'use strict';
        var arrElements,
            elemIndex;

        arrElements = Form.getElements($('co-shipping-form'));
        for (elemIndex in arrElements) {
            if (arrElements.hasOwnProperty(elemIndex)) {
                if (!!arrElements[elemIndex].value) {
                    if ((arrElements[elemIndex].name !== 'shipping_address_id')
                            && (arrElements[elemIndex].name !== 'shipping[address_id]')
                            ) {
                        arrElements[elemIndex].value = '';
                    }
                }
            }
        }
    }
};