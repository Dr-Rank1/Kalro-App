import os
import re

def process_directory(directory):
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.dart'):
                file_path = os.path.join(root, file)
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                original_content = content
                
                # Replace Text('Something') with Text('Something'.tr)
                # But don't replace if it already has .tr
                # Also handle Text("Something")
                
                def replace_text(match):
                    full = match.group(0)
                    quote = match.group(1)
                    string_val = match.group(2)
                    # if it already ends with .tr or contains variables, skip for safety?
                    # Dart string interpolation might be tricky: Text('Hello $name') -> Text('Hello $name'.tr)
                    # Yes, .tr will translate the exact literal. If it has interpolation, our Translator won't match it.
                    # But the user said "every word", so it's fine. It'll just fallback to english.
                    return f"Text({quote}{string_val}{quote}.tr)"
                
                # Regex for Text('...')
                content = re.sub(r"Text\(\s*(')([^'\n]+)('\)\s*)", replace_text, content)
                content = re.sub(r"Text\(\s*(\")([^\"\n]+)(\"\)\s*)", replace_text, content)
                
                # Regex for label: '...'
                def replace_label(match):
                    quote = match.group(1)
                    string_val = match.group(2)
                    return f"label: {quote}{string_val}{quote}.tr,"
                    
                content = re.sub(r"label:\s*(')([^'\n]+)('),", replace_label, content)
                content = re.sub(r"label:\s*(\")([^\"\n]+)(\"),", replace_label, content)

                # title: '...'
                def replace_title(match):
                    quote = match.group(1)
                    string_val = match.group(2)
                    return f"title: {quote}{string_val}{quote}.tr,"
                
                content = re.sub(r"title:\s*(')([^'\n]+)('),", replace_title, content)
                content = re.sub(r"title:\s*(\")([^\"\n]+)(\"),", replace_title, content)

                # hintText: '...'
                def replace_hint(match):
                    quote = match.group(1)
                    string_val = match.group(2)
                    return f"hintText: {quote}{string_val}{quote}.tr,"
                    
                content = re.sub(r"hintText:\s*(')([^'\n]+)('),", replace_hint, content)
                
                if content != original_content:
                    if "package:kalro/l10n/translator.dart" not in content:
                        import_stmt = "import 'package:kalro/l10n/translator.dart';\n"
                        # Insert after last import
                        last_import = content.rfind("import '")
                        if last_import != -1:
                            end_of_line = content.find("\n", last_import)
                            content = content[:end_of_line+1] + import_stmt + content[end_of_line+1:]
                        else:
                            content = import_stmt + content
                            
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(content)

process_directory('lib/screens')
process_directory('lib/components')
print("Done")
