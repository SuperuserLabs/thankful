from PIL import Image, ImageDraw, ImageFont

import matplotlib.font_manager

size = 256

# Create a new black image with a transparent background
image_size = (size, size)
background_color = (0, 0, 0, 255)
image = Image.new("RGBA", image_size, background_color)

# Print available fonts

# Load a monospace font
# Could be: FiraCode-Retina 
font_size = int(size / 2)
try:
    font = ImageFont.truetype("FiraCode-Retina.ttf", font_size)
except OSError:
    print("Available fonts:", [font.split("/")[-1] for font in matplotlib.font_manager.findSystemFonts(fontpaths=None, fontext='ttf')])
    raise

# Draw the string "$ su" on the image
def draw_text_old():
    text = "$ su"
    text_color = (255, 255, 255, 255)
    draw = ImageDraw.Draw(image)
    text_width, text_height = draw.textsize(text, font=font)
    text_position = ((image_size[0] - text_width) // 2, (image_size[1] - text_height) // 2)
    draw.text(text_position, text, font=font, fill=text_color)

# Draw the string "$" and "su" on the image with adjusted spacing
def draw_text():
    draw = ImageDraw.Draw(image)
    dollar_sign = "$"
    text = "su"
    text_color = (255, 255, 255, 255)

    left, top, right, bottom = draw.textbbox((0, 0), dollar_sign, font=font)
    dollar_sign_width = right - left
    dollar_sign_height = bottom - top
    left, top, right, bottom = draw.textbbox((0, 0), text, font=font)
    text_width = right - left
    text_height = bottom - top
    print("Dollar:",  (dollar_sign_width, dollar_sign_height))
    print("Text su:", (text_width, text_height))

    spacing = int(font_size / 8)  # Adjust this value to control the spacing between the "$" and "su"
    print("Spacing:", spacing)
    total_width = dollar_sign_width + spacing + text_width
    print("Total width:", total_width)


    dollar_sign_position = ((image_size[0] - total_width) // 2, 
                            (image_size[1] - dollar_sign_height) // 2)
    text_position = (dollar_sign_position[0] + dollar_sign_width + spacing, 
                     (image_size[1] - dollar_sign_height) // 2)

    draw.text(dollar_sign_position, dollar_sign, font=font, fill=text_color)
    draw.text(text_position, text, font=font, fill=text_color)

# Actually draw
draw_text()

# Save the image as a favicon
image.save("media/favicon.ico", "ICO")
print("Done!")
