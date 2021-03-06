import { assert } from '@ember/debug';
import { assign } from '@ember/polyfills';
import { get, set } from '@ember/object';
import { getOwner } from '@ember/application';
import { run } from '@ember/runloop';
import Component from '@ember/component';
import layout from '../templates/components/mapbox-gl';
import MapboxGl from 'mapbox-gl';
import noop from 'ember-mapbox-gl/utils/noop';

export default Component.extend({
  layout,

  initOptions: null,
  mapLoaded: noop,

  init() {
    this._super(...arguments);

    this.map = null;
    this.glSupported = MapboxGl.supported();

    const mbglConfig = getOwner(this).resolveRegistration('config:environment')['mapbox-gl'];
    assert('mapbox-gl config is required in config/environment', mbglConfig);
    assert('mapbox-gl config must have an accessToken string', typeof mbglConfig.accessToken === 'string');

    MapboxGl.accessToken = mbglConfig.accessToken;
  },

  didInsertElement() {
    this._super(...arguments);

    if (this.glSupported) {
      run.scheduleOnce('afterRender', this, this._setup);
    }
  },

  willDestroy() {
    this._super(...arguments);

    if (this.map !== null) {
      // some map users may be late doing cleanup (seen with mapbox-draw-gl), so don't remove the map until the next tick
      run.next(this.map, this.map.remove);
    }
  },

  _setup() {
    const mbglConfig = getOwner(this).resolveRegistration('config:environment')['mapbox-gl'];
    const options = assign({}, mbglConfig.map, get(this, 'initOptions'));
    options.container = this.element;

    const map = new MapboxGl.Map(options);
    map.once('load', run.bind(this, this._onLoad, map));
  },

  _onLoad(map) {
    if (this.isDestroyed || this.isDestroying) {
      return;
    }

    this.mapLoaded(map);

    set(this, 'map', map);
  }
});
