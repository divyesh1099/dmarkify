# Backend (views.py)
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import FileSystemStorage
from django.conf import settings
from PIL import Image, ImageDraw, ImageFont, ImageColor
import os
import zipfile
import threading
import time

def list_fonts(request):
    fonts_dir = os.path.join(settings.BASE_DIR, 'watermark/fonts')
    fonts = [f.split('.')[0] for f in os.listdir(fonts_dir) if f.endswith('.ttf')]
    return JsonResponse({'fonts': fonts})

@csrf_exempt
def upload_font(request):
    if request.method == 'POST' and 'font_file' in request.FILES:
        font_file = request.FILES['font_file']
        if not font_file.name.endswith('.ttf'):
            return JsonResponse({'error': 'Invalid file format. Only .ttf files are allowed.'}, status=400)
        fonts_dir = os.path.join(settings.BASE_DIR, 'watermark/fonts')
        os.makedirs(fonts_dir, exist_ok=True)
        file_storage = FileSystemStorage(location=fonts_dir)
        saved_filename = file_storage.save(font_file.name, font_file)
        return JsonResponse({'message': 'Font uploaded successfully.', 'font_name': saved_filename})
    return JsonResponse({'error': 'No font file provided or invalid request.'}, status=400)

def delete_files_after_delay(file_paths, delay=300):
    def delete_task():
        time.sleep(delay)
        for file_path in file_paths:
            if os.path.exists(file_path):
                os.remove(file_path)
    threading.Thread(target=delete_task).start()

def parse_gradient(text_color, width, height, alpha):
    colors = text_color.strip().lower().replace('gradient(', '').replace(')', '').split(',')
    start_color_str = colors[0].strip()
    end_color_str = colors[1].strip()
    start_rgb = ImageColor.getrgb(start_color_str)
    end_rgb = ImageColor.getrgb(end_color_str)
    gradient_img = Image.new("RGBA", (width, height), (0,0,0,0))
    draw = ImageDraw.Draw(gradient_img)
    for x in range(width):
        ratio = x / float(width - 1) if width > 1 else 0
        r = int(start_rgb[0] + (end_rgb[0] - start_rgb[0]) * ratio)
        g = int(start_rgb[1] + (end_rgb[1] - start_rgb[1]) * ratio)
        b = int(start_rgb[2] + (end_rgb[2] - start_rgb[2]) * ratio)
        draw.line([(x,0),(x,height)], fill=(r,g,b,alpha))
    return gradient_img

def parse_color(text_color):
    try:
        rgb = ImageColor.getrgb(text_color)
    except:
        rgb = (255,255,255)
    return rgb

@csrf_exempt
def upload_files(request):
    if request.method == 'POST':
        files = request.FILES.getlist('files')
        watermark_text = request.POST.get('watermark_text', None)
        watermark_image = request.FILES.get('watermark_image')
        text_position = request.POST.get('text_position', 'center').lower()
        image_position = request.POST.get('image_position', 'center').lower()
        font_name = request.POST.get('font', 'roboto-regular').lower()
        font_size = int(request.POST.get('font_size', 20)) if request.POST.get('font_size') else None
        font_size_percent = int(request.POST.get('font_size_percent', 0)) if not font_size and request.POST.get('font_size_percent') else None
        text_transparency = int(request.POST.get('text_transparency', 50)) if watermark_text else None
        text_rotation = int(request.POST.get('text_rotation', 0))
        text_color = request.POST.get('text_color', '#000000')
        image_size_percentage = int(request.POST.get('image_size_percentage', 20))
        image_transparency = int(request.POST.get('image_transparency', 50))

        output_dir = os.path.join(settings.MEDIA_ROOT, 'output')
        os.makedirs(output_dir, exist_ok=True)

        fonts_dir = os.path.join(settings.BASE_DIR, 'watermark/fonts')
        font_path = os.path.join(fonts_dir, f"{font_name}.ttf")
        if not os.path.exists(font_path):
            font_path = os.path.join(fonts_dir, "Roboto-Regular.ttf")

        watermarked_files = []
        uploaded_file_paths = []

        for file in files:
            file_storage = FileSystemStorage()
            filename = file_storage.save(file.name, file)
            file_path = file_storage.path(filename)
            uploaded_file_paths.append(file_path)

            image = Image.open(file_path).convert("RGBA")
            overlay = Image.new("RGBA", image.size, (255, 255, 255, 0))
            image_width, image_height = image.size

            if watermark_image:
                watermark_storage = FileSystemStorage()
                watermark_filename = watermark_storage.save(watermark_image.name, watermark_image)
                watermark_path = watermark_storage.path(watermark_filename)
                uploaded_file_paths.append(watermark_path)

                watermark_img = Image.open(watermark_path).convert("RGBA")
                new_width = int(image_width * (image_size_percentage / 100))
                aspect_ratio = watermark_img.height / watermark_img.width
                new_height = int(new_width * aspect_ratio)
                watermark_resized = watermark_img.resize((new_width, new_height))
                watermark_resized.putalpha(int(255 * (image_transparency / 100)))

                if image_position == 'center':
                    x_img = (image_width - watermark_resized.width) // 2
                    y_img = (image_height - watermark_resized.height) // 2
                elif image_position == 'top-left':
                    x_img, y_img = 10, 10
                elif image_position == 'top-right':
                    x_img = image_width - watermark_resized.width - 10
                    y_img = 10
                elif image_position == 'bottom-left':
                    x_img = 10
                    y_img = image_height - watermark_resized.height - 10
                elif image_position == 'bottom-right':
                    x_img = image_width - watermark_resized.width - 10
                    y_img = image_height - watermark_resized.height - 10

                overlay.paste(watermark_resized, (x_img, y_img), watermark_resized)
                os.remove(watermark_path)

            if watermark_text:
                if font_size_percent and font_size_percent > 0:
                    font_size = int((image_width * font_size_percent) / 100)
                font = ImageFont.truetype(font_path, size=font_size)

                dummy_img = Image.new("RGBA", (1,1), (0,0,0,0))
                dummy_draw = ImageDraw.Draw(dummy_img)
                bbox = dummy_draw.textbbox((0,0), watermark_text, font=font)
                tw = bbox[2]-bbox[0]
                th = bbox[3]-bbox[1]

                # Add padding to avoid cutting off descenders like 'y'
                padding = 5
                text_img = Image.new("RGBA", (tw+padding*2, th+padding*2), (0,0,0,0))
                text_draw = ImageDraw.Draw(text_img)
                alpha_val = int(255 * (text_transparency / 100))

                if text_color.strip().lower().startswith('gradient('):
                    gradient_img = parse_gradient(text_color, tw, th, alpha_val)
                    mask_img = Image.new("L", (tw, th), 0)
                    mask_draw = ImageDraw.Draw(mask_img)
                    mask_draw.text((0,0), watermark_text, fill=255, font=font)
                    # Paste gradient inside padded area
                    text_img = Image.alpha_composite(text_img, Image.composite(gradient_img, text_img, mask_img))
                else:
                    base_rgb = parse_color(text_color)
                    fill_color = base_rgb + (alpha_val,)
                    # Draw text with padding offset
                    text_draw.text((padding, padding), watermark_text, fill=fill_color, font=font)

                rotated_text = text_img.rotate(-text_rotation, expand=True, fillcolor=(0,0,0,0))
                rbbox = rotated_text.getbbox()
                rot_w = rbbox[2]-rbbox[0]
                rot_h = rbbox[3]-rbbox[1]

                if text_position == 'center':
                    x_txt = (image_width - rot_w) // 2
                    y_txt = (image_height - rot_h) // 2
                elif text_position == 'top-left':
                    x_txt, y_txt = 10, 10
                elif text_position == 'top-right':
                    x_txt = image_width - rot_w - 10
                    y_txt = 10
                elif text_position == 'bottom-left':
                    x_txt = 10
                    y_txt = image_height - rot_h - 10
                elif text_position == 'bottom-right':
                    x_txt = image_width - rot_w - 10
                    y_txt = image_height - rot_h - 10

                overlay.paste(rotated_text, (x_txt - rbbox[0], y_txt - rbbox[1]), rotated_text)

            watermarked_image = Image.alpha_composite(image, overlay)
            watermarked_image = watermarked_image.convert("RGB")

            output_path = os.path.join(output_dir, f'watermarked_{os.path.basename(file_path)}')
            watermarked_image.save(output_path)
            watermarked_files.append(output_path)
            os.remove(file_path)

        zip_path = os.path.join(output_dir, 'watermarked_images.zip')
        with zipfile.ZipFile(zip_path, 'w') as zipf:
            for file in watermarked_files:
                zipf.write(file, os.path.basename(file))

        delete_files_after_delay([zip_path] + watermarked_files)
        return JsonResponse({'message': 'Files processed successfully', 'zip_url': request.build_absolute_uri('/media/output/watermarked_images.zip')})

    return JsonResponse({'error': 'Invalid request'}, status=400)
