/**
 * @license MIT http://troopjs.mit-license.org/
 */
define([
	"module",
	"troopjs-utils/merge"
], function LoomConfigModule(module, merge) {
	"use strict";

	/**
	 * This module is to provide configurations **loom** from it's AMD module config.
	 *
	 * To change the configuration, refer to RequireJS [module config API](http://requirejs.org/docs/api.html#config-moduleconfig):
	 *
	 * 	requirejs.config(
	 * 	{
	 * 		config: { "troopjs-browser/loom/config" : { "weave" : "data-my-weave", ...  } }
	 * 	})
	 *
	 * @class browser.loom.config
	 * @private
	 * @singleton
	 */
	return merge.call({
		/**
		 * @cfg {String} $warp Property of the element's data where the **warp** resides.
		 */
		"$warp" : "$warp",
		/**
		 * @cfg {String} $weft Property of the widget where the **weft** resides.
		 */
		"$weft" : "$weft",

		/**
		 * @cfg {String} weave Attribute name of the element where the **weave** resides.
		 */
		"weave" : "data-weave",

		/**
		 * @cfg {String} unweave Attribute name of the element where the **unweave** resides.
		 */
		"unweave" : "data-unweave",

		/**
		 * @cfg {String} woven Attribute name of the element where the **woven** resides.
		 */
		"woven" : "data-woven"
	}, module.config());
});