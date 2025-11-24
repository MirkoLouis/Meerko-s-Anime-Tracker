def generate_tag_map(sql_file, output_file):
    tag_map = {}
    with open(sql_file, 'r', encoding='utf-8') as file:
        lines = file.readlines()

    # Skip lines until we reach the 'VALUES' keyword
    in_values = False
    tags = []
    for line in lines:
        if not in_values:
            if 'VALUES' in line.upper():
                in_values = True
        elif in_values:
            line = line.strip()
            if line.startswith('(') and line.endswith(('),', ');')):
                tag = line.split("'")[1]  # Gets the content inside single quotes
                tags.append(tag)

    # Generate the tag map
    tag_map = {tag: idx + 1 for idx, tag in enumerate(tags)}

    # Write the tag map to a file
    with open(output_file, 'w', encoding='utf-8') as out:
        out.write("tag_map = {\n")
        for tag, idx in tag_map.items():
            out.write(f"    '{tag}': {idx},\n")
        out.write("}\n")

    print(f"Tag map written to {output_file}")


# Run the script
if __name__ == "__main__":
    generate_tag_map("insert_tags.sql", "tag_map.txt")
