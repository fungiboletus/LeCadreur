/**
 *	@module Cadreur
 */

/**	Used for create the container's name */
var nb_cadreur_container = 65;

/**
 *	Enum of directions
 *	@class Cadreur_DIRECTIONS
 */
Cadreur_DIRECTIONS = {VERTICAL: 1, HORIZONTAL: 2};

/**
 *	Container of boxes or containers.
 *
 *	Used in internal by Cadreur.
 *	@param {Cadreur_DIRECTIONS} direction The direction of the container
 *	@class CadreurContainer
 *	@constructor
 */
function CadreurContainer(direction)
{
	this.name = String.fromCharCode(nb_cadreur_container++);

	this.boxes = [];
	this.direction = direction;
}

/**
 *  Create a layout for a HTML element.
 *
 *	@class Cadreur
 *	@constructor
 *	@param rootNode The HTML element in which is the layout
 *	@param direction The default direction of the layout (vertical or horizontal)
 */
function Cadreur(rootNode, direction)
{
	if (!(rootNode instanceof HTMLElement)) alert("The rootNode parameter is not a HTML element");
	this.rootNode = rootNode;

	this.rootContainer = new CadreurContainer(direction);

	// Manage size changes
	this.manageSize();
	$(window).resize(this, this.manageSize);

	this.dragged_box = null;
	this.drag_enabled = true;
	this.front = true;

	// Manage boxes's drag and drop
	var jNode = $(this.rootNode);
	this.visual_drag = document.createElement('div');
	this.visual_drag.id = 'visual_drag';
	this.visual_drag.style.display = 'none';
	this.rootNode.appendChild(this.visual_drag);

	var obj = this;
	jNode.mousedown(function(e){
		if (!obj.front && obj.drag_enabled && obj.dragged_box === null) {
			// Recovery of the dragged box
			var jdragged_box = jNode.find('.boxdiv.identifiee');

			jdragged_box.addClass('dragged');
			obj.dragged_box = jdragged_box[0];
			obj.visual_drag.style.display = 'block';
			obj.visual_drag.style.top = e.clientY-13+'px';
			obj.visual_drag.style.left = e.clientX-13+'px';
			obj.visual_drag.style.background = jdragged_box.css('background');
		}
	});

	var jbody = $(document.body);
	jbody.mouseup(function(){
		if (obj.dragged_box){

			// If the box didn't find a place to live
			if (!obj.dragged_box.style.top && !obj.dragged_box.style.left)
				// We could find a place
				obj.addBoxInBestPlace(obj.dragged_box);
			else
				$(obj.dragged_box).removeClass('dragged');

			obj.visual_drag.style.display = 'none';
			obj.dragged_box = null;
		}
	});

	// Handling mouse position
	jbody.mousemove(function(e){
		if (obj.drag_enabled && obj.dragged_box){
			obj.visual_drag.style.top = e.clientY-13+'px';
			obj.visual_drag.style.left = e.clientX-13+'px';
		}
		obj.hover(e.pageX, e.pageY);
	});

	// Disable text cursor
	rootNode.onselectstart = function(){ return obj.dragged_box === null;};
};


Cadreur.prototype =
{
	/**
	 *	Create a new box for the layout.
	 *
	 *	The box have two faces. Frontface (default), and backface.
	 *
	 *	@method createBox
	 *	@return {Object} An object : {box, front, back}
	 */
	createBox: function()
	{
		var div = document.createElement('div');

		var front = document.createElement('div');
		front.className = 'front';
		div.appendChild(front);

		var back = document.createElement('div');
		back.className = 'back';

		if (this.front)
			back.style.display = 'none';
		else
			front.style.display = 'none';

		div.appendChild(back);
		return {box: this.transformBox(div), front: front, back: back};
	},

	/**
	 *	Attach the box to the layout.
	 *
	 *	createBox doesn't do this.
	 *
	 *	@method transformBox
	 *	@param {HTMLElement} div The box to attach
	 *	@return	{HTMLElement} The same box, but attached
	 */
	transformBox: function(div)
	{
		$(div).addClass('box boxdiv');
		this.rootNode.appendChild(div);
		return div;
	},

	/**
	 *	Disable the drag'n'drop action for the div in the back side.
	 *
	 *	@param {HTMLElement} div The div in which disable the drag
	 */
	disableDrag: function(div)
	{
		var jdiv = $(div);
		var obj = this;
		jdiv.mousedown(function(){
			obj.drag_enabled = false;
		});
		jdiv.mouseup(function(){
			obj.drag_enabled = true;
		});
	},

	/**
	 *	Place the box in the layout.
	 *
	 *	@method addBox
	 *	@param {HTMLElement|CadreurContainer} box The box to place.
	 *	@param {CadreurContainer|Null} container The optionnal container where to place the box.
	 */
	addBox: function(box, container)
	{
		this.rootContainer.addBox(box, container ? container : this.rootContainer);
	},

	/**
	 *	Toggle the display of boxes's sides.
	 *
	 *	@method toggleFrontMode
	 *	@param {Function|Null} action Action to execute during the change
	 *	@param {Number}	duration Duration of the animation
	 */
	toggleFrontMode: function(action, duration)
	{
		this.front = !this.front;
		var jnode = $(this.rootNode);

		var boxes = jnode.find('.boxdiv');
		boxes.addClass('flipped_animation');
		var obj = this;
		setTimeout(function() {
			boxes.find(obj.front ? '.back' : '.front').hide();
			boxes.find(obj.front ? '.front' : '.back').show();
			boxes.removeClass('flipped_animation');
			if (action) action();
		}, duration == null ? 600 : duration);

	},

	/**
	 *	Update the layout size.
	 *
	 *	@method manageSize
	 *	@param {Cadreur} obj Optionnal reference for replacing this.
	 */
	manageSize: function(obj)
	{
		var obj = obj == null ? this : obj.data;
		obj.width = $(obj.rootNode).width();
		obj.height = $(obj.rootNode).height();
		obj.equilibrate();
	},

	/**
	 *	Exec the callback function for each box in the layout.
	 *
	 *	The passed arguments for the function are :
	 *		* The box
	 *		* x position of the box
	 *		* y position of the box
	 *		* width of the box
	 *		* height of the box
	 *		* stack of containers in which the box is
	 *
	 *	@method processing
	 *	@param {function} callback The function to execute.
	 */
	processing: function(callback)
	{
		this.rootContainer.processing(0, 0, this.width, this.height, callback);
	},

	/**
	 *	Place every box to his place.
	 *
	 *	@method equilibrate
	 */
	equilibrate: function()
	{
		var marge = 3;
		this.processing(
			function (box, x, y, width, height) {
				y = y + marge + 'px';
				x = x + marge + 'px';
				height = height - marge - marge + 'px';
				width = width - marge - marge + 'px';

				if (box.style.top != y) box.style.top = y;
				if (box.style.left != x) box.style.left = x;
				if (box.style.height != height) box.style.height = height;
				if (box.style.width != width) box.style.width = width;

				// Even the hidden boxes are showed
				if (box.style.display === 'none') box.style.display = 'block';
			});
	},

	/**
	 *	Manage the mouse location above the layout.
	 *
	 *	The processing is about the drag and drop.
	 *
	 *	@method hover
	 *	@protected
	 *	@param {Number} mouse_x
	 *	@param {Number} mouse_y
	 */
	hover: function(mouse_x, mouse_y)
	{
		var obj = this;
		var div = this.dragged_box;
		this.processing(
			function (box, x, y, width, height, containers) {
				var box_mouse_x = mouse_x - x;
				var box_mouse_y = mouse_y -y;
				// If the mouse is over the current box
				if (box_mouse_x >= 0 && box_mouse_x <= width &&
					box_mouse_y >= 0 && box_mouse_y <= height)
				{
					// If this is not the dragged mouse, is just an identifed box
					if (!div)
						$(box).addClass('identifiee');

					// If the box is the dragged box, we have to do nothing here
					if (!div || div === box) return;

					/** Fast method using vector product
					 * for determine if a point is in a triangle.
					 */
					var in_triangle = function(a_x, a_y, b_x, b_y, c_x, c_y, p_x, p_y) {
						var geoprog = function(a_x, a_y, b_x, b_y, c_x, c_y) {
							return (a_x * (b_y - c_y) + b_x * (c_y - a_y) + c_x * (a_y - b_y)) >= 0;
						};
						var p1 = geoprog(a_x, a_y, b_x, b_y, p_x, p_y);
						var p2 = geoprog(b_x, b_y, c_x, c_y, p_x, p_y);
						var p3 = geoprog(c_x, c_y, a_x, a_y, p_x, p_y);

						return p1 > 0 && p2 > 0 && p3 > 0 || p1 < 0 && p2 < 0 && p3 < 0;
					};

					/**
					 *	Add the dragged box in the good container.
					 *
					 *	@param containers Stack of containers
					 *	@param position Top/Right/Bottom/Left
					 *	@param target	The neighbor box
					 *
					 *	@return the result of the correct placement, or nothing
					 */
					var addBox = function(containers, position, target){

						var container = containers.pop();

						// If no one container is good, do nothing
						if (!container)
							return;

						// Try to find a good container in which add the box
						if (container.direction === Cadreur_DIRECTIONS.VERTICAL)
						{
							if (position === 0)
								return obj.rootContainer.addBoxTop(div, target, container);
							else if (position === 2)
								return obj.rootContainer.addBoxBottom(div, target, container);
						}
						else
						{
							if (position === 1)
								return obj.rootContainer.addBoxRight(div, target, container);
							else if (position === 3)
								return obj.rootContainer.addBoxLeft(div, target, container);
						}

						// If no container is good, try with the container from above
						return arguments.callee(containers, position, container);
					}

					// Locate where is the mouse in the box
					var box_center_x = x + width / 2;
					var box_center_y = y + height / 2;
					var position = -1;
					if (in_triangle(x, y, x+width, y,
						box_center_x, box_center_y, mouse_x, mouse_y))
						position = 0; // TOP
					else if (in_triangle(x+width, y, x+width, y+height,
						box_center_x, box_center_y, mouse_x, mouse_y))
						position = 1; // RIGHT
					else if (in_triangle(x, y+height,
						box_center_x, box_center_y, x+width, y+height,
						mouse_x, mouse_y))
						position = 2; // BOTTOM
					else if (in_triangle(x, y, box_center_x, box_center_y,
						x, y+height, mouse_x, mouse_y))
						position = 3; // LEFT

					// Try to add the box
					addBox(containers, position, box);

					// And show to the user the wonderful result
					obj.equilibrate();

				} else {
					$(box).removeClass('identifiee');
				}
			});
	},

	/**
	 *	Add a box in the best container.
	 *
	 *	@method addBoxInBestPlace
	 *	@param {HTMLElement|CadreurContainer} box The box to place
	 */
	addBoxInBestPlace: function(box) {
		var best_container = this.rootContainer;

		// Find the last container with no more children
		this.processing(
			function (box, x, y, width, height, containers) {
				var container = containers[containers.length -1];
				if (container.boxes.length <= best_container.boxes.length)
					best_container = container;
			});

		this.addBox(box, best_container);
		this.equilibrate();
	},

	/**
	 *	Change the layout's disposition.
	 *
	 *	@method changeLayout
	 *	@param new_layout	The new layout (really)
	 */
	changeLayout: function (new_layout) {
		new_layout(this, $(this.rootNode).find('.boxdiv'));
		this.equilibrate();
	},

	/**
	 *	Some usefull layouts
	 *	@property
	 */
	layouts:
	{
		/** Simple vertical layout */
		vertical: function(obj, boxes) {
			obj.rootContainer = new CadreurContainer(Cadreur_DIRECTIONS.VERTICAL);
			for (var i = 0; i < boxes.length; ++i)
				obj.addBox(boxes[i]);

		},

		/** Simple horizontal layout */
		horizontal: function(obj, boxes) {
			obj.rootContainer = new CadreurContainer(Cadreur_DIRECTIONS.HORIZONTAL);
			for (var i = 0; i < boxes.length; ++i)
				obj.addBox(boxes[i]);
		},

		/** Vertical split layout */
		verticalSplit: function(obj, boxes) {
			obj.rootContainer = new CadreurContainer(Cadreur_DIRECTIONS.HORIZONTAL);
			if (boxes.length > 0)
			{
				obj.addBox(boxes[0]);
				if (boxes.length > 1)
				{
					var container = new CadreurContainer(Cadreur_DIRECTIONS.VERTICAL);
					obj.addBox(container);
					for (var i = 1; i < boxes.length; ++i)
						obj.addBox(boxes[i], container);
				}
			}

		},

		/** Horizontal split layout */
		horizontalSplit: function(obj, boxes) {
			obj.rootContainer = new CadreurContainer(Cadreur_DIRECTIONS.VERTICAL);
			if (boxes.length > 0)
			{
				obj.addBox(boxes[0]);
				if (boxes.length > 1)
				{
					var container = new CadreurContainer(Cadreur_DIRECTIONS.HORIZONTAL);
					obj.addBox(container);
					for (var i = 1; i < boxes.length; ++i)
						obj.addBox(boxes[i], container);
				}
			}
		},

		/** Grid layout */
		grid: function(obj, boxes) {
			var nb_boxes = boxes.length;

			// The size of grid is calculed just one time
			// It's intersting to execute this function when the number
			// of boxes have changed
			var sqrt = Math.sqrt(nb_boxes);
			var lines = Math.ceil(sqrt);
			var columns = Math.round(sqrt);

			obj.rootContainer = new CadreurContainer(Cadreur_DIRECTIONS.VERTICAL);
			var cpt = 0;
			for (var i = 0; i < lines; ++i) {
				var line = new CadreurContainer(Cadreur_DIRECTIONS.HORIZONTAL);
				obj.addBox(line);
				for (var j = 0; j < columns && cpt < nb_boxes; ++j)
					obj.addBox(boxes[cpt++], line);
			}
		},

		/** Complex and weird layout */
		multi: function(obj, boxes) {
			var nb_boxes = boxes.length;
			obj.rootContainer = new CadreurContainer(Cadreur_DIRECTIONS.VERTICAL);
			var cpt = 0;

			if (nb_boxes > cpt) {
				obj.addBox(boxes[cpt++]);
				if (nb_boxes > cpt) {
					var container = new CadreurContainer(Cadreur_DIRECTIONS.HORIZONTAL);
					obj.addBox(container);
					obj.addBox(boxes[cpt++], container);
					if (nb_boxes > cpt) {
						obj.addBox(boxes[cpt++], container);
						if (nb_boxes > cpt) {
							var container_vertical = new CadreurContainer(Cadreur_DIRECTIONS.VERTICAL);
							obj.addBox(container_vertical, container);
							for (var i = 0; i < 3 && cpt < nb_boxes; ++i)
								obj.addBox(boxes[cpt++], container_vertical);

							for (var i = 0; i < 2 && cpt < nb_boxes; ++i)
								obj.addBox(boxes[cpt++], container);

							while (cpt < nb_boxes)
								obj.addBox(boxes[cpt++]);
						}
					}
				}
			}
		}
	}
}

/**
 *	@class CadreurContainer
 */
CadreurContainer.prototype =
{
	/**
	 *	@method toString
	 *	@return {String}
	 */
	toString: function()
	{
		var str = "["+this.name+": ";

		for (var i = 0; i < this.boxes.length; ++i)
		{
			var box = this.boxes[i];
			if (box instanceof CadreurContainer)
				str += box;
			else
				str += box.getAttribute('id');
			str += ", ";

		}

		str = str.slice(0, str.length -2);
		str += ']';

		return str;
	},

	/**
	 *	Add the box in the target container.
	 *
	 *	The target container could be a child. This function is recursive.
	 *
	 *	A function could be called when the box is added. The container is
	 *		passed by parameters, and the box isn't added automatically.
	 *
	 *	@method addBox
	 *	@protected
	 *	@param {HTMLElement|CadreurContainer} box The box to add
	 *	@param {CadreurContainer} container The container in which add the box
	 *	@param {Function|Null} action An optionnal function to execute when the box is added
	 */
	addBox: function(box, container, action)
	{
		var remove = function(array, elem)
		{
		    var match = -1;

		    while( (match = array.indexOf(elem)) > -1 )
		        array.splice(match, 1);

	        return array;
		};

		for (var i = 0; i < this.boxes.length; ++i)
		{
			var ibox = this.boxes[i];

			if (ibox instanceof CadreurContainer)
			{
				ibox.addBox(box, container, action);
				// Removing empty containers (for eliminate empty areas)
				if (ibox.boxes.length === 0)
					this.boxes = remove(this.boxes, ibox);
			}

			// If we find the box in another container, we change his location
			if (ibox !== container && ibox === box)
				this.boxes = remove(this.boxes, box);

		}

		if (this === container)
		{
			if (action)
				action(this);
			else
				this.boxes.push(box);
		}
	},

	/**
	 *	Add the box above the target.
	 *
	 *	@method addBoxTop
	 *	@param {HTMLElement|CadreurContainer} box
	 *	@param {HTMLElement|CadreurContainer} target
	 *	@param {CadreurContainer} container
	 */
	addBoxTop: function(box, target, container)
	{
		var obj  = this;
		this.addBox(box,container, function(container) {
			var boxes = container.boxes;
			boxes.splice(boxes.indexOf(target), 0, box);
		});
	},

	/**
	 *	Add the box right to the target.
	 *
	 *	@method addBoxRight
	 *	@param {HTMLElement|CadreurContainer} box
	 *	@param {HTMLElement|CadreurContainer} target
	 *	@param {CadreurContainer} container
	 */
	addBoxRight: function(box, target, container)
	{
		this.addBox(box,container, function(container) {
			var boxes = container.boxes;
			boxes.splice(boxes.indexOf(target)+1, 0, box);
		});
	},

	/**
	 *	Add the box below the target.
	 *
	 *	@method addBoxBottom
	 *	@param {HTMLElement|CadreurContainer} box
	 *	@param {HTMLElement|CadreurContainer} target
	 *	@param {CadreurContainer} container
	 */
	addBoxBottom: function(box, target, container)
	{
		this.addBox(box,container, function(container) {
			var boxes = container.boxes;
			boxes.splice(boxes.indexOf(target)+1, 0, box);
		});
	},

	/**
	 *	Add the box left to the target.
	 *
	 *	@method addBoxLeft
	 *	@param {HTMLElement|CadreurContainer} box
	 *	@param {HTMLElement|CadreurContainer} target
	 *	@param {CadreurContainer} container
	 */
	addBoxLeft: function(box, target, container)
	{
		this.addBox(box,container, function(container) {
			var boxes = container.boxes;
			boxes.splice(boxes.indexOf(target), 0, box);
		});
	},

	/**
	 *	Exec the callback function for each box in the layout.
	 *
	 *	@method processing
	 *	@protected
	 *	@param {Number} jmp_x X position of the box
	 *	@param {Number} jmp_y Y position of the box
	 *	@param {Number} width Width of the box
	 *	@param {Number} height Height of the box
	 *	@param {Function} callback The callback to execute (more info in Box_layout.processing)
	 *	@param {Array} containers Stack of containers in which the boxes are
	 */
	processing: function(jmp_x, jmp_y, width, height, callback, containers)
	{
		var height_jmp = 0;
		var width_jmp = 0;
		var nb_boxes = this.boxes.length;

		if (this.direction === Cadreur_DIRECTIONS.VERTICAL)
		{
			height = Math.ceil(height / nb_boxes);
			height_jmp = height;
		} else
		{
			width = Math.ceil(width / nb_boxes);
			width_jmp = width;
		}

		// Manage the stack of containers
		if (containers instanceof Array)
			containers.push(this);
		else
			containers = [this];

		for (var i = 0; i < nb_boxes; ++i) {

			var x = jmp_x + i * width_jmp;
			var y = jmp_y + i * height_jmp;

			var box = this.boxes[i];

			// Recursive call of the processing function
			// The slice function is very important, lot of time was wasted here
			if (box instanceof CadreurContainer)
				box.processing(x, y, width, height, callback, containers.slice(0));
			else
				callback(box, x, y, width, height, containers);

		}
	}

};
