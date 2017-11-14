// 文字缩放 20170815 twjohn.c
// 用法
//
// $('.sometext').fontResize(字体大小,这是屏幕宽在多少的时后);
// $(window).resize (function(){
//     $('.textRWD').fontResize(24,750);
// });

;(function($, window){

    var methods = (function(){
        return {

            // 取得正确FontSize
            getRWDFontSize : function (fontPx, maxWidth) {
                fontPx = fontPx ? fontPx : 14;
                maxWidth = maxWidth ? maxWidth : 750;
                var nowWindowWidth = ($(window).width() > maxWidth) ? maxWidth : $(window).width(),
                    ZOOM = fontPx / maxWidth;
                var newFontPx = nowWindowWidth * ZOOM;
                return newFontPx;
            }
        }
    })();

    $.fn.fontResize = function (fontPx, maxWidth) {
        fontPx = fontPx ? fontPx : 14;
        maxWidth = maxWidth ? maxWidth : 750;
        this.each (function() {
            $(this).css('font-size', methods.getRWDFontSize(fontPx,maxWidth)+'px');
        });
        return this;
    }

})(jQuery, window);