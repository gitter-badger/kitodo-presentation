/**
 * @constructor
 * @extends {ol.control.Control}
 * @param {Object=} opt_options Control options.
 */
ol.control.ImageManipulation = function(opt_options) {
	
  var options = opt_options || {};

  var anchor = document.createElement('a');
  anchor.href = '#image-manipulation';
  anchor.innerHTML = 'Image-Tools';
  anchor.title = 'Bildbearbeitung aktivieren';
  
  /**
   * @type {Array.<ol.layer.Layer>}
   * @private
   */
  this.layers = options.layers;
  
  /**
   * @type {Element}
   * @private
   */
  this.mainMap = $('#' + options.mapContainer)[0];
  
  /**
   * @type {string}
   * @private
   */
  this.manipulationMapId = 'tx-dfgviewer-map-manipulate';
  
  /**
	 * @type {ol.Map|undefined}
	 * @private
	 */
	this.manipulationMap;
	
  /**
   * @type {ol.View}
   * @private
   */
  this.mapView = options.view;
  
  var toolContainerEl_ = dlfUtils.exists(options.toolContainer) ? options.toolContainer: $('.tx-dlf-toolbox')[0];
  
//  var tooltip = goog.dom.createDom('span', {'role':'tooltip','innerHTML':vk2.utils.getMsg('openImagemanipulation')})
//  goog.dom.appendChild(anchor, tooltip);
  
  var openToolbox = $.proxy(function(event) {
	  event.preventDefault();
	  
	  if ($(event.target).hasClass('active')){
		  $(event.target).removeClass('active');
		  this.close_();
		  return;
	  } 
	  
	  $(event.target).addClass('active');
	  this.open_(toolContainerEl_);
  }, this);

  
  $(anchor).on('click', openToolbox);
  $(anchor).on('touchstart', openToolbox);  

  ol.control.Control.call(this, {
    element: anchor,
    target: options.target
  });

};
ol.inherits(ol.control.ImageManipulation, ol.control.Control);

/**
 * @param {Element} parentEl
 * @private
 */
ol.control.ImageManipulation.prototype.close_ = function(){
	// trigger close event
	$(this).trigger("close", this.manipulationMap);
	
	// fadeIn parent map container
	$('#' + this.manipulationMapId).hide();
	$(this.mainMap).show();	
	
	$(this.sliderContainer_).hide().removeClass('open');
};

/**
 * @param {string} className
 * @param {string} orientation
 * @param {Function} updateFn
 * @param {number=} opt_baseValue
 * @param {string=} opt_title
 * @return {Element}
 * @private
 */
ol.control.ImageManipulation.prototype.createSlider_ = function(className, orientation, updateFn, opt_baseValue, opt_title){
	var title = dlfUtils.exists('opt_title') ? opt_title : '',
		sliderEl = $('<div class="slider slider-imagemanipulation ' + className + '" title="' + title + '"></div>'),
		baseMin = 0, 
		baseMax = 100,
		minValueEl, 
		maxValueEl,
		startValue = dlfUtils.exists(opt_baseValue) ? opt_baseValue : 100;

	/**
	 * 	@param {number} value
	 *	@param {Element} element 
	 */
	var updatePosition = function(value, element){
		if (orientation == 'vertical'){
			var style_top = 100 - ((value - baseMin) / (baseMax - baseMin) * 100);
			element.style.top = style_top + '%';
			element.innerHTML = value + '%';
			return;
		};
		
		var style_left = (value - baseMin) / (baseMax - baseMin) * 100;
		element.style.left = style_left + '%';
		element.innerHTML = value + '%';
	};
	
	$(sliderEl).slider({
        'min': 0,
        'max': 100,
        'value': startValue,
        'animate': 'slow',
        'orientation': orientation,
        'step': 1,
        'slide': function( event, ui ) {
        	var value = ui['value'];
        	updatePosition(value, valueEl[0]);
        	updateFn(value);       	
        },
        'change': $.proxy(function( event, ui ){
        	var value = ui['value'];
        	updatePosition(value, valueEl[0]);
        	updateFn(value);
        }, this)
    });
	
	// append tooltips
	var innerHtml = dlfUtils.exists(opt_baseValue) ? opt_baseValue + '%' : '100%',
		valueEl = $('<div class="tooltip value ' + className + '">' + innerHtml + '</div>');
	$(sliderEl).append(valueEl);
	
	return sliderEl;
};


/**
 * @param {Element} parentEl
 * @private
 */
ol.control.ImageManipulation.prototype.initializeSliderContainer_ = function(parentEl){
	
	// create outer container
	var outerContainer = $('<div class="image-manipulation ol-unselectable"></div>');
	$(parentEl).append(outerContainer);
	
	// create inner slider container	
	var sliderContainer = $('<div class="slider-container" style="display:none;"></div>');
	$(outerContainer).append(sliderContainer);
	
	// add contrast slider
	var contrastSlider = this.createSlider_('slider-contrast', 'horizontal', $.proxy(function(value){
		for (var i = 0; i < this.layers.length; i++) {
			this.layers[i].setContrast(value/100);
		};
	}, this), undefined, 'Contrast');
	$(sliderContainer).append(contrastSlider);
	
	// add satuartion slider
	var satSlider = this.createSlider_('slider-saturation', 'horizontal', $.proxy(function(value){
		for (var i = 0; i < this.layers.length; i++) {
			this.layers[i].setSaturation(value/100);
		};
	}, this), undefined, 'Saturation');
	$(sliderContainer).append(satSlider);
	
	// add brightness slider
	var brightSlider = this.createSlider_('slider-brightness', 'horizontal', $.proxy(function(value){
		var linarMapping = 2 * value / 100 -1;
		for (var i = 0; i < this.layers.length; i++) {
			this.layers[i].setBrightness(linarMapping);
		};
	}, this), 50, 'Brightness');
	$(sliderContainer).append(brightSlider);

	// add hue slider
	var hueSlider = this.createSlider_('slider-hue', 'horizontal', $.proxy(function(value){
		var mapping = (value - 50) * 0.25,
			hueValue = mapping == 0 ? 0 : mapping + this.layers[0].getHue();
		for (var i = 0; i < this.layers.length; i++) {
			this.layers[i].setHue(hueValue);
		};
	}, this), 50, 'Hue');
	$(sliderContainer).append(hueSlider);
	
	// button for reset to default state
	var resetBtn = $('<button class="reset-btn" title="Reset">Reset</button>');
	$(sliderContainer).append(resetBtn);
	 
	var defaultValues = {
		hue: 0,
		brightness:0,
		contrast: 1,
		saturation: 1
	};
	
	$(resetBtn).on('click', $.proxy(function(e){
		// reset the layer
		for (var i = 0; i < this.layers.length; i++) {
			this.layers[i].setContrast(defaultValues.contrast);
			this.layers[i].setHue(defaultValues.hue);
			this.layers[i].setBrightness(defaultValues.brightness);
			this.layers[i].setSaturation(defaultValues.saturation);
		};
		
		// reset the sliders
		var sliderEls = $('.slider-imagemanipulation')
		for (var i = 0; i < sliderEls.length; i++){
			var sliderEl = sliderEls[i];
			var resetValue = $(sliderEl).hasClass('slider-hue') || $(sliderEl).hasClass('slider-brightness') ? 50 : 100;
			$(sliderEl).slider('value', resetValue);
		};
	}, this));
		
	return sliderContainer;
};


/**
 * @param {Element} parentEl
 * @private
 */
ol.control.ImageManipulation.prototype.open_ = function(parentEl){ 
	var map;
	
	$.when($(this.mainMap)
		// fadout parent map container
		.hide())
		// now create new map
		.done($.proxy(function() {
			if ($('#' + this.manipulationMapId).length == 0) {
				// create manipulation map
				var imageManipulationMapEl = $('<div id="' + this.manipulationMapId + '" class="tx-dlf-map"></div>');
				$(this.mainMap.parentElement).append(imageManipulationMapEl);

				this.manipulationMap = new ol.Map({
		            layers: this.layers,
		            target: this.manipulationMapId,
		            controls: [],
		            interactions: [
		                new ol.interaction.DragPan(),
		                new ol.interaction.MouseWheelZoom(),
		                new ol.interaction.KeyboardPan(),
		                new ol.interaction.KeyboardZoom
		            ],
		            // necessary for proper working of the keyboard events
		            keyboardEventTarget: document,
		            view: this.mapView,
		            renderer: 'webgl'
		        });
			};
			
			$('#' + this.manipulationMapId).show();
			
			// trigger open event
			$(this).trigger("open", this.manipulationMap);
		}, this));
	
	if (dlfUtils.exists(this.sliderContainer_)) {
		$(this.sliderContainer_).show().addClass('open');
	} else {
		this.sliderContainer_ = this.initializeSliderContainer_(parentEl);
		
		// fade in
		$(this.sliderContainer_).show().addClass('open');
	};
};
