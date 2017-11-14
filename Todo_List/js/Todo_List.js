/********* Todo List Function *******/

var Todo_List = (function($){
	var item_z_index = 1;
	// 拖曳
	var Dragger = (function($){
		var dragging = false;
		var originX = 0;
		var originY = 0;
		var $drag_item;
		return {
			dragging : dragging,
			originX : originX,
			originY : originY,
			$drag_item : $drag_item
		};
	})(jQuery);

	return {
		// 拖曳變數
		Dragger : Dragger,
		item_z_index : item_z_index,
		// 刷新底部主題塊
		item_refresh_foot : function ($item, changeTo) {
			var changeTo = changeTo ? changeTo : 0;
			var now_theme = Todo_List.get_theme_by_item($item); // 1 2 3 4

			// 換顏色
			if (changeTo > 0) {
				$item.removeClass('theme' + now_theme).addClass('theme' + changeTo);
				now_theme = changeTo;

				// 儲存
				Todo_List.save_now();
			}

			// 抽換foot
			$item.find('.foot>.items').show();
			$item.find('.foot>.item' + now_theme).hide();
		},
		// 全部刷新底部主題塊
		all_items_refresh_foot : function () {
			$('#Todo_List').find('.work_block>.item').each(function() {
				Todo_List.item_refresh_foot ($(this));
			});
		},
		// 移除MEMO
		remove_item : function ($item) {
			var title = $item.find('.head>div[contenteditable]').text();
			if (confirm('確定移除標題："' + title + '"？')) {
				$item.addClass('an_toBigFadeOut');
				setTimeout((function (){
					$item.remove ();
					
					// 儲存
					Todo_List.save_now();
				}),1000);
			}
		},
		// 新增物件
		add_item : function (theme_code, title, content, complete, style) {
			var theme_code = theme_code ? theme_code : 1;
			var title = title ? title : "Title";
			var content = content ? content : "Content";
			var complete = complete ? complete : "false";
			
			// 從template clone item
			var $new_item = $('#template').find('.item').clone();

			// 改變主題
			$new_item.addClass('theme' + theme_code);

			// 設置標題
			$new_item.find('.head>div[contenteditable]').html(title);

			// 設置內容
			$new_item.find('.body>div[contenteditable]').html(content);

			// 打勾
			if (complete == "true")
				$new_item.find('.head>.complete').addClass('active');

			// 設置樣式
			// 隨機位置 取得XY限制
			var limit_left = $('#Todo_List').width() - 240; // 物件寬240
			var limit_top = $('#Todo_List').height() - 240; // 物件高240

			var style = style ? style : Math.floor(Math.random()*limit_top) + 'px,' + Math.floor(Math.random()*limit_left) + 'px,' + Todo_List.item_z_index++ ;
			console.log(style);
			var top = style.split(',')[0];
			var left = style.split(',')[1];
			var zIndex = style.split(',')[2];

			// 更新item_z_index 置頂
			if (!isNaN(+zIndex))
				Todo_List.item_z_index = Math.max ((+zIndex)+1, Todo_List.item_z_index);

			$new_item.css({
				top : top,
				left : left,
				zIndex : zIndex
			});

			// 刷新底部塊
			Todo_List.item_refresh_foot($new_item);

			// 註冊全item事件
			Todo_List.reg_item_event($new_item);

			// 插入
			$('#Todo_List').find('.work_block').append($new_item);

		},
		// 註冊 拖曳、勾勾、垃圾桶、換主題
		reg_item_event : function ($item) {

			// 註冊拖曳
			$item.mousedown(function(e){
				// 開始拖曳
				Dragger.dragging = true;
				Dragger.$drag_item = $item;
				Dragger.originX = e.clientX - Dragger.$drag_item.get(0).offsetLeft;
				Dragger.originY = e.clientY - Dragger.$drag_item.get(0).offsetTop + $('#Todo_List').find('.work_block').scrollTop();

				// 置頂
				Todo_List.item_toTop($(this));

			});

			// 註冊換單塊主題
			$item.find('.foot>.items').click(function(){

				var item = $(this).parents('.item');
				var changeTo = $(this).attr('class').split("item")[1].charAt(0);

				// 刷新樣式 & 底部塊
				Todo_List.item_refresh_foot (item, changeTo);

			});

			// 註冊打勾功能
			$item.find('.head>.complete').click(function(){

				if ($(this).hasClass('active')) {
					$(this).removeClass('active');
				} else {
					$(this).addClass('active');
				}

				// 儲存
				Todo_List.save_now();
			});

			// 垃圾桶功能
			$item.find('.head>.trash').click(function(){

				Todo_List.remove_item($(this).parents('.item'));

			});

		},
		// 註冊事件
		reg_item_event_all : function () {
			$('#Todo_List').find('.work_block>.item').each(function() {
				Todo_List.reg_item_event ($(this));
			});
		},
		// 置頂物件
		item_toTop : function ($item) {
			$item.css ('z-index',Todo_List.item_z_index++);

		},
		// 儲存資訊至storage
		save_now : function () {
			var $work_block = $('#Todo_List').find('.work_block');
			var item_count = $work_block.find('.item').length;

			if (item_count == 0) {
				localStorage.clear();
			} else {
				// 開始儲存
				for (i=0;i<item_count;i++) {
					var $item = $work_block.find('.item:nth-child('+(i+1)+')');

					// 儲存title
					localStorage['item_'+i+'_title'] = $item.find('.head>div[contenteditable]').html();

					// 儲存content
					localStorage['item_'+i+'_content'] = $item.find('.body>div[contenteditable]').html();

					// 儲存complete
					localStorage['item_'+i+'_complete'] = $item.find('.head>.complete').hasClass('active');

					// 儲存theme
					localStorage['item_'+i+'_theme'] = Todo_List.get_theme_by_item($item);

					// 儲存 top left z-index
					var style = $item.css("top")+","+$item.css("left")+","+$item.css("z-index");
					localStorage['item_'+i+'_style'] = style;
				}
			}

		},
		// 得到theme
		get_theme_by_item : function ($item) {
			return +$item.attr('class').split("theme")[1].charAt(0); // 1 2 3 4
		},
		// 從storage載入items
		load_storage_item : function () {

			if (localStorage.length > 0) {
				var $work_block = $('#Todo_List').find('.work_block');

				// 清除場上
				$work_block.find('.item').remove();

				// 建立item
				var item_count = localStorage.length / 5;

				for (i=0;i<item_count;i++) {
					Todo_List.add_item(
						localStorage['item_'+i+'_theme'],
						localStorage['item_'+i+'_title'],
						localStorage['item_'+i+'_content'],
						localStorage['item_'+i+'_complete'],
						localStorage['item_'+i+'_style']
					);
				}

			}

		},
		// 關閉彈窗
		close_pop : function () {
			$('#popup').hide();
		},
		// 顯示彈窗
		show_pop : function () {
			$('#popup').show();
		},
		// 顯示訊息
		pop_msg : function (msg, speed) {
			var msg = msg ? msg : 'TEST';
			var speed = speed ? speed : msg.length * 100;

			$('#popmsg').find('.container2017>.msg_block').text(msg);
			$('#popmsg').show();
			setTimeout((function(){
				$('#popmsg').fadeOut('slow');
			}),speed);
		},
		// 清除紀錄
		clear_storage_item : function () {
			localStorage.clear();
		},
		// 改變字型
		change_font_size : function (size_px) {
			var size_px = size_px ? size_px : 16;
			// 文字RWD
			var MAXWIDTH = 470;
			$('.textRWD16').fontResize(size_px,MAXWIDTH);
			$('.textRWD18').fontResize(size_px+2,MAXWIDTH);
			$(window).resize(function(){
			    $('.textRWD16').fontResize(size_px,MAXWIDTH);
			    $('.textRWD18').fontResize(size_px+2,MAXWIDTH);
			});
		},
		// 篩選項目
		filter_item_by_complete : function (complete) { // 0 1

			$('#Todo_List').find('.work_block>.item').each(function(index, el) {

				$(this).show();

				if (complete == 0) {

					// 顯示未完成
					if ($(this).find('.head>.complete').hasClass('active') == true) {
						$(this).hide();
					}
				} else if (complete == 1) {

					// 顯示已完成
					if ($(this).find('.head>.complete').hasClass('active') == false) {
						$(this).hide();

					}
				}
			});
		},
		// 清除項目
		clear_item_by_complete : function (complete) { // 0 1

			$('#Todo_List').find('.work_block>.item').each(function(index, el) {

				if (complete == 0) {

					// 清除未完成
					if ($(this).find('.head>.complete').hasClass('active') == false) {
						$(this).remove();
					}
				} else {

					// 清除已完成
					if ($(this).find('.head>.complete').hasClass('active') == true) {
						$(this).remove();

					}
				}
			});
		},
		// 清除全部
		clear_all_items : function () {
			$('#Todo_List').find('.work_block>.item').remove();

			// 儲存
			Todo_List.save_now();
		}
	};
})(jQuery);

// 文字RWD
Todo_List.change_font_size();

// 場上全註冊 拖曳、勾勾、垃圾桶、換主題
Todo_List.reg_item_event_all();

// 場上全部刷新底部主題塊
Todo_List.all_items_refresh_foot();

// ESC關閉彈窗
$(document).keydown(function(event) {
	if (event.keyCode == 27) {
		Todo_List.close_pop();
	}
});

// 建立物件
if (localStorage.length > 4) {

	// 拿storage
	Todo_List.load_storage_item();
} else {

	// 建立一塊
	Todo_List.add_item(1);
}

// 註冊 篩選 已完成項目
$('#popup').find('.container2017>.content>.option4').click(function() {

	// 篩選
	Todo_List.filter_item_by_complete(1);

	// 關閉彈窗
	Todo_List.close_pop();

	// 提示成功
	Todo_List.pop_msg('篩選 已完成項目');

});

// 註冊 篩選 未完成項目
$('#popup').find('.container2017>.content>.option5').click(function() {

	// 篩選
	Todo_List.filter_item_by_complete(0);

	// 關閉彈窗
	Todo_List.close_pop();

	// 提示成功
	Todo_List.pop_msg('篩選 未完成項目');

});

// 註冊 取消篩選
$('#popup').find('.container2017>.content>.option8').click(function() {

	// 篩選
	Todo_List.filter_item_by_complete(-1);

	// 關閉彈窗
	Todo_List.close_pop();

	// 提示成功
	Todo_List.pop_msg('顯示全部');

});

// 註冊 清除 已完成項目
$('#popup').find('.container2017>.content>.option6').click(function() {

	if (confirm('確定清除 已完成項目？')) {
		// 篩選
		Todo_List.clear_item_by_complete(1);

		// 關閉彈窗
		Todo_List.close_pop();

		// 提示成功
		Todo_List.pop_msg('清除 已完成項目');
	}

});

// 註冊 清除 未完成項目
$('#popup').find('.container2017>.content>.option7').click(function() {

	if (confirm('確定清除 未完成項目？')) {
		// 篩選
		Todo_List.clear_item_by_complete(0);

		// 關閉彈窗
		Todo_List.close_pop();

		// 提示成功
		Todo_List.pop_msg('清除 未完成項目');
	}

});

// 註冊 清除全部
$('#popup').find('.container2017>.content>.option9').click(function() {

	if (confirm('確定清除全部？')) {
		// 篩選
		Todo_List.clear_all_items();

		// 關閉彈窗
		Todo_List.close_pop();

		// 提示成功
		Todo_List.pop_msg('清除全部');
	}

});

// 註冊調整字型
$('#popup').find('.container2017>.content>.option3>input').on('input',function() {
	var new_size = +$(this).val();
	$('#popup').find('.container2017>.content>.option3>span').text(new_size);
	Todo_List.change_font_size(new_size);
});

// 註冊儲存
$('#popup').find('.container2017>.content>.option1').click(function() {

	if (localStorage) {
		// 儲存
		Todo_List.save_now();

		// 關閉彈窗
		Todo_List.close_pop();

		// 提示成功
		Todo_List.pop_msg('儲存成功！');

	} else {

		// 提示失敗
		Todo_List.pop_msg('儲存失敗，沒有localStorage。');
	}

});

// 註冊清除
$('#popup').find('.container2017>.content>.option2').click(function() {

	if (localStorage) {

		// 清除
		Todo_List.clear_storage_item();

		// 關閉彈窗
		Todo_List.close_pop();

		// 提示成功
		Todo_List.pop_msg('清除成功！');

	} else {

		// 提示失敗
		Todo_List.pop_msg('清除失敗，沒有localStorage。');
	}

});

// 註冊拖曳中
$('#Todo_List').mousemove(function(e){
	// 滑鼠拖曳移動
	if(Todo_List.Dragger.dragging) {
		Todo_List.Dragger.$drag_item.css({
			top: e.clientY - Todo_List.Dragger.originY,
			left: e.clientX - Todo_List.Dragger.originX
		});
	}
});

// 註冊拖曳結束
$('#Todo_List').mouseup(function(){
	if (Todo_List.Dragger.dragging) {
		// 清空
		Todo_List.Dragger.dragging = false;
		Todo_List.Dragger.$drag_item = null;
		Todo_List.Dragger.originX = 0;
		Todo_List.Dragger.originY = 0;

		// 儲存
		setTimeout ((function(){
			Todo_List.save_now();
		}), 200);
	}
});

// 修改後馬上儲存
$('div[contenteditable=true]').change(function() {
	Todo_List.save_now();
});

// 工具列新增物件
$('#Todo_List').find('.tool_bar>.items').click(function() {
	
	var theme_code = +$(this).attr('class').split("item")[1].charAt(0); // 1 2 3 4
	Todo_List.add_item (theme_code);

});

/********* Todo List Function END *******/