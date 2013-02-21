/**
 * TroopJS browser/component/widget
 * @license MIT http://troopjs.mit-license.org/ © Mikael Karon mailto:mikael@karon.se
 */
/*global define:false */
define([ "troopjs-core/component/gadget", "jquery", "troopjs-jquery/weave", "troopjs-jquery/action" ], function WidgetModule(Gadget, $) {

	var UNDEFINED;
	var ARRAY_PROTO = Array.prototype;
	var ARRAY_SLICE = ARRAY_PROTO.slice;
	var ARRAY_PUSH = ARRAY_PROTO.push;
	var TYPEOF_FUNCTION = typeof function () {};
	var $TRIGGER = $.fn.trigger;
	var $ON = $.fn.on;
	var $OFF = $.fn.off;
	var $WEAVE = $.fn.weave;
	var $UNWEAVE = $.fn.unweave;
	var $ELEMENT = "$element";
	var $HANDLERS = "$handlers";
	var ATTR_WEAVE = "[data-weave]";
	var ATTR_WOVEN = "[data-woven]";
	var LENGTH = "length";
	var FEATURES = "features";
	var TYPE = "type";
	var VALUE = "value";

	/**
	 * Creates a proxy of the inner method 'handlerProxy' with the 'topic', 'widget' and handler parameters set
	 * @param {string} topic event topic
	 * @param {object} widget target widget
	 * @param {function} handler target handler
	 * @returns {function} proxied handler
	 */
	function eventProxy(topic, widget, handler) {
		/**
		 * Creates a proxy of the outer method 'handler' that first adds 'topic' to the arguments passed
		 * @returns result of proxied hanlder invocation
		 */
		return function handlerProxy() {
			// Create args
			var args = [ topic ];

			// Add add arguments to args
			ARRAY_PUSH.apply(args, arguments);

			// Apply with shifted arguments to handler
			return handler.apply(widget, args);
		};
	}

	/**
	 * Creates a proxy of the inner method 'render' with the '$fn' parameter set
	 * @param $fn jQuery method
	 * @returns {Function} proxied render
	 */
	function renderProxy($fn) {
		/**
		 * Renders contents into element
		 * @param {Function|String} contents Template/String to render
		 * @param {Object..} (data) If contents is a template - template data
		 * @returns {Object} self
		 */
		function render(contents, data) {
			var self = this;
			var args = ARRAY_SLICE.call(arguments, 1);

			// Call render with contents (or result of contents if it's a function)
			$fn.call(self[$ELEMENT], typeof contents === TYPEOF_FUNCTION ? contents.apply(self, args) : contents);

			return self.weave();
		}

		return render;
	}

	return Gadget.extend(function Widget($element, displayName) {
		var self = this;

		if ($element === UNDEFINED) {
			throw new Error("No $element provided");
		}

		self[$ELEMENT] = $element;
		self[$HANDLERS] = [];

		if (displayName !== UNDEFINED) {
			self.displayName = displayName;
		}
	}, {
		"displayName" : "browser/component/widget",

		/**
		 * Signal handler for 'initialize'
		 */
		"sig/initialize" : function initialize() {
			var self = this;
			var $element = self[$ELEMENT];
			var $handler;
			var $handlers = self[$HANDLERS];
			var special;
			var specials = self.constructor.specials.dom;
			var type;
			var features;
			var value;
			var i;
			var iMax;

			// Iterate specials
			for (i = 0, iMax = specials ? specials[LENGTH] : 0; i < iMax; i++) {
				// Get special
				special = specials[i];

				// Create $handler
				$handler = $handlers[i] = {};

				// Set $handler properties
				$handler[TYPE] = type = special[TYPE];
				$handler[FEATURES] = features = special[FEATURES];
				$handler[VALUE] = value = eventProxy(type, self, special[VALUE]);

				// Attach event special
				$ON.call($element, type, features, self, value);
			}
		},

		/**
		 * Signal handler for 'finalize'
		 */
		"sig/finalize" : function finalize() {
			var self = this;
			var $element = self[$ELEMENT];
			var $handler;
			var $handlers = self[$HANDLERS];
			var i;
			var iMax;

			// Iterate $handlers
			for (i = 0, iMax = $handlers[LENGTH]; i < iMax; i++) {
				// Get $handler
				$handler = $handlers[i];

				// Detach event handler
				$OFF.call($element, $handler[TYPE], $handler[FEATURES], $handler[VALUE]);
			}

			// Delete ref to $ELEMENT (for safety)
			delete self[$ELEMENT];
		},

		/**
		 * Weaves all children of $element
		 * @returns {Promise} from $.fn.weave
		 */
		"weave" : function weave() {
			return $WEAVE.apply(this[$ELEMENT].find(ATTR_WEAVE), arguments);
		},

		/**
		 * Unweaves all children of $element _and_ self
		 * @returns {Promise} from $.fn.unweave
		 */
		"unweave" : function unweave() {
			return $UNWEAVE.apply(this[$ELEMENT].find(ATTR_WOVEN).addBack(), arguments);
		},

		/**
		 * Binds event to $element
		 * @returns self
		 */
		"$on" : function $on() {
			var self = this;

			$ON.apply(self[$ELEMENT], arguments);

			return self;
		},

		/**
		 * Unbinds event from $element
		 * @returns self
		 */
		"$off" : function $off() {
			var self = this;

			$OFF.apply(self[$ELEMENT], arguments);

			return self;
		},

		/**
		 * Triggers event on $element
		 * @returns self
		 */
		"$trigger" : function $trigger() {
			var self = this;

			$TRIGGER.apply(self[$ELEMENT], arguments);

			return self;
		},

		/**
		 * Renders content and inserts it before $element
		 */
		"before" : renderProxy($.fn.before),

		/**
		 * Renders content and inserts it after $element
		 */
		"after" : renderProxy($.fn.after),

		/**
		 * Renders content and replaces $element contents
		 */
		"html" : renderProxy($.fn.html),

		/**
		 * Renders content and replaces $element contents
		 */
		"text" : renderProxy($.fn.text),

		/**
		 * Renders content and appends it to $element
		 */
		"append" : renderProxy($.fn.append),

		/**
		 * Renders content and prepends it to $element
		 */
		"prepend" : renderProxy($.fn.prepend)
	});
});
