var get_random_color_degrees = [];
function get_random_color() {

	var degree = 0;
	for (var i = 0; i < 20; ++i)
	{
		degree = Math.round(Math.random() * 360);
		var j = 0;
		for (var j = 0; j < get_random_color_degrees.length; ++j)
			if (Math.abs(get_random_color_degrees[j] - degree) < 
				30-get_random_color_degrees.length)
				j = 1000;

		if (j == get_random_color_degrees.length)
			i = 1000;

	}

	get_random_color_degrees.push(degree);

	var saturation = 80 + Math.round(Math.random() * 4) * 5;
	var luminosite = 45 + Math.round(Math.random() * 2) * 5;

	return degree+','+saturation+'%,'+luminosite+'%';
};


$(document).ready(function() {
	var layout = new Cadreur(
			document.getElementById('cadreur_area'),
			Cadreur_DIRECTIONS.VERTICAL);
	
	function create_box() {
		var box = layout.createBox();

		var data = document.createElement('div');
		data.className = 'data';
		box.back.appendChild(data);

		var color = get_random_color();
		box.box.style.background = 'hsl('+color+')';
		box.box.id = "box_"+color.slice(1);

		var border_line = document.createElement('div');
		border_line.className = 'borderLine';

		// Just a gradient
		var dark_color = color.substr(0, color.length-3)+'25%';
		border_line.style.background = "-webkit-gradient(linear, left top, right top, color-stop(0%,hsla("+
			color+",0.6)), color-stop(55%,hsla("+color+",0.6)), color-stop(100%,hsla("+dark_color+",0.65)))";
		border_line.style.background = "-webkit-linear-gradient(left, hsla("+color+",0.6) 0%,hsla("+color+
			",0.6) 55%,hsla("+dark_color+",0.65) 100%)";

		border_line.style.background = "linear-gradient(to right, hsla("+
			color+",0.6) 0%,hsla("+color+",0.6) 55%,hsla("+dark_color+",0.65) 100%)";
		border_line.style.background = "-moz-linear-gradient(left, hsla("
				+color+",0.6) 0%, hsla("+color+",0.6) 55%, hsla("
				+dark_color+",0.65) 100%)";
		box.back.appendChild(border_line);

		return box;
	}

	var firstbox = create_box(); 
	firstbox.front.appendChild(document.createTextNode('Front side. Click on Flip to view the back side, or to drag the boxes'));
	firstbox.back.appendChild(document.createTextNode('Back side. You can add a new box clicking or dragging the "new box" button.'));

	layout.addBox(firstbox.box);
	layout.addBox(create_box().box);
	layout.addBox(create_box().box);
	layout.addBox(create_box().box);

	setTimeout(function(){layout.changeLayout(layout.layouts.multi);}, 1);

	$('#button_vertical').click(function(){layout.changeLayout(layout.layouts.verticalSplit); return false;});
	$('#button_horizontal').click(function(){layout.changeLayout(layout.layouts.horizontalSplit); return false;});
	$('#button_grid').click(function(){layout.changeLayout(layout.layouts.grid); return false;});
	$('#button_multi').click(function(){layout.changeLayout(layout.layouts.multi); return false;});

	$('#button_flip').click(function(){layout.toggleFrontMode(); return false;});

	$('#button_new').mousedown(function(e){
		var box = create_box().box;

		box.style.display = 'none';
		box.className += ' dragged';
		layout.dragged_box = box;
		layout.visual_drag.style.display = 'block';
		layout.visual_drag.style.top = e.clientY-13+'px';
		layout.visual_drag.style.left = e.clientX-13+'px';
		layout.visual_drag.style.background = box.style.background;

	}).click(function(){return false;});

});
