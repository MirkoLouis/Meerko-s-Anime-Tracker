# studio_parser.py
# Updated to be compatible with studiocatcher's sanitized SQL output.
# Handles unescaping of SQL quotes (e.g., "''" -> "'") and robust parsing.
# Outputs to 'studio_map.txt'.

import os

def parse_studio_sql(file_path, output_path):
    studio_map = {} 
    try:
        if not os.path.exists(file_path):
            print(f"❌ File not found: {file_path}")
            return

        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Find the start of the VALUES section to avoid parsing headers
        start_marker = "VALUES"
        start_index = content.upper().find(start_marker)
        if start_index == -1:
            print("❌ Invalid SQL file: No 'VALUES' clause found.")
            return

        # Extract just the data part
        values_part = content[start_index + len(start_marker):].strip()
        
        # Remove the trailing semicolon if present
        if values_part.endswith(';'):
            values_part = values_part[:-1]

        # Split by `),` which is the standard delimiter in the generated SQL
        # This creates a list of strings like: "('Studio Name', 5"
        entries = values_part.split('),')

        index = 1 
        for entry in entries:
            entry = entry.strip()
            
            # Clean up the leading parenthesis/newlines
            if entry.startswith('('):
                entry = entry.lstrip('(\n ')

            # We expect format: 'Studio Name', Rating
            # We split by the LAST comma to separate Name from Rating safely
            # This protects against studio names that might contain commas themselves.
            last_comma_index = entry.rfind(',')
            
            if last_comma_index == -1:
                continue

            # Extract the raw name part (everything before the last comma)
            raw_name_part = entry[:last_comma_index].strip()
            
            # Remove the surrounding single quotes
            if raw_name_part.startswith("'") and raw_name_part.endswith("'"):
                # Slice off the first and last char
                name_inner = raw_name_part[1:-1]
                
                # CRITICAL: Unescape SQL quotes. 
                # The SQL file has "Brain''s Base", but we need "Brain's Base" for the map.
                real_name = name_inner.replace("''", "'")
                
                studio_map[real_name] = index
                index += 1

        # Write the generated studio_map dictionary to the text file.
        with open(output_path, 'w', encoding='utf-8') as out:
            out.write("studio_map = {\n")
            for k, v in studio_map.items():
                # Escape single quotes for valid Python syntax inside the text file
                # If key is "Brain's Base", we write: 'Brain\'s Base': 1,
                safe_key = k.replace("'", "\\'")
                out.write(f"    '{safe_key}': {v},\n")
            out.write("}\n")

        print(f"✅ Successfully mapped {len(studio_map)} studios.")
        print(f"💾 Map saved to: {output_path}")

    except Exception as e:
        print(f"❌ An error occurred: {e}")

if __name__ == '__main__':
    # Checks for the new file name first, falls back to the old one
    input_file = 'insert_studios.sql' if os.path.exists('insert_studios.sql') else 'studio_inserts.sql'
    
    print(f"📂 Reading from {input_file}...")
    parse_studio_sql(input_file, 'studio_map.txt')