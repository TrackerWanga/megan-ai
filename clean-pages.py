with open('src/index.ts', 'r') as f:
    lines = f.readlines()

# Find all the page-related lines and duplicates
output = []
skip_until_endif = False
found_cors = False

for i, line in enumerate(lines):
    # Skip duplicate page blocks (they appear after corsHeaders which is wrong)
    if 'const corsHeaders = {' in line:
        found_cors = True
    
    # If we see page routes AFTER corsHeaders, they're duplicates
    if found_cors and ("return new Response(landingPage" in line or 
                        "return new Response(playgroundPage" in line or
                        "return new Response(gamesPage" in line or
                        "Response.redirect('https://megan-coins" in line):
        continue
    
    output.append(line)

with open('src/index.ts', 'w') as f:
    f.writelines(output)

print("Duplicates removed!")
