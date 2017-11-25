(function($)
{
	$.Redactor.prototype.fontcolor = function()
	{
		return {
			init: function()
			{
				var colors = [
					// '#ffffff', '#000000', '#eeece1', '#1f497d', '#4f81bd', '#c0504d', '#9bbb59', '#8064a2', '#4bacc6', '#f79646', '#ffff00',
					// '#f2f2f2', '#7f7f7f', '#ddd9c3', '#c6d9f0', '#dbe5f1', '#f2dcdb', '#ebf1dd', '#e5e0ec', '#dbeef3', '#fdeada', '#fff2ca',
					// '#d8d8d8', '#595959', '#c4bd97', '#8db3e2', '#b8cce4', '#e5b9b7', '#d7e3bc', '#ccc1d9', '#b7dde8', '#fbd5b5', '#ffe694',
					// '#bfbfbf', '#3f3f3f', '#938953', '#548dd4', '#95b3d7', '#d99694', '#c3d69b', '#b2a2c7', '#b7dde8', '#fac08f', '#f2c314',
					// '#a5a5a5', '#262626', '#494429', '#17365d', '#366092', '#953734', '#76923c', '#5f497a', '#92cddc', '#e36c09', '#c09100',
					// '#7f7f7f', '#0c0c0c', '#1d1b10', '#0f243e', '#244061', '#632423', '#4f6128', '#3f3151', '#31859b',  '#974806', '#7f6000'
					'#000000',	'#000033',	'#000066',	'#000099',	'#0000cc',	'#0000ff',
					'#003300',	'#003333',	'#003366',	'#003399',	'#0033cc',	'#0033ff',
					'#006600',	'#006633',	'#006666',	'#006699',	'#0066cc',	'#0066ff',
					'#009900',	'#009933',	'#009966',	'#009999',	'#0099cc',	'#0099ff',
					'#00cc00',	'#00cc33',	'#00cc66',	'#00cc99',	'#00cccc',	'#00ccff',
					'#00ff00',	'#00ff33',	'#00ff66',	'#00ff99',	'#00ffcc',	'#00ffff',
					'#330000',	'#330033',	'#330066',	'#330099',	'#3300cc',	'#3300ff',
					'#333300',	'#333333',	'#333366',	'#333399',	'#3333cc',	'#3333ff',
					'#336600',	'#336633',	'#336666',	'#336699',	'#3366cc',	'#3366ff',
					'#339900',	'#339933',	'#339966',	'#339999',	'#3399cc',	'#3399ff',
					'#33cc00',	'#33cc33',	'#33cc66',	'#33cc99',	'#33cccc',	'#33ccff',
					'#33ff00',	'#33ff33',	'#33ff66',	'#33ff99',	'#33ffcc',	'#33ffff',
					'#660000',	'#660033',	'#660066',	'#660099',	'#6600cc',	'#6600ff',
					'#663300',	'#663333',	'#663366',	'#663399',	'#6633cc',	'#6633ff',
					'#666600',	'#666633',	'#666666',	'#666699',	'#6666cc',	'#6666ff',
					'#669900',	'#669933',	'#669966',	'#669999',	'#6699cc',	'#6699ff',
					'#66cc00',	'#66cc33',	'#66cc66',	'#66cc99',	'#66cccc',	'#66ccff',
					'#66ff00',	'#66ff33',	'#66ff66',	'#66ff99',	'#66ffcc',	'#66ffff',
					'#990000',	'#990033',	'#990066',	'#990099',	'#9900cc',	'#9900ff',
					'#993300',	'#993333',	'#993366',	'#993399',	'#9933cc',	'#9933ff',
					'#996600',	'#996633',	'#996666',	'#996699',	'#9966cc',	'#9966ff',
					'#999900',	'#999933',	'#999966',	'#999999',	'#9999cc',	'#9999ff',
					'#99cc00',	'#99cc33',	'#99cc66',	'#99cc99',	'#99cccc',	'#99ccff',
					'#99ff00',	'#99ff33',	'#99ff66',	'#99ff99',	'#99ffcc',	'#99ffff',
					'#cc0000',	'#cc0033',	'#cc0066',	'#cc0099',	'#cc00cc',	'#cc00ff',
					'#cc3300',	'#cc3333',	'#cc3366',	'#cc3399',	'#cc33cc',	'#cc33ff',
					'#cc6600',	'#cc6633',	'#cc6666',	'#cc6699',	'#cc66cc',	'#cc66ff',
					'#cc9900',	'#cc9933',	'#cc9966',	'#cc9999',	'#cc99cc',	'#cc99ff',
					'#cccc00',	'#cccc33',	'#cccc66',	'#cccc99',	'#cccccc',	'#ccccff',
					'#ccff00',	'#ccff33',	'#ccff66',	'#ccff99',	'#ccffcc',	'#ccffff',
					'#ff0000',	'#ff0033',	'#ff0066',	'#ff0099',	'#ff00cc',	'#ff00ff',
					'#ff3300',	'#ff3333',	'#ff3366',	'#ff3399',	'#ff33cc',	'#ff33ff',
					'#ff6600',	'#ff6633',	'#ff6666',	'#ff6699',	'#ff66cc',	'#ff66ff',
					'#ff9900',	'#ff9933',	'#ff9966',	'#ff9999',	'#ff99cc',	'#ff99ff',
					'#ffcc00',	'#ffcc33',	'#ffcc66',	'#ffcc99',	'#ffcccc',	'#ffccff',
					'#ffff00',	'#ffff33',	'#ffff66',	'#ffff99',	'#ffffcc',	'#ffffff',
				];


				var $button = this.button.add('fontcolor', 'Text Color');
				this.button.setIcon($button, '<i class="re-icon-fontcolor"></i>');

				var $dropdown = this.button.addDropdown($button);
                $dropdown.attr('rel', 'fontcolor');
				$dropdown.width(242);

				var $selector = $('<div style="overflow: hidden; text-align: center;">');
				var $selectorText = $('<span rel="text" class="re-dropdown-box-selector-font" style="background: #eee; float: left; padding: 8px 0; cursor: pointer; font-size: 12px; width: 50%;">Text</span>');
				var $selectorBack = $('<span rel="back" class="re-dropdown-box-selector-font" style="float: left; padding: 8px 0; cursor: pointer; font-size: 12px; width: 50%;">Highlight</span>');

				$selector.append($selectorText);
				$selector.append($selectorBack);

				$dropdown.append($selector);

				this.fontcolor.buildPicker($dropdown, 'textcolor', colors);
				this.fontcolor.buildPicker($dropdown, 'backcolor', colors);

				$selectorText.on('mousedown', function(e)
				{
    				e.preventDefault();

                    $dropdown.find('.re-dropdown-box-selector-font').css('background', 'none');
    				$dropdown.find('.re-dropdown-box-backcolor').hide();
    				$dropdown.find('.re-dropdown-box-textcolor').show();

    				$(this).css('background', '#eee');
				});

				$selectorBack.on('mousedown', function(e)
				{
    				e.preventDefault();

                    $dropdown.find('.re-dropdown-box-selector-font').css('background', 'none');
    				$dropdown.find('.re-dropdown-box-textcolor').hide();
    				$dropdown.find('.re-dropdown-box-backcolor').show();

    				$(this).css('background', '#eee');
				});

			},
			buildPicker: function($dropdown, name, colors)
			{
    			var $box = $('<div class="re-dropdown-box-' + name + '">');
				var rule = (name == 'backcolor') ? 'background-color' : 'color';
				var len = colors.length;
				var self = this;
				var func = function(e)
				{
					e.preventDefault();
					self.fontcolor.set($(this).data('rule'), $(this).attr('rel'));
				};

				for (var z = 0; z < len; z++)
				{
					var color = colors[z];

					var $swatch = $('<a rel="' + color + '" data-rule="' + rule +'" href="#" style="float: left; box-sizing: border-box; font-size: 0; border: 2px solid #fff; padding: 0; margin: 0; width: 22px; height: 22px;"></a>');
					$swatch.css('background-color', color);
					$swatch.on('mousedown', func);

					$box.append($swatch);
				}

				var $elNone = $('<a href="#" style="display: block; clear: both; padding: 8px 5px; box-sizing: border-box; font-size: 12px; line-height: 1;"></a>').html(this.lang.get('none'));
				$elNone.on('mousedown', $.proxy(function(e)
				{
					e.preventDefault();
					this.fontcolor.remove(rule);

				}, this));

				$box.append($elNone);
				$dropdown.append($box);

				if (name == 'backcolor')
				{
    				$box.hide();
				}
			},
			set: function(rule, type)
			{
				this.inline.format('span', 'style', rule + ': ' + type + ';');
				this.dropdown.hide();
			},
			remove: function(rule)
			{
				this.inline.removeStyleRule(rule);
				this.dropdown.hide();
			}
		};
	};
})(jQuery);