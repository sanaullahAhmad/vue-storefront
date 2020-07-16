/* eslint-disable camelcase, @typescript-eslint/camelcase */

import { createContext, createPayment } from './payment';
import { ref, onMounted } from '@vue/composition-api';
import { getPublicKey, getStyles, getCardTokenKey } from './configuration';
import { CKO_PAYMENT_TYPE, buildPaymentPayloadStrategies, PaymentPropetiesWithOptionalToken } from './helpers';

declare const Frames: any;

const submitDisabled = ref(false);
const error = ref(null);
const paymentMethod = ref(0);

const getCardToken = () => localStorage.getItem(getCardTokenKey());
const setCardToken = (token) => localStorage.setItem(getCardTokenKey(), token);
const removeCardToken = () => localStorage.removeItem(getCardTokenKey());

const setCurrentPaymentMethod = (newPaymentMethod: CKO_PAYMENT_TYPE) => paymentMethod.value = newPaymentMethod;
const getCurrentPaymentMethod = () => paymentMethod.value;
const getCurrentPaymentMethodPayload = (payload: PaymentPropetiesWithOptionalToken) => buildPaymentPayloadStrategies[getCurrentPaymentMethod()](payload);

const useCkoCard = () => {
  const makePayment = async ({ cartId }) => {
    try {

      const token = getCardToken();

      if (!token) {
        throw new Error('There is no payment token');
      }

      const context = await createContext({ reference: cartId });
      const payment = await createPayment(
        getCurrentPaymentMethodPayload({
          token,
          context_id: context.data.id,
          save_payment_instrument: true,
          secure3d: true,
          success_url: `${window.location.origin}/cko/payment-success`,
          failure_url: `${window.location.origin}/cko/payment-error`
        })
      );

      removeCardToken();
      if (![200, 202].includes(payment.status)) {
        throw new Error(payment.data.error_type);
      }

      return payment;
    } catch (e) {
      removeCardToken();
      error.value = e;
      return null;
    }
  };

  const submitForm = async () => Frames.submitCard();

  const initForm = () => {
    submitDisabled.value = true;
    onMounted(() => Frames.init({
      publicKey: getPublicKey(),
      style: getStyles(),
      cardValidationChanged: () => {
        submitDisabled.value = !Frames.isCardValid();
      },
      cardTokenized: async ({ token }) => {
        setCurrentPaymentMethod(CKO_PAYMENT_TYPE.CREDIT_CARD);
        setCardToken(token);
      },
      cardTokenizationFailed: (data) => {
        error.value = data;
        submitDisabled.value = false;
      }
    }));
  };

  return {
    error,
    submitDisabled,
    submitForm,
    makePayment,
    initForm,
    setCurrentPaymentMethod,
    getCurrentPaymentMethod
  };
};
export default useCkoCard;
