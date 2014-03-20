<?php
/**
 * Divisionlab_OneStepCheckout helper class
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

/** Divisionlab_OneStepCheckout_Helper_Data
 *
 * @category Divisionlab
 * @package  Divisionlab_OneStepCheckout
 *
 * @author  Oleg Ishenko <oleg.ishenko@solvingmagento.com>
 * @license http://opensource.org/licenses/osl-3.0.php Open Software License (OSL 3.0)
 * @version Release: <package_version>
 * @link    http://www.solvingmagento.com/
 */
class Divisionlab_OneStepCheckout_Helper_Data extends Mage_Core_Helper_Abstract
{
    /**
     * Check is the one step checkout is enabled
     *
     * @return bool
     */
    public function oneStepCheckoutEnabled()
    {
        return (bool)Mage::getStoreConfig('checkout/options/onestep_checkout_enabled');
    }
}
