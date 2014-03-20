<?php
/**
 * Divisionlab_OneStepCheckout controller class
 *
 * PHP version 5.3
 *
 * @category  Divisionlab
 * @package   Divisionlab_OneStepCheckout
 * @author    Oleg Ishenko <oleg.ishenko@solvingmagento.com>
 * @copyright 2014 Oleg Ishenko
 * @license   http://opensource.org/licenses/osl-3.0.php Open Software License (OSL 3.0)
 * @version   GIT: <0.1.0>
 * @link      http://www.solvingmagento.com/
 *
 */

/** Divisionlab_OneStepCheckout_OnestepController
 *
 * @category Divisionlab
 * @package  Divisionlab_OneStepCheckout
 *
 * @author  Oleg Ishenko <oleg.ishenko@solvingmagento.com>
 * @license http://opensource.org/licenses/osl-3.0.php Open Software License (OSL 3.0)
 * @version Release: <package_version>
 * @link    http://www.solvingmagento.com/
 */
require_once 'Mage/Checkout/controllers/OnepageController.php';

class Divisionlab_OneStepCheckout_OnestepController extends Mage_Checkout_OnepageController
{
    /**
     * Check if a guest can proceed to the checkout
     *
     * @return boolean
     */
    protected function _canShowForUnregisteredUsers()
    {
        $guestAllowed = Mage::getSingleton('customer/session')->isLoggedIn()
            || Mage::helper('checkout')->isAllowedGuestCheckout($this->getOnestep()->getQuote())
            || !Mage::helper('checkout')->isCustomerMustBeLogged();

        if (!$guestAllowed) {
            Mage::getSingleton('customer/session')->addError(
                Mage::helper('checkout')->__('Please login or register to continue to the checkout')
            );
            $this->_redirect('customer/account/edit');
            $this->setFlag('', self::FLAG_NO_DISPATCH, true);
            //return true to the caller method _preDispatch so that it doesn't redirect to the 404 page
            return true;
        } else {
            return true;
        }

    }

    /**
     * Validate ajax request and redirect on failure
     *
     * @return bool
     */
    protected function _expireAjax()
    {
        if (!$this->getOnestep()->getQuote()->hasItems()
            || $this->getOnestep()->getQuote()->getHasError()
            || $this->getOnestep()->getQuote()->getIsMultiShipping()) {
            $this->_ajaxRedirectResponse();
            return true;
        }
        $action = $this->getRequest()->getActionName();
        if (Mage::getSingleton('checkout/session')->getCartWasUpdated(true)
            && !in_array($action, array('index', 'progress'))) {
            $this->_ajaxRedirectResponse();
            return true;
        }

        return false;
    }

    /**
     * Get one page checkout model
     *
     * @return Divisionlab_OneStepCheckout_Model_Type_Onestep
     */
    public function getOnestep()
    {
        return Mage::getSingleton('divisionlab_onestepc/type_onestep');
    }

    /**
     * Saves address data (billing or shipping)
     *
     * @param array  $data       an array containing address form data
     * @param int    $addressId  an ID of an existing address (for logged in customers only)
     * @param string $type       billing or shipping
     * @param bool   $response   allows writing an error result directly to to the controller response
     *
     * @return array|bool
     */
    protected function saveAddressData($data, $addressId, $type, $response = true)
    {
        $type = strtolower($type);

        if ($type != 'shipping' && $type != 'billing') {
            $result = array('error' => 1, 'message' => Mage::helper('checkout')->__('Error saving checkout data'));
            if ($response) {
                $this->getResponse()->setBody(Mage::helper('core')->jsonEncode($result));
                return false;
            } else {
                return $result;
            }
        }
        $method = 'save' . ucwords($type);
        $result = $this->getOnestep()->$method($data, $addressId);

        if (isset($result['error'])) {
            if ($response) {
                $this->getResponse()->setBody(Mage::helper('core')->jsonEncode($result));
                return false;
            }
        }
        return $result;
    }

    /**
     * Get shipping method step html
     *
     * @return string
     */
    protected function _getShippingMethodsHtml()
    {
        $layout = Mage::getModel('core/layout');
        $layout->getUpdate()
            ->addHandle('checkout_onestep_shippingmethod')
            ->merge('checkout_onestep_shippingmethod');
        $layout->generateXml();
        $layout->generateBlocks();
        $output = $layout->getOutput();
        return $output;
    }

    /**
     * Get payment method step html
     *
     * @return string
     */
    protected function _getPaymentMethodsHtml()
    {
        $layout = Mage::getModel('core/layout');
        $layout->getUpdate()
            ->addHandle('checkout_onestep_paymentmethod')
            ->merge('checkout_onestep_paymentmethod');
        $layout->generateXml();
        $layout->generateBlocks();
        $output = $layout->getOutput();
        return $output;
    }

    /**
     * Get order review step html
     *
     * @return string
     */
    protected function _getReviewHtml()
    {
        $layout = Mage::getModel('core/layout');
        $layout->getUpdate()
            ->addHandle('checkout_onestep_review')
            ->merge('checkout_onestep_review');
        $layout->generateXml()
            ->generateBlocks();
        $output = $layout->getBlock('checkout.review')->toHtml();
        return $output;
    }

    /**
     * Save the selected shipping method to the quote
     *
     * @param string $shippingMethod code of the selected shipping method
     * @param bool   $response       allows writing of an error result directly to the response
     *
     * @return array|bool
     */
    protected function saveShippingMethodData($shippingMethod, $response = true)
    {
        $result = $this->getOnestep()->saveShippingMethod($shippingMethod);

        if (isset($result['error'])) {
            if ($response) {
                $this->getResponse()->setBody(Mage::helper('core')->jsonEncode($result));
                return false;
            }
        }
        $this->getOnestep()->getQuote()->getShippingAddress()->setCollectShippingRates(true);

        return $result;
    }

    /**
     * Saves payment data to the quote
     *
     * @param array $data     payment data
     * @param bool  $response allows writing of an error result directly to the response
     *
     * @return array|bool
     */
    protected function savePayment($data, $response = true)
    {
        $result = array();

        try {
            $result = $this->getOnestep()->savePayment($data);

            // get section and redirect data
            $redirectUrl = $this->getOnestep()->getQuote()->getPayment()->getCheckoutRedirectUrl();
            if ($redirectUrl) {
                $result['redirect'] = $redirectUrl;
            }
        } catch (Mage_Payment_Exception $e) {
            if ($e->getFields()) {
                $result['fields'] = $e->getFields();
            }
            $result['error']   = 1;
            $resutl['message'] = $e->getMessage();
        } catch (Mage_Core_Exception $e) {
            $result['error']   = 1;
            $result['message'] = $e->getMessage();
        } catch (Exception $e) {
            Mage::logException($e);
            $result['error']   = 1;
            $result['message'] = $this->__('Unable to set Payment Method.');
        }

        if (isset($result['error'])) {
            if ($response) {
                $this->getResponse()->setBody(Mage::helper('core')->jsonEncode($result));
                return false;
            }
        }

        return $result;
    }

    /**
     * Checkout page
     */
    public function indexAction()
    {
        if (!Mage::helper('divisionlab_onestepc')->oneStepCheckoutEnabled()) {
            Mage::getSingleton('checkout/session')
                ->addError($this->__('One Step checkout is disabled.'));
            $this->_redirect('checkout/cart');
            return;
        }
        $quote = $this->getOnestep()->getQuote();
        if (!$quote->hasItems() || $quote->getHasError()) {
            $this->_redirect('checkout/cart');
            return;
        }
        if (!$quote->validateMinimumAmount()) {
            $error = Mage::getStoreConfig('sales/minimum_order/error_message') ?
                Mage::getStoreConfig('sales/minimum_order/error_message') :
                Mage::helper('checkout')->__('Subtotal must exceed minimum order amount');

            Mage::getSingleton('checkout/session')->addError($error);
            $this->_redirect('checkout/cart');
            return;
        }
        Mage::getSingleton('checkout/session')->setCartWasUpdated(false);
        Mage::getSingleton('customer/session')
            ->setBeforeAuthUrl(Mage::getUrl('*/*/*', array('_secure'=>true)));
        $this->getOnestep()->initCheckout();
        $this->loadLayout();
        $this->_initLayoutMessages('customer/session');
        $this->getLayout()->getBlock('head')->setTitle($this->__('Checkout'));
        $this->renderLayout();
    }

    /**
     * Saves the checkout method: guest or register
     */
    public function saveMethodAction()
    {
        if ($this->_expireAjax()) {
            return;
        }
        if ($this->getRequest()->isPost()) {
            $method = $this->getRequest()->getPost('checkout_method');
            $result = $this->getOnestep()->saveCheckoutMethod($method);
            $this->getResponse()->setBody(Mage::helper('core')->jsonEncode($result));
        }
    }

    /**
     * Updates the available selection of shipping method by saving the address data first
     */
    public function updateShippingMethodsAction()
    {
        if ($this->_expireAjax()) {
            return;
        }
        $post   = $this->getRequest()->getPost();
        $result = array('error' => 1, 'message' => Mage::helper('checkout')->__('Error saving checkout data'));

        if ($post) {

            $result = array();

            $billing           = $post['billing'];
            $shipping          = $post['shipping'];
            $usingCase         = isset($billing['use_for_shipping']) ? (int) $billing['use_for_shipping'] : 0;
            $billingAddressId  = isset($post['billing_address_id']) ? (int) $post['billing_address_id'] : false;
            $shippingAddressId = isset($post['shipping_address_id']) ? (int) $post['shipping_address_id'] : false;


            if ($this->saveAddressData($billing, $billingAddressId, 'billing') === false) {
                return;
            }

            if ($usingCase <= 0) {
                if ($this->saveAddressData($shipping, $shippingAddressId, 'shipping') === false) {
                    return;
                }
            }

            /* check quote for virtual */
            if ($this->getOnestep()->getQuote()->isVirtual()) {
                $result['update_step']['shipping_method'] = $this->_getShippingMethodsHtml('none');
            } else {
                $result['update_step']['shipping_method'] = $this->_getShippingMethodsHtml();
            }
        }

        $this->getResponse()->setBody(Mage::helper('core')->jsonEncode($result));
    }

    /**
     * Shipping method save action
     */
    public function saveShippingMethodAction()
    {
        if ($this->_expireAjax()) {
            return;
        }
        if ($this->getRequest()->isPost()) {
            $data   = $this->getRequest()->getPost('shipping_method', '');
            $result = $this->getOnestep()->saveShippingMethod($data);
            /*
            $result will have error data if shipping method is empty
            */
            if (!isset($result['error'])) {
                Mage::dispatchEvent(
                    'checkout_controller_onepage_save_shipping_method',
                    array(
                        'request' => $this->getRequest(),
                        'quote'   => $this->getOnestep()->getQuote()
                    )
                );
                $this->getResponse()->setBody(Mage::helper('core')->jsonEncode($result));

                $result['update_step']['payment_method'] = $this->_getPaymentMethodsHtml();
            }
            //update totals
            $this->getOnestep()->getQuote()->getShippingAddress()->setCollectShippingRates(true);
            $this->getOnestep()->getQuote()->setTotalsCollectedFlag(false)->collectTotals()->save();

            $result['update_step']['review'] = $this->_getReviewHtml();
            $this->getResponse()->setBody(Mage::helper('core')->jsonEncode($result));
        }
    }

    /**
     * Updates the available selection of payment methods by saving address and shipping  method data first
     */
    public function updatePaymentMethodsAction()
    {
        if ($this->_expireAjax()) {
            return;
        }
        $post   = $this->getRequest()->getPost();
        $result = array('error' => 1, 'message' => Mage::helper('checkout')->__('Error saving checkout data'));

        if ($post) {

            $billing           = $post['billing'];
            $shipping          = $post['shipping'];
            $usingCase         = isset($billing['use_for_shipping']) ? (int) $billing['use_for_shipping'] : 0;
            $billingAddressId  = isset($post['billing_address_id']) ? (int) $post['billing_address_id'] : false;
            $shippingAddressId = isset($post['shipping_address_id']) ? (int) $post['shipping_address_id'] : false;
            $shippingMethod    = $this->getRequest()->getPost('shipping_method', '');

            if ($this->saveAddressData($billing, $billingAddressId, 'billing') === false) {
                return;
            }

            if ($usingCase <= 0) {
                if ($this->saveAddressData($shipping, $shippingAddressId, 'shipping') === false) {
                    return;
                }
            }

            $result = $this->getOnestep()->saveShippingMethod($shippingMethod);

            if (!isset($result['error'])) {
                $result['update_step']['payment_method'] = $this->_getPaymentMethodsHtml();
            }
        }
        $this->getResponse()->setBody(Mage::helper('core')->jsonEncode($result));
    }

    /**
     * Updates the order review step by attempting to save the current checkout state
     */
    public function updateOrderReviewAction()
    {
        if ($this->_expireAjax()) {
            return;
        }

        $post   = $this->getRequest()->getPost();
        $result = array('error' => 1, 'message' => Mage::helper('checkout')->__('Error saving checkout data'));

        if ($post) {

            $result            = array();
            $billing           = $post['billing'];
            $shipping          = $post['shipping'];
            $usingCase         = isset($billing['use_for_shipping']) ? (int) $billing['use_for_shipping'] : 0;
            $billingAddressId  = isset($post['billing_address_id']) ? (int) $post['billing_address_id'] : false;
            $shippingAddressId = isset($post['shipping_address_id']) ? (int) $post['shipping_address_id'] : false;
            $shippingMethod    = $this->getRequest()->getPost('shipping_method', '');
            $paymentMethod     = isset($post['payment']) ? $post['payment'] : array();

            /**
             * Attempt to save checkout data before loading the preview html
             * errors ignored
             */
            $this->saveAddressData($billing, $billingAddressId, 'billing', false);

            if ($usingCase <= 0) {
                $this->saveAddressData($shipping, $shippingAddressId, 'shipping', false);
            }

            if (!$this->getOnestep()->getQuote()->isVirtual()) {
                $this->saveShippingMethodData($shippingMethod, false);
            }

            $this->savePayment($paymentMethod, false);

            //update totals
            $this->getOnestep()->getQuote()->setTotalsCollectedFlag(false)->collectTotals()->save();

            $result['update_step']['review'] = $this->_getReviewHtml();
        }
        $this->getResponse()->setBody(Mage::helper('core')->jsonEncode($result));
    }

    /**
     * Submits all step data, checks for errors, saves order
     */
    public function submitOrderAction() {
        if ($this->_expireAjax()) {
            return;
        }

        $redirectUrl = null;
        $post        = $this->getRequest()->getPost();
        $result      = array(
            'error' => 1,
            'message' => Mage::helper('checkout')->__('Error saving checkout data')
        );

        if ($post) {
            try {
                if ($requiredAgreements = Mage::helper('checkout')->getRequiredAgreementIds()) {
                    $postedAgreements = array_keys($this->getRequest()->getPost('agreement', array()));
                    if ($diff = array_diff($requiredAgreements, $postedAgreements)) {
                        $result['success'] = false;
                        $result['error']   = true;
                        $result['message'] = $this->__(
                            'Please agree to all the terms and conditions before placing the order.'
                        );
                        $this->getResponse()->setBody(Mage::helper('core')->jsonEncode($result));
                        return;
                    }
                }

                $result            = array();
                $billing           = $post['billing'];
                $shipping          = $post['shipping'];
                $usingCase         = isset($billing['use_for_shipping']) ? (int) $billing['use_for_shipping'] : 0;
                $billingAddressId  = isset($post['billing_address_id']) ? (int) $post['billing_address_id'] : false;
                $shippingAddressId = isset($post['shipping_address_id']) ? (int) $post['shipping_address_id'] : false;
                $shippingMethod    = $this->getRequest()->getPost('shipping_method', '');
                $paymentMethod     = isset($post['payment']) ? $post['payment'] : array();

                $results = array();

                $method = $this->getRequest()->getPost('checkout_method');
                if ($method) {
                    $results[] = $this->getOnestep()->saveCheckoutMethod($method);
                }

                $results[] = $this->saveAddressData($billing, $billingAddressId, 'billing', false);

                if ($usingCase <= 0) {
                    $results[] = $this->saveAddressData($shipping, $shippingAddressId, 'shipping', false);
                }

                if (!$this->getOnestep()->getQuote()->isVirtual()) {
                    $results[] = $this->saveShippingMethodData($shippingMethod, false);
                }

                $results[] = $this->savePayment($paymentMethod, false);

                if ($data = $this->getRequest()->getPost('payment', false)) {
                    $this->getOnestep()->getQuote()->getPayment()->importData($data);
                }

                foreach ($results as $stepResult) {
                    if (isset($stepResult['error'])) {
                        $result['error'] = 1;
                        if (!isset($result['message'])) {
                            $result['message'] = array();
                        }
                        if (isset($stepResult['message'])) {
                            if (is_array($stepResult['message'])) {
                                $result['message'] = array_merge($result['message'], $stepResult['message']);
                            } else {
                                $result['message'][] = $stepResult['message'];
                            }
                        }
                    }
                }
                if (isset($result['error'])) {
                    if ($result['message']) {
                        throw new Mage_Core_Exception(implode("\n", $result['message']));
                    }
                }
                $this->getOnestep()->saveOrder();
                $result['success'] = 1;

                $redirectUrl = $this->getOnestep()->getCheckout()->getRedirectUrl();

            } catch (Mage_Payment_Model_Info_Exception $e) {

                $result['success'] = false;
                $result['error'] = 1;
                $message = $e->getMessage();
                if( !empty($message) ) {
                    $result['message'] = $message;
                }

            } catch (Mage_Core_Exception $e) {
                Mage::logException($e);
                Mage::helper('checkout')->sendPaymentFailedEmail($this->getOnestep()->getQuote(), $e->getMessage());

                $result['success'] = false;
                $result['error']   = true;
                $result['message'] = $e->getMessage();

            } catch (Exception $e) {
                Mage::logException($e);
                Mage::helper('checkout')->sendPaymentFailedEmail($this->getOnestep()->getQuote(), $e->getMessage());
                $result['success'] = false;
                $result['error']   = true;
                $result['message'] = $this->__(
                    'There was an error processing your order. Please contact us or try again later.'
                );
            }

            if ((!isset($result['success'])) || (isset($result['success']) && $result['success'] == false)) {
                /**
                 * Update the steps if tehre is an error
                 */
                $result['update_step']['shipping_method'] = $this->_getShippingMethodsHtml();
                $result['update_step']['payment_method']  = $this->_getPaymentMethodsHtml();
            }

            $this->getOnestep()->getQuote()->save();

            /**
             * when there is redirect to third party, we don't want to save order yet.
             * we will save the order in return action.
             */
            if (!empty($redirectUrl)) {
                $result['redirect'] = $redirectUrl;
            }
        }

        $this->getResponse()->setBody(Mage::helper('core')->jsonEncode($result));
    }
}
