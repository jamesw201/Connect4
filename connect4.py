import svgwrite

def generate_connect4_board(config, layout, filename='connect4_board.svg'):
    rows = config['rows']
    cols = config['cols']
    cell_size = config['cell_size']
    circle_radius = cell_size // 2 - config['padding']
    board_width = cols * cell_size
    board_height = rows * cell_size

    dwg = svgwrite.Drawing(filename, size=(board_width, board_height))
    board_color = config['board_color']
    color_map = config['color_map']

    # Draw the board background
    dwg.add(dwg.rect(insert=(0, 0), size=(board_width, board_height), fill=board_color))

    # Draw the circles based on the layout
    for row in range(rows):
        for col in range(cols):
            cx = col * cell_size + cell_size // 2
            cy = row * cell_size + cell_size // 2
            cell_value = layout[row][col]
            color = color_map.get(cell_value, config['empty_circle_color'])
            dwg.add(dwg.circle(center=(cx, cy), r=circle_radius, fill=color))

    dwg.save()

# Configuration for the Connect 4 board
config = {
    'rows': 6,
    'cols': 7,
    'cell_size': 30,
    'padding': 10,
    'board_color': '#0000FF',  # Blue board color
    'color_map': {
        'R': '#FF0000',  # Red counter
        'Y': '#FFFF00'   # Yellow counter
    },
    'empty_circle_color': '#FFFFFF'  # White for empty cells
}

# Layout for the Connect 4 board ('R' for red, 'Y' for yellow, 'E' for empty)
layout = [
    ['E', 'E', 'E', 'E', 'E', 'E', 'E'],
    ['E', 'E', 'E', 'E', 'E', 'E', 'E'],
    ['E', 'E', 'Y', 'R', 'E', 'E', 'E'],
    ['E', 'E', 'R', 'Y', 'E', 'E', 'E'],
    ['E', 'Y', 'R', 'R', 'Y', 'E', 'E'],
    ['R', 'R', 'Y', 'Y', 'R', 'Y', 'E']
]

generate_connect4_board(config, layout)

