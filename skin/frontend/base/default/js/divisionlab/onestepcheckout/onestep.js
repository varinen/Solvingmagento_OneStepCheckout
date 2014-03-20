var Checkout,
    Login,
    Billing,
    Shipping,
    ShippingMethod,
    Payment,
    Review,
    switchToPaymentMethod,
    currentPaymentMethod,
    login          = new Login('login'),
    billing        = new Billing('billing'),
    shipping       = new Shipping('shipping'),
    shippingMethod = new ShippingMethod('shipping_method'),
    payment        = new Payment('payment'),
    review         = new Review('review'),
    checkout       = new Checkout(
        {
            'login': login,
            'billing': billing,
            'shipping': shipping,
            'shipping_method': shippingMethod,
            'payment': payment,
            'review': review
        }
    );
if (currentPaymentMethod) {
    payment.currentMethod = currentPaymentMethod;
}

payment.init();

if (switchToPaymentMethod) {
    payment.switchMethod(switchToPaymentMethod);
}

review.updateReview(this, true);