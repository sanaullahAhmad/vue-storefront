import path from 'path';
import proxyMiddleware from '@vue-storefront/checkout-com/nuxt/proxyMiddleware';

export default function CheckoutComModule(moduleOptions) {
  this.addPlugin({
    src: path.resolve(__dirname, './plugin.js'),
    options: {
      publicKey: moduleOptions.publicKey
    }
  });

  this.addServerMiddleware({
    path: '/cko-api/payment-instruments',
    handler: proxyMiddleware({
      publicKey: moduleOptions.publicKey,
      secretKey: moduleOptions.secretKey
    })
  });

  const { successComponent, errorComponent } = moduleOptions;

  this.extendRoutes((routes, resolve) => {
    routes.push({
      name: 'cko-payment-success',
      path: '/cko/payment-success',
      component: successComponent || resolve(__dirname, './CheckoutComPaymentSuccess.vue')
    });
  });

  this.extendRoutes((routes, resolve) => {
    routes.push({
      name: 'cko-payment-error',
      path: '/cko/payment-error',
      component: errorComponent || resolve(__dirname, './CheckoutComPaymentError.vue')
    });
  });
}
