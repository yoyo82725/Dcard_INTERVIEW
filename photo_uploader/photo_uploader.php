<?php

// if(isset($_FILES['files']) && $_FILES['files']['error'] == 0){
//     $upload_folder = dirname(dirname(__FILE__))."/uploads"; 
//     $upload_path = $upload_folder."/".$_FILES['files']['name'];
//     move_uploaded_file($_FILES['files']['tmp_name'], $upload_path);
//     echo '{"status":"success"}';    //顯示的狀態 是否上傳成功
//     exit;
// }


// 接收base64
if ($_POST['base64_str']) {

	// 寫入檔案
	if(base64_to_img($_POST['base64_str'], 'file/test.'.$_POST['img_type'], $_POST['img_type'])) {
		$rs = array(
		    'message' => '後端php儲存圖片成功！'
		);
	} else {
		$rs = array(
		    'message' => '後端php儲存圖片失敗！(base64_to_img)'
		);
	}

	resposnsJSON($rs);
	exit;

}

// 接收url
else if ($_POST['url']) {
	// 寫入檔案
	if(@copy ($_POST['url'] ,'file/test.jpg')){
		$rs = array(
		    'message' => '後端php儲存圖片成功！'
		);
	} else {
		$rs = array(
		    'message' => '後端php儲存圖片失敗！(copy)'
		);
	}

	resposnsJSON($rs);
	exit;

}

// 產生多種SIZE的圖片
else if ($_POST['burn_some_size']) {

	// 尺寸表
	$size_array = [15,30,45];

	$file_path = 'file/test.'.$_POST['img_type'];

	// 產生檔案
	for ($i=0;$i<count($size_array);$i++) {
		if ($_POST['img_type'] == 'jpg') {

			// 建立來源圖片
			$src = imagecreatefromjpeg($file_path);

			// 縮圖
			$new_img = ImageResize($src, $size_array[$i], $size_array[$i]);

			// 儲存
			imagejpeg($new_img, 'file/'.$size_array[$i].'x'.$size_array[$i].'.'.$_POST['img_type']);

			imagedestroy($src);
		} else {

			// 縮圖 & 儲存
			pngthumb($file_path, 'file/'.$size_array[$i].'x'.$size_array[$i].'.'.$_POST['img_type'], $size_array[$i], $size_array[$i]);

		}
	}

	// 確認檔案存在
	if(is_file('file/'.$size_array[0].'x'.$size_array[0].'.'.$_POST['img_type'])){
		$rs = array(
		    'message' => '後端php儲存圖片成功！',
		    'show_burn_img' => '1',
		    'img_type' => $_POST['img_type']
		);
	} else {
		$rs = array(
		    'message' => '後端php儲存圖片失敗！(imagecopyresized)'
		);
	}

	resposnsJSON($rs);
	exit;

}

header("Location: photo_uploader.html");
exit;

function base64_to_img($base64_string, $output_file, $img_type='jpg') {
	// split the string on commas
	// $data[ 0 ] == "data:image/png;base64"
	// $data[ 1 ] == <actual base64 string>
	$data = explode( ',', $base64_string );

	$imageData = base64_decode($data[ 1 ]);
	$source = imagecreatefromstring($imageData);
	if ($img_type == 'jpg') {
		$save = imagejpeg($source, $output_file, 100);
	} else {
		// $save = imagepng($source, $output_file);
		$save = file_put_contents($output_file, $imageData);
	}

	imagedestroy($source);

	return $save;
}

function isAjax()
{
    if (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') {
        return true;
    }

    return false;
}

function resposnsJSON($data)
{
    header('content-type:application/json');
    echo json_encode($data);

    return;
}

// 高精度縮圖
function ImageResize (&$src, $x, $y) {
	$dst=imagecreatetruecolor($x, $y);
	$pals=ImageColorsTotal ($src);

	for ($i=0; $i<$pals; $i++) {
		$colors=ImageColorsForIndex ($src, $i);
		ImageColorAllocate ($dst, $colors['red'], $colors['green'], $colors['blue']);

	}
	$scX =(imagesx ($src)-1)/$x;
	$scY =(imagesy ($src)-1)/$y;
	$scX2 =intval($scX/2);
	$scY2 =intval($scY/2);

	for ($j = 0; $j < ($y); $j++) {
		$sY = intval($j * $scY);
		$y13 = $sY + $scY2;
		for ($i = 0; $i < ($x); $i++) {
			$sX = intval($i * $scX);
			$x34 = $sX + $scX2;
			$c1 = ImageColorsForIndex ($src, ImageColorAt ($src, $sX, $y13));
			$c2 = ImageColorsForIndex ($src, ImageColorAt ($src, $sX, $sY));
			$c3 = ImageColorsForIndex ($src, ImageColorAt ($src, $x34, $y13));
			$c4 = ImageColorsForIndex ($src, ImageColorAt ($src, $x34, $sY));
			$r = ($c1['red']+$c2['red']+$c3['red']+$c4['red'])/4;
			$g = ($c1['green']+$c2['green']+$c3['green']+$c4['green'])/4;
			$b = ($c1['blue']+$c2['blue']+$c3['blue']+$c4['blue'])/4;
			ImageSetPixel ($dst, $i, $j, ImageColorClosest ($dst, $r, $g, $b));
		}
	}
	return ($dst);
}
function pngthumb($sourePic, $smallFileName, $width, $heigh){
	$image = imagecreatefrompng($sourePic);//PNG
	imagesavealpha($image,true);
	$BigWidth = imagesx($image);
	$BigHeigh = imagesy($image);
	$thumb = imagecreatetruecolor($width,$heigh);
	imagealphablending($thumb,false);
	imagesavealpha($thumb,true);
	if(imagecopyresampled($thumb,$image,0,0,0,0,$width,$heigh,$BigWidth,$BigHeigh)){
	imagepng($thumb,$smallFileName);}
	return $smallFileName;
}
?>