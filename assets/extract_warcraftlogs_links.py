import re

input_file = 'assets/reports_chat.txt'
output_file = 'assets/warcraftlogs_links.csv'

# Regex to match and extract the report ID from the link
id_pattern = re.compile(r'https://www\.warcraftlogs\.com/reports/([\w\d]+)')

all_ids = []
with open(input_file, encoding='utf-8') as infile:
    for line in infile:
        fields = line.strip().split(',')
        for field in fields:
            all_ids.extend(id_pattern.findall(field))

unique_ids = set()
dupes = set()
for rid in all_ids:
    if rid in unique_ids:
        dupes.add(rid)
    else:
        unique_ids.add(rid)

with open(output_file, 'w', encoding='utf-8') as outfile:
    outfile.write('report_id\n')
    for rid in sorted(unique_ids):
        outfile.write(f'{rid}\n')

print(f"Total report IDs found: {len(all_ids)}")
print(f"Unique report IDs: {len(unique_ids)}")
print(f"Non-unique (duplicate) report IDs: {len(dupes)}")
if dupes:
    print(f"Duplicate IDs: {sorted(list(dupes))}")
