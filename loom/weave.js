/*
 * TroopJS browser/loom/weave
 * @license MIT http://troopjs.mit-license.org/ © Mikael Karon mailto:mikael@karon.se
 */
define([ "./config", "require", "when", "jquery", "troopjs-utils/getargs", "troopjs-utils/defer", "poly/array" ], function WeaveModule(config, parentRequire, when, $, getargs, Defer) {
	"use strict";

	var UNDEFINED;
	var NULL = null;
	var ARRAY_PROTO = Array.prototype;
	var ARRAY_SLICE = ARRAY_PROTO.slice;
	var ARRAY_MAP = ARRAY_PROTO.map;
	var ARRAY_PUSH = ARRAY_PROTO.push;
	var WEAVE = "weave";
	var WOVEN = "woven";
	var $WARP = config["$warp"];
	var $WEFT = config["$weft"];
	var ATTR_WEAVE = config[WEAVE];
	var ATTR_WOVEN = config[WOVEN];
	var RE_SEPARATOR = /[\s,]+/;

	/**
	 * Instantiate all widget instances specified in the {@link browser.loom.config#weave weave attribute}
	 * of this element, and to signal the widget for start with the arguments. The weaving will result in:
	 *
	 *  - Updates the {@link browser.loom.config#weave woven attribute} with the created widget instances names.
	 *  - The {@link browser.loom.config#$warp $warp data property} will reference the widget instances.
	 *
	 * **Note:** It's not commonly to use this method directly, use instead {@link $#weave jQuery.fn.weave}.
	 *
	 * 	// Create element for weaving.
	 * 	var $el = $('<div data-weave="my/widget(option)"></div>').data("option",{"foo":"bar"});
	 * 	// Instantiate the widget defined in "my/widget" module, with one param read from the element's custom data.
	 * 	$el.weave();
	 * @member browser.loom.weave
	 * @method weave
	 * @param {Mixed...} [arg] The params that used to start the widget.
	 * @returns {Promise} Promise to the completion of weaving all widgets.
	 */
	return function weave() {
		// Store start_args for later
		var start_args = arguments;

		// Map elements
		return when.all(ARRAY_MAP.call(this, function (element) {
			var $element = $(element);
			var $data = $element.data();
			var $warp = $data[$WARP] || ($data[$WARP] = []);
			var $weave = [];
			var weave_attr = $element.attr(ATTR_WEAVE) || "";
			var weave_args;
			var re = /[\s,]*(((?:\w+!)?([\w\d_\-\/\.]+)(?:#[^(\s]+)?)(?:\(([^\)]+)\))?)/g;
			var matches;

			/*
			 * Updated attributes
			 * @param {object} widget Widget
			 * @private
			 */
			var update_attr = function (widget) {
				var woven = widget[$WEFT][WOVEN];

				$element.attr(ATTR_WOVEN, function (index, attr) {
					var result = [ woven ];

					if (attr !== UNDEFINED) {
						ARRAY_PUSH.apply(result, attr.split(RE_SEPARATOR));
					}

					return result.join(" ");
				});
			};

			// Make sure to remove ATTR_WEAVE (so we don't try processing this again)
			$element.removeAttr(ATTR_WEAVE);

			var module;
			var widgetName;
			var args;

			// Iterate weave_attr (while re matches)
			// matches[1] : full widget module name (could be loaded from plugin) - "mv!widget/name#1.x(1, 'string', false)"
			// matches[2] : widget name and arguments - "widget/name(1, 'string', false)"
			// matches[3] : widget name - "widget/name"
			// matches[4] : widget arguments - "1, 'string', false"
			while ((matches = re.exec(weave_attr)) !== NULL) {
				/*jshint loopfunc:true*/
				// Create weave_args
				// Require module, add error handler
				module = matches[2];
				widgetName = matches[3];
				args = matches[4];

				weave_args = [ $element.get(0), widgetName ];

				// Store matches[1] as WEAVE on weave_args
				weave_args[WEAVE] = widgetName;

				// If there were additional arguments
				if (args !== UNDEFINED) {
					// Parse matches[2] using getargs, map the values and append to weave_args
					ARRAY_PUSH.apply(weave_args, getargs.call(args).map(function (value) {
						// If value from $data if key exist
						return value in $data
							? $data[value]
							: value;
					}));
				}

				// Push on $weave
				ARRAY_PUSH.call($weave, weave_args);
			}

			// Return promise of mapped $weave
			return when.map($weave, function (widget_args) {
				// Create deferred
				var deferred = when.defer();
				var resolver = deferred.resolver;
				var promise = deferred.promise;

				// Copy WEAVE
				promise[WEAVE] = widget_args[WEAVE];

				// Add promise to $warp
				ARRAY_PUSH.call($warp, promise);

				// Add deferred update of attr
				when(promise, update_attr);

				parentRequire([ module ], function (Widget) {
					var widget
					var startPromise;

					try {
						// Create widget instance
						widget = Widget.apply(Widget, widget_args);

						// Add $WEFT to widget
						widget[$WEFT] = promise;

						// Add WOVEN to promise
						promise[WOVEN] = widget.toString();

						// TODO: Detecting TroopJS 1.x widget from *version* property.
						if (widget.trigger) {
							deferred = Defer();
							widget.start(deferred);
							startPromise = deferred.promise;
						}
						else {
							startPromise = widget.start.apply(widget, start_args);
						}

						resolver.resolve(startPromise.yield(widget));
					}
					catch (e) {
						resolver.reject(e);
					}
				}, resolver.reject);

				// Return promise
				return promise;
			});
		}));
	};
});
