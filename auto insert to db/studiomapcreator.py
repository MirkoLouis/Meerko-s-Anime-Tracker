# studio_parser.py
# This script is a utility to parse the 'studio_inserts.sql' file and generate a Python dictionary
# that maps studio names to their corresponding numerical IDs, which can then be used in other scripts.

def parse_studio_sql(file_path, output_path):
    studio_map = {} # Initialize an empty dictionary to store the studio name to ID mapping.
    try:
        # Open and read all lines from the specified SQL file.
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        # Skip the first line, which contains the INSERT INTO statement.
        values_lines = lines[1:]

        # Join the remaining lines into a single string and split by the '),(' delimiter to get individual entries.
        values_str = ''.join(values_lines)
        entries = values_str.split('),')

        index = 1 # Initialize a counter for assigning StudioIDs.
        for entry in entries:
            # Clean up each entry by removing leading/trailing whitespace and specific characters.
            entry = entry.strip().lstrip('(').rstrip(',\n );')
            if entry:
                try:
                    # Extract the studio name (first part of the entry before the comma).
                    name, _ = entry.split(',', 1)
                    studio_name = name.strip().strip("'") # Clean up the studio name.
                    studio_map[studio_name] = index # Map the studio name to its ID.
                    index += 1 # Increment the ID counter.
                except ValueError:
                    print(f"Skipping malformed entry: {entry}")

        # Write the generated studio_map dictionary to a Python file.
        with open(output_path, 'w', encoding='utf-8') as out:
            out.write("studio_map = {\n")
            for k, v in studio_map.items():
                out.write(f"    '{k}': {v},\n")
            out.write("}\n")

        print(f"studio_map written to {output_path}")

    except FileNotFoundError:
        print(f"File not found: {file_path}")

if __name__ == '__main__':
    # Call the parse_studio_sql function with the input SQL file and desired output map file.
    parse_studio_sql('studio_inserts.sql', 'studio_map.txt')
