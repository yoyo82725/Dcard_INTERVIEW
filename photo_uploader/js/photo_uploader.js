var test; // use to test closeure

var Photo_Uploader = (function($){
	var reader = new FileReader();
	var drag_upload = true;
	var original_img; // 修圖復原用
	var img_type = 'jpg'; // jpg/png

	var Crop_Dragger = (function($){
		var dragging = false;
		var originX = 0;
		var originY = 0;
		var $drag_item;
		var limitX = 0;
		var limitY = 0;
		return {
			dragging : dragging,
			originX : originX,
			originY : originY,
			$drag_item : $drag_item
		}
	})(jQuery);

	var Mosaic = (function(){
		is_putting = false;
		is_edited = false;
		return {
			is_putting : is_putting,
			is_edited : is_edited
		}
	});

	return {
		reader : reader,
		drag_upload : drag_upload,
		original_img : original_img,
		img_type : img_type,
		Crop_Dragger : Crop_Dragger,
		Mosaic : Mosaic,

		// 刷新上方圖
		load_file : function (file) {
			// 輸出用
			if (file.type.match('image/png')) {
				Photo_Uploader.img_type = 'png';
				localStorage['img_type'] = 'png';
			} else {
				Photo_Uploader.img_type = 'jpg';
				localStorage['img_type'] = 'jpg';
			}

			// 重置上傳訊息
			Photo_Uploader.init_msg();

			// 開始處理
			Photo_Uploader.reader.readAsDataURL(file);
			Photo_Uploader.reader.onloadstart = function () {

				// 顯示讀取中
				Photo_Uploader.show_canvas_loading();
			};

			// 進度
			Photo_Uploader.reader.onprogress = function (e) {
				if (e.lengthComputable) {

					// 進度換算百分比
					var percentage = e.loaded / e.total;

					// 進度條
					$('#photo_uploader').find('.function_block>.progress_block>progress').attr('value',percentage);
				}
			};

			// 處理結束
			Photo_Uploader.reader.onloadend = function () {

				// 更改上圖
				// $img.attr('src',Photo_Uploader.reader.result);
				Photo_Uploader.canvas_load_img (Photo_Uploader.reader.result);

				// 進度條
				$('#photo_uploader').find('.function_block>.progress_block>progress').attr('value','1');
			};

		},
		// 顯示拖曳上傳遮罩
		show_drop_mask : function () {
			$('#photo_uploader').find('.img_block>.drop_mask').css('opacity','1');
		},
		// 隱藏拖曳上傳遮罩
		hide_drop_mask : function () {
			$('#photo_uploader').find('.img_block>.drop_mask').css('opacity','0');
		},
		// 儲存圖片base64(Ajax PHP)
		save_img_base64 : function (base64_str) {
			var $canvas = $('#photo_uploader').find('.img_block>canvas');
			var base64_str = base64_str ? base64_str : $canvas.get(0).toDataURL('image/' + Photo_Uploader.img_type);

			// 判斷有沒有圖
			if (base64_str) {

				// 開始上傳
				var objForm = new FormData();
				objForm.append('base64_str', base64_str);
				objForm.append('img_type', Photo_Uploader.img_type);

				Photo_Uploader.send_to_php(objForm);

			} else {
				alert('請先上傳圖片!');
			}
		},
		// 上方圖片
		canvas_load_img : function (img_path) {
			var $canvas = $('#photo_uploader').find('.img_block>canvas');
			var ctx = $canvas.get(0).getContext('2d');
			var img = new Image();
			// 是否是base64
			if (img_path.match('base64'))
				img.src = img_path;
			else
				img.src = img_path + '?' + Math.ceil(Math.random()*100); // 抗緩存

			// show loading
			Photo_Uploader.show_canvas_loading();

			// 讀圖片
			img.onload = function () {
				Photo_Uploader.hide_canvas_loading();
				// 重整寬高
				$canvas.attr('width',img.width);
				$canvas.attr('height',img.height);
				// 繪製
				ctx.drawImage(img, 0, 0);

				// 儲存還原點
				Photo_Uploader.original_img = img;
			};

		},
		show_canvas_loading : function () {
			$('#photo_uploader').find('.img_block>img.loading').show();
			$('#photo_uploader').find('.img_block>canvas').hide();
		},
		hide_canvas_loading : function () {
			$('#photo_uploader').find('.img_block>img.loading').hide();
			$('#photo_uploader').find('.img_block>canvas').show();
		},
		// 儲存圖片by url(Ajax PHP)
		save_img_by_url : function () {
			var url = $('#photo_uploader').find('.function_block>.upload_img_url_block>input[type="text"]').get(0).value;
			// 判斷有沒有內容
			if (url) {

				// 開始上傳
				var objForm = new FormData();
				objForm.append('url',url);

				// 更新圖片type
				Photo_Uploader.img_type = 'jpg';
				localStorage['img_type'] = 'jpg';

				Photo_Uploader.send_to_php(objForm);

			} else {
				alert('請輸入url！');
			}
		},
		// 送去Photo_Uploader.php
		send_to_php : function (FormData) {
			var $status = $('#photo_uploader').find('.function_block>.upload_php_block>.status');

			// 開始上傳
			var objXhr = new XMLHttpRequest();
			objXhr.open('POST', 'Photo_Uploader.php');
			objXhr.send(FormData);
			$status.text('後端PHP開始上傳...');

			// 禁用所有上傳按鈕
			Photo_Uploader.disable_upload_btns();

			objXhr.onprogress = function(e) //上傳中
			{
			    if (e.lengthComputable)
			    {
			    	var percentage = e.loaded / e.total;
			        var intComplete = Math.ceil(percentage * 100);

			        $status.text('後端PHP開始上傳...' + intComplete + '%');

			        // 進度條
			        $('#photo_uploader').find('.function_block>.progress_block_php>progress').attr('value',percentage);

			    }
			}

			objXhr.onloadend = function(e) //上傳完成時
			{
				if(objXhr.responseText.match('<')) {
					$status.text('php 接收出錯，請查看Network Response！');
				} else {
					var arrData = JSON.parse(objXhr.responseText);
					$status.text(arrData.message);
				}

			    // 進度條
			    $('#photo_uploader').find('.function_block>.progress_block_php>progress').attr('value','1');

			    // 初始化上方圖
				Photo_Uploader.canvas_load_img ('file/test.' + Photo_Uploader.img_type);

				// 開啟所有上傳按鈕
				Photo_Uploader.open_upload_btns();

				// 後端生成各種尺寸 顯示縮圖
				if (typeof arrData.show_burn_img != "undefined") {
					var $show_burn_block = $('#photo_uploader').find('.function_block>.show_burn_block');

					// 顯示縮圖們
					$show_burn_block.show();

					var rand = Math.ceil(Math.random()*100);
					// 改縮圖
					$show_burn_block.find('img[name="1"]').attr('src','file/15x15.' + arrData.img_type + '?' + rand);
					$show_burn_block.find('img[name="2"]').attr('src','file/30x30.' + arrData.img_type + '?' + rand);
					$show_burn_block.find('img[name="3"]').attr('src','file/45x45.' + arrData.img_type + '?' + rand);

				}

			}
		},
		// 初始化訊息
		init_msg : function () {

			// 進度條
			$('#photo_uploader').find('.function_block>.progress_block_php>progress').attr('value','0');
			$('#photo_uploader').find('.function_block>.progress_block>progress').attr('value','0');

			// 文字
			$('#photo_uploader').find('.function_block>.upload_php_block>.status').text('');
		},
		// 打開裁切模式
		open_crop_mode : function () {

			// 定義工作區
			var $top = $('#photo_uploader').find('.img_block>.crop_items>.top');
			var $right = $('#photo_uploader').find('.img_block>.crop_items>.right');
			var $bottom = $('#photo_uploader').find('.img_block>.crop_items>.bottom');
			var $left = $('#photo_uploader').find('.img_block>.crop_items>.left');
			var $canvas = $('#photo_uploader').find('.img_block>canvas');

			// 過小不給切
			if ($canvas.width() + $canvas.height() < 60) {
				alert('已經很小了');
				return;
			}

			// 禁用其他按鈕
			Photo_Uploader.img_only(1);

			// 開啟裁剪區
			$('#photo_uploader').find('.img_block>.crop_items').show();

			// 初始化裁剪區
			// 內縮10px開始
			var INIT_PADDING = 10;
			$top.css({
				bottom: ($canvas.height()-INIT_PADDING) + 'px'
			});
			$right.css({
				left: ($canvas.width()-INIT_PADDING) + 'px'
			});
			$bottom.css({
				top: ($canvas.height()-INIT_PADDING) + 'px'
			});
			$left.css({
				right: ($canvas.width()-INIT_PADDING) + 'px'
			});

			// 註冊按鈕關閉
			$('body').on('keyup.close_crop', (function(e) {
				if (e.keyCode == 27) { // ESC
					Photo_Uploader.close_crop_mode();
				}
			}));

			// 註冊裁減四邊拖動
			// drag start
			var MIN_SIZE = 16; // 最小縮到16*16
			$top.on('mousedown.Crop_Dragger_end', (function(e) {
				if (!Photo_Uploader.Crop_Dragger.dragging) {
					Photo_Uploader.Crop_Dragger.dragging = true;
					Photo_Uploader.Crop_Dragger.$drag_item = $(this);

					// 點擊位置加上原先位置
					Photo_Uploader.Crop_Dragger.originY = e.clientY + (+Photo_Uploader.Crop_Dragger.$drag_item.css('bottom').slice(0,-2));
					Photo_Uploader.Crop_Dragger.limitY = $canvas.height() - (+$bottom.css('top').slice(0,-2)) + MIN_SIZE;
				}
				e.preventDefault();
				e.stopPropagation();
			}));
			$right.on('mousedown.Crop_Dragger_end', (function(e) {
				if (!Photo_Uploader.Crop_Dragger.dragging) {
					Photo_Uploader.Crop_Dragger.dragging = true;
					Photo_Uploader.Crop_Dragger.$drag_item = $(this);

					// 點擊位置扣掉原先位置
					Photo_Uploader.Crop_Dragger.originX = e.clientX - (+Photo_Uploader.Crop_Dragger.$drag_item.css('left').slice(0,-2));
					Photo_Uploader.Crop_Dragger.limitX = $canvas.width() - (+$left.css('right').slice(0,-2)) + MIN_SIZE;
				}
				e.preventDefault();
				e.stopPropagation();
			}));
			$bottom.on('mousedown.Crop_Dragger_end', (function(e) {
				if (!Photo_Uploader.Crop_Dragger.dragging) {
					Photo_Uploader.Crop_Dragger.dragging = true;
					Photo_Uploader.Crop_Dragger.$drag_item = $(this);

					// 點擊位置扣掉原先位置
					Photo_Uploader.Crop_Dragger.originY = e.clientY - (+Photo_Uploader.Crop_Dragger.$drag_item.css('top').slice(0,-2));
					Photo_Uploader.Crop_Dragger.limitY = $canvas.height() - (+$top.css('bottom').slice(0,-2)) + MIN_SIZE;
				}
				e.preventDefault();
				e.stopPropagation();
			}));
			$left.on('mousedown.Crop_Dragger_end', (function(e) {
				if (!Photo_Uploader.Crop_Dragger.dragging) {
					Photo_Uploader.Crop_Dragger.dragging = true;
					Photo_Uploader.Crop_Dragger.$drag_item = $(this);

					// 點擊位置加上原先位置
					Photo_Uploader.Crop_Dragger.originX = e.clientX + (+Photo_Uploader.Crop_Dragger.$drag_item.css('right').slice(0,-2));
					Photo_Uploader.Crop_Dragger.limitX = $canvas.width() - (+$right.css('left').slice(0,-2)) + MIN_SIZE;
				}
				e.preventDefault();
				e.stopPropagation();
			}));

			// 註冊裁切拖動
			$(document).on('mousemove.Crop_Dragger_end', (function(e) {

				// 有拖曳中
				if(Photo_Uploader.Crop_Dragger.dragging) {

					// 上方塊
					if(Photo_Uploader.Crop_Dragger.$drag_item.attr('name') == 'top') {

						// 以原點為中心移動
						var new_offset = Photo_Uploader.Crop_Dragger.originY - e.clientY;

						// 不超過下塊極限
						if (new_offset < Photo_Uploader.Crop_Dragger.limitY)
							new_offset = Photo_Uploader.Crop_Dragger.limitY;

						// 不超過圖片極限
						if (new_offset > $canvas.height())
							new_offset = $canvas.height();

						Photo_Uploader.Crop_Dragger.$drag_item.css({
							bottom: new_offset + 'px'
						});
					}

					// 右方塊
					else if(Photo_Uploader.Crop_Dragger.$drag_item.attr('name') == 'right') {

						// 以原點為中心移動
						var new_offset = e.clientX - Photo_Uploader.Crop_Dragger.originX;

						// 不超過左塊極限
						if (new_offset < Photo_Uploader.Crop_Dragger.limitX)
							new_offset = Photo_Uploader.Crop_Dragger.limitX;

						// 不超過圖片極限
						if (new_offset > $canvas.width())
							new_offset = $canvas.width();

						Photo_Uploader.Crop_Dragger.$drag_item.css({
							left: new_offset + 'px'
						});
					}

					// 下方塊
					else if(Photo_Uploader.Crop_Dragger.$drag_item.attr('name') == 'bottom') {

						// 以原點為中心移動
						var new_offset = e.clientY - Photo_Uploader.Crop_Dragger.originY;

						// 不超過上塊極限
						if (new_offset < Photo_Uploader.Crop_Dragger.limitY)
							new_offset = Photo_Uploader.Crop_Dragger.limitY;

						// 不超過圖片極限
						if (new_offset > $canvas.height())
							new_offset = $canvas.height();

						Photo_Uploader.Crop_Dragger.$drag_item.css({
							top: new_offset + 'px'
						});
					}

					// 左方塊
					else if(Photo_Uploader.Crop_Dragger.$drag_item.attr('name') == 'left') {

						// 以原點為中心移動
						var new_offset = Photo_Uploader.Crop_Dragger.originX - e.clientX;

						// 不超過右塊極限
						if (new_offset < Photo_Uploader.Crop_Dragger.limitX)
							new_offset = Photo_Uploader.Crop_Dragger.limitX;

						// 不超過圖片極限
						if (new_offset > $canvas.width())
							new_offset = $canvas.width();

						Photo_Uploader.Crop_Dragger.$drag_item.css({
							right: new_offset + 'px'
						});
					}
				}
				e.preventDefault();
				e.stopPropagation();
			}));

			// 註冊裁切拖動結束
			$(document).on('mouseup.Crop_Dragger_end', (function(e){
				if(Photo_Uploader.Crop_Dragger.dragging) {
					// 清空
					Photo_Uploader.Crop_Dragger.dragging = false;
					Photo_Uploader.Crop_Dragger.$drag_item = null;
				}
				e.preventDefault();
				e.stopPropagation();
			}));

		},
		// 關閉裁減模式
		close_crop_mode : function () {

			// 開啟按鈕功能
			Photo_Uploader.img_only(-1);

			// 關閉裁減區
			$('#photo_uploader').find('.img_block>.crop_items').hide();

			// 解註冊按鈕關閉
			$('body').off('.close_crop');

			// 解註冊裁切拖動結束
			var $top = $('#photo_uploader').find('.img_block>.crop_items>.top');
			var $right = $('#photo_uploader').find('.img_block>.crop_items>.right');
			var $bottom = $('#photo_uploader').find('.img_block>.crop_items>.bottom');
			var $left = $('#photo_uploader').find('.img_block>.crop_items>.left');

			$(document).off('.Crop_Dragger_end');
			$top.off('.Crop_Dragger_end');
			$right.off('.Crop_Dragger_end');
			$bottom.off('.Crop_Dragger_end');
			$left.off('.Crop_Dragger_end');
		},
		// 完成裁切
		complete_crop : function () {

			// 宣告工作區
			var $top = $('#photo_uploader').find('.img_block>.crop_items>.top');
			var $right = $('#photo_uploader').find('.img_block>.crop_items>.right');
			var $bottom = $('#photo_uploader').find('.img_block>.crop_items>.bottom');
			var $left = $('#photo_uploader').find('.img_block>.crop_items>.left');
			var $canvas = $('#photo_uploader').find('.img_block>canvas');
			var ctx = $canvas.get(0).getContext('2d');

			// 裁切參數
			var sx = +$left.css('width').slice(0, -2); // 含border的寬
			var sy = +$top.css('height').slice(0, -2); // 含border的高
			var sWidth = (+$right.css('left').slice(0, -2)) - sx; // 裁切寬
			var sHeight = (+$bottom.css('top').slice(0, -2)) - sy; // 裁切高
			var dx = 0; // 新x
			var dy = 0; // 新y
			var dWidth = sWidth; // 新width
			var dHeight = sHeight; // 新height

			// canvas轉img儲存
			var img = new Image();
			img.src = $canvas.get(0).toDataURL('image/' + Photo_Uploader.img_type);

			Photo_Uploader.show_canvas_loading();

			img.onload = function () {
				Photo_Uploader.hide_canvas_loading();
				// 重整寬高
				$canvas.attr('width',dWidth);
				$canvas.attr('height',dHeight);

				//繪製
				ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);

				// 關閉裁切區
				Photo_Uploader.close_crop_mode();
			}

		},
		// 恢復原圖
		back_modify : function () {
			var $canvas = $('#photo_uploader').find('.img_block>canvas');
			var img = Photo_Uploader.original_img;
			var ctx = $canvas.get(0).getContext('2d');

			// 重整寬高
			$canvas.attr('width',img.width);
			$canvas.attr('height',img.height);

			// 繪製
			ctx.drawImage(img, 0, 0);

		},
		// 灰階
		toGrayscale : function () {
			var $canvas = $('#photo_uploader').find('.img_block>canvas');
			var ctx = $canvas.get(0).getContext('2d');

			var source = ctx.getImageData (0, 0, $canvas.width(), $canvas.height());
			var output = ctx.createImageData ($canvas.width(), $canvas.height());

			var for_length = $canvas.width() * $canvas.height() * 4;
			for (var i = 0 ; i < for_length ; i+=4) {

				// 取得RGB值之後平均
				var gray = (source.data[i] + source.data[i+1] + source.data[i+2]) / 3;

				output.data[i] = gray; // r
				output.data[i + 1] = gray; // g
				output.data[i + 2] = gray; // b
				output.data[i + 3] = source.data[i + 3]; // alpha
			}

			// 輸出
			ctx.putImageData (output, 0, 0);
		},
		// 負片
		toInv : function () {
			var $canvas = $('#photo_uploader').find('.img_block>canvas');
			var ctx = $canvas.get(0).getContext('2d');

			var source = ctx.getImageData (0, 0, $canvas.width(), $canvas.height());
			var output = ctx.createImageData ($canvas.width(), $canvas.height());

			var for_length = $canvas.width() * $canvas.height() * 4;
			for (var i = 0 ; i < for_length ; i+=4) {

				// 亮度相反
				output.data[i] = 255 - source.data[i]; // r
				output.data[i + 1] = 255 - source.data[i + 1]; // g
				output.data[i + 2] = 255 - source.data[i + 2]; // b
				output.data[i + 3] = source.data[i + 3]; // alpha
			}

			// 輸出
			ctx.putImageData (output, 0, 0);
		},
		// 開啟放馬賽克模式
		open_mosaic_mode : function () {
			var $img_block = $('#photo_uploader').find('.img_block');

			// 改變手指
			$img_block.css('cursor','pointer');

			// 聚焦圖片區
			Photo_Uploader.img_only(1);

			// 開啟馬賽克工具
			$('#photo_uploader').find('.img_block>.mosaic_items').show();

			// 註冊點擊事件
			var $mosaic_block = $('#photo_uploader').find('.img_block>.mosaic_items');
			$mosaic_block.on('mousedown.mosaic', function(e){
				Photo_Uploader.Mosaic.is_putting = true;
				Photo_Uploader.Mosaic.is_edited = true;
				Photo_Uploader.put_mosaic_at_point(e.offsetX, e.offsetY);

				e.preventDefault();
				e.stopPropagation();
			});

			// 註冊拖曳事件
			$mosaic_block.on('mousemove.mosaic', function(e){

				// 有開啟
				if (Photo_Uploader.Mosaic.is_putting) {
					Photo_Uploader.put_mosaic_at_point(e.offsetX, e.offsetY);
				}

				e.preventDefault();
				e.stopPropagation();
			});

			// 註冊放開事件
			$mosaic_block.on('mouseup.mosaic', function(e){

				// 有開啟
				if (Photo_Uploader.Mosaic.is_putting) {
					Photo_Uploader.Mosaic.is_putting = false;
				}

				e.preventDefault();
				e.stopPropagation();
			});

			// 註冊ESC關閉
			$('body').on('keyup.mosaic', function(e) {
				if (e.keyCode == 27) { // ESC
					Photo_Uploader.close_mosaic_mode();
				}
			});

		},
		// 關閉放馬賽克模式
		close_mosaic_mode : function (is_confirm) {
			var is_confirm = is_confirm ? is_confirm : 0;
			// 詢問是否儲存
			if (Photo_Uploader.Mosaic.is_edited) {
				if (!is_confirm && !confirm('是否保留結果？')) {
					// 返回原樣
					Photo_Uploader.back_modify();
				}
				Photo_Uploader.Mosaic.is_edited = false;
			}

			// 改變手指
			var $img_block = $('#photo_uploader').find('.img_block');
			$img_block.css('cursor','default');

			// 關閉聚焦圖片區
			Photo_Uploader.img_only(-1);

			// 關閉馬賽克工具
			$('#photo_uploader').find('.img_block>.mosaic_items').hide();

			// 解註冊
			var $mosaic_block = $('#photo_uploader').find('.img_block>.mosaic_items');
			$mosaic_block.off('.mosaic');
			$('body').off('.mosaic');

		},
		// 聚焦圖片區
		img_only : function (open) {
			var open = open ? open : 1;
			if (open == 1) {
				// 禁用其他按鈕
				$('#photo_uploader').find('.disable_mask').show();
				Photo_Uploader.drag_upload = false;
			} else {
				// 開啟按鈕功能
				$('#photo_uploader').find('.disable_mask').hide();
				Photo_Uploader.drag_upload = true;
			}
		},
		// 放馬賽克at point
		put_mosaic_at_point : function (x, y, RANGE) {
			var $canvas = $('#photo_uploader').find('.img_block>canvas');
			var ctx = $canvas.get(0).getContext('2d');
			var RANGE = RANGE ? RANGE : 10; // 影響10*10範圍

			// 取得影響範圍
			var x = x ? x : 0;
			var y = y ? y : 0;
			var newX = Math.max(x - Math.ceil(RANGE/2), 0); // 不小於0
			var newY = Math.max(y - Math.ceil(RANGE/2), 0); // 不小於0
			var source = ctx.getImageData(newX, newY, RANGE, RANGE);
			var output = ctx.createImageData (RANGE, RANGE);

			// 馬賽克化
			var for_length = RANGE * RANGE * 4;
			for (var i = 0 ; i < for_length ; i+=4) {
				// 變成同色
				output.data[i] = source.data[0]; // r
				output.data[i + 1] = source.data[1]; // g
				output.data[i + 2] = source.data[2]; // b
				output.data[i + 3] = source.data[3]; // alpha
			}

			// 輸出
			ctx.putImageData (output, newX, newY);
		},
		// 完成馬賽克
		complete_mosaic : function () {

			// 關閉裁切區
			Photo_Uploader.close_mosaic_mode(1);
		},
		// 新尺寸
		canvas_resize : function (SIZE) {
			var SIZE = SIZE ? SIZE : 150;

			var $canvas = $('#photo_uploader').find('.img_block>canvas');
			var ctx = $canvas.get(0).getContext('2d');

			// canvas轉img儲存
			var img = new Image();
			img.src = $canvas.get(0).toDataURL('image/' + Photo_Uploader.img_type);

			Photo_Uploader.show_canvas_loading();

			img.onload = function () {
				Photo_Uploader.hide_canvas_loading();
				// 重整寬高
				$canvas.attr('width',SIZE);
				$canvas.attr('height',SIZE);

				//繪製
				ctx.drawImage(img, 0, 0, SIZE, SIZE);
			}
		},
		// 後端生成各種尺寸
		burn_some_size : function () {

			// 傳送請求
			var objForm = new FormData();
			objForm.append('burn_some_size',1);
			objForm.append('img_type', Photo_Uploader.img_type);

			Photo_Uploader.send_to_php(objForm);
		},
		disable_upload_btns : function () {
			var $upload_btn = $('.upload_btn');
			$upload_btn.each(function() {
				$(this).attr('disabled',true);
			});
		},
		open_upload_btns : function () {
			var $upload_btn = $('.upload_btn');
			$upload_btn.each(function() {
				$(this).attr('disabled',false);
			});
		}
	}
})(jQuery);

// 初始化上方圖
if (typeof localStorage['img_type'] != "undefined") {
	Photo_Uploader.img_type = localStorage['img_type'];
}
Photo_Uploader.canvas_load_img ('file/test.' + Photo_Uploader.img_type);

// 檔案上傳
$('#fileupload').change(function(event) {
	var file = this.files[0];
	if (typeof file.type != "undefined") {

		//判斷上傳的檔案是否為圖檔
		if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
			alert('請上傳.jpg/.png圖片檔案');
			return;
		}

		// 刷新上方圖
		Photo_Uploader.load_file(file);
	}
});

// 處理圖片區拖曳上傳
var $img_block = $('#photo_uploader').find('.img_block');

// 註冊拖入
$img_block.on('dragenter', function (e) {
	e.stopPropagation();
	e.preventDefault();

	// 判斷可拖曳
	if (Photo_Uploader.drag_upload) {
		Photo_Uploader.show_drop_mask();
	}
});

// 註冊拖開
$img_block.on('dragleave', function (e) {
	e.stopPropagation();
	e.preventDefault();

	// 可拖曳
	if (Photo_Uploader.drag_upload) {
		Photo_Uploader.hide_drop_mask();
	}
});

// 註冊拖上
$img_block.on('dragover', function (e) {
	e.stopPropagation();
	e.preventDefault();
});

// 註冊放開
$img_block.on('drop', function (e) {
	e.stopPropagation();
	e.preventDefault();

	// 判斷可拖曳
	if (Photo_Uploader.drag_upload) {
		Photo_Uploader.hide_drop_mask();

		var files = e.originalEvent.dataTransfer.files;

		if (typeof files[0].type != "undefined") {

			//判斷上傳的檔案是否為圖檔
			if (!files[0].type.match('image/jpeg') && !files[0].type.match('image/png')) {
				alert('請上傳.jpg/.png圖片檔案');
				return;
			}

			// 刷新上方圖
			Photo_Uploader.load_file(files[0]);
		}
	}

});

// 拖曳到其他位置不反應
$('body').on('dragover', function (e) {
	e.stopPropagation();
	e.preventDefault();
});
$('body').on('drop', function (e) {
	e.stopPropagation();
	e.preventDefault();
});
