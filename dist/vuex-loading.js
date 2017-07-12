/**
 * @license
 *
 * vuex-loading v0.1.2
 *
 * (c) 2017 Fatih Kadir Akın <fatihkadirakin@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.createVuexLoader = factory());
}(this, (function () { 'use strict';

var mutations = {
  LOAD: 'LOAD',
  END: 'END',
};

var spinners = {
  spinner: require('./spinners/spinner').default,
  heart: require('./spinners/heart').default,
};

// Base Utils
var uniq = function (array) {
  return array.filter(function (el, index, arr) { return index == arr.indexOf(el); });
};

function createComponent(ref) {
  var componentName = ref.componentName;
  var moduleName = ref.moduleName;
  var className = ref.className;

  return {
    template: ("\n      <div>\n        <span class='" + className + "' v-if='status'>\n          <slot name='spinner'>\n            <" + componentName + "-spinner :width=\"width || '1em'\" :height=\"height || '1em'\" />\n          </slot>\n          <span>{{ message }}</span>\n        </span>\n        <slot v-if='!status'></slot>\n      </div>\n    "),
    props: [
      'when',
      'loader',
      'message',
      'height',
      'width'
    ],
    computed: {
      isLoading: function isLoading() {
        var store = this.$store;
        if (!store) {
          throw new Error('Vuex not initialized.')
        }
        return store.getters[(moduleName + "/isLoading")];
      },
      anyLoading: function anyLoading() {
        var store = this.$store;
        if (!store) {
          throw new Error('Vuex not initialized.')
        }
        return store.getters[(moduleName + "/anyLoading")];
      },
      status: function status() {
        if (this.when) {
          return this.when;
        }
        if (this.loader) {
          return this.isLoading(this.loader);
        }
        return this.anyLoading;
      },
    },
  }
}

// Vuex store to collect loadings
var createStore = function (moduleName) {
  return function (store) {
    store.registerModule(moduleName, {
      namespaced: true,
      state: {
        activeLoaders: [],
      },
      getters: {
        isLoading: function (state) { return function (loaderMessage) { return state.activeLoaders.indexOf(loaderMessage) > -1; }; },
        anyLoading: function (state) { return state.activeLoaders.length > 0; },
      },
      actions: {
        load: function (ref, loaderMessage) {
          var commit = ref.commit;

          return commit(mutations.LOAD, loaderMessage);
    },
        end: function (ref, loaderMessage) {
          var commit = ref.commit;

          return commit(mutations.END, loaderMessage);
    },
      },
      mutations: ( obj = {}, obj[mutations.LOAD] = function (state, loaderMessage) {
          state.activeLoaders.push(loaderMessage);
          state.activeLoaders = uniq(state.activeLoaders);
        }, obj[mutations.END] = function (state, loaderMessage) {
          state.activeLoaders = uniq(state.activeLoaders).filter(function (p) { return p !== loaderMessage; });
        }, obj ),
    });
    var obj;
  }
};

// Vue plugin
var createInstaller = function (ref) {
  var moduleName = ref.moduleName;
  var componentName = ref.componentName;
  var className = ref.className;

  return function (Vue) {
    Vue.prototype.$startLoading = function (loaderMessage) {
      this.$store.dispatch((moduleName + "/load"), loaderMessage, { root: true });
    };
    Vue.prototype.$endLoading = function (loaderMessage) {
      this.$store.dispatch((moduleName + "/end"), loaderMessage, { root: true });
    };
    Vue.prototype.$isLoading = function (loaderMessage) {
      return this.$store.getters[(moduleName + "/isLoading")](loaderMessage);
    };
    Vue.prototype.$anyLoading = function () {
      return this.$store.getters[(moduleName + "/anyLoading")];
    };

    Vue.component(componentName, createComponent({ componentName: componentName, moduleName: moduleName, className: className }));
    Object.keys(spinners).forEach(function (spinner) {
      Vue.component((componentName + "-" + spinner), spinners[spinner]);
    });
  }
};

function createVuexLoader(ref) {
  var moduleName = ref.moduleName; if ( moduleName === void 0 ) moduleName = 'loading';
  var componentName = ref.componentName; if ( componentName === void 0 ) componentName = 'v-loading';
  var className = ref.className; if ( className === void 0 ) className = 'v-loading';

  return {
    install: createInstaller({ moduleName: moduleName, componentName: componentName, className: className }),
    Store: createStore(moduleName),
    // start and stop helpers for async processes
    startLoading: function startLoading(dispatcher, loaderMessage, callback) {
      var this$1 = this;

      dispatcher((moduleName + "/load"), loaderMessage, { root: true });
      return callback().then(function (response) {
        this$1.endLoading(dispatcher, loaderMessage);
        return response;
      });
    },
    endLoading: function endLoading(dispatcher, loaderMessage) {
      dispatcher((moduleName + "/end"), loaderMessage, { root: true });
    }
  };
}

return createVuexLoader;

})));